## MODIFIED Requirements

### Requirement: Visualizar un tablero desde la API
El sistema SHALL mostrar en el frontend un workspace Kanban enfocado en el tablero, con encabezado contextual, navegacion clara y una jerarquia visual que haga legibles columnas y tarjetas en desktop y mobile usando datos obtenidos del endpoint de lectura del backend.

#### Scenario: Render exitoso del tablero
- **WHEN** la vista del tablero carga un `boardId` valido y la API responde correctamente
- **THEN** la interfaz muestra el titulo del tablero, la navegacion de retorno, sus columnas y las tarjetas de cada columna dentro de un workspace visualmente priorizado

### Requirement: Representar estados de carga y fallo de lectura
El sistema SHALL mostrar estados explicitos mientras la vista espera respuesta del backend o cuando la consulta falla, con copy comprensible y una presentacion coherente con el resto del workspace.

#### Scenario: Carga en progreso
- **WHEN** la vista solicita el tablero y la respuesta aun no ha llegado
- **THEN** la interfaz muestra un estado de carga identificable que preserva la estructura general de la pantalla

#### Scenario: Error al consultar la API
- **WHEN** la vista solicita el tablero y ocurre un fallo de red o de servidor
- **THEN** la interfaz muestra un estado de error comprensible para la persona usuaria y una via visible para reintentar o volver

### Requirement: Distinguir tablero vacio de tablero inexistente
El sistema SHALL mostrar una representacion diferente para un tablero existente sin columnas y para un `boardId` que no existe, manteniendo jerarquia y siguientes pasos claros en ambos casos.

#### Scenario: Tablero existente sin columnas
- **WHEN** la API devuelve un tablero valido sin columnas
- **THEN** la interfaz muestra un estado vacio del tablero con una invitacion visible a crear la primera columna

#### Scenario: Tablero no encontrado
- **WHEN** la API responde que el `boardId` no existe
- **THEN** la interfaz muestra un estado especifico de not found con una salida clara hacia una vista valida

### Requirement: Mostrar acciones de gestion sobre tarjetas visibles
El sistema SHALL exponer acciones para editar y eliminar cada tarjeta visible mediante controles contextuales y accesibles que reduzcan el ruido visual sin ocultar funcionalidades disponibles.

#### Scenario: Acciones disponibles en una tarjeta renderizada
- **WHEN** la vista muestra una tarjeta existente dentro de una columna
- **THEN** la interfaz presenta controles identificables para editarla o eliminarla a traves de patrones visibles en foco, touch o menu contextual

### Requirement: Confirmar y comunicar errores en operaciones sobre tarjetas
El sistema SHALL solicitar confirmacion explicita antes de eliminar una tarjeta y mostrar errores comprensibles mediante patrones propios de la interfaz en lugar de dialogos nativos del navegador.

#### Scenario: Confirmacion previa a eliminacion
- **WHEN** la persona usuaria inicia la accion de eliminar una tarjeta
- **THEN** la interfaz solicita una confirmacion explicita con un patron accesible y coherente con el resto de la app antes de ejecutar la eliminacion

#### Scenario: Fallo al editar o eliminar una tarjeta
- **WHEN** una solicitud de edicion o eliminacion falla en la API
- **THEN** la interfaz informa el error, mantiene un estado coherente del tablero y deja claro que accion puede intentarse de nuevo

## ADDED Requirements

### Requirement: Adaptar el workspace del tablero a pantallas pequenas
El sistema SHALL adaptar la vista del tablero a pantallas pequenas con una jerarquia, densidad y navegacion que sigan siendo utilizables cuando existan multiples columnas y tarjetas.

#### Scenario: Board con multiples columnas en movil
- **WHEN** la persona usuaria abre un tablero con varias columnas desde una pantalla pequena
- **THEN** la interfaz mantiene accesibles el titulo de la columna activa, sus tarjetas y las acciones esenciales sin obligar a interactuar con controles demasiado pequenos o superpuestos

### Requirement: Manejar contenido largo dentro del tablero
El sistema SHALL manejar titulos, descripciones y nombres largos en columnas y tarjetas sin romper el layout ni ocultar el estado principal del board.

#### Scenario: Tarjeta con contenido extenso
- **WHEN** una tarjeta visible contiene un titulo o descripcion mas largo que el promedio
- **THEN** la interfaz mantiene legibilidad, evita overflow roto y conserva disponibles las acciones asociadas
