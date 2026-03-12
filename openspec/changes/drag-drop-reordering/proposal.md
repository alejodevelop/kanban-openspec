## Why

El reordenamiento ya existe como capacidad del tablero, pero depender de botones para mover columnas y tarjetas hace que la experiencia sea lenta y poco natural para una interfaz Kanban. Cambiar a drag and drop acerca la interaccion al comportamiento esperado del producto y reduce friccion en el flujo principal.

## What Changes

- Reemplazar los controles de reorder basados en botones por una interaccion de arrastrar y soltar para columnas y tarjetas.
- Mantener la persistencia del orden actual y la validacion backend ya definidas para movimientos dentro de una columna, entre columnas y entre posiciones de columnas.
- Agregar feedback visual durante el arrastre y al soltar para que el usuario entienda donde quedara cada elemento.
- Asegurar que la vista siga ofreciendo una alternativa accesible cuando drag and drop no este disponible.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `kanban-reordering`: cambiar la experiencia de reorder en la UI desde botones hacia drag and drop, manteniendo persistencia y validaciones existentes.

## Impact

- Afecta principalmente `packages/web` en la vista del tablero y sus controles de interaccion.
- Puede introducir una libreria o utilidades de drag and drop en frontend.
- Requiere actualizar pruebas de interfaz para cubrir arrastre, drop y fallback accesible.
