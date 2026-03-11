## Why

Una shell de frontend sin datos reales todavia no valida el sistema. El primer hito visible del producto es abrir la aplicacion y ver un tablero Kanban cargado desde la API, con estados claros para carga, error y ausencia de datos.

## What Changes

- Crear una vista de tablero que consuma el endpoint de lectura del backend.
- Resolver la carga del board a partir de un identificador de ruta.
- Renderizar board, columnas y tarjetas en el orden entregado por la API.
- Mostrar estados de `loading`, `error`, `empty` y `not found`.
- Dejar fuera creacion, edicion y reorder.

## Capabilities

### New Capabilities
- `board-view-ui`: visualizacion del tablero Kanban en el frontend a partir de datos reales de la API.

### Modified Capabilities
- Ninguna.

## Impact

- El frontend pasara de shell vacia a pantalla funcional.
- El contrato de `board-read-api` quedara validado por un consumidor real.
- Se fijara la primera experiencia visible de la aplicacion.
