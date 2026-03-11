## Why

El comportamiento central de un Kanban no es solo crear tarjetas, sino reorganizarlas. El schema ya persiste `position`, pero el sistema todavia no ofrece ningun flujo para mover columnas o tarjetas y guardar ese nuevo orden.

## What Changes

- Agregar contratos backend para reordenar columnas dentro de un board.
- Agregar contratos backend para reordenar tarjetas dentro de una columna y entre columnas.
- Persistir posiciones contiguas y consistentes despues de cada movimiento.
- Incorporar la interaccion de reorder en la UI del tablero.
- Dejar fuera colaboracion en tiempo real y resolucion avanzada de conflictos.

## Capabilities

### New Capabilities
- `kanban-reordering`: reordenamiento persistente de columnas y tarjetas desde la interfaz Kanban.

### Modified Capabilities
- Ninguna.

## Impact

- El sistema activara por fin el significado practico de los campos `position`.
- Se agregara la interaccion mas representativa del dominio Kanban.
- El backend y el frontend tendran que coordinar validacion, persistencia y sincronizacion visual del orden.
