## ADDED Requirements

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
