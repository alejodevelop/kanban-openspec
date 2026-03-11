## Purpose

Definir el flujo end-to-end para crear tarjetas desde la interfaz del tablero, persistirlas en PostgreSQL y mantener el orden inicial bajo control del backend.

## Requirements

### Requirement: Crear tarjetas dentro de una columna desde la interfaz
El sistema SHALL permitir que el usuario cree una tarjeta asociada a una columna visible del tablero desde el frontend.

#### Scenario: Creacion exitosa de tarjeta
- **WHEN** el usuario envia una nueva tarjeta sobre una columna valida con los datos requeridos
- **THEN** el sistema persiste la tarjeta en esa columna y la interfaz puede mostrarla en el tablero

### Requirement: Validar datos minimos de la tarjeta
El sistema SHALL requerir un titulo valido para crear una tarjeta y aceptar `description` como dato opcional.

#### Scenario: Titulo ausente o invalido
- **WHEN** el usuario intenta crear una tarjeta sin un titulo valido
- **THEN** el sistema rechaza la solicitud y comunica el error sin persistir la tarjeta

#### Scenario: Descripcion omitida
- **WHEN** el usuario crea una tarjeta con titulo valido y sin descripcion
- **THEN** el sistema persiste la tarjeta correctamente con `description` nula

### Requirement: Asignar la posicion inicial de nuevas tarjetas
El sistema SHALL ubicar cada nueva tarjeta al final del orden actual de su columna sin requerir una `position` enviada por el cliente.

#### Scenario: Insercion al final de la columna
- **WHEN** el usuario crea una tarjeta en una columna con tarjetas existentes
- **THEN** la nueva tarjeta recibe una `position` mayor que la ultima tarjeta actual de esa columna
