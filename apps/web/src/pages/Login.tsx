import { useState, type FormEvent } from "react";
import { ApiError } from "@limd/api-client";
import { useAuth } from "../auth";

const FILAS: Array<[boolean, boolean]> = [
  [true, true],
  [true, false],
  [false, true],
  [false, false],
];

const v = (b: boolean) => (b ? "V" : "F");

/** Elemento memorable del login: una tabla de verdad que responde a lo que eliges. */
function TablaVerdad() {
  const [p, setP] = useState(true);
  const [q, setQ] = useState(false);
  return (
    <figure className="cuaderno" aria-label="Tabla de verdad de p implica q">
      <figcaption>
        <span className="formula">p → q</span>
        <span className="pista">Elige los valores y mira qué fila se enciende.</span>
      </figcaption>
      <div className="selectores">
        <button type="button" aria-pressed={p} onClick={() => setP(!p)}>
          p = {v(p)}
        </button>
        <button type="button" aria-pressed={q} onClick={() => setQ(!q)}>
          q = {v(q)}
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>p</th>
            <th>q</th>
            <th>p → q</th>
          </tr>
        </thead>
        <tbody>
          {FILAS.map(([fp, fq]) => {
            const activa = fp === p && fq === q;
            const r = !fp || fq;
            return (
              <tr key={`${fp}${fq}`} className={activa ? "activa" : undefined}>
                <td>{v(fp)}</td>
                <td>{v(fq)}</td>
                <td className={r ? "ok" : "no"}>{v(r)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="nota">
        Una implicación solo es falsa cuando la premisa es verdadera y la conclusión es falsa.
      </p>
    </figure>
  );
}

export function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await entrar(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setError("Correo o contraseña incorrectos.");
      else if (err instanceof ApiError && err.status === 0) setError(err.message);
      else setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login">
      <section className="login-form">
        <h1 className="marca">LIMD</h1>
        <p className="subtitulo">Laboratorio Interactivo de Matemáticas Discretas</p>

        <form onSubmit={enviar} noValidate>
          <label>
            Correo institucional
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primario" type="submit" disabled={cargando || !email || !password}>
            {cargando ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
      </section>
      <section className="login-lado">
        <TablaVerdad />
      </section>
    </main>
  );
}
