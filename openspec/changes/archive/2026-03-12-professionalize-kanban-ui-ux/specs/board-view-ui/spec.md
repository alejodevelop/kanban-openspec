## MODIFIED Requirements

### Requirement: Visualizar un tablero desde la API
El sistema SHALL mostrar en el frontend un tablero con una barra superior de workspace que incluya breadcrumb hacia el dashboard, titulo del board, resumen operativo y acciones principales, junto con las columnas y tarjetas obtenidas desde el endpoint de lectura.

#### Scenario: Render exitoso del tablero
- **WHEN** la vista del tablero carga un `boardId` valido y la API responde correctamente
- **THEN** la interfaz muestra una barra superior de workspace y el rail de columnas del tablero con una jerarquia clara y profesional

### Requirement: Distinguir tablero vacio de tablero inexistente
El sistema SHALL mostrar una representacion diferente para un tablero existente sin columnas y para un `boardId` que no existe, integrando en el estado vacio una accion clara para crear la primera columna sin perder el contexto del workspace.

#### Scenario: Tablero existente sin columnas
- **WHEN** la API devuelve un tablero valido sin columnas
- **THEN** la interfaz muestra un estado vacio del tablero con una accion visible para crear la primera columna sin tratarlo como error

#### Scenario: Tablero no encontrado
- **WHEN** la API responde que el `boardId` no existe
- **THEN** la interfaz muestra un estado especifico de not found

## ADDED Requirements

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
