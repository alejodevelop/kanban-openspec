## ADDED Requirements

### Requirement: Gestionar una tarjeta despues de su creacion
El sistema SHALL permitir corregir o eliminar una tarjeta existente despues de haber sido creada dentro del flujo del tablero.

#### Scenario: Correccion posterior a la creacion
- **WHEN** el usuario detecta que una tarjeta recien creada tiene datos incorrectos
- **THEN** el sistema permite editar sus campos permitidos sin crear una nueva tarjeta

#### Scenario: Eliminacion de tarjeta creada por error
- **WHEN** el usuario decide quitar una tarjeta creada por error
- **THEN** el sistema permite eliminarla del tablero y de la persistencia asociada
