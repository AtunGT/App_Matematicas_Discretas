# @limd/math-engine

Motor matemático de LIMD (rol C). TypeScript puro, sin interfaz, con pruebas. La web y la app de
escritorio lo consumen; el asistente ONNX solo explica lo que este motor ya calculó.

## Lógica proposicional (`src/logica`)

| Función | Qué hace |
|---|---|
| `parsear(texto)` | Texto → árbol. Acepta ∧ & && ^ · ∨ \| \|\| · ¬ ! ~ · → -> => · ↔ <-> <=> · ⊕. Lanza `ErrorDeSintaxis` con posición. |
| `aTexto(expr)` | Árbol → texto canónico con paréntesis mínimos. |
| `evaluar(expr, asignación)` | Valor de verdad con una asignación dada. |
| `tablaVerdad(expr)` | Filas V→F, una columna por subexpresión (máx. 10 variables). |
| `clasificar(expr)` | tautología, contradicción o contingencia. |
| `compararEquivalencia(a, b)` | Equivalencia lógica, con contraejemplo si no lo son. |
| `argumentoValido(premisas, conclusión)` | Validez de un argumento, con contraejemplo. |
| `aArbol(expr)` / `arbolEnTexto(expr)` | Representación estructural para dibujar. |
| `LEYES` | 24 leyes de equivalencia (De Morgan, absorción, contrapositiva…), todas verificadas en las pruebas. |

Precedencia (mayor primero): ¬ · ∧ · ⊕ · ∨ · → (asocia a la derecha) · ↔. Constantes: `V`, `F`, `1`, `0`.

```bash
npm -w @limd/math-engine test
```

> Importación: `import { logica, conjuntos } from "@limd/math-engine"` (cada módulo va en su espacio de nombres).

## Conjuntos (`src/conjuntos`)

| Función | Qué hace |
|---|---|
| `parsearConjunto("{1, 2, a, (1, b)}")` | Texto → conjunto canónico (sin repetidos, ordenado). Acepta `∅`, `{}`, números, palabras, "textos" y tuplas. |
| `union`, `interseccion`, `diferencia`, `diferenciaSimetrica`, `complemento(A, U)` | Operaciones; el complemento exige A ⊆ U. |
| `productoCartesiano(A, B)` | Pares ordenados; \|A×B\| = \|A\|·\|B\|. |
| `potencia(A)` | Los 2ⁿ subconjuntos (máx. 12 elementos). |
| `pertenece`, `esSubconjunto`, `esSubconjuntoPropio`, `sonIguales`, `sonDisjuntos` | Relaciones entre conjuntos. |
| `parsearExpresion("A ∪ (B ∩ C)'")` + `evaluarExpresion(expr, {A, B, C}, U)` | Expresiones con ∪ ∩ ∖ Δ × y complemento (`A'`, `ᶜ`, `¬A`). Precedencia: ∪ ∖ Δ < ∩ < × < complemento. |
| `expresionesEquivalentes(a, b)` | ¿Son la misma identidad para cualquier conjunto? Se decide con la tabla de verdad de «x ∈ …», con contraejemplo. |
| `regionesVenn({A, B, C}, U)` | Regiones del diagrama de Venn (hasta 4 conjuntos) con sus elementos, listas para dibujar. |
| `LEYES_CONJUNTOS` | 18 identidades (De Morgan, distributivas, absorción…), todas verificadas en las pruebas. |
