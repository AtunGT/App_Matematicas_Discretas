import { useEffect, useState } from "react";
import { ApiError, type Rol } from "@limd/api-client";
import { useAuth } from "../auth";
import { DataTable } from "../components/DataTable";

interface Seccion {
  id: string;
  titulo: string;
  ruta: string;
}

const SECCIONES: Record<Rol, Seccion[]> = {
  admin: [
    { id: "usuarios", titulo: "Usuarios", ruta: "/users" },
    { id: "asignaturas", titulo: "Asignaturas", ruta: "/academic/asignaturas" },
    { id: "periodos", titulo: "Periodos", ruta: "/academic/periodos" },
  ],
  docente: [
    { id: "resumen", titulo: "Resumen general", ruta: "/metricas/resumen-general" },
    { id: "grupos", titulo: "Grupos", ruta: "/academic/grupos" },
    { id: "practicas", titulo: "Prácticas", ruta: "/practicas" },
  ],
  estudiante: [
    { id: "grupos", titulo: "Mis grupos", ruta: "/academic/mis-grupos" },
    { id: "intentos", titulo: "Mis intentos", ruta: "/intentos/mis-intentos" },
    { id: "metricas", titulo: "Mis métricas", ruta: "/metricas/mis-metricas" },
  ],
};

const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador",
  docente: "Docente",
  estudiante: "Estudiante",
};

function Contenido({ ruta }: { ruta: string }) {
  const { api } = useAuth();
  const [data, setData] = useState<unknown>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setData(undefined);
    setError(null);
    api
      .get(ruta)
      .then((d) => vigente && setData(d))
      .catch((e: unknown) => {
        if (!vigente) return;
        if (e instanceof ApiError && e.status === 403) setError("Tu rol no tiene permiso para ver esto.");
        else setError(e instanceof Error ? e.message : "No se pudo cargar la información.");
      });
    return () => {
      vigente = false;
    };
  }, [api, ruta]);

  if (error)
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  if (data === undefined) return <p className="vacio">Cargando…</p>;
  return <DataTable data={data} />;
}

export function Panel() {
  const { sesion, salir } = useAuth();
  const rol = sesion!.usuario.rol;
  const secciones = SECCIONES[rol];
  const [activa, setActiva] = useState(secciones[0]!.id);
  const actual = secciones.find((s) => s.id === activa) ?? secciones[0]!;
  const u = sesion!.usuario;
  const nombre = [u.nombre, u.apellidos].filter(Boolean).join(" ") || u.email;

  return (
    <div className="app">
      <header className="barra">
        <span className="marca chica">LIMD</span>
        <nav aria-label="Secciones">
          {secciones.map((s) => (
            <button
              key={s.id}
              className={s.id === actual.id ? "tab activa" : "tab"}
              onClick={() => setActiva(s.id)}
            >
              {s.titulo}
            </button>
          ))}
        </nav>
        <div className="usuario">
          <span>
            {nombre}
            <small>{NOMBRE_ROL[rol]}</small>
          </span>
          <button className="secundario" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="contenido">
        <h2>{actual.titulo}</h2>
        <Contenido key={actual.ruta} ruta={actual.ruta} />
      </main>
    </div>
  );
}
