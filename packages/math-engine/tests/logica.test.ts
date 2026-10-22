import { describe, expect, it } from "vitest";
import {
  ErrorDeSintaxis,
  LEYES,
  aTexto,
  argumentoValido,
  arbolEnTexto,
  clasificar,
  compararEquivalencia,
  evaluar,
  parsear,
  tablaVerdad,
  variables,
} from "../src/logica";

const resultados = (texto: string) => tablaVerdad(parsear(texto)).filas.map((f) => f.resultado);

describe("parser", () => {
  it("acepta distintas notaciones para el mismo operador", () => {
    const base = aTexto(parsear("p ∧ q"));
    expect(aTexto(parsear("p & q"))).toBe(base);
    expect(aTexto(parsear("p && q"))).toBe(base);
    expect(aTexto(parsear("p ^ q"))).toBe(base);
    expect(aTexto(parsear("p -> q"))).toBe("p → q");
    expect(aTexto(parsear("p <-> q"))).toBe("p ↔ q");
    expect(aTexto(parsear("!p | ~q"))).toBe("¬p ∨ ¬q");
  });

  it("respeta la precedencia: ¬ > ∧ > ⊕ > ∨ > → > ↔", () => {
    expect(aTexto(parsear("p ∨ q ∧ r"))).toBe("p ∨ q ∧ r");
    expect(parsear("p ∨ q ∧ r")).toMatchObject({ op: "o", der: { op: "y" } });
    expect(parsear("p → q ∨ r")).toMatchObject({ op: "implica", der: { op: "o" } });
    expect(parsear("p ↔ q → r")).toMatchObject({ op: "sii", der: { op: "implica" } });
    expect(parsear("¬p ∧ q")).toMatchObject({ op: "y", izq: { tipo: "no" } });
  });

  it("→ asocia a la derecha y los demás a la izquierda", () => {
    expect(parsear("p → q → r")).toMatchObject({ op: "implica", der: { op: "implica" } });
    expect(parsear("p ∧ q ∧ r")).toMatchObject({ op: "y", izq: { op: "y" } });
  });

  it("el texto canónico se vuelve a parsear al mismo árbol", () => {
    for (const t of ["(p → q) → r", "p → (q → r)", "¬(p ∧ q)", "p ∧ (q ∨ r)", "(p ∨ q) ∧ ¬r ↔ s", "p ∧ (q ∧ r)"]) {
      const e = parsear(t);
      expect(parsear(aTexto(e))).toEqual(e);
    }
  });

  it("reconoce constantes y variables de varias letras", () => {
    expect(evaluar(parsear("V ∧ ¬F"), {})).toBe(true);
    expect(evaluar(parsear("1 → 0"), {})).toBe(false);
    expect(variables(parsear("llueve → mojado"))).toEqual(["llueve", "mojado"]);
  });

  it("reporta errores de sintaxis con posición", () => {
    expect(() => parsear("")).toThrow(ErrorDeSintaxis);
    expect(() => parsear("p ∧")).toThrow(/falta un operando/);
    expect(() => parsear("(p ∧ q")).toThrow(/Falta cerrar/);
    expect(() => parsear("p ∧ q)")).toThrow(/sin abrir/);
    expect(() => parsear("p q")).toThrow(/Se esperaba un operador/);
    expect(() => parsear("p # q")).toThrow(/no reconocido/);
    try {
      parsear("p ∧ # q");
    } catch (e) {
      expect((e as ErrorDeSintaxis).posicion).toBe(4);
    }
  });
});

describe("tabla de verdad", () => {
  it("ordena las filas V,V → V,F → F,V → F,F", () => {
    const t = tablaVerdad(parsear("p ∧ q"));
    expect(t.variables).toEqual(["p", "q"]);
    expect(t.filas.map((f) => [f.asignacion.p, f.asignacion.q])).toEqual([
      [true, true],
      [true, false],
      [false, true],
      [false, false],
    ]);
  });

  it("calcula los operadores básicos", () => {
    expect(resultados("p ∧ q")).toEqual([true, false, false, false]);
    expect(resultados("p ∨ q")).toEqual([true, true, true, false]);
    expect(resultados("p → q")).toEqual([true, false, true, true]);
    expect(resultados("p ↔ q")).toEqual([true, false, false, true]);
    expect(resultados("p ⊕ q")).toEqual([false, true, true, false]);
    expect(resultados("¬p")).toEqual([false, true]);
  });

  it("incluye una columna por subexpresión, sin repetir, y la última es la expresión completa", () => {
    const t = tablaVerdad(parsear("(p ∧ q) ∨ ¬(p ∧ q)"));
    expect(t.columnas).toEqual(["p ∧ q", "¬(p ∧ q)", "p ∧ q ∨ ¬(p ∧ q)"]);
    expect(t.filas.every((f) => f.valores[f.valores.length - 1] === f.resultado)).toBe(true);
  });

  it("una variable sola produce una sola columna", () => {
    const t = tablaVerdad(parsear("p"));
    expect(t.columnas).toEqual(["p"]);
    expect(t.filas).toHaveLength(2);
  });

  it("tiene 2^n filas", () => {
    expect(tablaVerdad(parsear("p ∧ q ∧ r ∧ s")).filas).toHaveLength(16);
  });

  it("rechaza más de 10 variables", () => {
    const muchas = Array.from({ length: 11 }, (_, i) => `x${i}`).join(" ∧ ");
    expect(() => tablaVerdad(parsear(muchas))).toThrow(/máximo 10/);
  });
});

describe("clasificación", () => {
  it("distingue tautología, contradicción y contingencia", () => {
    expect(clasificar(parsear("p ∨ ¬p"))).toBe("tautologia");
    expect(clasificar(parsear("p ∧ ¬p"))).toBe("contradiccion");
    expect(clasificar(parsear("p → q"))).toBe("contingencia");
    expect(clasificar(parsear("(p → q) ∧ p → q"))).toBe("tautologia");
  });
});

describe("equivalencias", () => {
  it.each(LEYES.map((l) => [l.nombre, l.izq, l.der]))("ley: %s", (_n, izq, der) => {
    expect(compararEquivalencia(parsear(izq!), parsear(der!)).equivalentes).toBe(true);
  });

  it("detecta lo que NO es equivalente y da un contraejemplo", () => {
    const r = compararEquivalencia(parsear("p → q"), parsear("q → p"));
    expect(r.equivalentes).toBe(false);
    expect(r.contraejemplo).toBeDefined();
    const a = r.contraejemplo!;
    expect(evaluar(parsear("p → q"), a)).not.toBe(evaluar(parsear("q → p"), a));
  });

  it("compara expresiones con variables distintas", () => {
    expect(compararEquivalencia(parsear("p ∨ (q ∧ ¬q)"), parsear("p")).equivalentes).toBe(true);
  });
});

describe("argumentos", () => {
  it("modus ponens es válido", () => {
    expect(argumentoValido([parsear("p → q"), parsear("p")], parsear("q")).equivalentes).toBe(true);
  });
  it("afirmar el consecuente es una falacia", () => {
    const r = argumentoValido([parsear("p → q"), parsear("q")], parsear("p"));
    expect(r.equivalentes).toBe(false);
    expect(r.contraejemplo).toEqual({ p: false, q: true });
  });
});

describe("representación estructural", () => {
  it("dibuja el árbol de la expresión", () => {
    expect(arbolEnTexto(parsear("¬p ∧ q"))).toBe(["∧", "├─ ¬", "│  └─ p", "└─ q"].join("\n"));
  });
});
