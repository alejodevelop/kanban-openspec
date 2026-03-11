## Context

El modelo de datos ya existe y resuelve jerarquia, orden e integridad referencial, pero todavia no hay un endpoint que devuelva esa estructura como agregado de dominio. El frontend no necesita todas las tablas por separado: necesita una vista unica del tablero lista para renderizar.

Paths nuevos esperados para este cambio: `packages/api/src/features/boards/get-board.ts`, `packages/api/src/routes/boards.ts`, `packages/api/src/features/boards/get-board.test.ts` o equivalente de integracion, y actualizaciones en los archivos de bootstrap del backend para registrar la nueva ruta.

## Goals / Non-Goals

**Goals:**
- Exponer un endpoint de lectura que devuelva un tablero con columnas y tarjetas ordenadas.
- Definir un contrato de respuesta estable y facil de consumir desde React.
- Cubrir explicitamente el caso de tablero inexistente.
- Dejar una base reutilizable para futuras mutaciones que necesiten reconsultar el tablero.

**Non-Goals:**
- Listar multiples tableros.
- Crear o editar entidades.
- Resolver cache, paginacion o autenticacion.

## Decisions

### 1. Exponer un agregado anidado por tablero
El endpoint devolvera un objeto de tablero con un arreglo de columnas y, dentro de cada columna, un arreglo de tarjetas. Esa forma coincide con lo que la UI necesita pintar en pantalla.

Alternativas consideradas:
- Respuesta normalizada por colecciones separadas. Se descarta porque obliga al frontend inicial a recomponer un agregado que ya existe conceptualmente.

### 2. Usar `GET /api/boards/:boardId`
La identidad principal del flujo es el tablero. Usar el `boardId` en la ruta hace explicito el recurso consultado y evita sobrecargar este cambio con filtros o listados.

Alternativas consideradas:
- `GET /api/board` con query params. Se descarta por menor claridad semantica.

### 3. Resolver el agregado con consultas ordenadas y composicion en backend
La primera version puede consultar tablero, columnas y tarjetas con orden explicito por `position` y componer la respuesta en el servicio. La claridad vale mas que optimizar prematuramente una consulta compleja.

Alternativas consideradas:
- Un join grande con agrupacion manual. Se descarta por complejidad innecesaria en el primer endpoint.

### 4. Tratar tablero inexistente como `404`
Si el `boardId` no existe, la API respondera con not found en lugar de un objeto vacio. Eso evita ambiguedad entre "tablero sin columnas" y "tablero inexistente".

Alternativas consideradas:
- Responder `200` con estructura vacia. Se descarta porque oculta errores de ruta o de seed.

### 5. Preparar fixtures o seed para validacion local
Aunque no es parte del contrato funcional, este cambio necesita una forma controlada de probar el endpoint con datos reales o de prueba.

Alternativas consideradas:
- Depender de inserciones manuales. Se descarta porque frena la validacion del frontend y de pruebas de integracion.

## Risks / Trade-offs

- [La respuesta anidada puede crecer si el tablero es muy grande] -> Mitigacion: aceptar ese costo en la primera iteracion y revisar paginacion solo si aparece un caso real.
- [Componer el agregado con varias consultas puede introducir sobrecosto] -> Mitigacion: mantener el endpoint simple y medir antes de optimizar.
- [Sin fixtures consistentes, la API sera dificil de demostrar desde UI] -> Mitigacion: incluir una estrategia de datos de prueba desde este cambio.

## Migration Plan

1. Implementar el caso de uso de lectura y la forma de respuesta.
2. Registrar la ruta `GET /api/boards/:boardId`.
3. Agregar fixtures o seeds para pruebas locales y automatizadas.
4. Validar exito y not found por pruebas de integracion.
5. Si hay rollback, retirar la ruta y el caso de uso sin tocar el schema existente.

## Open Questions

- Queda diferida la decision de si mas adelante existira un endpoint para listar tableros y descubrir `boardId` desde UI.
