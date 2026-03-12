## Purpose

Definir la base operativa del frontend en `packages/web`, incluyendo arranque con React/Vite, configuracion compartida de consumo de API y una shell navegable minima para que los siguientes changes puedan construir vistas funcionales sobre un navegador ya preparado.

## Requirements

### Requirement: Iniciar la aplicacion web del proyecto
El sistema SHALL proveer una aplicacion frontend arrancable en `packages/web` usando React y un flujo de desarrollo local compatible con el monorepo.

#### Scenario: Arranque del frontend
- **WHEN** el desarrollador ejecuta el script de desarrollo del frontend
- **THEN** la aplicacion web arranca desde `packages/web` y muestra su shell base

### Requirement: Centralizar la configuracion de consumo de API
El sistema SHALL definir una configuracion unica para la URL base del backend y un cliente HTTP reutilizable para las features del frontend.

#### Scenario: Consumo preparado para futuras features
- **WHEN** una feature del frontend necesita llamar a la API
- **THEN** puede reutilizar un cliente centralizado sin duplicar configuracion de URL y manejo basico de errores

### Requirement: Proveer una shell navegable para nuevas features
El sistema SHALL incluir una shell de aplicacion coherente para dashboard y tablero, con landmarks semanticos, navegacion clara, foco visible y distribucion responsive que priorice el contenido operativo por encima de elementos decorativos no esenciales.

#### Scenario: Entrada al dashboard
- **WHEN** la persona usuaria abre la aplicacion en la ruta `/`
- **THEN** la interfaz muestra una shell enfocada en la gestion de boards con encabezado principal, contenido central y accion primaria claramente identificable

#### Scenario: Entrada al workspace de un board
- **WHEN** la persona usuaria navega a `/boards/:boardId`
- **THEN** la interfaz presenta una shell orientada al tablero con navegacion de retorno al dashboard y sin reutilizar chrome promocional que reste espacio o jerarquia al workspace

### Requirement: Definir una base compartida de interfaz web
El sistema SHALL usar una base compartida de interfaz para tipografia, espaciado, color, superficies, formularios, dialogs, feedback y estados de foco, de modo que dashboard y board view se perciban como un mismo producto.

#### Scenario: Consistencia entre vistas principales
- **WHEN** la persona usuaria navega entre el dashboard y la vista de un board
- **THEN** ambas pantallas mantienen patrones coherentes de espaciado, tipografia, componentes de accion y mensajes de estado

### Requirement: Cumplir lineamientos base de accesibilidad y motion
El sistema SHALL aplicar lineamientos base de accesibilidad y motion alineados con `web-design-guidelines`, incluyendo foco visible, semantica HTML, soporte de teclado y touch, manejo de contenido largo y variantes reducidas para `prefers-reduced-motion`.

#### Scenario: Navegacion accesible en la app
- **WHEN** la persona usuaria navega solo con teclado o tecnologia asistiva
- **THEN** puede identificar foco, landmarks, acciones principales y feedback sin depender de interacciones exclusivamente visuales o de hover

#### Scenario: Preferencia de movimiento reducido
- **WHEN** el entorno del usuario indica `prefers-reduced-motion`
- **THEN** la interfaz reduce o elimina animaciones no esenciales sin perder claridad de estado
