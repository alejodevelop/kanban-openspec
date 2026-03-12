## Context

El sistema ya tiene una vista detallada de tablero en `packages/web`, pero la ruta `/` sigue mostrando una shell estatica. Para convertir esa entrada en una pantalla real hace falta cubrir dos piezas: un endpoint de listado en `packages/api` y una UI inicial que pueda consumirlo y enlazar hacia `/boards/:boardId`.

El backend actual ya organiza la lectura de boards por feature (`get-board.ts` + `routes/boards.ts`) y el frontend ya usa un cliente HTTP sencillo con manejo local de estado. Conviene extender esos mismos patrones para mantener bajo el costo de una feature que es transversal, pero todavia pequena.

## Goals / Non-Goals

**Goals:**
- Exponer un contrato HTTP para listar boards disponibles con datos suficientes para una tarjeta de resumen.
- Reemplazar la home placeholder por un dashboard navegable con estados de `loading`, `error` y `empty`.
- Mantener el cambio alineado con la arquitectura actual de Express, Drizzle, React Router y cliente HTTP liviano.

**Non-Goals:**
- Crear, editar o eliminar boards.
- Agregar filtros, busqueda, paginacion o favoritos.
- Redisenar la vista individual de tablero mas alla de enlazarla desde el dashboard.

## Decisions

### 1. Reutilizar `/api/boards` como recurso de coleccion
El listado se expondra como `GET /api/boards`, manteniendo `GET /api/boards/:boardId` para el detalle. Esto preserva una superficie HTTP coherente: el mismo recurso `boards` ofrece lectura de coleccion y de item.

Alternativas consideradas:
- Crear una ruta separada como `/api/dashboard/boards`. Se descarta porque mezcla presentacion con dominio y duplica el recurso.

### 2. Devolver summaries preagregados desde el backend
Cada item del listado incluira al menos `id`, `title`, `columnCount` y `cardCount`. El dashboard necesita ese resumen para mostrar valor rapido sin disparar una lectura completa por cada board.

Alternativas consideradas:
- Devolver solo `id` y `title` y calcular el resto con consultas adicionales. Se descarta por sobrecargar la UI y multiplicar roundtrips.
- Reutilizar la respuesta completa de `board-read-api` para todos los boards. Se descarta porque el payload creceria demasiado y no corresponde al caso de uso inicial.

### 3. Ordenar el listado de forma deterministica por titulo
El endpoint respondera boards en un orden estable basado en `title`, con desempate por `id` si hace falta. Para una primera dashboard esto favorece escaneo visual y evita depender de semanticas de `updatedAt` que hoy no representan necesariamente toda mutacion del board.

Alternativas consideradas:
- Ordenar por `createdAt` o `updatedAt`. Se descarta porque no ayuda tanto al descubrimiento rapido y puede resultar menos predecible para el usuario.

### 4. Mantener manejo local de estado en la home route
La nueva pantalla seguira el patron de `board-page.tsx`: estado React local, llamada a `boardApi` y render explicito de estados. No hace falta introducir una libreria de cache remota para una sola consulta de bootstrap.

Alternativas consideradas:
- Incorporar una libreria de data fetching. Se descarta para no sobredimensionar una feature inicial.

### 5. Tratar el dashboard como reemplazo de la home, no como ruta paralela
La ruta `/` pasara a ser la entrada oficial del producto y alojara el dashboard. Eso elimina la shell temporal y hace que la navegacion empiece desde un flujo real.

Alternativas consideradas:
- Crear una ruta adicional como `/dashboard`. Se descarta porque prolonga la existencia de una home vacia y agrega friccion innecesaria.

## Risks / Trade-offs

- [Los agregados de conteo pueden requerir consultas mas complejas que `get-board`] -> Mitigacion: encapsular el acceso en un repositorio dedicado y mantener la respuesta pequena.
- [Ordenar alfabeticamente puede no coincidir con prioridades futuras del producto] -> Mitigacion: dejar la decision aislada en el use case para poder cambiarla sin romper la UI.
- [La home quedara acoplada al nuevo endpoint] -> Mitigacion: reutilizar el cliente API existente y cubrir el contrato con tests de ruta y de componente.

## Migration Plan

1. Implementar el caso de uso y handler `GET /api/boards` con pruebas de contrato.
2. Extender `boardApi` con la lectura de listado.
3. Reemplazar `HomeRoute` por el dashboard y sumar pruebas de UI para estados y navegacion.
4. Validar manualmente que `/` lista boards y que cada enlace abre `/boards/:boardId`.

Rollback: si aparece un problema, se puede quitar la nueva ruta GET y restaurar el contenido placeholder de `HomeRoute` sin tocar el contrato de detalle existente.

## Open Questions

- Por ahora no se mostraran metricas temporales ni actividad reciente. Si el producto necesita priorizacion por uso, habra que revisar el contrato del listado.
