import * as L from "../logica";
import { complemento, diferencia, diferenciaSimetrica, interseccion, productoCartesiano, union } from "./operaciones";
import { aTexto as conjuntoATexto, type Conjunto } from "./tipos";

export type OpConj = "union" | "inter" | "dif" | "dsim" | "prod";

export type ExprConj =
  | { t: "var"; nombre: string }
  | { t: "vacio" }
  | { t: "comp"; x: ExprConj }
  | { t: "bin"; op: OpConj; izq: ExprConj; der: ExprConj };

export class ErrorDeExpresion extends Error {
  constructor(
    mensaje: string,
    readonly posicion: number,
  ) {
    super(mensaje);
    this.name = "ErrorDeExpresion";
  }
}

const SIMBOLO: Record<OpConj, string> = { union: "∪", inter: "∩", dif: "∖", dsim: "Δ", prod: "×" };
const PREC: Record<OpConj, number> = { union: 1, dif: 1, dsim: 1, inter: 2, prod: 3 };

type Tok = { t: "nom"; v: string; p: number } | { t: "op"; op: OpConj; p: number } | { t: "'" | "¬" | "(" | ")" | "∅" | "fin"; p: number };

const OPS: Array<[string, OpConj]> = [
  ["∪", "union"], ["|", "union"], ["∩", "inter"], ["&", "inter"],
  ["∖", "dif"], ["\\", "dif"], ["−", "dif"], ["-", "dif"],
  ["Δ", "dsim"], ["△", "dsim"], ["×", "prod"], ["*", "prod"],
];

function tokenizar(s: string): Tok[] {
  const out: Tok[] = [];
  for (let i = 0; i < s.length; ) {
    const c = s[i]!;
    if (/\s/.test(c)) { i++; continue; }
    if (c === "(" || c === ")" || c === "'" || c === "¬" || c === "∅") { out.push({ t: c, p: i }); i++; continue; }
    if (c === "!" ) { out.push({ t: "¬", p: i }); i++; continue; }
    if (c === "ᶜ" || c === "’") { out.push({ t: "'", p: i }); i++; continue; }
    const op = OPS.find(([x]) => x === c);
    if (op) { out.push({ t: "op", op: op[1], p: i }); i++; continue; }
    const m = /^[\p{L}][\p{L}\p{N}_]*/u.exec(s.slice(i));
    if (m) { out.push({ t: "nom", v: m[0], p: i }); i += m[0].length; continue; }
    throw new ErrorDeExpresion(`Carácter no reconocido «${c}» en la posición ${i + 1}.`, i);
  }
  out.push({ t: "fin", p: s.length });
  return out;
}

/**
 * Precedencia (menor a mayor): ∪ ∖ Δ  <  ∩  <  ×  <  complemento (A' o ¬A).
 * Los operadores del mismo nivel asocian a la izquierda; usa paréntesis para dejarlo claro.
 */
export function parsearExpresion(texto: string): ExprConj {
  const toks = tokenizar(texto);
  let i = 0;
  const act = () => toks[i]!;

  const nivel = (n: 1 | 2 | 3): ExprConj => {
    const sig = (): ExprConj => (n === 3 ? unario() : nivel((n + 1) as 2 | 3));
    let izq = sig();
    while (act().t === "op" && PREC[(act() as { op: OpConj }).op] === n) {
      const op = (act() as { op: OpConj }).op;
      i++;
      izq = { t: "bin", op, izq, der: sig() };
    }
    return izq;
  };

  const unario = (): ExprConj => {
    if (act().t === "¬") { i++; return { t: "comp", x: unario() }; }
    let e = atomo();
    while (act().t === "'") { i++; e = { t: "comp", x: e }; }
    return e;
  };

  const atomo = (): ExprConj => {
    const t = act();
    if (t.t === "nom") { i++; return { t: "var", nombre: t.v }; }
    if (t.t === "∅") { i++; return { t: "vacio" }; }
    if (t.t === "(") {
      i++;
      const e = nivel(1);
      if (act().t !== ")") throw new ErrorDeExpresion(`Falta cerrar el paréntesis abierto en la posición ${t.p + 1}.`, t.p);
      i++;
      return e;
    }
    if (t.t === "fin") throw new ErrorDeExpresion("La expresión termina antes de tiempo: falta un conjunto.", t.p);
    throw new ErrorDeExpresion(`Se esperaba un conjunto o «(» en la posición ${t.p + 1}.`, t.p);
  };

  if (act().t === "fin") throw new ErrorDeExpresion("La expresión está vacía.", 0);
  const e = nivel(1);
  const resto = act();
  if (resto.t !== "fin") {
    if (resto.t === ")") throw new ErrorDeExpresion(`Paréntesis «)» sin abrir en la posición ${resto.p + 1}.`, resto.p);
    throw new ErrorDeExpresion(`Se esperaba un operador en la posición ${resto.p + 1}.`, resto.p);
  }
  return e;
}

export function exprATexto(e: ExprConj): string {
  const p = (x: ExprConj): number => (x.t === "bin" ? PREC[x.op] : 9);
  switch (e.t) {
    case "var": return e.nombre;
    case "vacio": return "∅";
    case "comp": return e.x.t === "var" || e.x.t === "vacio" ? `${exprATexto(e.x)}'` : `(${exprATexto(e.x)})'`;
    case "bin": {
      const n = PREC[e.op];
      const l = p(e.izq) < n ? `(${exprATexto(e.izq)})` : exprATexto(e.izq);
      const r = p(e.der) <= n ? `(${exprATexto(e.der)})` : exprATexto(e.der);
      return `${l} ${SIMBOLO[e.op]} ${r}`;
    }
  }
}

export type Entorno = Record<string, Conjunto>;

export function evaluarExpresion(e: ExprConj, env: Entorno, universo?: Conjunto): Conjunto {
  switch (e.t) {
    case "vacio": return [];
    case "var": {
      const c = env[e.nombre];
      if (!c) throw new Error(`No se definió el conjunto «${e.nombre}».`);
      return c;
    }
    case "comp": {
      if (!universo) throw new Error("Para calcular un complemento hace falta definir el universo.");
      return complemento(evaluarExpresion(e.x, env, universo), universo);
    }
    case "bin": {
      const a = evaluarExpresion(e.izq, env, universo);
      const b = evaluarExpresion(e.der, env, universo);
      switch (e.op) {
        case "union": return union(a, b);
        case "inter": return interseccion(a, b);
        case "dif": return diferencia(a, b);
        case "dsim": return diferenciaSimetrica(a, b);
        case "prod": return productoCartesiano(a, b);
      }
    }
  }
}

/** Traduce una expresión de conjuntos a lógica proposicional ("x ∈ A" pasa a ser la variable A). */
export function aLogica(e: ExprConj): L.Expr {
  switch (e.t) {
    case "vacio": return L.constante(false);
    case "var": return L.variable(e.nombre);
    case "comp": return L.no(aLogica(e.x));
    case "bin": {
      if (e.op === "prod") throw new Error("El producto cartesiano no tiene un equivalente proposicional directo.");
      const a = aLogica(e.izq);
      const b = aLogica(e.der);
      switch (e.op) {
        case "union": return L.bin("o", a, b);
        case "inter": return L.bin("y", a, b);
        case "dif": return L.bin("y", a, L.no(b));
        case "dsim": return L.bin("xor", a, b);
      }
    }
  }
}

/** ¿Son iguales para cualquier conjunto y universo? Se decide con la tabla de verdad de "x ∈ …". */
export function expresionesEquivalentes(a: string, b: string): L.ResultadoEquivalencia {
  return L.compararEquivalencia(aLogica(parsearExpresion(a)), aLogica(parsearExpresion(b)));
}

export const mostrar = conjuntoATexto;
