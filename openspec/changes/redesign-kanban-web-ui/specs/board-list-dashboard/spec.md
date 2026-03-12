## MODIFIED Requirements

### Requirement: Mostrar dashboard inicial con boards disponibles
El sistema SHALL presentar la ruta inicial del frontend como un dashboard de producto claro y escaneable, con jerarquia visual consistente, layout responsive y una representacion de boards que priorice comprension y navegacion por encima de un listado CRUD plano.

#### Scenario: Dashboard con boards
- **WHEN** la ruta `/` carga y la API devuelve boards disponibles
- **THEN** la interfaz muestra una coleccion responsive de boards con titulo, resumen principal y una affordance clara para abrir cada tablero

### Requirement: Comunicar estados de carga, error y vacio
El sistema SHALL representar los estados principales del dashboard con copy clara, jerarquia visual consistente y proximos pasos accionables cuando corresponda.

#### Scenario: Carga en progreso
- **WHEN** la ruta `/` inicia la consulta del listado y la respuesta aun no llega
- **THEN** la interfaz muestra un estado de carga identificable y coherente con la shell, sin aparentar una pantalla rota o incompleta

#### Scenario: Error al consultar el listado
- **WHEN** la consulta del dashboard falla por red o servidor
- **THEN** la interfaz muestra un mensaje de error comprensible con una accion de recuperacion o reintento visible

#### Scenario: Sin boards disponibles
- **WHEN** la API responde una lista vacia
- **THEN** la interfaz muestra un estado vacio especifico con una invitacion clara a crear el primer board

### Requirement: Permitir entrar a un board desde el dashboard
El sistema SHALL ofrecer una navegacion directa y claramente identificable desde cada board listado hacia su vista detallada existente.

#### Scenario: Navegacion a board individual
- **WHEN** la persona usuaria activa la superficie principal o CTA de un board listado
- **THEN** el frontend navega hacia `/boards/:boardId` usando el identificador correspondiente

## ADDED Requirements

### Requirement: Contextualizar acciones de gestion por board
El sistema SHALL mantener disponibles las acciones de renombrar y eliminar boards desde el dashboard mediante patrones contextuales y accesibles que reduzcan el ruido visual cuando la persona usuaria solo quiere explorar o abrir un tablero.

#### Scenario: Acciones secundarias disponibles sin saturar la tarjeta
- **WHEN** la persona usuaria enfoca, selecciona o abre el menu de acciones de un board listado
- **THEN** la interfaz expone las acciones de gestion correspondientes sin obligar a mostrar todos los botones secundarios de forma permanente

### Requirement: Manejar titulos y contenido variable en las tarjetas de board
El sistema SHALL manejar boards con nombres cortos, normales o largos sin romper el layout del dashboard ni volver ambiguas las acciones principales.

#### Scenario: Board con titulo largo
- **WHEN** un board listado tiene un titulo significativamente mas largo que el promedio
- **THEN** la interfaz conserva legibilidad, evita overflow roto y mantiene accesible la accion para abrirlo o gestionarlo
