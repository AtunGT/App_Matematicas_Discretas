/** Un elemento es un número, un texto o una tupla de elementos (p. ej. un par del producto cartesiano). */
export type Elemento = number | string | readonly Elemento[];

/** Conjunto en forma canónica: sin repetidos y ordenado (números, textos y luego tuplas). */
export type Conjunto = readonly Elemento[];

export function clave(e: Elemento): string {
  if (typeof e === "number") return `n:${e}`;
  if (typeof e === "string") return `s:${e}`;
  return `t:(${e.map(clave).join(",")})`;
}

function rango(e: Elemento): number {
  return typeof e === "number" ? 0 : typeof e === "string" ? 1 : 2;
}

export function comparar(a: Elemento, b: Elemento): number {
  const ra = rango(a);
  const rb = rango(b);
  if (ra !== rb) return ra - rb;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
  const ta = a as readonly Elemento[];
  const tb = b as readonly Elemento[];
  for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
    const c = comparar(ta[i]!, tb[i]!);
    if (c !== 0) return c;
  }
  return ta.length - tb.length;
}

/** Crea un conjunto: quita repetidos y ordena. */
export function conjunto(elementos: Iterable<Elemento>): Conjunto {
  const vistos = new Map<string, Elemento>();
  for (const e of elementos) vistos.set(clave(e), e);
  return [...vistos.values()].sort(comparar);
}

export function elementoATexto(e: Elemento): string {
  if (typeof e === "number") return String(e);
  if (typeof e === "string") return e;
  return `(${e.map(elementoATexto).join(", ")})`;
}

export function aTexto(c: Conjunto): string {
  return c.length === 0 ? "∅" : `{${c.map(elementoATexto).join(", ")}}`;
}
