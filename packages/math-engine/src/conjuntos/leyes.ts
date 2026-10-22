export interface LeyConjuntos {
  nombre: string;
  izq: string;
  der: string;
}

/** Identidades de conjuntos; las pruebas las verifican con la tabla de verdad. */
export const LEYES_CONJUNTOS: LeyConjuntos[] = [
  { nombre: "De Morgan (unión)", izq: "(A ∪ B)'", der: "A' ∩ B'" },
  { nombre: "De Morgan (intersección)", izq: "(A ∩ B)'", der: "A' ∪ B'" },
  { nombre: "Doble complemento", izq: "A''", der: "A" },
  { nombre: "Conmutativa (∪)", izq: "A ∪ B", der: "B ∪ A" },
  { nombre: "Conmutativa (∩)", izq: "A ∩ B", der: "B ∩ A" },
  { nombre: "Asociativa (∪)", izq: "(A ∪ B) ∪ C", der: "A ∪ (B ∪ C)" },
  { nombre: "Asociativa (∩)", izq: "(A ∩ B) ∩ C", der: "A ∩ (B ∩ C)" },
  { nombre: "Distributiva (∩ sobre ∪)", izq: "A ∩ (B ∪ C)", der: "(A ∩ B) ∪ (A ∩ C)" },
  { nombre: "Distributiva (∪ sobre ∩)", izq: "A ∪ (B ∩ C)", der: "(A ∪ B) ∩ (A ∪ C)" },
  { nombre: "Absorción (∪)", izq: "A ∪ (A ∩ B)", der: "A" },
  { nombre: "Absorción (∩)", izq: "A ∩ (A ∪ B)", der: "A" },
  { nombre: "Idempotencia", izq: "A ∪ A", der: "A" },
  { nombre: "Identidad (∪ con ∅)", izq: "A ∪ ∅", der: "A" },
  { nombre: "Dominación (∩ con ∅)", izq: "A ∩ ∅", der: "∅" },
  { nombre: "Diferencia como intersección", izq: "A ∖ B", der: "A ∩ B'" },
  { nombre: "Diferencia simétrica", izq: "A Δ B", der: "(A ∖ B) ∪ (B ∖ A)" },
  { nombre: "Diferencia simétrica (otra forma)", izq: "A Δ B", der: "(A ∪ B) ∖ (A ∩ B)" },
  { nombre: "Complemento con A", izq: "A ∩ A'", der: "∅" },
];
