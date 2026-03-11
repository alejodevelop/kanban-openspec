## Purpose

Definir el contrato de lectura de un tablero Kanban completo desde la API HTTP para que el frontend pueda cargar columnas y tarjetas desde un agregado estable.

## Requirements

### Requirement: Obtener un tablero Kanban por identificador
El sistema SHALL exponer una operacion HTTP que permita recuperar un tablero por `boardId` junto con su titulo, sus columnas y las tarjetas de cada columna.

#### Scenario: Lectura exitosa del tablero
- **WHEN** el cliente solicita un `boardId` existente
- **THEN** la API responde con el tablero y su jerarquia completa `board -> columns -> cards`

### Requirement: Mantener el orden de presentacion en la respuesta
El sistema SHALL devolver columnas y tarjetas ordenadas de forma deterministica segun sus campos `position`.

#### Scenario: Columnas y tarjetas ordenadas
- **WHEN** el cliente consulta un tablero con multiples columnas y tarjetas
- **THEN** la respuesta mantiene el orden visible definido en la base de datos para cada nivel

### Requirement: Distinguir tablero inexistente
El sistema SHALL responder explicitamente cuando el `boardId` solicitado no corresponda a un tablero persistido.

#### Scenario: Tablero no encontrado
- **WHEN** el cliente solicita un `boardId` inexistente
- **THEN** la API responde con un resultado de not found y no devuelve un tablero vacio
