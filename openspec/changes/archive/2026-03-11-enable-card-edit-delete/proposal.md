## Why

Actualmente las tarjetas solo pueden crearse, lo que obliga a recrearlas por completo cuando un titulo o descripcion necesita correccion o cuando una tarjeta fue creada por error. Habilitar edicion y eliminacion reduce friccion en el uso diario del tablero y completa el ciclo basico de gestion de tarjetas.

## What Changes

- Agregar acciones de editar y eliminar para tarjetas existentes desde la interfaz del tablero.
- Incorporar soporte API para actualizar titulo y descripcion de una tarjeta ya creada.
- Incorporar soporte API para eliminar una tarjeta y retirar su representacion del tablero.
- Definir estados de confirmacion y error en la UI para operaciones destructivas o fallidas.

## Capabilities

### New Capabilities
- `card-management-api`: Gestiona la actualizacion y eliminacion de tarjetas existentes desde el backend.

### Modified Capabilities
- `board-view-ui`: La vista del tablero incorpora acciones para editar y eliminar tarjetas visibles.
- `card-creation-flow`: El ciclo de vida de la tarjeta se amplia para permitir correccion o eliminacion despues de su creacion.

## Impact

- Frontend React del tablero y componentes de tarjeta.
- Backend Express para endpoints de actualizacion y eliminacion.
- Persistencia en PostgreSQL mediante Drizzle ORM para mutaciones sobre `cards`.
- Posibles pruebas de integracion y validacion de estados de error/confirmacion en UI.
