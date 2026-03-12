## Purpose

Definir las operaciones HTTP para crear, editar y eliminar boards y columnas, de modo que el backend soporte la gestion estructural del dominio Kanban con validaciones y efectos consistentes sobre la jerarquia relacionada.

## Requirements

### Requirement: Crear boards desde la API
El sistema SHALL exponer una operacion HTTP para crear un board con un titulo valido y devolver el recurso creado listo para aparecer en el dashboard.

#### Scenario: Creacion exitosa de board
- **WHEN** el cliente envia una solicitud de creacion con un titulo no vacio
- **THEN** la API responde `201` con el `id`, `title` y metadatos basicos del board creado

#### Scenario: Titulo invalido al crear board
- **WHEN** el cliente envia un titulo vacio o compuesto solo por espacios
- **THEN** la API responde `400` con un mensaje de validacion y no persiste el board

### Requirement: Editar titulo de boards desde la API
El sistema SHALL permitir actualizar el titulo de un board existente sin modificar su identidad ni su jerarquia asociada.

#### Scenario: Actualizacion exitosa del board
- **WHEN** el cliente envia un nuevo titulo valido para un `boardId` existente
- **THEN** la API responde `200` con el board actualizado y conserva sus columnas y tarjetas asociadas

#### Scenario: Board inexistente al editar
- **WHEN** el cliente intenta actualizar un `boardId` que no existe
- **THEN** la API responde `404` y no crea un board nuevo implicitamente

### Requirement: Eliminar boards desde la API
El sistema SHALL permitir eliminar un board existente y resolver explicitamente el borrado de sus columnas y tarjetas relacionadas.

#### Scenario: Eliminacion exitosa de board
- **WHEN** el cliente solicita eliminar un `boardId` persistido
- **THEN** la API responde con exito y el board deja de aparecer en lecturas posteriores

#### Scenario: Borrado de board con jerarquia asociada
- **WHEN** el cliente elimina un board que contiene columnas y tarjetas
- **THEN** la operacion elimina toda la jerarquia relacionada sin dejar referencias huerfanas

### Requirement: Crear columnas dentro de un board
El sistema SHALL exponer una operacion HTTP para crear una columna en un board existente, asignandole una posicion valida al final del orden actual.

#### Scenario: Creacion exitosa de columna
- **WHEN** el cliente envia un titulo valido para un `boardId` existente
- **THEN** la API responde `201` con la columna creada asociada a ese board y con `position` al final de la secuencia

#### Scenario: Board inexistente al crear columna
- **WHEN** el cliente intenta crear una columna sobre un `boardId` inexistente
- **THEN** la API responde `404` y no persiste la columna

### Requirement: Editar columnas desde la API
El sistema SHALL permitir actualizar el titulo de una columna existente sin alterar su `boardId` ni su `position`.

#### Scenario: Actualizacion exitosa de columna
- **WHEN** el cliente envia un nuevo titulo valido para una columna persistida
- **THEN** la API responde `200` con la columna actualizada y mantiene su orden previo

#### Scenario: Columna inexistente al editar
- **WHEN** el cliente intenta editar una columna que ya no existe
- **THEN** la API responde `404`

### Requirement: Eliminar columnas desde la API
El sistema SHALL permitir eliminar una columna existente y recompactar el orden restante dentro del mismo board.

#### Scenario: Eliminacion exitosa de columna
- **WHEN** el cliente elimina una columna persistida
- **THEN** la API responde con exito y la columna deja de aparecer en la lectura del board

#### Scenario: Reindexacion tras eliminar columna
- **WHEN** el cliente elimina una columna intermedia de un board con multiples columnas
- **THEN** las columnas restantes conservan un orden contiguo y deterministico sin huecos en `position`
