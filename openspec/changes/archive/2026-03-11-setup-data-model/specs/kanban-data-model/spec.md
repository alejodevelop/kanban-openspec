## ADDED Requirements

### Requirement: Persistir jerarquia Kanban
El sistema SHALL persistir tableros, columnas y tarjetas en PostgreSQL con relaciones explicitas que mantengan la jerarquia tablero -> columna -> tarjeta.

#### Scenario: Creacion de una estructura valida
- **WHEN** la aplicacion guarda un tablero con columnas y tarjetas asociadas
- **THEN** la base de datos conserva las relaciones entre cada entidad mediante claves foraneas validas

#### Scenario: Derivacion de tablero desde una tarjeta
- **WHEN** la aplicacion necesita identificar el tablero de una tarjeta
- **THEN** el tablero se obtiene a traves de `cards.column_id -> columns.board_id` sin requerir un `board_id` redundante en `cards`

### Requirement: Mantener orden estable de columnas y tarjetas
El sistema SHALL almacenar un campo de orden numerico para columnas dentro de un tablero y para tarjetas dentro de una columna.

#### Scenario: Lectura en orden de presentacion
- **WHEN** la aplicacion consulta las columnas de un tablero o las tarjetas de una columna
- **THEN** los registros pueden ordenarse de forma deterministica usando los campos de orden persistidos

### Requirement: Registrar metadatos operativos basicos
El sistema SHALL almacenar identificadores unicos, marcas de tiempo de creacion y actualizacion, y titulo obligatorio para cada entidad principal del dominio Kanban.

#### Scenario: Insercion de entidades del dominio
- **WHEN** se crea un tablero, una columna o una tarjeta
- **THEN** cada registro queda con un identificador unico, un titulo valido y timestamps disponibles para auditoria basica

#### Scenario: Tarjeta con descripcion opcional
- **WHEN** se crea una tarjeta con titulo valido pero sin descripcion
- **THEN** la tarjeta se persiste correctamente con `description` nula y mantiene los metadatos obligatorios

### Requirement: Proteger integridad referencial
El sistema SHALL impedir referencias huerfanas entre tableros, columnas y tarjetas y definir un comportamiento explicito de borrado para entidades relacionadas.

#### Scenario: Eliminacion de una entidad padre
- **WHEN** se elimina un tablero o una columna
- **THEN** la base de datos aplica la regla de borrado configurada sin dejar columnas o tarjetas apuntando a registros inexistentes

### Requirement: Mantener nomenclatura tecnica en ingles
El sistema SHALL definir nombres de tablas y columnas del modelo tecnico en ingles y usar espanol solo en la documentacion funcional.

#### Scenario: Revision de archivos de schema y migracion
- **WHEN** se revisan los identificadores de tablas y columnas del schema inicial
- **THEN** se mantienen nombres en ingles consistentes como `boards`, `columns`, `cards`, `created_at` y `updated_at`
