import { conjunto, type Conjunto, type Elemento } from "./tipos";

export class ErrorDeConjunto extends Error {
  constructor(
    mensaje: string,
    readonly posicion: number,
  ) {
    super(mensaje);
    this.name = "ErrorDeConjunto";
  }
}

/** Lee "{1, 2, a, (1, b)}", "∅" o "{}". Números, palabras, "textos entre comillas" y tuplas entre paréntesis. */
export function parsearConjunto(texto: string): Conjunto {
  let i = 0;
  const saltar = () => {
    while (i < texto.length && /\s/.test(texto[i]!)) i++;
  };
  const fallo = (m: string): never => {
    throw new ErrorDeConjunto(`${m} (posición ${i + 1}).`, i);
  };

  function elemento(): Elemento {
    saltar();
    const c = texto[i];
    if (c === undefined) return fallo("Falta un elemento");
    if (c === "(") {
      i++;
      const partes: Elemento[] = [];
      saltar();
      if (texto[i] === ")") return fallo("Una tupla no puede estar vacía");
      for (;;) {
        partes.push(elemento());
        saltar();
        if (texto[i] === ",") {
          i++;
          continue;
        }
        if (texto[i] === ")") {
          i++;
          return partes;
        }
        return fallo("Se esperaba «,» o «)» en la tupla");
      }
    }
    if (c === '"') {
      const fin = texto.indexOf('"', i + 1);
      if (fin < 0) return fallo("Texto sin cerrar");
      const s = texto.slice(i + 1, fin);
      i = fin + 1;
      return s;
    }
    const num = /^-?\d+(\.\d+)?/.exec(texto.slice(i));
    if (num) {
      i += num[0].length;
      return Number(num[0]);
    }
    const pal = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(texto.slice(i));
    if (pal) {
      i += pal[0].length;
      return pal[0];
    }
    return fallo(`Carácter no válido «${c}»`);
  }

  saltar();
  if (texto.startsWith("∅", i)) {
    i += 1;
    saltar();
    if (i < texto.length) fallo("Hay texto después de ∅");
    return [];
  }
  if (texto[i] !== "{") fallo("Un conjunto debe empezar con «{»");
  i++;
  saltar();
  const elementos: Elemento[] = [];
  if (texto[i] === "}") {
    i++;
  } else {
    for (;;) {
      elementos.push(elemento());
      saltar();
      if (texto[i] === ",") {
        i++;
        continue;
      }
      if (texto[i] === "}") {
        i++;
        break;
      }
      fallo("Se esperaba «,» o «}»");
    }
  }
  saltar();
  if (i < texto.length) fallo("Hay texto después de «}»");
  return conjunto(elementos);
}
