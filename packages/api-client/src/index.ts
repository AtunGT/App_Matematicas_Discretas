/**
 * Cliente de la API de LIMD (/api/v1). Lo comparten la web y, después, la app de escritorio.
 * Los contratos de respuesta se leen de forma tolerante hasta tener el Swagger de Arthur.
 */

export type Rol = "admin" | "docente" | "estudiante";

export interface Usuario {
  id: number;
  nombre?: string;
  apellidos?: string;
  email: string;
  rol: Rol;
  activo?: boolean;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function normalizarRol(valor: unknown): Rol | null {
  const v = String(valor ?? "").toLowerCase();
  if (v.startsWith("admin")) return "admin";
  if (v.startsWith("doc")) return "docente";
  if (v.startsWith("est") || v.startsWith("alum")) return "estudiante";
  return null;
}

/** Devuelve un arreglo venga la respuesta como [] o como { data | items | results | content: [] }. */
export function comoLista(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["data", "items", "results", "content"]) {
      if (Array.isArray(o[k])) return o[k] as unknown[];
    }
  }
  return null;
}

function mensajeDe(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["message", "mensaje", "error", "detail", "detalle"]) {
      if (typeof o[k] === "string") return o[k] as string;
    }
  }
  return null;
}

export interface ClientOptions {
  /** Vacío = mismo origen (en desarrollo Vite redirige /api al backend). */
  baseUrl?: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export function createClient(opts: ClientOptions = {}) {
  const base = (opts.baseUrl ?? "").replace(/\/$/, "");

  async function request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    tokenExplicito?: string,
  ): Promise<T> {
    const token = tokenExplicito ?? opts.getToken?.() ?? null;
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${base}/api/v1${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, "No se pudo conectar con el servidor.");
    }

    const texto = await res.text();
    let data: unknown = null;
    if (texto) {
      try {
        data = JSON.parse(texto);
      } catch {
        data = texto;
      }
    }

    if (!res.ok) {
      if (res.status === 401 && token) opts.onUnauthorized?.();
      throw new ApiError(res.status, mensajeDe(data) ?? `Error ${res.status}`, data);
    }
    if (data && typeof data === "object" && "success" in data && "data" in data) {
      return (data as { data: T }).data;
    }
    return data as T;
  }

  async function perfil(token?: string): Promise<Usuario> {
    const r = await request<Record<string, unknown>>("GET", "/auth/profile", undefined, token);
    const raw = (r.user ?? r.usuario ?? r.data ?? r) as Record<string, unknown>;
    const rol = normalizarRol(raw.rol ?? raw.role);
    if (!rol) throw new ApiError(500, "La API no devolvió un rol reconocido.", raw);
    return {
      id: Number(raw.id ?? raw.id_usuario ?? 0),
      nombre: raw.nombre as string | undefined,
      apellidos: raw.apellidos as string | undefined,
      email: String(raw.email ?? ""),
      rol,
      activo: raw.activo as boolean | undefined,
    };
  }

    async function login(email: string, password: string): Promise<Sesion> {
    const r = await request<Record<string, unknown>>("POST", "/auth/login", { email, password });
    const d = (r.data && typeof r.data === "object" ? r.data : r) as Record<string, unknown>;
    const token = [d.token, d.access_token, d.accessToken, d.jwt].find(
      (x): x is string => typeof x === "string",
    );
    if (!token) throw new ApiError(500, "La API no devolvió un token.", r);
    return { token, usuario: await perfil(token) };
  }

  return {
    request,
    login,
    perfil,
    get: <T = unknown>(path: string) => request<T>("GET", path),
    post: <T = unknown>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
    put: <T = unknown>(path: string, body: unknown) => request<T>("PUT", path, body),
    patch: <T = unknown>(path: string, body: unknown) => request<T>("PATCH", path, body),
    del: <T = unknown>(path: string) => request<T>("DELETE", path),
  };
}

export type ApiClient = ReturnType<typeof createClient>;
