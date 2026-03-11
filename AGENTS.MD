# Kanban OpenSpec

## Repo Snapshot

- Monorepo con npm workspaces: `packages/api` y `packages/web`.
- Backend: Express 5, Drizzle ORM, `pg`, TypeScript.
- Frontend: React 19, React Router 7, Vite 7, TypeScript.
- Base de datos: PostgreSQL.
- Testing: Vitest.
- Estilos: CSS plano en `packages/web/src/styles.css`.

## Arquitectura

- `packages/api/src/server.ts` es el entrypoint del backend.
- `packages/api/src/app.ts` compone la aplicacion Express y registra las rutas.
- El backend esta organizado por features, no por MVC:
  - `features/boards/` para lectura y reorder de boards/columnas.
  - `features/cards/` para creacion y reorder de cards.
  - `routes/` para adaptadores HTTP.
  - `db/` para cliente y schema de Drizzle.
  - `scripts/` para seed y validacion de runtime.
- El frontend esta organizado asi:
  - `routes/` para ruteo de la app.
  - `features/boards/` para la vista del tablero y su contrato HTTP.
  - `lib/` para cliente API y carga de entorno.
- OpenSpec vive en `openspec/specs/` y los changes archivados en `openspec/changes/archive/`.

## Estado funcional actual

- `GET /health` verifica runtime y conectividad a PostgreSQL.
- `GET /api/boards/:boardId` devuelve un board con columnas y tarjetas ordenadas.
- `POST /api/columns/:columnId/cards` crea una tarjeta.
- `POST /api/boards/:boardId/columns/reorder` reordena columnas.
- `POST /api/boards/:boardId/cards/reorder` reordena tarjetas dentro de una o varias columnas.
- La web soporta `/boards/:boardId` para cargar el tablero, crear tarjetas y persistir reorder.

## Entorno

- `DATABASE_URL` es obligatoria para backend, seed y validacion.
- `PORT` es opcional y default a `3001`.
- `VITE_API_BASE_URL` es opcional y default a `http://localhost:3001`.

## Comandos utiles

- `npm run dev`
- `npm test`
- `npm run api:seed:board-read`
- `npm run api:validate`
- `npm run web:validate`

## Convenciones

- Mantener las pruebas junto al codigo fuente con `*.test.ts` o `*.test.tsx`.
- Preferir estructura por feature sobre capas MVC.
- Mantener la logica HTTP compartida del frontend en `packages/web/src/lib/api-client.ts`.
- Mantener cambios de schema en `packages/api/src/db/schema/` y regenerar migraciones en `drizzle/`.
- Seguir el estilo de nombres ya presente: modulos de feature mayormente en kebab-case y exports de React en PascalCase.
- El dominio actual es `Board`, `Column` y `Card`.
- Una `Card` hoy tiene `title`, `description?` y `position`. No existe `tags` en el schema actual.
- No asumir Tailwind, Prisma, Playwright ni patron MVC mientras no formen parte real del repo.
