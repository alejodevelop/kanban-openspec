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

### Requirement: Mostrar acciones de gestion sobre tarjetas visibles
El sistema SHALL exponer acciones para editar y eliminar cada tarjeta visible desde la interfaz del tablero.

#### Scenario: Acciones disponibles en una tarjeta renderizada
- **WHEN** la vista muestra una tarjeta existente dentro de una columna
- **THEN** la interfaz presenta controles identificables para editarla o eliminarla

### Requirement: Reflejar cambios de edicion y eliminacion en la vista del tablero
El sistema SHALL actualizar la vista del tablero despues de una edicion o eliminacion confirmada de tarjeta.

#### Scenario: Tarjeta editada en la interfaz
- **WHEN** el usuario confirma una edicion valida de una tarjeta y la API responde exitosamente
- **THEN** la interfaz muestra el contenido actualizado sin recargar toda la pagina

#### Scenario: Tarjeta eliminada en la interfaz
- **WHEN** el usuario confirma la eliminacion de una tarjeta y la API responde exitosamente
- **THEN** la interfaz retira la tarjeta de su columna visible

### Requirement: Confirmar y comunicar errores en operaciones sobre tarjetas
El sistema SHALL solicitar confirmacion antes de eliminar una tarjeta y mostrar errores comprensibles cuando una mutacion falle.

#### Scenario: Confirmacion previa a eliminacion
- **WHEN** el usuario inicia la accion de eliminar una tarjeta
- **THEN** la interfaz solicita una confirmacion explicita antes de ejecutar la eliminacion

#### Scenario: Fallo al editar o eliminar una tarjeta
- **WHEN** una solicitud de edicion o eliminacion falla en la API
- **THEN** la interfaz informa el error y mantiene un estado coherente del tablero
