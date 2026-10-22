/** Leyes de equivalencia clásicas. Cada una se verifica con la tabla de verdad, no se da por buena. */
export interface Ley {
  nombre: string;
  izq: string;
  der: string;
}

export const LEYES: Ley[] = [
  { nombre: "Doble negación", izq: "¬¬p", der: "p" },
  { nombre: "De Morgan (conjunción)", izq: "¬(p ∧ q)", der: "¬p ∨ ¬q" },
  { nombre: "De Morgan (disyunción)", izq: "¬(p ∨ q)", der: "¬p ∧ ¬q" },
  { nombre: "Conmutativa (∧)", izq: "p ∧ q", der: "q ∧ p" },
  { nombre: "Conmutativa (∨)", izq: "p ∨ q", der: "q ∨ p" },
  { nombre: "Asociativa (∧)", izq: "(p ∧ q) ∧ r", der: "p ∧ (q ∧ r)" },
  { nombre: "Asociativa (∨)", izq: "(p ∨ q) ∨ r", der: "p ∨ (q ∨ r)" },
  { nombre: "Distributiva (∧ sobre ∨)", izq: "p ∧ (q ∨ r)", der: "(p ∧ q) ∨ (p ∧ r)" },
  { nombre: "Distributiva (∨ sobre ∧)", izq: "p ∨ (q ∧ r)", der: "(p ∨ q) ∧ (p ∨ r)" },
  { nombre: "Idempotencia (∧)", izq: "p ∧ p", der: "p" },
  { nombre: "Idempotencia (∨)", izq: "p ∨ p", der: "p" },
  { nombre: "Absorción (∧)", izq: "p ∧ (p ∨ q)", der: "p" },
  { nombre: "Absorción (∨)", izq: "p ∨ (p ∧ q)", der: "p" },
  { nombre: "Identidad (∧)", izq: "p ∧ V", der: "p" },
  { nombre: "Identidad (∨)", izq: "p ∨ F", der: "p" },
  { nombre: "Dominación (∧)", izq: "p ∧ F", der: "F" },
  { nombre: "Dominación (∨)", izq: "p ∨ V", der: "V" },
  { nombre: "Tercero excluido", izq: "p ∨ ¬p", der: "V" },
  { nombre: "Contradicción", izq: "p ∧ ¬p", der: "F" },
  { nombre: "Implicación como disyunción", izq: "p → q", der: "¬p ∨ q" },
  { nombre: "Contrapositiva", izq: "p → q", der: "¬q → ¬p" },
  { nombre: "Bicondicional como dos implicaciones", izq: "p ↔ q", der: "(p → q) ∧ (q → p)" },
  { nombre: "Bicondicional y XOR", izq: "p ↔ q", der: "¬(p ⊕ q)" },
  { nombre: "Exportación", izq: "(p ∧ q) → r", der: "p → (q → r)" },
];
