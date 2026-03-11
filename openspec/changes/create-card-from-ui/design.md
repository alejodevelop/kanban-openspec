## Context

Con el board ya visible desde la API, el siguiente paso mas logico es habilitar una mutacion sencilla pero representativa. Crear tarjetas prueba toda la ruta de escritura sin introducir todavia la complejidad de mover elementos entre listas.

Paths nuevos esperados para este cambio: endpoint y caso de uso de creacion en `packages/api/src/features/cards/`, controles de creacion en `packages/web/src/features/boards/`, y pruebas de backend/frontend para validacion y persistencia.

## Goals / Non-Goals

**Goals:**
- Permitir crear una tarjeta desde una columna visible del tablero.
- Persistir titulo obligatorio y descripcion opcional.
- Asignar una `position` valida para la nueva tarjeta.
- Reflejar el resultado en la UI y confirmar persistencia tras recarga.

**Non-Goals:**
- Editar o borrar tarjetas.
- Implementar actualizaciones optimistas sofisticadas.
- Resolver reorder o movimiento entre columnas en este cambio.

## Decisions

### 1. Crear tarjetas bajo la jerarquia de columna
La mutacion se modelara desde la columna, porque la relacion directa existente es `cards.column_id`.

Alternativas consideradas:
- Crear tarjetas con un endpoint plano sobre `/api/cards`. Se descarta porque oculta la dependencia primaria del recurso.

### 2. Asignar la siguiente `position` disponible en backend
El servidor calculara la nueva posicion tomando el final actual de la columna. Eso mantiene la regla de orden bajo control del backend y evita confiar en el cliente para un dato derivado.

Alternativas consideradas:
- Permitir que el cliente envie `position`. Se descarta porque abre inconsistencias desde el primer flujo de escritura.

### 3. Usar un formulario simple en la propia columna
La UI inicial de creacion sera intencionalmente ligera y cercana al punto de uso, sin modal ni flujos de edicion complejos.

Alternativas consideradas:
- Modal global de creacion. Se descarta porque agrega navegacion y estado innecesario a este primer corte.

### 4. Reconsultar el tablero despues de crear
La primera version refrescara el agregado del tablero tras una creacion exitosa. Es mas simple y fiable que intentar sincronizar manualmente el estado local con la respuesta parcial de escritura.

Alternativas consideradas:
- Actualizacion optimista local. Se descarta para no introducir dos fuentes de verdad antes de tiempo.

## Risks / Trade-offs

- [Crear dos tarjetas al mismo tiempo podria tensionar la unicidad de `position`] -> Mitigacion: encapsular el calculo de posicion en backend y usar manejo transaccional o estrategia de reintento.
- [Reconsultar el tablero completo tras cada creacion puede ser mas costoso] -> Mitigacion: aceptar el costo en la primera iteracion y optimizar solo si se vuelve un problema real.
- [Una UI demasiado minima podria quedar limitada rapidamente] -> Mitigacion: mantener el flujo simple ahora y dejar extensibilidad para descripcion u otros campos en cambios posteriores.

## Migration Plan

1. Implementar la mutacion backend para crear tarjetas.
2. Incorporar validacion de datos de entrada y calculo de posicion.
3. Agregar el control de UI dentro de la columna.
4. Refrescar la vista y validar persistencia tras recarga.
5. Si hay rollback, retirar el endpoint y el control UI sin afectar la lectura del tablero.

## Open Questions

- Queda diferido si en esta primera UI de creacion se permitira escribir descripcion o si se arrancara solo con titulo.
