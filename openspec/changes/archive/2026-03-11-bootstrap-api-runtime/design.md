## Context

El codigo actual en `packages/api` solo define tablas de Drizzle y una prueba que valida la migracion generada. No existe todavia una app Express, un proceso arrancable, ni un cliente compartido de base de datos para usar el schema en tiempo de ejecucion.

Paths nuevos esperados para este cambio: `packages/api/src/app.ts`, `packages/api/src/server.ts`, `packages/api/src/config/env.ts`, `packages/api/src/db/client.ts`, `packages/api/src/routes/health.ts` y ajustes en `packages/api/package.json` y `package.json`.

## Goals / Non-Goals

**Goals:**
- Crear una API arrancable en `packages/api`.
- Centralizar la configuracion de entorno y el acceso a PostgreSQL.
- Dejar un healthcheck que permita verificar que el servicio esta vivo y puede revisar la base de datos.
- Preparar una base facil de probar para endpoints posteriores.

**Non-Goals:**
- Implementar endpoints de tableros, columnas o tarjetas.
- Introducir autenticacion, autorizacion o middleware de negocio.
- Resolver observabilidad avanzada, versionado o despliegue productivo.

## Decisions

### 1. Mantener Express como shell HTTP inicial
Se usara Express 5 como punto de entrada del backend porque ya forma parte de la direccion declarada del proyecto y cubre bien el primer corte sin introducir una decision nueva de framework.

Alternativas consideradas:
- Node HTTP nativo. Se descarta por ergonomia pobre para crecimiento de rutas.
- Fastify. Se descarta para no abrir otra decision arquitectonica antes de tener endpoints reales.

### 2. Mantener Drizzle como fuente de verdad del acceso a datos
El runtime se conectara a PostgreSQL usando Drizzle y el schema ya existente en `packages/api/src/db/schema`.

Alternativas consideradas:
- Reintroducir Prisma en esta etapa. Se descarta porque duplicaria el contrato de persistencia ya definido y romperia continuidad con la migracion existente.

### 3. Separar `app` de `server`
La app Express se construira en un modulo reutilizable y el `listen` quedara en un entrypoint aparte. Esto facilita pruebas y evita acoplar la inicializacion del proceso con la definicion de rutas.

Alternativas consideradas:
- Un solo archivo que cree la app y escuche el puerto. Se descarta porque complica pruebas e inicializacion controlada.

### 4. Centralizar configuracion y healthcheck
La lectura de `PORT` y `DATABASE_URL` vivira en una capa de configuracion unica. El endpoint `GET /health` devolvera estado del proceso y resultado de una verificacion basica de la base de datos.

Alternativas consideradas:
- Leer variables de entorno en cada modulo. Se descarta por duplicacion y errores de configuracion.
- Healthcheck sin tocar la base. Se descarta porque no valida la dependencia critica del backend.

## Risks / Trade-offs

- [La verificacion de base en el healthcheck puede volver mas lento el endpoint] -> Mitigacion: mantener una comprobacion minima y separar mas adelante liveness de readiness si hace falta.
- [Introducir runtime sin casos de uso visibles puede parecer trabajo poco tangible] -> Mitigacion: mantener este cambio pequeno y usarlo enseguida para el primer endpoint de lectura.
- [La configuracion local puede volverse fragil si no se normaliza pronto] -> Mitigacion: concentrar la carga de entorno en un unico modulo desde el inicio.

## Migration Plan

1. Agregar dependencias y scripts para levantar `packages/api`.
2. Crear la app Express, el entrypoint del servidor y el modulo compartido de DB.
3. Exponer el healthcheck y agregar pruebas de arranque basicas.
4. Validar el runtime contra la base local con la migracion existente.
5. Si hay rollback, eliminar el runtime nuevo y volver al estado actual de schema aislado.

## Open Questions

- Ninguna critica para crear el cambio. La unica decision deliberadamente diferida es si mas adelante convendra separar `liveness` y `readiness`.
