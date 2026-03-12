# Kanban OpenSpec

Monorepo Kanban guiado por OpenSpec. El repositorio ya tiene una ruta funcional completa desde PostgreSQL hasta la UI: listado de boards, lectura de tablero, creacion de tarjetas y reorder de columnas y tarjetas con persistencia.

## Capacidades actuales

- Modelo relacional `boards -> columns -> cards` en PostgreSQL.
- Schema en Drizzle con migracion inicial generada en `drizzle/`.
- Backend Express con `GET /health` y comprobacion de conectividad a PostgreSQL.
- Endpoint para listar boards con conteo de columnas y tarjetas.
- Endpoint para leer un board completo con columnas y tarjetas ordenadas.
- Endpoint para crear tarjetas dentro de una columna.
- Endpoints para reordenar columnas y tarjetas dentro de un board.
- Frontend React/Vite con rutas `/` y `/boards/:boardId`.
- Dashboard inicial en `/` que lista boards disponibles y navega a su detalle.
- Vista de board que consume la API real y permite crear tarjetas y mover columnas o tarjetas.
- Suite automatizada en backend y frontend con Vitest.
- Specs y artifacts de OpenSpec archivados en `openspec/`.

## Stack actual

- Backend: Express 5, Drizzle ORM, `pg`, TypeScript.
- Frontend: React 19, React Router 7, Vite 7, TypeScript.
- Base de datos: PostgreSQL.
- Testing: Vitest.

## Estructura del repo

```text
.
├── drizzle/
├── openspec/
│   ├── changes/
│   │   └── archive/
│   └── specs/
├── packages/
│   ├── api/
│   │   └── src/
│   │       ├── config/
│   │       ├── db/
│   │       ├── features/
│   │       ├── routes/
│   │       └── scripts/
│   └── web/
│       └── src/
│           ├── features/
│           ├── lib/
│           └── routes/
├── AGENTS.MD
├── README.md
├── drizzle.config.ts
└── package.json
```

## API actual

- `GET /health`
  Valida que el runtime este arriba y que PostgreSQL responda.
- `GET /api/boards`
  Devuelve el listado de boards con metadata resumida: `id`, `title`, `columnCount`, `cardCount`.
- `GET /api/boards/:boardId`
  Devuelve el board con columnas y tarjetas ordenadas por `position`.
- `POST /api/columns/:columnId/cards`
  Crea una tarjeta. Payload: `{ "title": "string", "description": "string?" }`
- `POST /api/boards/:boardId/columns/reorder`
  Reordena columnas. Payload: `{ "columnIds": ["..."] }`
- `POST /api/boards/:boardId/cards/reorder`
  Reordena tarjetas dentro de una o varias columnas. Payload:
  `{ "columns": [{ "columnId": "...", "cardIds": ["..."] }] }`

## Scripts utiles

- `npm run dev`: levanta API y frontend juntos.
- `npm test`: ejecuta `db:check`, pruebas del backend y pruebas del frontend.
- `npm run db:generate`: genera migraciones desde el schema de Drizzle.
- `npm run api:dev`: arranca el backend con watch.
- `npm run api:start`: arranca el backend sin watch.
- `npm run api:seed:board-read`: inserta un board demo idempotente.
- `npm run api:validate`: levanta el backend, consulta `GET /health` y valida PostgreSQL.
- `npm run web:dev`: arranca Vite.
- `npm run web:build`: genera el build del frontend.
- `npm run web:test`: ejecuta pruebas del frontend.
- `npm run web:validate`: ejecuta typecheck, pruebas y build del frontend.

## Runtime local

Variables relevantes:

- `DATABASE_URL`: obligatoria para el backend y scripts de base de datos.
- `PORT`: opcional. Default `3001`.
- `VITE_API_BASE_URL`: opcional. Default `http://localhost:3001`.

Flujo recomendado:

1. Configura `DATABASE_URL` apuntando a una base PostgreSQL que ya tenga aplicada la migracion inicial de `drizzle/`.
2. Ejecuta `npm run api:seed:board-read` para cargar el board demo `11111111-1111-4111-8111-111111111111`.
3. Si la API no va a correr en `http://localhost:3001`, crea `packages/web/.env` a partir de `packages/web/.env.example`.
4. Ejecuta `npm run dev`.
5. Abre `/` para ver el dashboard o navega directo a `/boards/11111111-1111-4111-8111-111111111111`.
6. Opcional: ejecuta `npm run api:validate` y `npm run web:validate`.

## OpenSpec

Specs principales actuales:

- `openspec/specs/api-runtime-foundation/spec.md`
- `openspec/specs/kanban-data-model/spec.md`
- `openspec/specs/board-read-api/spec.md`
- `openspec/specs/board-list-api/spec.md`
- `openspec/specs/web-app-foundation/spec.md`
- `openspec/specs/board-view-ui/spec.md`
- `openspec/specs/board-list-dashboard/spec.md`
- `openspec/specs/card-creation-flow/spec.md`
- `openspec/specs/kanban-reordering/spec.md`

Changes archivados:

- `2026-03-11-setup-data-model`
- `2026-03-11-bootstrap-api-runtime`
- `2026-03-11-read-board-api`
- `2026-03-11-bootstrap-web-app`
- `2026-03-11-render-board-from-api`
- `2026-03-11-create-card-from-ui`
- `2026-03-11-reorder-cards-and-columns`
- `2026-03-11-board-list-dashboard`
