import { aTexto, subexpresiones, variables, type Expr } from "./ast";

export type Asignacion = Record<string, boolean>;

export const MAX_VARIABLES = 10; // 2^10 = 1024 filas

export function evaluar(e: Expr, a: Asignacion): boolean {
  switch (e.tipo) {
    case "const":
      return e.valor;
    case "var": {
      const v = a[e.nombre];
      if (v === undefined) throw new Error(`Falta asignar un valor a «${e.nombre}».`);
      return v;
    }
    case "no":
      return !evaluar(e.operando, a);
    case "bin": {
      const l = evaluar(e.izq, a);
      const r = evaluar(e.der, a);
      switch (e.op) {
        case "y":
          return l && r;
        case "o":
          return l || r;
        case "xor":
          return l !== r;
        case "implica":
          return !l || r;
        case "sii":
          return l === r;
      }
    }
  }
}

/** Todas las asignaciones posibles, empezando por todo verdadero (V,V → V,F → F,V → F,F). */
export function* asignaciones(vars: string[]): Generator<Asignacion> {
  if (vars.length > MAX_VARIABLES) {
    throw new Error(`Se admiten como máximo ${MAX_VARIABLES} variables (recibidas: ${vars.length}).`);
  }
  const total = 2 ** vars.length;
  for (let i = 0; i < total; i++) {
    const a: Asignacion = {};
    vars.forEach((v, j) => {
      a[v] = ((i >> (vars.length - 1 - j)) & 1) === 0;
    });
    yield a;
  }
}

export interface FilaTabla {
  asignacion: Asignacion;
  /** Valor de cada columna (subexpresión), en el mismo orden que `columnas`. */
  valores: boolean[];
  resultado: boolean;
}

export interface TablaVerdad {
  variables: string[];
  columnas: string[];
  filas: FilaTabla[];
}

export function tablaVerdad(e: Expr): TablaVerdad {
  const vars = variables(e);
  const subs = subexpresiones(e);
  const filas: FilaTabla[] = [];
  for (const a of asignaciones(vars)) {
    const valores = subs.map((s) => evaluar(s, a));
    filas.push({ asignacion: a, valores, resultado: evaluar(e, a) });
  }
  return { variables: vars, columnas: subs.map(aTexto), filas };
}

export type Clasificacion = "tautologia" | "contradiccion" | "contingencia";

export function clasificar(e: Expr): Clasificacion {
  let hayV = false;
  let hayF = false;
  for (const a of asignaciones(variables(e))) {
    if (evaluar(e, a)) hayV = true;
    else hayF = true;
    if (hayV && hayF) return "contingencia";
  }
  return hayV ? "tautologia" : "contradiccion";
}

export interface ResultadoEquivalencia {
  equivalentes: boolean;
  /** Primera asignación donde difieren, si no son equivalentes. */
  contraejemplo?: Asignacion;
}

export function compararEquivalencia(a: Expr, b: Expr): ResultadoEquivalencia {
  const vars = [...new Set([...variables(a), ...variables(b)])];
  for (const asig of asignaciones(vars)) {
    if (evaluar(a, asig) !== evaluar(b, asig)) return { equivalentes: false, contraejemplo: asig };
  }
  return { equivalentes: true };
}

/** Un argumento es válido si nunca hay premisas verdaderas con conclusión falsa. */
export function argumentoValido(premisas: Expr[], conclusion: Expr): ResultadoEquivalencia {
  const vars = [...new Set([...premisas.flatMap((p) => variables(p)), ...variables(conclusion)])];
  for (const asig of asignaciones(vars)) {
    if (premisas.every((p) => evaluar(p, asig)) && !evaluar(conclusion, asig)) {
      return { equivalentes: false, contraejemplo: asig };
    }
  }
  return { equivalentes: true };
}
