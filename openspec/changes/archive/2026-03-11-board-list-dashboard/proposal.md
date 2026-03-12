## Why

La app ya puede abrir un tablero puntual, pero todavia no ofrece una entrada natural para descubrirlos. Un dashboard con listado de boards permite pasar de una ruta manual a una navegacion real y prepara el terreno para una experiencia multi-tablero.

## What Changes

- Agregar un endpoint de lectura para listar los boards disponibles con metadatos utiles de resumen.
- Reemplazar la home placeholder por un dashboard que consuma ese listado.
- Mostrar estados explicitos de carga, error y vacio en la pantalla inicial.
- Permitir navegar desde cada board listado hacia su ruta `/boards/:boardId`.
- Dejar fuera busqueda, filtros, creacion de boards y metricas avanzadas.

## Capabilities

### New Capabilities
- `board-list-api`: lectura HTTP del catalogo de boards disponibles para el frontend.
- `board-list-dashboard`: dashboard inicial que muestra el listado de boards y enlaza a cada vista de tablero.

### Modified Capabilities
- Ninguna.

## Impact

- El backend expondra un nuevo contrato de lectura orientado a navegacion inicial.
- El frontend dejara de usar una home estatica y tendra una portada funcional.
- La experiencia actual de `board-view-ui` ganara un punto de entrada real sin cambiar su contrato principal.
