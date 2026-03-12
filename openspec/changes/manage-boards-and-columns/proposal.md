## Why

Hoy el producto solo permite listar tableros, leer un tablero existente y operar tarjetas dentro de columnas ya creadas. Falta el flujo base para administrar tableros y columnas desde la aplicacion, lo que obliga a preparar datos manualmente y bloquea el uso cotidiano del Kanban.

## What Changes

- Agregar endpoints HTTP para crear, editar y eliminar tableros.
- Agregar endpoints HTTP para crear, editar y eliminar columnas dentro de un tablero.
- Incorporar acciones de gestion en el frontend para crear boards desde el dashboard y administrar columnas desde la vista del tablero.
- Refrescar la UI despues de cada operacion mostrando estados de exito, carga y error comprensibles.
- Definir validaciones y reglas de borrado explicitas para evitar referencias huerfanas y operaciones inconsistentes.

## Capabilities

### New Capabilities
- `board-management-api`: contrato de escritura para crear, editar y eliminar tableros y columnas desde la API HTTP.
- `board-management-ui`: experiencia frontend para crear, editar y eliminar tableros o columnas desde el dashboard y la vista del tablero.

### Modified Capabilities
- `kanban-data-model`: precisar como se mantienen posiciones y borrados en cascada cuando se crean o eliminan columnas administradas por usuarios.

## Impact

- `packages/api`: nuevas rutas, casos de uso, validaciones y persistencia para boards y columns.
- `packages/web`: formularios, acciones y refresco de estado en dashboard y board view.
- PostgreSQL/Drizzle: uso de reglas existentes de integridad y potencial ajuste de posiciones al crear o eliminar columnas.
- Tests de API y frontend para cubrir CRUD basico y errores comunes.
