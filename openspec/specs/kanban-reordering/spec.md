## Purpose

Definir el comportamiento de reordenamiento persistente del tablero Kanban para columnas y tarjetas, incluyendo movimientos dentro de una columna, entre columnas y la validacion de payloads inconsistentes.

## Requirements

### Requirement: Reordenar columnas dentro de un tablero
El sistema SHALL permitir reordenar las columnas de un tablero mediante drag and drop y persistir el nuevo orden usando `position`.

#### Scenario: Reorder exitoso de columnas por drag and drop
- **WHEN** el usuario arrastra una columna y la suelta en otra posicion dentro del mismo tablero
- **THEN** el sistema actualiza las posiciones de las columnas afectadas y conserva ese orden al volver a consultar el tablero

### Requirement: Reordenar tarjetas dentro y entre columnas
El sistema SHALL permitir mover tarjetas mediante drag and drop dentro de su columna actual o hacia otra columna del mismo tablero manteniendo un orden persistente.

#### Scenario: Reorder dentro de una misma columna por drag and drop
- **WHEN** el usuario arrastra una tarjeta y la suelta en otra posicion dentro de su columna actual
- **THEN** el sistema reescribe las posiciones de esa columna y conserva el nuevo orden

#### Scenario: Movimiento de tarjeta a otra columna por drag and drop
- **WHEN** el usuario arrastra una tarjeta y la suelta en una columna distinta del mismo tablero
- **THEN** el sistema actualiza `column_id`, recalcula las posiciones afectadas y conserva el nuevo estado al recargar

### Requirement: Rechazar operaciones de reorder invalidas
El sistema SHALL validar que los elementos enviados en una operacion de reorder pertenecen al scope afectado y rechazar payloads inconsistentes.

#### Scenario: Payload inconsistente
- **WHEN** el cliente envia un reorder con ids faltantes, repetidos o ajenos al tablero objetivo
- **THEN** el sistema rechaza la operacion y no persiste un orden parcial o corrupto

### Requirement: Ofrecer una alternativa accesible al drag and drop
El sistema SHALL ofrecer una via accesible para ejecutar reorder de columnas y tarjetas cuando la interaccion de drag and drop no pueda utilizarse.

#### Scenario: Reorder sin gesto de arrastre
- **WHEN** el usuario navega con teclado o una tecnologia asistiva que no ejecuta drag and drop
- **THEN** la interfaz sigue permitiendo reordenar columnas y tarjetas y persiste el mismo resultado que el flujo principal
