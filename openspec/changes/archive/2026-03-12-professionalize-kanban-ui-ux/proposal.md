## Why

La aplicacion ya resuelve el flujo funcional principal del kanban, pero la experiencia visual y de uso todavia no transmite un workspace profesional, consistente ni confiable. Este cambio es necesario ahora para consolidar la home y la vista de board como un producto operativo claro, reducir ruido visual y mejorar la jerarquia sin tocar el alcance funcional existente.

## What Changes

- Redefinir la direccion visual del frontend hacia un estilo de "calm operations workspace" light-first, con tokens semanticos coherentes para color, borde, radio, sombra, spacing y motion.
- Reorganizar `/` como un dashboard operativo real con una unica cabecera util, CTA principal clara, cards de boards mas escaneables y acciones secundarias menos intrusivas.
- Reorganizar `/boards/:boardId` con una barra superior de workspace mas fuerte, mejor contexto navegable, integracion natural de "Nueva columna" y un rail horizontal de columnas mas intencional.
- Unificar la familia de componentes de workspace, incluyendo botones, inputs, cards, menus, dialogs, banners, estados vacios y estados interactivos consistentes.
- Reducir la exposicion prominente de IDs tecnicos en dashboard y board view, manteniendolos solo como dato secundario o accion utilitaria cuando aplique.
- Simplificar controles redundantes alrededor del reordenamiento, preservando drag and drop y un fallback accesible con menos ruido visual.

## Capabilities

### New Capabilities
- `workspace-visual-system`: Define tokens semanticos y reglas de consistencia visual e interactiva para el workspace Kanban, incluyendo componentes base, estados y accesibilidad visual compartida.

### Modified Capabilities
- `board-list-dashboard`: Cambiar la jerarquia, estructura y prioridades visuales del dashboard para que opere como superficie de trabajo y no como pseudo landing.
- `board-view-ui`: Cambiar la organizacion del workspace del board, su barra superior, el patron de creacion de columnas y la presentacion de controles y metadatos.

## Impact

- Afecta `packages/web/src/routes/home-route.tsx`, `packages/web/src/features/boards/board-page.tsx`, componentes UI compartidos y hojas de estilo/tokens del frontend.
- Requiere actualizar tests de frontend relacionados con dashboard y board view para reflejar nueva jerarquia y nuevos labels accesibles.
- No requiere nuevas rutas, endpoints ni cambios de backend; reutiliza la data existente de boards, columnas y tarjetas.
