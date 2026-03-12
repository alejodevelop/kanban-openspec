## MODIFIED Requirements

### Requirement: Mantener orden estable de columnas y tarjetas
El sistema SHALL almacenar un campo de orden numerico para columnas dentro de un tablero y para tarjetas dentro de una columna, manteniendo secuencias contiguas y deterministicas cuando se crean, reordenan o eliminan columnas.

#### Scenario: Lectura en orden de presentacion
- **WHEN** la aplicacion consulta las columnas de un tablero o las tarjetas de una columna
- **THEN** los registros pueden ordenarse de forma deterministica usando los campos de orden persistidos

#### Scenario: Nueva columna al final del tablero
- **WHEN** la aplicacion crea una nueva columna dentro de un tablero existente
- **THEN** la columna recibe la siguiente `position` disponible al final de la secuencia actual del tablero

#### Scenario: Eliminacion de columna con reindexacion
- **WHEN** la aplicacion elimina una columna intermedia de un tablero
- **THEN** las columnas restantes actualizan su `position` para conservar una secuencia contigua sin huecos
