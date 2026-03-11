## ADDED Requirements

### Requirement: Reordenar columnas dentro de un tablero
El sistema SHALL permitir reordenar las columnas de un tablero y persistir el nuevo orden usando `position`.

#### Scenario: Reorder exitoso de columnas
- **WHEN** el usuario mueve una columna a otra posicion dentro del mismo tablero
- **THEN** el sistema actualiza las posiciones de las columnas afectadas y conserva ese orden al volver a consultar el tablero

### Requirement: Reordenar tarjetas dentro y entre columnas
El sistema SHALL permitir mover tarjetas dentro de su columna actual o hacia otra columna del mismo tablero manteniendo un orden persistente.

#### Scenario: Reorder dentro de una misma columna
- **WHEN** el usuario cambia la posicion de una tarjeta dentro de su columna actual
- **THEN** el sistema reescribe las posiciones de esa columna y conserva el nuevo orden

#### Scenario: Movimiento de tarjeta a otra columna
- **WHEN** el usuario mueve una tarjeta a una columna distinta del mismo tablero
- **THEN** el sistema actualiza `column_id`, recalcula las posiciones afectadas y conserva el nuevo estado al recargar

### Requirement: Rechazar operaciones de reorder invalidas
El sistema SHALL validar que los elementos enviados en una operacion de reorder pertenecen al scope afectado y rechazar payloads inconsistentes.

#### Scenario: Payload inconsistente
- **WHEN** el cliente envia un reorder con ids faltantes, repetidos o ajenos al tablero objetivo
- **THEN** el sistema rechaza la operacion y no persiste un orden parcial o corrupto
