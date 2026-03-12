## ADDED Requirements

### Requirement: Crear boards desde el dashboard
El sistema SHALL permitir crear un board desde la ruta `/` usando un formulario visible sin abandonar el dashboard.

#### Scenario: Alta exitosa desde dashboard
- **WHEN** la persona usuaria envia un titulo valido desde el dashboard
- **THEN** la interfaz crea el board, refresca el listado y muestra el nuevo item disponible para abrirlo

#### Scenario: Error de validacion al crear board
- **WHEN** la persona usuaria intenta crear un board con un titulo invalido
- **THEN** la interfaz mantiene el formulario visible y comunica el error sin recargar la pagina

### Requirement: Editar y eliminar boards desde el dashboard
El sistema SHALL ofrecer acciones de edicion y borrado para cada board listado con feedback claro del resultado.

#### Scenario: Renombrar board desde el dashboard
- **WHEN** la persona usuaria confirma un nuevo titulo valido para un board listado
- **THEN** la interfaz actualiza el nombre visible sin perder el acceso a su ruta detallada

#### Scenario: Eliminar board desde el dashboard
- **WHEN** la persona usuaria confirma la eliminacion de un board listado
- **THEN** la interfaz remueve ese board del dashboard y conserva visibles los restantes

### Requirement: Crear columnas desde la vista del board
El sistema SHALL permitir crear columnas nuevas dentro de la vista de un board existente.

#### Scenario: Nueva columna en board existente
- **WHEN** la persona usuaria envia un titulo valido desde la vista `/boards/:boardId`
- **THEN** la interfaz refresca el board y muestra la nueva columna al final del orden actual

#### Scenario: Error al crear columna
- **WHEN** la API rechaza la creacion de la columna por validacion o porque el board ya no existe
- **THEN** la interfaz comunica el error y mantiene el contexto actual del tablero

### Requirement: Editar y eliminar columnas desde la vista del board
El sistema SHALL ofrecer acciones para renombrar y eliminar columnas existentes desde la vista del tablero.

#### Scenario: Renombrar columna
- **WHEN** la persona usuaria actualiza el titulo de una columna con un valor valido
- **THEN** la interfaz muestra el nuevo nombre en el mismo board sin alterar el orden de columnas ni tarjetas

#### Scenario: Eliminar columna
- **WHEN** la persona usuaria confirma la eliminacion de una columna existente
- **THEN** la interfaz refresca el board y deja de mostrar la columna eliminada

### Requirement: Comunicar estados de mutacion de gestion
El sistema SHALL representar estados de envio, exito o error para operaciones CRUD de boards y columnas sin bloquear la navegacion completa.

#### Scenario: Operacion en curso
- **WHEN** la persona usuaria envia una operacion de creacion, edicion o borrado
- **THEN** la interfaz deshabilita la accion correspondiente o muestra un indicador de procesamiento hasta recibir respuesta

#### Scenario: Falla de red o servidor al mutar
- **WHEN** una operacion CRUD falla por error de red o servidor
- **THEN** la interfaz informa un mensaje comprensible y preserva los datos ya renderizados que sigan siendo validos
