## 1. Base visual system

- [x] 1.1 Actualizar `packages/web/src/styles/tokens.css` con la nueva direccion visual calm operations workspace, incluyendo paleta semantica, tipografia, radios, sombras, spacing y motion
- [x] 1.2 Ajustar estilos base y primitives compartidos para que botones, inputs, banners, cards, menus y dialogs usen estados coherentes de hover, focus, pressed y disabled
- [x] 1.3 Incorporar soporte de reduced motion, foco visible y touch targets consistentes en los componentes compartidos del workspace

## 2. Dashboard operativo en `/`

- [x] 2.1 Reorganizar `packages/web/src/routes/home-route.tsx` para consolidar la cabecera en una sola pieza util con contexto, conteo de boards y CTA principal de creacion
- [x] 2.2 Redisenar las board cards y `packages/web/src/styles/dashboard.css` para priorizar titulo, metadata util, conteos y accion principal de apertura con acciones secundarias menos prominentes
- [x] 2.3 Reducir la visibilidad primaria de IDs tecnicos en el dashboard, manteniendolos solo como metadata secundaria o accion utilitaria si aplica
- [x] 2.4 Adaptar estados de loading, empty, error y success del dashboard a la nueva jerarquia visual sin romper el CRUD actual de boards

## 3. Workspace de board en `/boards/:boardId`

- [x] 3.1 Reorganizar `packages/web/src/features/boards/board-page.tsx` para introducir una barra superior de workspace con breadcrumb, titulo, resumen y acciones principales
- [x] 3.2 Integrar la creacion de columnas al flujo principal del tablero desde el toolbar y/o una ultima tile del rail, manteniendo el comportamiento actual de crear columna
- [x] 3.3 Redisenar `packages/web/src/styles/board.css` para que el rail horizontal de columnas se sienta mas intencional, comodo y coherente en desktop y mobile
- [x] 3.4 Reducir la prominencia del `boardId` y de controles redundantes de movimiento, preservando drag and drop y fallback accesible para columnas y tarjetas

## 4. Cohesion de componentes de workspace

- [x] 4.1 Refinar columnas, tarjetas, overlays, menus y formularios de `packages/web/src/features/boards/board-components.tsx` para alinearlos con el nuevo sistema visual
- [x] 4.2 Refinar dialogs y patrones de confirmacion/edicion en `packages/web/src/features/boards/board-dialogs.tsx` y componentes UI compartidos para que se sientan parte del mismo producto
- [x] 4.3 Unificar iconografia SVG y estados interactivos en acciones principales y secundarias del dashboard y board workspace

## 5. Verificacion

- [x] 5.1 Actualizar pruebas de frontend afectadas por la nueva jerarquia, labels accesibles y reorganizacion visual en dashboard y board view
- [x] 5.2 Ejecutar la suite relevante de pruebas del frontend y corregir regresiones sin alterar rutas ni alcance funcional existente
- [x] 5.3 Validar responsive real, foco visible, dialogs, reduced motion y estados loading/empty/error/success en desktop y mobile
