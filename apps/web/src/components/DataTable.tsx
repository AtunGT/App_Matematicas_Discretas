import { comoLista } from "@limd/api-client";

type Fila = Record<string, unknown>;

function esPrimitivo(v: unknown): boolean {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

function celda(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

function etiqueta(k: string): string {
  const t = k.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Muestra cualquier respuesta de la API: lista de objetos como tabla, objeto simple como pares clave/valor. */
export function DataTable({ data }: { data: unknown }) {
  const lista = comoLista(data);

  if (lista) {
    if (lista.length === 0) return <p className="vacio">Todavía no hay registros.</p>;
    const filas = lista.filter((x): x is Fila => !!x && typeof x === "object");
    const cols: string[] = [];
    for (const f of filas.slice(0, 20)) {
      for (const [k, v] of Object.entries(f)) if (esPrimitivo(v) && !cols.includes(k)) cols.push(k);
    }
    const visibles = cols.slice(0, 7);
    return (
      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>{visibles.map((c) => <th key={c}>{etiqueta(c)}</th>)}</tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>{visibles.map((c) => <td key={c}>{celda(f[c])}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data && typeof data === "object") {
    const pares = Object.entries(data as Fila).filter(([, v]) => esPrimitivo(v));
    if (pares.length === 0) return <p className="vacio">Sin datos para mostrar.</p>;
    return (
      <dl className="metricas">
        {pares.map(([k, v]) => (
          <div key={k}>
            <dt>{etiqueta(k)}</dt>
            <dd>{celda(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className="vacio">Sin datos para mostrar.</p>;
}
