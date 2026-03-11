## Context

La base de datos ya fue preparada para orden estable de columnas y tarjetas, pero ese orden sigue siendo estatico. Despues de lectura y creacion, el siguiente salto de valor es permitir que el usuario reorganice el tablero y que ese orden sobreviva a una recarga.

Paths nuevos esperados para este cambio: endpoints y servicios de reorder en `packages/api/src/features/boards/` y `packages/api/src/features/cards/`, logica de interaccion en `packages/web/src/features/boards/`, y pruebas de backend/frontend para reorder dentro de columna, entre columnas y de columnas dentro del board.

## Goals / Non-Goals

**Goals:**
- Permitir reordenar columnas dentro de un tablero.
- Permitir reordenar tarjetas dentro de una columna y moverlas entre columnas.
- Persistir posiciones consecutivas y coherentes tras cada operacion.
- Reflejar el nuevo orden en la UI y mantenerlo tras recarga.

**Non-Goals:**
- Sincronizacion multiusuario en tiempo real.
- Algoritmos avanzados de ranking fraccional.
- Historial de movimientos o auditoria detallada.

## Decisions

### 1. Modelar reorder como operaciones explicitas de dominio
El backend expondra endpoints dedicados de reorder en lugar de un `PATCH` generico. Eso hace visible la intencion del cambio y facilita validar payloads ligados al movimiento.

Alternativas consideradas:
- Reutilizar endpoints genericos de update. Se descarta porque mezclar cambio de orden con ediciones arbitrarias reduce claridad y complica validacion.

### 2. Reescribir posiciones enteras y contiguas en el servidor
Cada operacion de reorder persistira el nuevo orden usando enteros consecutivos dentro del scope afectado. Esto aprovecha el schema actual y mantiene simples las reglas de lectura.

Alternativas consideradas:
- Usar posiciones fraccionales o rangos dispersos. Se descarta por complejidad innecesaria para la primera version.

### 3. Soportar movimiento de tarjetas entre columnas en el mismo cambio
Mover tarjetas entre columnas es parte natural de un Kanban y debe resolverse junto con el reorder intracolumna para no dejar una experiencia a medias.

Alternativas consideradas:
- Separar reorder interno y moves cross-column en cambios distintos. Se descarta porque fragmenta una sola expectativa del usuario.

### 4. Mantener la UI sincronizada con la respuesta canonica del backend
Aunque la interaccion de drag and drop puede reflejarse de inmediato en cliente, el backend seguira siendo la fuente canonica del orden persistido y la UI debera reconciliarse con ese resultado.

Alternativas consideradas:
- Confiar solo en el orden local tras soltar. Se descarta porque deja abierta divergencia con la base de datos.

## Risks / Trade-offs

- [Reorder es el cambio mas complejo de la primera etapa y puede mezclar muchas piezas] -> Mitigacion: abordarlo despues de cerrar lectura y creacion, con contratos explicitos y pruebas por caso.
- [Las escrituras de posicion pueden entrar en conflicto bajo concurrencia] -> Mitigacion: ejecutar actualizaciones dentro de una transaccion y validar el scope afectado.
- [La UX de drag and drop puede ser dificil de ajustar en desktop y mobile] -> Mitigacion: partir de una interaccion accesible y acotar la primera version a lo estrictamente necesario.

## Migration Plan

1. Definir payloads y endpoints dedicados de reorder.
2. Implementar reescritura consistente de posiciones para columnas y tarjetas.
3. Integrar la interaccion de UI para mover elementos.
4. Reconciliar la vista con el estado persistido por backend.
5. Validar reorder en los casos principales y hacer rollback retirando endpoints y controles si fuera necesario.

## Open Questions

- La libreria o estrategia exacta de drag and drop se resolvera durante implementacion, siempre que permita modelar columnas y tarjetas sin romper el contrato del backend.
