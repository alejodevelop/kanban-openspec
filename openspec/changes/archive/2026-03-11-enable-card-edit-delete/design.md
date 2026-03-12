## Context

El producto ya permite crear tarjetas dentro de una columna y renderizarlas en la vista del tablero, pero no existe un camino para corregir datos ni para eliminar tarjetas creadas por error. La solicitud impacta frontend y backend: la UI debe exponer acciones sobre cada tarjeta, la API debe aceptar mutaciones sobre registros existentes y la capa de persistencia debe conservar la consistencia del tablero despues de una eliminacion.

## Goals / Non-Goals

**Goals:**
- Permitir editar `title` y `description` de una tarjeta existente sin abandonar la vista del tablero.
- Permitir eliminar una tarjeta existente con una confirmacion explicita antes de una accion destructiva.
- Mantener la vista sincronizada con el backend despues de actualizar o eliminar una tarjeta.
- Conservar validaciones minimas ya existentes para el dominio de tarjetas.

**Non-Goals:**
- Agregar edicion inline compleja con autosave o soporte colaborativo en tiempo real.
- Modificar reordenamiento de tarjetas o recalculo avanzado de posiciones mas alla de retirar la tarjeta eliminada de la respuesta mostrada.
- Introducir archivado, soft delete o historial de cambios.

## Decisions

### Decision: Exponer mutaciones dedicadas para actualizar y eliminar tarjetas
Se agregaran endpoints especificos para `PATCH` y `DELETE` sobre tarjetas existentes en lugar de reutilizar flujos de creacion. Esto mantiene separadas las responsabilidades y permite validar con claridad los datos editables y las precondiciones de borrado.

Alternativas consideradas:
- Reusar un endpoint generico upsert: descartado por mezclar semanticas de creacion y actualizacion.
- Resolverlo solo del lado cliente: descartado porque la persistencia debe seguir siendo fuente de verdad.

### Decision: Usar un formulario/modal liviano para editar y una confirmacion explicita para eliminar
La UI mostrara acciones por tarjeta y abrira una superficie enfocada para editar titulo y descripcion. Para eliminar, se requerira una confirmacion antes de ejecutar la mutacion para reducir errores de usuario.

Alternativas consideradas:
- Edicion inline directa en la tarjeta: descartada para esta fase por aumentar complejidad visual y de manejo de estados.
- Eliminacion inmediata con opcion de deshacer: descartada porque requiere infraestructura adicional no presente hoy.

### Decision: Actualizar el estado local del tablero a partir de la respuesta de mutacion
Despues de editar, la UI aplicara los campos retornados por la API sobre la tarjeta afectada. Despues de eliminar, retirara la tarjeta del estado local sin requerir una recarga completa del tablero. Esto mantiene la experiencia reactiva y limita llamadas redundantes.

Alternativas consideradas:
- Refetch completo del tablero tras cada mutacion: mas simple, pero con peor experiencia y mayor costo de red.
- Actualizacion optimista sin respuesta del backend: descartada para minimizar inconsistencias en errores iniciales.

## Risks / Trade-offs

- [Eliminacion sin recalculo explicito de posiciones] -> Mitigacion: el orden existente se preserva para las tarjetas restantes y cualquier renormalizacion se deja fuera de este cambio.
- [Mayor complejidad de estado en UI por modales y errores] -> Mitigacion: concentrar el flujo en componentes acotados y reutilizar patrones de carga/error ya usados en el tablero.
- [Tarjeta inexistente o ya eliminada al mutar] -> Mitigacion: devolver errores claros desde la API y limpiar estado local solo cuando la operacion sea confirmada por el backend.
- [Ediciones invalidas] -> Mitigacion: reutilizar la validacion de titulo requerido y mostrar feedback comprensible antes de persistir.
