import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient, type ApiClient, type Sesion } from "@limd/api-client";

const KEY = "limd.sesion";

interface AuthCtx {
  sesion: Sesion | null;
  api: ApiClient;
  entrar: (email: string, password: string) => Promise<Sesion>;
  salir: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function leerSesion(): Sesion | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as Sesion | null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);
  const ref = useRef(sesion);
  ref.current = sesion;

  const salir = useCallback(() => {
    localStorage.removeItem(KEY);
    setSesion(null);
  }, []);

  const api = useMemo(
    () =>
      createClient({
        baseUrl: import.meta.env.VITE_API_URL ?? "",
        getToken: () => ref.current?.token ?? null,
        onUnauthorized: salir,
      }),
    [salir],
  );

  const entrar = useCallback(
    async (email: string, password: string) => {
      const s = await api.login(email, password);
      localStorage.setItem(KEY, JSON.stringify(s));
      setSesion(s);
      return s;
    },
    [api],
  );

  return <Ctx.Provider value={{ sesion, api, entrar, salir }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return v;
}
