## Context

Con `board-read-api` disponible y `packages/web` ya levantado, el siguiente paso natural es unir ambas capas en una pantalla concreta. Este cambio es donde el proyecto deja de ser infraestructura y se convierte en una aplicacion que muestra su dominio principal.

Paths nuevos esperados para este cambio: `packages/web/src/features/boards/board-page.tsx`, `packages/web/src/features/boards/use-board-query.ts` o equivalente, `packages/web/src/routes/board-route.tsx`, estilos o componentes base necesarios para columnas/tarjetas y pruebas cercanas a esa feature.

## Goals / Non-Goals

**Goals:**
- Renderizar un tablero real desde la API en una ruta del frontend.
- Representar de forma explicita estados de carga, error, vacio y no encontrado.
- Mantener una integracion simple entre el contrato del backend y la primera UI funcional.

**Non-Goals:**
- Crear nuevas entidades desde la pantalla.
- Implementar drag and drop.
- Resolver navegacion multi-tablero o dashboards.

## Decisions

### 1. Tomar `boardId` desde la ruta
La vista del tablero se resolvera a partir de un parametro de ruta. Eso evita hardcodear un tablero dentro del codigo UI y deja una estructura compatible con multiples tableros en el futuro.

Alternativas consideradas:
- Fijar un `boardId` estatico en el cliente. Se descarta porque no escala y oculta el contrato real.

### 2. Cargar datos con manejo local de estado en la primera iteracion
La pantalla puede resolver su consulta con estado React y un hook o servicio pequeno. No hace falta introducir todavia una libreria adicional de cache remota para una sola lectura principal.

Alternativas consideradas:
- Incorporar una libreria de data fetching desde este cambio. Se descarta para mantener pequeno el primer render funcional.

### 3. Mantener la forma anidada de la API en la UI
El frontend trabajara directamente con el agregado que devuelve el backend. Eso reduce transformaciones innecesarias antes de tener mas casos de uso.

Alternativas consideradas:
- Normalizar la respuesta en el cliente. Se descarta porque agrega complejidad sin necesidad inmediata.

### 4. Tratar `empty` y `not found` como estados diferentes
Un tablero sin columnas no es lo mismo que un tablero inexistente. La UI mostrara mensajes distintos para cada caso.

Alternativas consideradas:
- Unificar todos los errores de lectura bajo un solo estado generico. Se descarta porque reduce claridad para el usuario y para depuracion.

## Risks / Trade-offs

- [El primer render puede quedar acoplado al contrato exacto del backend] -> Mitigacion: mantener el contrato simple y estable, y revisar solo cuando aparezcan mas consumidores.
- [Sin cache remota, pueden aparecer re-fetches innecesarios] -> Mitigacion: aceptar esa simplicidad hasta que existan mas mutaciones o navegacion avanzada.
- [La ruta requiere conocer un `boardId` util para demo local] -> Mitigacion: apoyarse en los fixtures o seeds definidos por el cambio de lectura.

## Migration Plan

1. Crear la ruta y la pantalla de board.
2. Conectar la pantalla con el endpoint de lectura.
3. Renderizar la jerarquia `board -> columns -> cards`.
4. Agregar estados de carga, error, vacio y no encontrado.
5. Verificar manual y automaticamente la vista contra la API local.

## Open Questions

- Se difiere la decision de si la ruta inicial del producto debe redirigir automaticamente a un board conocido o si primero existira una pantalla intermedia.
