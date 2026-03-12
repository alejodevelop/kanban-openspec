## 1. Frontend foundation

- [x] 1.1 Definir tokens y primitivas compartidas de UI para color, tipografia, espaciado, superficies, formularios, dialogs, foco visible y motion reducido en `packages/web`
- [x] 1.2 Reorganizar la shell del frontend para separar el layout del dashboard y el layout del workspace del board sin cambiar rutas ni contratos API
- [x] 1.3 Preparar una estructura de componentes y estilos mas modular para evitar que el rediseno siga dependiendo de `src/styles.css` y de archivos monoliticos

## 2. Dashboard de boards

- [x] 2.1 Redisenar `home-route` con una jerarquia mas clara para encabezado, listado de boards y accion primaria de creacion
- [x] 2.2 Implementar estados de carga, error y vacio del dashboard con copy mas pulido, CTA claros y manejo correcto de titulos o contenido largo
- [x] 2.3 Convertir las acciones de crear, renombrar y eliminar boards en patrones contextuales y accesibles con feedback por mutacion

## 3. Workspace del board

- [x] 3.1 Refactorizar `board-page` en subcomponentes y hooks para shell del board, header, columnas, tarjetas, composers y dialogs
- [x] 3.2 Redisenar la vista del tablero para desktop y mobile con navegacion de retorno, mejor jerarquia visual y estados de carga, error, vacio y not found coherentes
- [x] 3.3 Actualizar la presentacion de columnas y tarjetas para reducir ruido visual, manejar contenido largo y mantener acciones clave accesibles

## 4. Flujos CRUD consistentes

- [x] 4.1 Reemplazar `prompt` y `confirm` de boards, columnas y tarjetas por dialogs, drawers o formularios inline accesibles y consistentes
- [x] 4.2 Hacer contextual la creacion de columnas y tarjetas para evitar formularios siempre expandidos en el workspace
- [x] 4.3 Estandarizar feedback de envio, exito y error en operaciones CRUD usando actualizacion local o revalidacion focalizada segun corresponda

## 5. Reorder, accesibilidad y responsive

- [x] 5.1 Adaptar drag and drop y overlays al nuevo arbol de componentes sin perder reorder de columnas ni de tarjetas
- [x] 5.2 Mantener y pulir la alternativa accesible al drag and drop con controles descubribles, feedback claro y estado consistente ante errores
- [x] 5.3 Aplicar lineamientos de `web-design-guidelines` en foco visible, semantica HTML, labels, `aria-live`, reduced motion, touch interactions y layout responsive

## 6. Validacion

- [x] 6.1 Actualizar o agregar pruebas del dashboard y del board para cubrir los nuevos layouts, dialogs, feedback y flujos de mutacion
- [x] 6.2 Verificar que los flujos principales funcionen en desktop y mobile, incluyendo creacion, edicion, eliminacion y reorder
- [x] 6.3 Ejecutar pruebas y build del frontend, corrigiendo regresiones antes de cerrar la implementacion
