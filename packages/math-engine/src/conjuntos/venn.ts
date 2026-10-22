import { clave, conjunto, type Conjunto, type Elemento } from "./tipos";

export interface RegionVenn {
  /** Conjuntos a los que pertenecen los elementos de esta región. */
  dentro: string[];
  etiqueta: string;
  elementos: Conjunto;
}

export interface DiagramaVenn {
  nombres: string[];
  regiones: RegionVenn[];
  /** Elementos del universo que no están en ningún conjunto. */
  fuera: Conjunto;
}

export const MAX_VENN = 4;

/** Divide todos los elementos en regiones según a qué conjuntos pertenecen; es lo que se dibuja en un diagrama de Venn. */
export function regionesVenn(env: Record<string, Conjunto>, universo?: Conjunto): DiagramaVenn {
  const nombres = Object.keys(env);
  if (nombres.length === 0) throw new Error("Hace falta al menos un conjunto.");
  if (nombres.length > MAX_VENN) throw new Error(`Un diagrama de Venn admite hasta ${MAX_VENN} conjuntos.`);

  const todos = new Map<string, Elemento>();
  for (const n of nombres) for (const e of env[n]!) todos.set(clave(e), e);
  const enUniverso = new Set((universo ?? []).map(clave));
  for (const e of universo ?? []) todos.set(clave(e), e);

  const grupos = new Map<string, { dentro: string[]; elementos: Elemento[] }>();
  const fuera: Elemento[] = [];
  for (const [k, e] of todos) {
    const dentro = nombres.filter((n) => env[n]!.some((x) => clave(x) === k));
    if (dentro.length === 0) {
      if (enUniverso.has(k)) fuera.push(e);
      continue;
    }
    const id = dentro.join("|");
    if (!grupos.has(id)) grupos.set(id, { dentro, elementos: [] });
    grupos.get(id)!.elementos.push(e);
  }

  // Se listan todas las regiones posibles (aunque estén vacías) para poder dibujarlas.
  const regiones: RegionVenn[] = [];
  for (let m = 1; m < 2 ** nombres.length; m++) {
    const dentro = nombres.filter((_, i) => (m >> i) & 1);
    const resto = nombres.filter((n) => !dentro.includes(n));
    const etiqueta = dentro.join(" ∩ ") + (resto.length ? ` (sin ${resto.join(", ")})` : "");
    regiones.push({ dentro, etiqueta, elementos: conjunto(grupos.get(dentro.join("|"))?.elementos ?? []) });
  }
  return { nombres, regiones, fuera: conjunto(fuera) };
}
