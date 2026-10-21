# LIMD — Laboratorio Interactivo de Matemáticas Discretas

Monorepo (npm workspaces):

- `packages/api-client` — cliente TypeScript de la API `/api/v1` (compartido por web y, después, escritorio).
- `apps/web` — aplicación web (React + Vite): login por rol y panel de admin, docente y estudiante.

## Correr en local

```bash
npm install
cp apps/web/.env.example apps/web/.env   # ajusta VITE_DEV_BACKEND si la API no está en :8080
npm run dev:web                           # http://localhost:5173
```

En desarrollo Vite redirige `/api` al backend (sin CORS). En producción define `VITE_API_URL`.

## Pendiente de confirmar con Arthur (rol B)

- Forma exacta de la respuesta de `POST /auth/login` y `GET /auth/profile` (el cliente acepta `token`/`access_token` y `rol`/`role`).
- Swagger/OpenAPI y CORS habilitado para el dominio de la web.
