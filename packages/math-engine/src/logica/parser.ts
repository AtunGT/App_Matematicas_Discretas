import { bin, constante, no, variable, type Expr, type OpBinario } from "./ast";

export class ErrorDeSintaxis extends Error {
  constructor(
    mensaje: string,
    readonly posicion: number,
  ) {
    super(mensaje);
    this.name = "ErrorDeSintaxis";
  }
}

type Token =
  | { t: "const"; valor: boolean; pos: number }
  | { t: "var"; nombre: string; pos: number }
  | { t: "no"; pos: number }
  | { t: "op"; op: OpBinario; pos: number }
  | { t: "(" | ")"; pos: number }
  | { t: "fin"; pos: number };

// Se prueban de mayor a menor longitud para que "<->" no se lea como "<" y "->".
const OPERADORES: Array<[string, OpBinario]> = [
  ["<=>", "sii"],
  ["<->", "sii"],
  ["↔", "sii"],
  ["=>", "implica"],
  ["->", "implica"],
  ["→", "implica"],
  ["&&", "y"],
  ["∧", "y"],
  ["&", "y"],
  ["^", "y"],
  ["||", "o"],
  ["∨", "o"],
  ["|", "o"],
  ["⊕", "xor"],
];
const NEGACIONES = ["¬", "!", "~"];

function tokenizar(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "(" || c === ")") {
      tokens.push({ t: c, pos: i });
      i++;
      continue;
    }
    if (NEGACIONES.includes(c)) {
      tokens.push({ t: "no", pos: i });
      i++;
      continue;
    }
    const op = OPERADORES.find(([s]) => src.startsWith(s, i));
    if (op) {
      tokens.push({ t: "op", op: op[1], pos: i });
      i += op[0].length;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j]!)) j++;
      const palabra = src.slice(i, j);
      if (palabra === "V" || palabra === "true") tokens.push({ t: "const", valor: true, pos: i });
      else if (palabra === "F" || palabra === "false") tokens.push({ t: "const", valor: false, pos: i });
      else tokens.push({ t: "var", nombre: palabra, pos: i });
      i = j;
      continue;
    }
    if (c === "1" || c === "0") {
      tokens.push({ t: "const", valor: c === "1", pos: i });
      i++;
      continue;
    }
    throw new ErrorDeSintaxis(`Carácter no reconocido «${c}» en la posición ${i + 1}.`, i);
  }
  tokens.push({ t: "fin", pos: src.length });
  return tokens;
}

/**
 * Gramática (de menor a mayor precedencia):
 *   sii     := implica ( ↔ implica )*          asocia a la izquierda
 *   implica := o ( → implica )?                asocia a la derecha
 *   o       := xor ( ∨ xor )*
 *   xor     := y ( ⊕ y )*
 *   y       := unario ( ∧ unario )*
 *   unario  := ¬ unario | atomo
 *   atomo   := constante | variable | ( sii )
 */
class Parser {
  private i = 0;
  constructor(private readonly tokens: Token[]) {}

  private get actual(): Token {
    return this.tokens[this.i]!;
  }

  parsear(): Expr {
    if (this.tokens[0]!.t === "fin") throw new ErrorDeSintaxis("La expresión está vacía.", 0);
    const e = this.sii();
    const resto = this.actual;
    if (resto.t !== "fin") {
      if (resto.t === ")") throw new ErrorDeSintaxis(`Paréntesis «)» sin abrir en la posición ${resto.pos + 1}.`, resto.pos);
      throw new ErrorDeSintaxis(`Se esperaba un operador en la posición ${resto.pos + 1}.`, resto.pos);
    }
    return e;
  }

  private binarioIzq(op: OpBinario, siguiente: () => Expr): Expr {
    let izq = siguiente();
    while (this.actual.t === "op" && this.actual.op === op) {
      this.i++;
      izq = bin(op, izq, siguiente());
    }
    return izq;
  }

  private sii = (): Expr => this.binarioIzq("sii", this.implica);
  private o = (): Expr => this.binarioIzq("o", this.xor);
  private xor = (): Expr => this.binarioIzq("xor", this.y);
  private y = (): Expr => this.binarioIzq("y", this.unario);

  private implica = (): Expr => {
    const izq = this.o();
    if (this.actual.t === "op" && this.actual.op === "implica") {
      this.i++;
      return bin("implica", izq, this.implica());
    }
    return izq;
  };

  private unario = (): Expr => {
    if (this.actual.t === "no") {
      this.i++;
      return no(this.unario());
    }
    return this.atomo();
  };

  private atomo(): Expr {
    const t = this.actual;
    switch (t.t) {
      case "const":
        this.i++;
        return constante(t.valor);
      case "var":
        this.i++;
        return variable(t.nombre);
      case "(": {
        this.i++;
        const e = this.sii();
        if (this.actual.t !== ")") throw new ErrorDeSintaxis(`Falta cerrar el paréntesis abierto en la posición ${t.pos + 1}.`, t.pos);
        this.i++;
        return e;
      }
      case "fin":
        throw new ErrorDeSintaxis("La expresión termina antes de tiempo: falta un operando.", t.pos);
      default:
        throw new ErrorDeSintaxis(`Se esperaba una variable, constante o «(» en la posición ${t.pos + 1}.`, t.pos);
    }
  }
}

/** Convierte texto como "(p ∧ q) → ¬r" en un árbol. Lanza ErrorDeSintaxis si no es válido. */
export function parsear(texto: string): Expr {
  return new Parser(tokenizar(texto)).parsear();
}
