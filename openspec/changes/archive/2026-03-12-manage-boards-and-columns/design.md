## Context

La base actual ya cubre lectura de boards, reordenamiento de columnas, reordenamiento de tarjetas y creacion de tarjetas, pero no ofrece operaciones CRUD para boards ni columnas. Eso deja al dashboard y a la vista del tablero en un estado parcialmente util: pueden mostrar y mover datos existentes, pero no pueden crear la estructura base que necesita un equipo para empezar a trabajar.

El cambio cruza frontend, API y reglas de persistencia. Tambien introduce decisiones sobre donde ubicar cada accion para no romper la experiencia existente: el dashboard hoy es el punto natural para crear y renombrar boards, mientras que la vista del tablero es el lugar correcto para crear, editar y eliminar columnas porque ya concentra el contexto de un board individual.

## Goals / Non-Goals

**Goals:**
- habilitar CRUD basico de boards con validaciones y respuestas HTTP consistentes;
- habilitar CRUD basico de columnas dentro de un board conservando un orden estable;
- reflejar las mutaciones en el frontend sin requerir recargas manuales;
- aprovechar el modelo actual con cascadas en base de datos para simplificar borrados.

**Non-Goals:**
- editar o eliminar tarjetas;
- introducir drag and drop o flujos avanzados de inline editing;
- agregar permisos, auditoria o confirmaciones multiplataforma fuera de la UI web actual.

## Decisions

### Exponer escritura de boards y columns desde rutas separadas y REST simples
La API ya organiza boards y columns en routers distintos. Mantener ese corte reduce acoplamiento con la estructura actual y facilita tests aislados. La propuesta es agregar operaciones `POST /api/boards`, `PATCH /api/boards/:boardId`, `DELETE /api/boards/:boardId`, `POST /api/boards/:boardId/columns`, `PATCH /api/columns/:columnId` y `DELETE /api/columns/:columnId`.

Alternativas consideradas:
- concentrar todo bajo `POST /api/boards/:boardId/actions`: se descarta porque complica validacion y hace menos claro el contrato;
- usar un endpoint generico de mutaciones: se descarta porque no sigue el estilo actual del repo.

### Reutilizar el patron existente de casos de uso + repositorio por feature
Las features actuales (`get-board`, `list-boards`, `reorder-columns`, `create-card`) separan reglas de negocio, adaptadores HTTP y persistencia. El cambio sigue la misma forma con casos de uso dedicados para crear, actualizar y eliminar boards/columns. Esto mantiene coherencia, permite pruebas unitarias por operacion y evita meter logica SQL en los handlers.

Alternativas consideradas:
- implementar la logica directamente en rutas Express: se descarta por peor testabilidad y mezcla de responsabilidades;
- crear un unico servicio de administracion: se descarta porque creceria rapido y mezclaria reglas de entidades distintas.

### Devolver recursos actualizados o identificadores utiles despues de mutar
Para que el frontend pueda refrescarse con poco codigo, cada operacion de escritura debe devolver suficiente informacion para reconciliar el estado. Crear o editar board puede responder con el `board` resumido; crear, editar o eliminar columna debe permitir recargar el board afectado de forma inmediata, ya sea devolviendo la columna creada/editada o un payload minimo con `boardId`. En UI, la opcion mas robusta y consistente con el codigo actual es reconsultar el board o el listado tras mutar, en lugar de intentar sincronizar cache local compleja.

Alternativas consideradas:
- actualizacion optimista completa: se descarta para esta iteracion porque aumenta complejidad y superficie de error;
- no devolver nada en `DELETE`: se evita porque obliga a que la UI preserve contexto manualmente.

### Mantener posiciones contiguas al crear o eliminar columnas
El schema ya exige unicidad de `position` por `boardId`. Para evitar huecos o colisiones, una columna nueva se crea al final (`max(position) + 1`) y una eliminacion debe recompactar las posiciones restantes dentro de una transaccion. Renombrar una columna no cambia `position`.

Alternativas consideradas:
- permitir huecos y normalizar despues: se descarta porque complica lectura, reordenamiento y tests;
- recalcular posiciones en cada lectura: se descarta porque traslada una regla de escritura a todos los consumidores.

### Ubicar las acciones de gestion donde ya existe contexto de usuario
El dashboard incorporara crear, renombrar y eliminar boards porque ya lista la coleccion completa. La vista del tablero incorporara crear, editar y eliminar columnas porque muestra su jerarquia y es donde la persona usuaria entiende el impacto de esos cambios. Se mantendran mensajes de carga/error similares al tono actual para no romper la UX existente.

Alternativas consideradas:
- administrar columnas desde el dashboard: se descarta por falta de contexto;
- administrar boards solo dentro de la vista del board: se descarta porque impide crear el primer board desde la home.

## Risks / Trade-offs

- [Borrado accidental de board] -> Mitigacion: requerir confirmacion explicita en la UI antes de eliminar un board o una columna.
- [Inconsistencias de posicion al eliminar columnas] -> Mitigacion: ejecutar borrado y reindexacion en una misma transaccion y cubrirlo con tests de repositorio/use case.
- [Mas viajes de red tras mutaciones] -> Mitigacion: reutilizar endpoints de lectura existentes para una implementacion simple y confiable en esta iteracion.
- [Solapamiento entre dashboard y board view] -> Mitigacion: limitar cada pantalla a las acciones que mejor corresponden a su contexto.

## Migration Plan

1. Implementar casos de uso y rutas de escritura en API sin eliminar contratos actuales.
2. Agregar pruebas de API y de frontend para los nuevos flujos CRUD.
3. Incorporar formularios y acciones en dashboard y board view reutilizando el cliente HTTP existente.
4. Validar manualmente que los boards existentes sigan cargando y que los borrados respeten cascada.
5. Si hubiera rollback, retirar las rutas y la UI nueva sin necesidad de migracion destructiva de datos porque el schema base ya soporta la jerarquia requerida.

## Open Questions

- La edicion de titulo de board debe vivir solo en el dashboard o tambien en la vista del tablero; por defecto el cambio la habilita en el dashboard y deja opcional replicarla dentro del board si la implementacion lo vuelve trivial.
- El borrado de columna debe bloquearse si contiene tarjetas o permitir cascada; la recomendacion es permitirlo con confirmacion y apoyarse en la cascada ya definida en la base.
