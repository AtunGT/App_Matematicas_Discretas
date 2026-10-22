import { describe, expect, it } from "vitest";
import {
  ErrorDeConjunto,
  ErrorDeExpresion,
  LEYES_CONJUNTOS,
  aTexto,
  cardinalidad,
  complemento,
  conjunto,
  diferencia,
  diferenciaSimetrica,
  esSubconjunto,
  esSubconjuntoPropio,
  evaluarExpresion,
  exprATexto,
  expresionesEquivalentes,
  interseccion,
  parsearConjunto,
  parsearExpresion,
  pertenece,
  potencia,
  productoCartesiano,
  regionesVenn,
  sonDisjuntos,
  sonIguales,
  union,
} from "../src/conjuntos";

const C = parsearConjunto;
const U = C("{1, 2, 3, 4, 5, 6}");
const A = C("{1, 2, 3}");
const B = C("{3, 4, 5}");

describe("literales", () => {
  it("lee números, palabras, textos y tuplas, y ordena sin repetidos", () => {
    expect(aTexto(C("{3, 1, 2, 3, a, b, (1, 2)}"))).toBe("{1, 2, 3, a, b, (1, 2)}");
    expect(aTexto(C('{"hola mundo", 1.5}'))).toBe("{1.5, hola mundo}");
    expect(aTexto(C("{}"))).toBe("∅");
    expect(aTexto(C("∅"))).toBe("∅");
  });
  it("reporta errores con posición", () => {
    expect(() => C("1, 2")).toThrow(ErrorDeConjunto);
    expect(() => C("{1, 2")).toThrow(/Se esperaba/);
    expect(() => C("{1,, 2}")).toThrow(ErrorDeConjunto);
    expect(() => C("{1} 2")).toThrow(/después/);
    expect(() => C("{()}")).toThrow(/vacía/);
  });
});

describe("operaciones", () => {
  it("unión, intersección, diferencia y diferencia simétrica", () => {
    expect(aTexto(union(A, B))).toBe("{1, 2, 3, 4, 5}");
    expect(aTexto(interseccion(A, B))).toBe("{3}");
    expect(aTexto(diferencia(A, B))).toBe("{1, 2}");
    expect(aTexto(diferenciaSimetrica(A, B))).toBe("{1, 2, 4, 5}");
  });
  it("complemento respecto al universo", () => {
    expect(aTexto(complemento(A, U))).toBe("{4, 5, 6}");
    expect(() => complemento(C("{9}"), U)).toThrow(/universo/);
  });
  it("producto cartesiano: |A×B| = |A|·|B| y no es conmutativo", () => {
    const X = C("{1, 2}");
    const Y = C("{a, b, c}");
    expect(aTexto(productoCartesiano(X, Y))).toBe("{(1, a), (1, b), (1, c), (2, a), (2, b), (2, c)}");
    expect(cardinalidad(productoCartesiano(X, Y))).toBe(6);
    expect(sonIguales(productoCartesiano(X, Y), productoCartesiano(Y, X))).toBe(false);
    expect(cardinalidad(productoCartesiano(X, []))).toBe(0);
  });
  it("conjunto potencia tiene 2^n subconjuntos", () => {
    const P = potencia(C("{a, b, c}"));
    expect(P).toHaveLength(8);
    expect(aTexto(P[0]!)).toBe("∅");
    expect(aTexto(P[7]!)).toBe("{a, b, c}");
    expect(potencia([])).toHaveLength(1);
    expect(() => potencia(conjunto(Array.from({ length: 13 }, (_, i) => i)))).toThrow(/límita|limita/);
  });
  it("predicados", () => {
    expect(pertenece(2, A)).toBe(true);
    expect(pertenece(9, A)).toBe(false);
    expect(esSubconjunto(C("{1, 2}"), A)).toBe(true);
    expect(esSubconjuntoPropio(A, A)).toBe(false);
    expect(sonIguales(C("{2, 1, 3}"), A)).toBe(true);
    expect(sonDisjuntos(C("{1, 2}"), C("{3, 4}"))).toBe(true);
    expect(esSubconjunto([], A)).toBe(true);
  });
  it("1 y '1' son elementos distintos", () => {
    expect(cardinalidad(conjunto([1, "1"]))).toBe(2);
  });
});

describe("expresiones", () => {
  const env = { A, B, C: C("{5, 6}") };
  it("respeta la precedencia ∩ antes que ∪", () => {
    expect(aTexto(evaluarExpresion(parsearExpresion("A ∪ B ∩ C"), env))).toBe("{1, 2, 3, 5}");
    expect(aTexto(evaluarExpresion(parsearExpresion("(A ∪ B) ∩ C"), env))).toBe("{5}");
  });
  it("acepta notaciones alternativas y complemento", () => {
    expect(aTexto(evaluarExpresion(parsearExpresion("A | B"), env))).toBe("{1, 2, 3, 4, 5}");
    expect(aTexto(evaluarExpresion(parsearExpresion("A \\ B"), env))).toBe("{1, 2}");
    expect(aTexto(evaluarExpresion(parsearExpresion("A'"), env, U))).toBe("{4, 5, 6}");
    expect(aTexto(evaluarExpresion(parsearExpresion("¬A ∩ B"), env, U))).toBe("{4, 5}");
    expect(aTexto(evaluarExpresion(parsearExpresion("A × C"), env))).toBe("{(1, 5), (1, 6), (2, 5), (2, 6), (3, 5), (3, 6)}");
  });
  it("complemento sin universo da un error claro", () => {
    expect(() => evaluarExpresion(parsearExpresion("A'"), env)).toThrow(/universo/);
    expect(() => evaluarExpresion(parsearExpresion("Z"), env)).toThrow(/«Z»/);
  });
  it("errores de sintaxis", () => {
    expect(() => parsearExpresion("")).toThrow(ErrorDeExpresion);
    expect(() => parsearExpresion("A ∪")).toThrow(/falta un conjunto/);
    expect(() => parsearExpresion("(A ∪ B")).toThrow(/Falta cerrar/);
    expect(() => parsearExpresion("A B")).toThrow(/Se esperaba un operador/);
    expect(() => parsearExpresion("A # B")).toThrow(/no reconocido/);
  });
  it("el texto canónico se vuelve a parsear al mismo árbol", () => {
    for (const t of ["(A ∪ B) ∩ C", "A ∪ (B ∩ C)", "A ∖ (B ∖ C)", "(A ∪ B)'", "A × B ∩ C"]) {
      const e = parsearExpresion(t);
      expect(parsearExpresion(exprATexto(e))).toEqual(e);
    }
  });
});

describe("identidades (verificadas con la tabla de verdad)", () => {
  it.each(LEYES_CONJUNTOS.map((l) => [l.nombre, l.izq, l.der]))("%s", (_n, izq, der) => {
    expect(expresionesEquivalentes(izq!, der!).equivalentes).toBe(true);
  });
  it("detecta lo que no es una identidad y da contraejemplo", () => {
    const r = expresionesEquivalentes("A ∖ B", "B ∖ A");
    expect(r.equivalentes).toBe(false);
    expect(r.contraejemplo).toBeDefined();
  });
  it("las identidades también se cumplen con conjuntos concretos", () => {
    const env = { A, B, C: C("{2, 5, 6}") };
    for (const l of LEYES_CONJUNTOS) {
      const izq = evaluarExpresion(parsearExpresion(l.izq), env, U);
      const der = evaluarExpresion(parsearExpresion(l.der), env, U);
      expect(sonIguales(izq, der), l.nombre).toBe(true);
    }
  });
  it("el producto cartesiano no se traduce a lógica", () => {
    expect(() => expresionesEquivalentes("A × B", "B × A")).toThrow(/producto/);
  });
});

describe("diagrama de Venn", () => {
  it("reparte los elementos por región y cubre todas las regiones", () => {
    const d = regionesVenn({ A, B }, U);
    expect(d.regiones).toHaveLength(3);
    const por = (etq: string) => aTexto(d.regiones.find((r) => r.etiqueta === etq)!.elementos);
    expect(por("A (sin B)")).toBe("{1, 2}");
    expect(por("A ∩ B")).toBe("{3}");
    expect(por("B (sin A)")).toBe("{4, 5}");
    expect(aTexto(d.fuera)).toBe("{6}");
  });
  it("con 3 conjuntos hay 7 regiones, incluso las vacías", () => {
    const d = regionesVenn({ A, B, C: C("{9}") });
    expect(d.regiones).toHaveLength(7);
    expect(d.regiones.filter((r) => r.elementos.length === 0).length).toBeGreaterThan(0);
  });
  it("rechaza más de 4 conjuntos", () => {
    expect(() => regionesVenn({ A, B, C: A, D: B, E: A })).toThrow(/hasta 4/);
  });
});
