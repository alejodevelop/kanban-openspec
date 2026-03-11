# Kanban OpenSpec

Proyecto Kanban guiado por OpenSpec. El repositorio ya tiene una base operativa con modelo de datos en PostgreSQL, runtime HTTP en Express y un frontend React/Vite arrancable. Lo que falta ahora es conectar esas piezas con los flujos reales del board.

## Estado actual

El sistema ya cubre estas piezas:

- Modelo relacional `boards -> columns -> cards`.
- Migracion SQL inicial generada con Drizzle.
- Verificacion automatizada del schema y de las relaciones clave.
- Runtime HTTP minimo con Express y `GET /health`.
- Frontend React/Vite con shell base, routing inicial y cliente API compartido.
- Especificacion principal en OpenSpec para el modelo de datos Kanban.

Hoy el codigo real vive sobre estas bases:

- Backend HTTP: `packages/api/src/`
- Frontend web: `packages/web/src/`
- Migraciones: `drizzle/`
- Spec principal: `openspec/specs/kanban-data-model/spec.md`

## Arquitectura objetivo

La direccion actual del sistema es:

- Base de datos PostgreSQL
- ORM y migraciones con Drizzle
- Backend HTTP con Express
- Frontend con React + Vite
- Testing con Vitest y, mas adelante, Playwright para flujos end-to-end

## Hito actual

El repositorio ya resolvio la capa de persistencia minima. El siguiente objetivo no es ampliar el schema, sino atravesarlo con una primera ruta completa:

`base de datos -> acceso a datos -> caso de uso -> endpoint HTTP -> frontend`

El primer hito funcional buscado es este:

1. Abrir la aplicacion.
2. Ver un tablero real cargado desde la API.
3. Crear una tarjeta desde la UI.
4. Recargar y confirmar que el cambio persiste.

## Roadmap propuesto

Estos son los seis changes planeados para llegar a un frontend interactivo sin mezclar demasiadas decisiones en una sola iteracion:

1. `bootstrap-api-runtime`
   Resultado: backend Express arrancable, conexion a PostgreSQL y healthcheck.
2. `read-board-api`
   Resultado: primer endpoint para leer un tablero con columnas y tarjetas ordenadas.
3. `bootstrap-web-app`
   Resultado: frontend React/Vite inicial con estructura, routing y cliente API.
4. `render-board-from-api`
   Resultado: tablero visible en UI consumiendo datos reales del backend.
5. `create-card-from-ui`
   Resultado: primera mutacion completa desde el frontend hasta la base de datos.
6. `reorder-cards-and-columns`
   Resultado: interaccion central de Kanban con persistencia de posiciones.

## Estructura actual

```text
.
├── drizzle/
├── openspec/
│   ├── changes/
│   └── specs/
├── packages/
│   ├── api/
│       └── src/
│   └── web/
│       └── src/
├── package.json
└── drizzle.config.ts
```

## Scripts utiles

- `npm test`: ejecuta el check del schema, las pruebas del backend y el smoke test del frontend.
- `npm run dev`: levanta API y frontend juntos para desarrollo local.
- `npm run db:generate`: genera migraciones desde el schema de Drizzle.
- `npm run api:dev`: levanta el backend Express desde `packages/api`.
- `npm run api:seed:board-read`: inserta un tablero demo idempotente para probar `GET /api/boards/:boardId`.
- `npm run api:validate`: arranca el backend, consulta `GET /health` y verifica la conectividad a PostgreSQL usando `DATABASE_URL`.
- `npm run web:dev`: levanta Vite para el frontend en `packages/web`.
- `npm run web:validate`: typecheck, smoke test y build del frontend.

## Runtime local

El change `bootstrap-api-runtime` deja una base operativa minima en `packages/api`:

- App Express separada del entrypoint del servidor.
- Configuracion centralizada con `PORT` y `DATABASE_URL`.
- Cliente compartido de Drizzle enlazado al schema Kanban.
- Endpoint `GET /health` con comprobacion basica de PostgreSQL.

El change `bootstrap-web-app` agrega la base del navegador en `packages/web`:

- Entrypoint con React + Vite.
- Shell inicial con routing base.
- Configuracion centralizada por `VITE_API_BASE_URL`.
- Cliente HTTP reutilizable para features futuras.

Flujo local recomendado:

1. Exportar `DATABASE_URL` apuntando a la base que ya tiene aplicada la migracion inicial.
2. Ejecutar `npm run api:seed:board-read` para cargar un tablero demo estable con `boardId` `11111111-1111-4111-8111-111111111111`.
3. Opcional: crear `packages/web/.env` a partir de `packages/web/.env.example` si la API no corre en `http://localhost:3001`.
4. Ejecutar `npm run dev` para levantar API y frontend juntos.
5. Abrir `/boards/11111111-1111-4111-8111-111111111111` en el frontend para validar la lectura completa del board.
6. Ejecutar `npm run api:validate` para comprobar el healthcheck del backend contra PostgreSQL.
7. Ejecutar `npm run web:validate` para verificar typecheck, smoke test y build del frontend.

## OpenSpec

El cambio ya completado y archivado es:

- `2026-03-11-setup-data-model`

Los siguientes changes del roadmap se van a preparar como artifacts separados para poder revisar e implementar uno por uno, manteniendo el alcance de cada iteracion controlado.
