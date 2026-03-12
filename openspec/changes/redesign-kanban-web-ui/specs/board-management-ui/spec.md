## MODIFIED Requirements

### Requirement: Crear boards desde el dashboard
El sistema SHALL permitir crear un board desde la ruta `/` usando una accion primaria y un flujo de formulario consistente con el sistema visual, sin abandonar el dashboard ni introducir ruido permanente innecesario.

#### Scenario: Alta exitosa desde dashboard
- **WHEN** la persona usuaria envia un titulo valido desde el dashboard
- **THEN** la interfaz crea el board, actualiza el listado visible y deja el nuevo item disponible para abrirlo sin perder el contexto de la vista

#### Scenario: Error de validacion al crear board
- **WHEN** la persona usuaria intenta crear un board con un titulo invalido
- **THEN** la interfaz mantiene visible el flujo de creacion y comunica el error junto al formulario sin recargar la pagina

### Requirement: Editar y eliminar boards desde el dashboard
El sistema SHALL ofrecer acciones de edicion y borrado para cada board listado mediante patrones contextuales y accesibles, con feedback claro del resultado.

#### Scenario: Renombrar board desde el dashboard
- **WHEN** la persona usuaria confirma un nuevo titulo valido para un board listado
- **THEN** la interfaz actualiza el nombre visible sin perder el acceso a su ruta detallada ni depender de `prompt`

#### Scenario: Eliminar board desde el dashboard
- **WHEN** la persona usuaria confirma la eliminacion de un board listado
- **THEN** la interfaz remueve ese board del dashboard y conserva visibles los restantes sin depender de `confirm`

### Requirement: Crear columnas desde la vista del board
El sistema SHALL permitir crear columnas nuevas dentro de la vista de un board existente mediante un patron contextual que no obligue a mantener un formulario expandido de forma permanente.

#### Scenario: Nueva columna en board existente
- **WHEN** la persona usuaria envia un titulo valido desde la vista `/boards/:boardId`
- **THEN** la interfaz incorpora la nueva columna al final del orden actual y devuelve foco o feedback al contexto en el que se inicio la accion

#### Scenario: Error al crear columna
- **WHEN** la API rechaza la creacion de la columna por validacion o porque el board ya no existe
- **THEN** la interfaz comunica el error y mantiene el contexto actual del tablero sin perder la accion iniciada

### Requirement: Editar y eliminar columnas desde la vista del board
El sistema SHALL ofrecer acciones para renombrar y eliminar columnas existentes desde la vista del tablero mediante controles contextuales, accesibles y coherentes con el resto de la app.

#### Scenario: Renombrar columna
- **WHEN** la persona usuaria actualiza el titulo de una columna con un valor valido
- **THEN** la interfaz muestra el nuevo nombre en el mismo board sin alterar el orden de columnas ni tarjetas y sin depender de `prompt`

#### Scenario: Eliminar columna
- **WHEN** la persona usuaria confirma la eliminacion de una columna existente
- **THEN** la interfaz deja de mostrar la columna eliminada y conserva un estado coherente del workspace sin depender de `confirm`

### Requirement: Comunicar estados de mutacion de gestion
El sistema SHALL representar estados de envio, exito o error para operaciones CRUD de boards y columnas con feedback cercano a la entidad afectada y sin bloquear la navegacion completa.

#### Scenario: Operacion en curso
- **WHEN** la persona usuaria envia una operacion de creacion, edicion o borrado
- **THEN** la interfaz deshabilita la accion correspondiente o muestra un indicador de procesamiento contextual hasta recibir respuesta

#### Scenario: Falla de red o servidor al mutar
- **WHEN** una operacion CRUD falla por error de red o servidor
- **THEN** la interfaz informa un mensaje comprensible, preserva los datos ya renderizados que sigan siendo validos y deja claro donde reintentar

## ADDED Requirements

### Requirement: Confirmar acciones destructivas con patrones consistentes
El sistema SHALL confirmar la eliminacion de boards y columnas mediante dialogs, sheets o patrones equivalentes propios de la interfaz que sean accesibles en teclado, touch y lector de pantalla.

#### Scenario: Confirmacion destructiva en desktop o mobile
- **WHEN** la persona usuaria inicia una accion de borrado sobre un board o una columna
- **THEN** la interfaz presenta una confirmacion explicita coherente con el sistema visual antes de ejecutar la mutacion
