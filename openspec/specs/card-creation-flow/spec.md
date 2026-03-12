## Purpose

Definir el flujo end-to-end para crear tarjetas desde la interfaz del tablero, persistirlas en PostgreSQL y mantener el orden inicial bajo control del backend.

## Requirements

### Requirement: Crear tarjetas dentro de una columna desde la interfaz
El sistema SHALL permitir que la persona usuaria cree una tarjeta asociada a una columna visible del tablero mediante una accion contextual que expanda el flujo de creacion solo cuando haga falta, manteniendo el workspace legible.

#### Scenario: Apertura contextual del flujo de creacion
- **WHEN** la persona usuaria activa la accion para agregar una tarjeta en una columna visible
- **THEN** la interfaz revela un flujo de creacion en contexto sin mantener formularios de alta expandidos de forma permanente en todas las columnas

#### Scenario: Creacion exitosa de tarjeta
- **WHEN** la persona usuaria envia una nueva tarjeta sobre una columna valida con los datos requeridos
- **THEN** el sistema persiste la tarjeta en esa columna y la interfaz puede mostrarla en el tablero con feedback coherente del resultado

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

### Requirement: Gestionar una tarjeta despues de su creacion
El sistema SHALL permitir corregir o eliminar una tarjeta existente despues de haber sido creada dentro del flujo del tablero.

#### Scenario: Correccion posterior a la creacion
- **WHEN** el usuario detecta que una tarjeta recien creada tiene datos incorrectos
- **THEN** el sistema permite editar sus campos permitidos sin crear una nueva tarjeta

#### Scenario: Eliminacion de tarjeta creada por error
- **WHEN** el usuario decide quitar una tarjeta creada por error
- **THEN** el sistema permite eliminarla del tablero y de la persistencia asociada

### Requirement: Mantener la creacion de tarjetas usable en pantallas pequenas
El sistema SHALL ofrecer un flujo de creacion de tarjetas que siga siendo utilizable en mobile, con controles legibles, foco claro y espacio suficiente para completar el formulario.

#### Scenario: Crear tarjeta desde movil
- **WHEN** la persona usuaria crea una tarjeta desde una pantalla pequena
- **THEN** la interfaz mantiene visibles el contexto de la columna, los campos necesarios y las acciones de confirmar o cancelar sin superposiciones rotas ni controles diminutos
