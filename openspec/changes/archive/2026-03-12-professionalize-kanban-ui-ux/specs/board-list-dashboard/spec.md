## MODIFIED Requirements

### Requirement: Mostrar dashboard inicial con boards disponibles
El sistema SHALL usar la ruta inicial del frontend para mostrar un dashboard operativo de boards con una cabecera unica que concentre el contexto principal, el conteo disponible y la accion primaria de creacion.

#### Scenario: Dashboard con boards
- **WHEN** la ruta `/` carga y la API devuelve boards disponibles
- **THEN** la interfaz muestra una cabecera unica de dashboard y un listado de boards con jerarquia visual orientada a trabajo operativo

### Requirement: Permitir entrar a un board desde el dashboard
El sistema SHALL ofrecer una navegacion directa desde cada board listado hacia su vista detallada existente, destacando una accion principal visible para abrir el workspace.

#### Scenario: Navegacion a board individual
- **WHEN** la persona usuaria activa la accion principal de un board listado
- **THEN** el frontend navega hacia `/boards/:boardId` usando el identificador correspondiente

### Requirement: Mostrar el resumen principal de cada board
El sistema SHALL presentar para cada board listado el titulo y los metadatos de resumen entregados por la API, priorizando conteos y contexto util por encima de identificadores tecnicos visibles.

#### Scenario: Resumen visible por board
- **WHEN** el dashboard renderiza un board listado
- **THEN** la interfaz muestra al menos el total de columnas y el total de tarjetas asociado a ese board en una card escaneable y profesional

## ADDED Requirements

### Requirement: Tratar acciones de mantenimiento como secundarias
El sistema SHALL mantener las acciones de renombrar y eliminar boards accesibles desde el dashboard, pero con una jerarquia visual secundaria respecto de abrir el board y crear uno nuevo.

#### Scenario: Acciones secundarias disponibles
- **WHEN** la persona usuaria revisa una card de board en el dashboard
- **THEN** puede encontrar acciones de renombrar y eliminar sin que compitan visualmente con la accion principal de abrir el board

### Requirement: Reducir la prominencia de IDs tecnicos en el dashboard
El sistema SHALL evitar mostrar el `boardId` como dato primario en cada board card del dashboard.

#### Scenario: Identificador tecnico no dominante
- **WHEN** la persona usuaria escanea el listado de boards
- **THEN** el titulo, los conteos y la accion principal aparecen antes que cualquier identificador tecnico visible
