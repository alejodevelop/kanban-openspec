## Why

Ver un tablero es solo medio sistema. El primer flujo de escritura con mejor relacion valor/complejidad es crear una tarjeta desde la interfaz y confirmar que persiste en la base de datos al recargar.

## What Changes

- Crear una mutacion backend para agregar tarjetas a una columna.
- Asignar automaticamente la posicion inicial de la nueva tarjeta dentro de la columna.
- Incorporar una interaccion de UI para crear tarjetas desde el board view.
- Refrescar o reconciliar la vista despues de una creacion exitosa.
- Dejar fuera edicion, borrado y reorder.

## Capabilities

### New Capabilities
- `card-creation-flow`: flujo end-to-end para crear tarjetas desde la UI y persistirlas en PostgreSQL.

### Modified Capabilities
- Ninguna.

## Impact

- Se agregara el primer endpoint de escritura del sistema.
- El board view dejara de ser solo lectura.
- El contrato de posiciones de `cards` empezara a ejercerse desde logica de aplicacion real.
