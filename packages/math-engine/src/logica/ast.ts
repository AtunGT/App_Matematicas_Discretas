/** Árbol de sintaxis de una expresión de lógica proposicional. */

export type OpBinario = "y" | "o" | "xor" | "implica" | "sii";

export type Expr =
  | { tipo: "const"; valor: boolean }
  | { tipo: "var"; nombre: string }
  | { tipo: "no"; operando: Expr }
  | { tipo: "bin"; op: OpBinario; izq: Expr; der: Expr };

export const SIMBOLO: Record<OpBinario, string> = {
  y: "∧",
  o: "∨",
  xor: "⊕",
  implica: "→",
  sii: "↔",
};

/** Precedencia: mayor = se evalúa primero. */
const PREC: Record<OpBinario, number> = { sii: 1, implica: 2, o: 3, xor: 4, y: 5 };
const PREC_NO = 6;
const PREC_ATOMO = 7;

export const constante = (valor: boolean): Expr => ({ tipo: "const", valor });
export const variable = (nombre: string): Expr => ({ tipo: "var", nombre });
export const no = (operando: Expr): Expr => ({ tipo: "no", operando });
export const bin = (op: OpBinario, izq: Expr, der: Expr): Expr => ({ tipo: "bin", op, izq, der });

function prec(e: Expr): number {
  if (e.tipo === "bin") return PREC[e.op];
  if (e.tipo === "no") return PREC_NO;
  return PREC_ATOMO;
}

/** Texto canónico con los paréntesis mínimos para conservar la estructura. */
export function aTexto(e: Expr): string {
  switch (e.tipo) {
    case "const":
      return e.valor ? "V" : "F";
    case "var":
      return e.nombre;
    case "no": {
      const s = aTexto(e.operando);
      return prec(e.operando) < PREC_NO ? `¬(${s})` : `¬${s}`;
    }
    case "bin": {
      const p = PREC[e.op];
      const derAsoc = e.op === "implica"; // → asocia a la derecha; los demás a la izquierda
      const izq = prec(e.izq) < p || (prec(e.izq) === p && derAsoc) ? `(${aTexto(e.izq)})` : aTexto(e.izq);
      const der = prec(e.der) < p || (prec(e.der) === p && !derAsoc) ? `(${aTexto(e.der)})` : aTexto(e.der);
      return `${izq} ${SIMBOLO[e.op]} ${der}`;
    }
  }
}

/** Variables en orden de primera aparición. */
export function variables(e: Expr, acc: string[] = []): string[] {
  switch (e.tipo) {
    case "var":
      if (!acc.includes(e.nombre)) acc.push(e.nombre);
      break;
    case "no":
      variables(e.operando, acc);
      break;
    case "bin":
      variables(e.izq, acc);
      variables(e.der, acc);
      break;
  }
  return acc;
}

/** Subexpresiones compuestas, de adentro hacia afuera y sin repetir (columnas de una tabla de verdad). */
export function subexpresiones(e: Expr): Expr[] {
  const vistos = new Set<string>();
  const salida: Expr[] = [];
  const visitar = (x: Expr) => {
    if (x.tipo === "no") visitar(x.operando);
    if (x.tipo === "bin") {
      visitar(x.izq);
      visitar(x.der);
    }
    if (x.tipo === "no" || x.tipo === "bin") {
      const k = aTexto(x);
      if (!vistos.has(k)) {
        vistos.add(k);
        salida.push(x);
      }
    }
  };
  visitar(e);
  return salida.length ? salida : [e];
}

/** Representación estructural lista para dibujar como árbol. */
export interface NodoArbol {
  etiqueta: string;
  hijos: NodoArbol[];
}

export function aArbol(e: Expr): NodoArbol {
  switch (e.tipo) {
    case "const":
      return { etiqueta: e.valor ? "V" : "F", hijos: [] };
    case "var":
      return { etiqueta: e.nombre, hijos: [] };
    case "no":
      return { etiqueta: "¬", hijos: [aArbol(e.operando)] };
    case "bin":
      return { etiqueta: SIMBOLO[e.op], hijos: [aArbol(e.izq), aArbol(e.der)] };
  }
}

/** Árbol en texto con sangría, útil para depurar y para el asistente. */
export function arbolEnTexto(e: Expr): string {
  const lineas: string[] = [];
  const rec = (n: NodoArbol, prefijo: string, ultimo: boolean, raiz: boolean) => {
    lineas.push(raiz ? n.etiqueta : `${prefijo}${ultimo ? "└─ " : "├─ "}${n.etiqueta}`);
    const sig = raiz ? "" : prefijo + (ultimo ? "   " : "│  ");
    n.hijos.forEach((h, i) => rec(h, sig, i === n.hijos.length - 1, false));
  };
  rec(aArbol(e), "", true, true);
  return lineas.join("\n");
}
