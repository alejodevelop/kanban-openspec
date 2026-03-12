## Purpose

Definir la experiencia de visualizacion del tablero Kanban en el frontend consumiendo el endpoint de lectura para mostrar columnas, tarjetas y estados principales de la vista.

## Requirements

### Requirement: Visualizar un tablero desde la API
El sistema SHALL mostrar en el frontend un tablero con una barra superior de workspace que incluya breadcrumb hacia el dashboard, titulo del board, resumen operativo y acciones principales, junto con las columnas y tarjetas obtenidas desde el endpoint de lectura.

#### Scenario: Render exitoso del tablero
- **WHEN** la vista del tablero carga un `boardId` valido y la API responde correctamente
- **THEN** la interfaz muestra una barra superior de workspace y el rail de columnas del tablero con una jerarquia clara y profesional

### Requirement: Representar estados de carga y fallo de lectura
El sistema SHALL mostrar estados explicitos mientras la vista espera respuesta del backend o cuando la consulta falla, con copy comprensible y una presentacion coherente con el resto del workspace.

#### Scenario: Carga en progreso
- **WHEN** la vista solicita el tablero y la respuesta aun no ha llegado
- **THEN** la interfaz muestra un estado de carga identificable que preserva la estructura general de la pantalla

#### Scenario: Error al consultar la API
- **WHEN** la vista solicita el tablero y ocurre un fallo de red o de servidor
- **THEN** la interfaz muestra un estado de error comprensible para la persona usuaria y una via visible para reintentar o volver

### Requirement: Distinguir tablero vacio de tablero inexistente
El sistema SHALL mostrar una representacion diferente para un tablero existente sin columnas y para un `boardId` que no existe, integrando en el estado vacio una accion clara para crear la primera columna sin perder el contexto del workspace.

#### Scenario: Tablero existente sin columnas
- **WHEN** la API devuelve un tablero valido sin columnas
- **THEN** la interfaz muestra un estado vacio del tablero con una accion visible para crear la primera columna sin tratarlo como error

#### Scenario: Tablero no encontrado
- **WHEN** la API responde que el `boardId` no existe
- **THEN** la interfaz muestra un estado especifico de not found

### Requirement: Integrar la creacion de columnas al flujo principal del tablero
El sistema SHALL ofrecer la accion de crear columna como parte natural del workspace, ya sea desde la barra superior, como ultima tile del rail horizontal o ambas, sin depender de un bloque aislado ajeno al flujo del tablero.

#### Scenario: Crear columna desde el workspace
- **WHEN** la persona usuaria necesita agregar una columna en `/boards/:boardId`
- **THEN** encuentra una accion de creacion integrada al toolbar del board o al final del rail horizontal

### Requirement: Hacer intencional el rail horizontal de columnas
El sistema SHALL presentar las columnas dentro de un rail horizontal claramente perteneciente al workspace, comodo de recorrer en desktop y mobile y coherente con el sistema visual del producto.

#### Scenario: Rail escaneable del tablero
- **WHEN** la persona usuaria revisa columnas y tarjetas del board
- **THEN** percibe un contenedor horizontal con espaciado, superficies y comportamiento de scroll que favorecen lectura y manipulacion

### Requirement: Reducir el ruido visual de controles redundantes de movimiento
El sistema SHALL preservar drag and drop y un fallback accesible para mover columnas y tarjetas, pero presentando los controles alternativos con una jerarquia visual secundaria.

#### Scenario: Reordenamiento con menor ruido visual
- **WHEN** la vista del tablero muestra columnas y tarjetas reordenables
- **THEN** la interfaz mantiene drag and drop y un fallback accesible sin saturar permanentemente cada item con controles dominantes

### Requirement: Tratar metadatos tecnicos como informacion secundaria en el workspace
El sistema SHALL evitar que el `boardId` sea el dato principal del encabezado del board, reservandolo para metadata secundaria o utilidades discretas.

#### Scenario: Encabezado orientado al trabajo
- **WHEN** la persona usuaria entra a un board
- **THEN** el titulo del board, su contexto y sus acciones principales aparecen antes que cualquier identificador tecnico visible

### Requirement: Mostrar acciones de gestion sobre tarjetas visibles
El sistema SHALL exponer acciones para editar y eliminar cada tarjeta visible mediante controles contextuales y accesibles que reduzcan el ruido visual sin ocultar funcionalidades disponibles.

#### Scenario: Acciones disponibles en una tarjeta renderizada
- **WHEN** la vista muestra una tarjeta existente dentro de una columna
- **THEN** la interfaz presenta controles identificables para editarla o eliminarla a traves de patrones visibles en foco, touch o menu contextual

### Requirement: Reflejar cambios de edicion y eliminacion en la vista del tablero
El sistema SHALL actualizar la vista del tablero despues de una edicion o eliminacion confirmada de tarjeta.

#### Scenario: Tarjeta editada en la interfaz
- **WHEN** el usuario confirma una edicion valida de una tarjeta y la API responde exitosamente
- **THEN** la interfaz muestra el contenido actualizado sin recargar toda la pagina

#### Scenario: Tarjeta eliminada en la interfaz
- **WHEN** el usuario confirma la eliminacion de una tarjeta y la API responde exitosamente
- **THEN** la interfaz retira la tarjeta de su columna visible

### Requirement: Confirmar y comunicar errores en operaciones sobre tarjetas
El sistema SHALL solicitar confirmacion explicita antes de eliminar una tarjeta y mostrar errores comprensibles mediante patrones propios de la interfaz en lugar de dialogos nativos del navegador.

#### Scenario: Confirmacion previa a eliminacion
- **WHEN** la persona usuaria inicia la accion de eliminar una tarjeta
- **THEN** la interfaz solicita una confirmacion explicita con un patron accesible y coherente con el resto de la app antes de ejecutar la eliminacion

#### Scenario: Fallo al editar o eliminar una tarjeta
- **WHEN** una solicitud de edicion o eliminacion falla en la API
- **THEN** la interfaz informa el error, mantiene un estado coherente del tablero y deja claro que accion puede intentarse de nuevo

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
