## Context

El repositorio todavia no tiene codigo de aplicacion ni un esquema principal en `openspec/specs`, pero la configuracion del proyecto establece TypeScript, React, Express, PostgreSQL y Drizzle ORM. Este cambio define la primera capa persistente del dominio Kanban para que las siguientes iteraciones construyan APIs y UI sobre una estructura consistente.

La propuesta introduce una capacidad nueva, `kanban-data-model`, centrada en una jerarquia minima y operable: tableros, columnas y tarjetas. La decision importante aqui no es solo crear tablas, sino fijar reglas de integridad, nombres de entidades y campos que sigan siendo utiles cuando lleguen reorder, filtros y endpoints REST.

## Goals / Non-Goals

**Goals:**
- Definir un esquema relacional inicial para tableros, columnas y tarjetas.
- Establecer restricciones y relaciones que eviten datos huerfanos o inconsistentes.
- Dejar lista una base de migraciones y tipos de Drizzle reutilizable por backend y frontend.
- Documentar los paths nuevos esperados para la implementacion: `src/db/schema/boards.ts`, `src/db/schema/columns.ts`, `src/db/schema/cards.ts`, `src/db/schema/index.ts`, `drizzle.config.ts` y `drizzle/*.sql`.

**Non-Goals:**
- Implementar autenticacion, usuarios o permisos.
- Resolver comentarios, adjuntos, etiquetas o historial de actividad.
- Diseñar endpoints HTTP o componentes React mas alla de lo necesario para validar el modelo.

## Decisions

### 1. Modelar una jerarquia minima de tres entidades
Se usaran las tablas `boards`, `columns` y `cards` como base del dominio. Esta estructura cubre el flujo principal del producto sin introducir abstracciones prematuras.

Alternativas consideradas:
- Agregar `workspaces` desde el inicio. Se descarta por ahora para mantener el primer corte pequeno.
- Unificar columnas y tarjetas en una tabla generica. Se descarta porque complica restricciones y consultas.

### 2. Usar claves primarias UUID y timestamps en todas las tablas
Cada tabla tendra `id`, `created_at` y `updated_at`. UUID reduce acoplamiento con el motor y facilita merges o integraciones futuras.

Alternativas consideradas:
- IDs enteros autoincrementales. Son mas simples, pero menos flexibles para sincronizacion futura.

### 3. Persistir orden explicito con columnas numericas
`columns.position` y `cards.position` definiran el orden visible. El reordenamiento futuro actualizara esos valores sin cambiar la identidad de las entidades.

Alternativas consideradas:
- Orden derivado por fecha de creacion. Se descarta porque no soporta drag-and-drop real.
- Listas enlazadas. Se descarta por complejidad innecesaria para la primera version.

### 4. Aplicar integridad referencial con borrado en cascada controlado
`columns.board_id` referenciara `boards.id` y `cards.column_id` referenciara `columns.id`. El borrado en cascada elimina descendientes cuando desaparece el padre y evita registros huerfanos.

Alternativas consideradas:
- Soft delete desde el dia uno. Se descarta porque introduce complejidad operativa antes de validar el dominio basico.
- Restrict en borrados. Se descarta porque obliga a flujos manuales adicionales en una etapa temprana.

## Risks / Trade-offs

- [El dominio inicial puede quedarse corto si pronto aparecen workspaces o usuarios] -> Mitigacion: mantener nombres de tablas y claves preparados para extender con FK opcionales en cambios posteriores.
- [El borrado en cascada puede ocultar eliminaciones accidentales] -> Mitigacion: encapsular borrados en servicios y agregar pruebas de integridad antes de exponer endpoints.
- [Sin codigo existente, los paths propuestos podrian requerir ajuste] -> Mitigacion: conservar la separacion por entidad y adaptar solo la ubicacion final al bootstrap real del proyecto.

## Migration Plan

1. Crear configuracion de Drizzle y archivos de esquema por entidad.
2. Generar la primera migracion SQL para PostgreSQL.
3. Aplicar la migracion en entorno local y verificar creacion de tablas, indices y claves foraneas.
4. Exponer el esquema agregado para consumo por servicios Express.
5. Si hay rollback, revertir la migracion inicial y eliminar referencias al esquema en el codigo de arranque.

## Open Questions

- ¿Las tarjetas necesitan descripcion larga desde la primera iteracion o basta con titulo y estado derivado de la columna?
- ¿Conviene reservar desde ahora un campo `board_id` en `cards` para consultas directas, aunque sea redundante con `column_id`?
- ¿El proyecto quiere nombres en ingles para tablas y en espanol solo para documentacion, o todo el stack deberia mantenerse en ingles?
