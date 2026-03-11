## Why

Una vez exista el runtime del backend, el siguiente corte con mas valor es leer un tablero completo desde la base de datos. Ese flujo valida que el modelo relacional actual realmente sirve para una UI Kanban y fija el primer contrato util entre backend y frontend.

## What Changes

- Crear un caso de uso para leer un tablero con sus columnas y tarjetas.
- Exponer `GET /api/boards/:boardId` como primer endpoint de negocio.
- Definir una respuesta JSON anidada y ordenada por `position`.
- Cubrir respuestas de exito y de tablero inexistente.
- Dejar fuera creacion, edicion, borrado y reorder.

## Capabilities

### New Capabilities
- `board-read-api`: lectura de un tablero Kanban completo mediante una API HTTP estable para el frontend.

### Modified Capabilities
- Ninguna.

## Impact

- Se agregaran rutas y casos de uso en `packages/api`.
- El frontend tendra por fin un contrato claro para renderizar un tablero real.
- El cambio obligara a decidir una forma consistente de serializar la jerarquia `board -> columns -> cards`.
