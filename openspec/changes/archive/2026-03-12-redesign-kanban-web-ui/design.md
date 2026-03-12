## Context

El frontend actual ya resuelve las operaciones principales del producto, pero la experiencia sigue concentrada en pocos archivos y en una capa visual global poco sistematica. `packages/web/src/App.tsx` mantiene una shell con tono de landing incluso en la vista operativa del tablero, `packages/web/src/styles.css` concentra practicamente toda la presentacion, y `packages/web/src/features/boards/board-page.tsx` mezcla layout, drag and drop, formularios, modal y mutaciones del board en un solo modulo. El resultado es una interfaz funcional pero ruidosa, poco escalable y con patrones inconsistentes: formularios siempre visibles dentro de cada columna, uso mixto de modales propios con `prompt` y `confirm`, y una experiencia movil que se parece a la de escritorio comprimida.

El cambio debe preservar las capacidades actuales de boards, columnas, tarjetas y reorder, sin introducir una reescritura del backend. La oportunidad esta en rehacer la arquitectura visual y la arquitectura UI del frontend para que el producto se perciba como una aplicacion Kanban intencional. La propuesta adopta `web-design-guidelines` como criterio explicito de diseno y validacion, por lo que la accesibilidad, los focus states, la semantica HTML, el reduced motion, la respuesta tactil y el manejo de estados dejan de ser detalles cosmeticos y pasan a ser restricciones de diseno.

## Goals / Non-Goals

**Goals:**
- Construir una direccion visual coherente y consistente entre dashboard y board view, con una shell mas orientada a workspace que a landing.
- Reducir ruido visual y cognitivo mediante acciones contextuales, mejores jerarquias, estados vacios/carga/error mas claros y feedback de mutacion uniforme.
- Crear una base sostenible de frontend con tokens, primitivas compartidas y una separacion de componentes que permita evolucionar la UI sin volver a concentrar todo en un archivo.
- Mejorar accesibilidad y responsive siguiendo `web-design-guidelines`, incluyendo foco visible, dialogos accesibles, reduced motion, soporte tactil y manejo de contenido largo.
- Mantener intactas las capacidades funcionales ya soportadas por el producto, incluyendo CRUD y drag and drop.

**Non-Goals:**
- Cambiar el dominio principal del producto o redefinir entidades, reglas de negocio o contratos backend.
- Introducir una nueva libreria de gestion de estado o rehacer toda la capa de datos si la mejora puede resolverse con la arquitectura actual.
- Agregar nuevas features de negocio como filtros avanzados, vistas alternativas, colaboracion en tiempo real o permisos.
- Resolver internacionalizacion completa del producto mas alla de dejar una base de copy mas consistente para la UI actual.

## Decisions

### Decision: Separar shell de dashboard y shell de workspace
Se reemplazara la experiencia de shell unica por una estructura de aplicacion con chrome adaptable por ruta. El dashboard mantendra una presentacion mas editorial para descubrimiento y gestion de boards, mientras que la vista del board priorizara densidad util, navegacion de retorno, encabezado contextual y el area operativa del tablero.

**Why:** la shell actual desperdicia espacio en la vista mas importante del producto y diluye la jerarquia entre navegacion y trabajo operativo.

**Alternatives considered:**
- Mantener una sola shell para todas las rutas y solo retocar estilos. Se descarta porque conserva el problema estructural de mezclar marketing con workspace.
- Crear layouts completamente independientes sin base comun. Se descarta porque duplicaria patrones de navegacion, focus y feedback.

### Decision: Introducir una base visual sistematica sin adoptar una UI library externa
El rediseno se implementara con tokens de CSS y primitivas UI reutilizables del propio proyecto para color, tipografia, espaciado, superficies, botones, formularios, badges, dialogs y estados. La hoja global dejara de ser el unico punto de composicion y se reorganizara alrededor de capas base, componentes compartidos y estilos por feature.

**Why:** el proyecto ya usa React + Vite con CSS simple, por lo que la forma mas sostenible de mejorar consistencia sin sobrecoste es ordenar la base existente en lugar de incorporar una dependencia visual completa.

**Alternatives considered:**
- Seguir iterando sobre `styles.css` monolitico. Se descarta porque haria el rediseno fragil y dificil de mantener.
- Incorporar una libreria de componentes de terceros. Se descarta porque impondria una identidad ajena y aumentaria el alcance de integracion sin necesidad funcional.

### Decision: Normalizar interacciones CRUD con patrones accesibles y contextuales
Las acciones de crear, editar y eliminar boards, columnas y tarjetas pasaran a usar formularios inline, menus de acciones y dialogs/drawers accesibles segun el contexto. Se eliminara la dependencia de `prompt` y `confirm`, y la UI reducira la cantidad de botones visibles por defecto, especialmente en columnas y tarjetas.

**Why:** la mezcla actual de patrones genera ruido, baja calidad percibida y deuda de accesibilidad.

**Alternatives considered:**
- Mantener `prompt` y `confirm` para simplificar implementacion. Se descarta porque contradice el objetivo principal del cambio y los lineamientos de interfaz.
- Mover todas las acciones a modales globales. Se descarta porque sobrecarga interacciones simples y empeora la continuidad del contexto.

### Decision: Refactorizar la vista del board en subcomponentes con limites claros
`board-page.tsx` se dividira en componentes y hooks orientados a responsabilidades: shell del board, toolbar/header, lista de columnas, columna, tarjeta, composers contextuales, dialogs y feedback de mutaciones. La logica de reorder existente se preservara como base funcional, pero la composicion de UI y el estado local se reorganizaran para permitir cambios visuales y responsive sin acoplamiento excesivo.

**Why:** el archivo actual concentra demasiadas decisiones de interfaz y flujo, lo que hace costoso iterar en diseno, testing y accesibilidad.

**Alternatives considered:**
- Hacer solo cambios cosmeticos sobre el archivo actual. Se descarta porque no crea una base sostenible para el rediseno.
- Reescribir toda la feature desde cero. Se descarta porque aumenta el riesgo funcional sobre una base que ya resuelve lectura, CRUD y reorder.

### Decision: Adoptar una estrategia responsive especifica para el workspace Kanban
La experiencia del board dejara de depender solo de un scroller horizontal comprimido. En desktop se mantendra el workspace multi-columna, mientras que en pantallas pequenas se priorizaran anchos legibles, navegacion clara entre columnas, acciones compactas y patrones tactiles seguros. Las animaciones se limitaran a `transform` y `opacity`, con variantes reducidas para `prefers-reduced-motion`.

**Why:** la vista actual es funcional pero incomoda en movil porque replica la densidad de escritorio con menos espacio y demasiados controles simultaneos.

**Alternatives considered:**
- Mantener exactamente el scroller actual en todos los breakpoints. Se descarta porque conserva una experiencia movil de baja calidad.
- Crear una experiencia movil completamente distinta con logica separada. Se descarta porque eleva demasiado el costo de mantenimiento para este alcance.

### Decision: Estandarizar feedback y mutaciones alrededor de actualizacion local + revalidacion focalizada
Las mutaciones visibles del dashboard y del board se alinearan en torno a feedback contextual, estados de envio por entidad afectada y actualizaciones locales o focalizadas cuando sea razonable, evitando recargas completas del listado o del board salvo cuando aporten simplicidad real.

**Why:** hoy conviven mutaciones optimistas con refetches totales, lo que hace la experiencia inconsistente y dificulta que la UI se sienta fluida.

**Alternatives considered:**
- Refrescar siempre toda la vista despues de cada mutacion. Se descarta porque empeora continuidad y percepcion de rendimiento.
- Introducir de inmediato una capa nueva de cache global. Se descarta porque no es necesaria para cumplir el objetivo del cambio.

## Risks / Trade-offs

- [Refactor amplio de la vista del board] -> Mitigacion: dividir por capas, preservar pruebas existentes y agregar cobertura sobre interacciones criticas antes de mover logica sensible.
- [Mayor sofisticacion visual puede afectar accesibilidad o rendimiento] -> Mitigacion: usar tokens, revisar contraste, limitar animaciones a propiedades seguras y validar `prefers-reduced-motion`.
- [Los patrones contextuales pueden volver invisibles acciones importantes] -> Mitigacion: mantener acciones primarias siempre descubribles y usar menus o estados de foco/hover/touch consistentes.
- [La coexistencia de desktop y mobile puede fragmentar la UX] -> Mitigacion: definir primitivas compartidas y adaptar solo layout y densidad, no el modelo mental del producto.
- [Eliminar refetches completos puede introducir desalineaciones de estado] -> Mitigacion: aplicar actualizaciones locales solo en operaciones bien delimitadas y conservar revalidacion focalizada como red de seguridad.

## Migration Plan

- Reorganizar la base visual compartida del frontend: tokens, tipografia, espaciado, superficies, foco, formularios, feedback y utilidades responsive.
- Introducir shells/layouts reutilizables para dashboard y board workspace sin cambiar rutas ni contratos API.
- Refactorizar el dashboard para adoptar la nueva jerarquia, estados y acciones contextuales.
- Refactorizar la vista del board por componentes, manteniendo la logica funcional de lectura y reorder mientras se sustituyen patrones UI.
- Reemplazar `prompt` y `confirm` por dialogs/drawers/inline forms accesibles en boards, columnas y tarjetas.
- Actualizar pruebas y validaciones visuales/interactivas del frontend. Si el despliegue detecta regresiones, el rollback puede hacerse revirtiendo solo el paquete web porque no hay migraciones de datos ni cambios obligatorios de backend.

## Open Questions

- Conviene fijar en esta etapa una voz unica de copy en espanol para toda la app o solo establecer lineamientos y corregir los textos tocados por el rediseno?
- En movil, la navegacion entre columnas debe priorizar scroll horizontal mejorado, puntos de salto visibles o una variante tipo carrusel paginado para reducir friccion?
