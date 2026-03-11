## Why

El repositorio ya tiene schema, migracion y verificacion del modelo Kanban, pero todavia no puede arrancar una aplicacion backend real. Sin un runtime HTTP y una conexion reutilizable a PostgreSQL, el modelo de datos no se puede exponer ni validar desde capas superiores.

## What Changes

- Crear el runtime base del backend en `packages/api` usando Express.
- Conectar Drizzle al schema existente mediante `DATABASE_URL`.
- Exponer un endpoint de salud para validar proceso y conectividad basica.
- Preparar scripts y estructura minima para ejecutar y probar la API localmente.
- Dejar fuera endpoints de negocio, autenticacion y frontend.

## Capabilities

### New Capabilities
- `api-runtime-foundation`: base operativa del backend HTTP y del acceso compartido a PostgreSQL.

### Modified Capabilities
- Ninguna.

## Impact

- `packages/api` pasara de contener solo schema a contener runtime de aplicacion.
- Se agregaran dependencias de servidor y conexion para Node.js.
- Los siguientes changes podran construir casos de uso y endpoints sobre esta base.
