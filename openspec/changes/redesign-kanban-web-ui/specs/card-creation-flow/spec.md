## MODIFIED Requirements

### Requirement: Crear tarjetas dentro de una columna desde la interfaz
El sistema SHALL permitir que la persona usuaria cree una tarjeta asociada a una columna visible del tablero mediante una accion contextual que expanda el flujo de creacion solo cuando haga falta, manteniendo el workspace legible.

#### Scenario: Apertura contextual del flujo de creacion
- **WHEN** la persona usuaria activa la accion para agregar una tarjeta en una columna visible
- **THEN** la interfaz revela un flujo de creacion en contexto sin mantener formularios de alta expandidos de forma permanente en todas las columnas

#### Scenario: Creacion exitosa de tarjeta
- **WHEN** la persona usuaria envia una nueva tarjeta sobre una columna valida con los datos requeridos
- **THEN** el sistema persiste la tarjeta en esa columna y la interfaz puede mostrarla en el tablero con feedback coherente del resultado

## ADDED Requirements

### Requirement: Mantener la creacion de tarjetas usable en pantallas pequenas
El sistema SHALL ofrecer un flujo de creacion de tarjetas que siga siendo utilizable en mobile, con controles legibles, foco claro y espacio suficiente para completar el formulario.

#### Scenario: Crear tarjeta desde movil
- **WHEN** la persona usuaria crea una tarjeta desde una pantalla pequena
- **THEN** la interfaz mantiene visibles el contexto de la columna, los campos necesarios y las acciones de confirmar o cancelar sin superposiciones rotas ni controles diminutos
