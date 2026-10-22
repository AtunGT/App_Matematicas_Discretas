import { clave, conjunto, type Conjunto, type Elemento } from "./tipos";

const claves = (c: Conjunto) => new Set(c.map(clave));

export const pertenece = (e: Elemento, c: Conjunto): boolean => claves(c).has(clave(e));
export const cardinalidad = (c: Conjunto): number => c.length;

export const union = (a: Conjunto, b: Conjunto): Conjunto => conjunto([...a, ...b]);

export function interseccion(a: Conjunto, b: Conjunto): Conjunto {
  const kb = claves(b);
  return conjunto(a.filter((e) => kb.has(clave(e))));
}

/** A − B: elementos de A que no están en B. */
export function diferencia(a: Conjunto, b: Conjunto): Conjunto {
  const kb = claves(b);
  return conjunto(a.filter((e) => !kb.has(clave(e))));
}

/** A Δ B: elementos que están en exactamente uno de los dos. */
export const diferenciaSimetrica = (a: Conjunto, b: Conjunto): Conjunto =>
  union(diferencia(a, b), diferencia(b, a));

/** Complemento respecto a un universo. Exige A ⊆ U para no dar resultados engañosos. */
export function complemento(a: Conjunto, universo: Conjunto): Conjunto {
  if (!esSubconjunto(a, universo)) {
    throw new Error("El conjunto tiene elementos que no están en el universo.");
  }
  return diferencia(universo, a);
}

export function productoCartesiano(a: Conjunto, b: Conjunto): Conjunto {
  const pares: Elemento[] = [];
  for (const x of a) for (const y of b) pares.push([x, y]);
  return conjunto(pares);
}

export const MAX_POTENCIA = 12; // 2^12 = 4096 subconjuntos

/** Conjunto potencia: todos los subconjuntos de A (2^n). */
export function potencia(a: Conjunto): Conjunto[] {
  if (a.length > MAX_POTENCIA) throw new Error(`El conjunto potencia se limita a ${MAX_POTENCIA} elementos (recibidos: ${a.length}).`);
  const salida: Conjunto[] = [];
  for (let mascara = 0; mascara < 2 ** a.length; mascara++) {
    salida.push(a.filter((_, i) => (mascara >> i) & 1));
  }
  return salida.sort((x, y) => x.length - y.length);
}

export function esSubconjunto(a: Conjunto, b: Conjunto): boolean {
  const kb = claves(b);
  return a.every((e) => kb.has(clave(e)));
}

export const esSubconjuntoPropio = (a: Conjunto, b: Conjunto): boolean => esSubconjunto(a, b) && a.length < b.length;
export const sonIguales = (a: Conjunto, b: Conjunto): boolean => a.length === b.length && esSubconjunto(a, b);
export const sonDisjuntos = (a: Conjunto, b: Conjunto): boolean => interseccion(a, b).length === 0;
