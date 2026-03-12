## Why

La interfaz web actual ya cubre las capacidades base del producto, pero todavia se percibe como una demo CRUD: la jerarquia visual es debil, la shell desperdicia espacio util, varias acciones usan `prompt` y `confirm`, y la experiencia movil y de accesibilidad queda por debajo de una aplicacion Kanban de uso real. Este cambio busca elevar la calidad del frontend sin alterar el dominio ni rehacer la logica principal del backend, para que el producto se sienta consistente, usable y visualmente intencional.

## What Changes

- Redisenar de forma integral el dashboard de boards y la vista de detalle del board con una direccion visual coherente, mejor jerarquia de informacion y una shell mas orientada a workspace.
- Reorganizar acciones CRUD de boards, columnas y tarjetas para que sean mas contextuales y menos ruidosas, manteniendo las capacidades existentes de creacion, edicion, eliminacion y apertura.
- Reemplazar interacciones provisionales basadas en `prompt` y `confirm` por dialogos, drawers o formularios inline mas consistentes y accesibles.
- Mejorar estados de carga, error, vacio, feedback de mutaciones, copy de interfaz, foco visible, semantica HTML, responsive, touch interactions y reduced motion siguiendo `web-design-guidelines`.
- Introducir una base visual mas sistematica en frontend con tokens, tipografia, espaciado, patrones reutilizables y una separacion de componentes mas sostenible, especialmente en la vista del board.
- Preservar el comportamiento funcional actual del producto, incluyendo apertura de boards, CRUD de boards/columnas/tarjetas y reordenamiento con drag and drop, ajustando solo la arquitectura UI necesaria para soportar el rediseno.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `web-app-foundation`: actualizar la shell y las bases compartidas del frontend para soportar una experiencia de aplicacion mas consistente, accesible y responsive.
- `board-list-dashboard`: redefinir la experiencia del dashboard con mejor jerarquia visual, estados pulidos y acciones mas contextuales sobre cada board.
- `board-view-ui`: rehacer la vista del tablero como workspace principal con mejor navegacion, densidad visual controlada, estados claros y patron consistente de interacciones.
- `board-management-ui`: cambiar los flujos de crear, editar y eliminar boards y columnas para usar patrones accesibles y feedback coherente en lugar de interacciones nativas provisionales.
- `card-creation-flow`: ajustar la creacion de tarjetas para que sea contextual, menos ruidosa y compatible con la nueva arquitectura de interfaz y responsive.
- `kanban-reordering`: refinar la experiencia de reorder para que conserve accesibilidad, feedback y usabilidad dentro del rediseno visual y movil.

## Impact

- Frontend en `packages/web`, en particular `src/App.tsx`, `src/styles.css`, `src/routes/home-route.tsx`, `src/routes/board-route.tsx` y `src/features/boards/*`.
- Nuevos componentes, tokens y patrones UI reutilizables para dashboard, board workspace, dialogs, forms y feedback.
- Actualizacion de pruebas del frontend para reflejar la nueva estructura e interacciones.
- Sin cambios obligatorios en el dominio principal del producto ni en contratos backend existentes, salvo ajustes menores de arquitectura frontend para sostener el rediseno.
