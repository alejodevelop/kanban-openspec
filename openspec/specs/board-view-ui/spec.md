## Purpose

Definir la experiencia de visualizacion del tablero Kanban en el frontend consumiendo el endpoint de lectura para mostrar columnas, tarjetas y estados principales de la vista.

## Requirements

### Requirement: Visualizar un tablero desde la API
El sistema SHALL mostrar en el frontend un tablero con sus columnas y tarjetas usando datos obtenidos del endpoint de lectura del backend.

#### Scenario: Render exitoso del tablero
- **WHEN** la vista del tablero carga un `boardId` valido y la API responde correctamente
- **THEN** la interfaz muestra el titulo del tablero, sus columnas y las tarjetas de cada columna

### Requirement: Representar estados de carga y fallo de lectura
El sistema SHALL mostrar estados explicitos mientras la vista espera respuesta del backend o cuando la consulta falla.

#### Scenario: Carga en progreso
- **WHEN** la vista solicita el tablero y la respuesta aun no ha llegado
- **THEN** la interfaz muestra un estado de carga identificable

#### Scenario: Error al consultar la API
- **WHEN** la vista solicita el tablero y ocurre un fallo de red o de servidor
- **THEN** la interfaz muestra un estado de error comprensible para el usuario

### Requirement: Distinguir tablero vacio de tablero inexistente
El sistema SHALL mostrar una representacion diferente para un tablero existente sin columnas y para un `boardId` que no existe.

#### Scenario: Tablero existente sin columnas
- **WHEN** la API devuelve un tablero valido sin columnas
- **THEN** la interfaz muestra un estado vacio del tablero sin tratarlo como error

#### Scenario: Tablero no encontrado
- **WHEN** la API responde que el `boardId` no existe
- **THEN** la interfaz muestra un estado especifico de not found
