## Context

La UI actual cumple con el alcance funcional, pero mezcla decisiones visuales de tipo editorial con un producto operativo que necesita mas claridad, consistencia y confianza. En `packages/web/src/routes/home-route.tsx` la home reparte el contexto entre shell, hero, metrica y paneles de accion; en `packages/web/src/features/boards/board-page.tsx` el board view expone contexto tecnico demasiado pronto, separa la creacion de columnas del flujo principal y repite controles secundarios alrededor del drag and drop.

La implementacion ya tiene una base util: rutas y CRUD resueltos, estados de loading/empty/error/success, dialogs compartidos, menus y drag and drop con fallback por teclado. El cambio debe reutilizar esa base sin exigir endpoints nuevos ni alterar la estructura de datos, por lo que el rediseño tiene que apoyarse en reorganizacion de layout, jerarquia visual, semantica de componentes y refinamiento de accesibilidad.

## Goals / Non-Goals

**Goals:**
- Establecer una direccion visual unica para dashboard y board view basada en un workspace profesional, claro y light-first.
- Introducir tokens semanticos y patrones compartidos para superficies, acciones, estados y motion, reduciendo decisiones visuales ad hoc.
- Reorganizar `/` y `/boards/:boardId` para que el contexto principal, las acciones prioritarias y la densidad de informacion sean mas legibles y consistentes.
- Preservar las funcionalidades actuales, incluyendo CRUD, drag and drop, rutas, dialogs y estados operativos.
- Mejorar accesibilidad visual y de interaccion con foco visible, hover/pressed/disabled coherentes, reduced motion y touch targets adecuados.

**Non-Goals:**
- Cambiar contratos de API, modelos de datos o rutas existentes.
- Introducir un template SaaS generico o una identidad visual demasiado experimental o editorial.
- Reemplazar drag and drop por otro sistema de reordenamiento.
- Crear una libreria de componentes externa o una migracion amplia de framework.

## Decisions

### Decision: Consolidar un visual system semantico sobre CSS tokens existentes
Se reemplazara la paleta actual y la tipografia editorial de `packages/web/src/styles/tokens.css` por tokens semanticos orientados a workspace: neutrales/slate para base, azul de confianza como primario, apoyo frio sutil y acento naranja contenido para CTA y foco. Tambien se definiran niveles claros de superficie, borde, elevacion, radios, spacing y motion con duraciones entre 150ms y 250ms.

Rationale:
- Permite mejorar toda la app desde una base comun sin introducir dependencias nuevas.
- Reduce la mezcla actual de gradientes, blur y contrastes inconsistentes entre dashboard y board view.
- Facilita estados consistentes en botones, inputs, cards, menus, dialogs y banners.

Alternatives considered:
- Ajustar estilos pantalla por pantalla sin tocar tokens: mas rapido, pero mantendria inconsistencia estructural.
- Adoptar una libreria de componentes externa: agregaria costo visual y riesgo de verse generico.

### Decision: Tratar la home como dashboard operativo con una sola cabecera util
La ruta `/` se reorganizara alrededor de una cabecera unica que combine contexto, conteo de boards y CTA principal, seguida por estados del dashboard y un grid/lista de board cards mas sobrio. La creacion de board dejara de sentirse un bloque desconectado: se mostrara como panel inline expandible o region contextual desde la misma cabecera, manteniendo el flujo actual de formulario visible.

Rationale:
- Elimina el tono de pseudo landing y la duplicacion de contexto.
- Hace mas evidente la accion prioritaria sin esconder CRUD secundario.
- Permite que los estados loading/empty/error sigan existiendo dentro de una jerarquia mas operativa.

Alternatives considered:
- Mantener la home actual y solo retocar colores/espaciado: no resuelve el problema de jerarquia.
- Mover crear board a un dialog nuevo: cambiaria el patron actual sin necesidad funcional.

### Decision: Reforzar `/boards/:boardId` con una barra de workspace y un rail de columnas mas intencional
La vista del board tendra una barra superior persistente dentro de la pagina con breadcrumb, titulo, resumen operativo y acciones principales. La accion de crear columna se integrara a esa barra y/o al final del rail horizontal como tile de adicion, evitando el bloque separado actual. El rail conservara scroll horizontal y drag and drop, pero con contencion visual mas clara y menos ruido accesorio.

Rationale:
- Ordena el contexto del workspace y reduce la prominencia del `boardId` tecnico.
- Acerca la accion de crear columna al lugar donde ocurre el trabajo.
- Mejora la continuidad visual entre toolbar, columnas, tarjetas y overlays.

Alternatives considered:
- Dejar el composer como bloque independiente superior: conserva la desconexion actual.
- Mover toda la creacion solo a una ultima columna: dificulta descubrir la accion en estados vacios si no se acompana de toolbar.

### Decision: Mantener fallback accesible de movimiento, pero degradar su prominencia visual
Se conservaran los controles de movimiento por teclado/botones para columnas y tarjetas, pero pasaran a patrones secundarios o menus de overflow cuando drag and drop este disponible visualmente. El objetivo es que sigan siendo accesibles sin competir permanentemente con la lectura del contenido.

Rationale:
- Preserva accesibilidad y capacidad operativa.
- Reduce el ruido de controles redundantes en cards y columnas.

Alternatives considered:
- Eliminar fallback: rompe accesibilidad.
- Mantener todos los controles visibles como hoy: mantiene saturacion visual.

### Decision: Tratar IDs tecnicos como metadata secundaria
Los IDs de board y otros identificadores tecnicos dejaran de ser parte del encabezado principal o del copy primario. Cuando sea necesario mantenerlos, se presentaran como metadata discreta, texto de soporte o accion de copiado, nunca como el primer dato escaneable.

Rationale:
- Mejora la sensacion de producto terminado.
- Mantiene trazabilidad sin contaminar la jerarquia principal.

Alternatives considered:
- Eliminar por completo todos los IDs visibles: puede quitar una ayuda util para soporte o debugging.

## Risks / Trade-offs

- [Mayor alcance visual en componentes compartidos] -> Mitigar con una capa de tokens primero y luego ajustes por superficie para evitar regresiones dispersas.
- [Cambios de jerarquia pueden romper tests por texto/roles] -> Mitigar actualizando pruebas por comportamiento y labels accesibles, no por estructura cosmetica fragil.
- [Reducir prominencia de controles de movimiento podria afectar descubribilidad] -> Mitigar manteniendo menus/contextos claros y soporte de teclado documentado en labels accesibles.
- [Nueva tipografia puede afectar rendering y layout] -> Mitigar usando una pila con fallback equivalente y validando desktop/mobile.

## Migration Plan

1. Actualizar tokens base, tipografia y primitives compartidos sin tocar todavia el flujo funcional.
2. Rehacer la jerarquia del dashboard y adaptar tests de `/`.
3. Rehacer la barra de workspace del board, integrar creacion de columna y ajustar el rail horizontal.
4. Refinar columnas, tarjetas, menus, dialogs, banners y controles secundarios para cerrar consistencia visual.
5. Ejecutar pruebas de frontend y verificacion responsive/accesible antes de cerrar el change.

Rollback: al no haber cambios de backend ni migraciones de datos, el rollback consiste en revertir los cambios del frontend por commit si aparece una regresion mayor.

## Open Questions

- La tipografia preferida es Plus Jakarta Sans; si no se incorpora como asset externo, se usara una alternativa local de legibilidad equivalente para evitar bloquear el cambio.
- La visibilidad exacta de IDs tecnicos puede resolverse como metadata colapsable o accion de copiado segun el espacio disponible en dashboard y board view.
