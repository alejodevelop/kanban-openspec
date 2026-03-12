## Purpose

Definir la API para editar y eliminar tarjetas existentes, reutilizando las reglas de validacion del dominio y devolviendo respuestas claras para clientes del tablero.

## Requirements

### Requirement: Actualizar datos editables de una tarjeta
El sistema SHALL permitir actualizar el `title` y la `description` de una tarjeta existente mediante la API.

#### Scenario: Edicion exitosa de tarjeta
- **WHEN** el cliente envia una solicitud valida para actualizar una tarjeta existente con un `title` valido y una `description` opcional
- **THEN** el sistema persiste los nuevos valores y responde con la representacion actualizada de la tarjeta

#### Scenario: Titulo invalido al editar
- **WHEN** el cliente intenta actualizar una tarjeta existente con un `title` ausente o invalido
- **THEN** el sistema rechaza la solicitud y no modifica la tarjeta persistida

### Requirement: Eliminar una tarjeta existente
El sistema SHALL permitir eliminar una tarjeta existente mediante la API.

#### Scenario: Eliminacion exitosa de tarjeta
- **WHEN** el cliente solicita eliminar una tarjeta existente
- **THEN** el sistema elimina la tarjeta persistida y confirma la operacion sin devolverla en lecturas posteriores

#### Scenario: Tarjeta inexistente al eliminar
- **WHEN** el cliente solicita eliminar una tarjeta que no existe
- **THEN** el sistema responde con un error identificable y no altera otras tarjetas
