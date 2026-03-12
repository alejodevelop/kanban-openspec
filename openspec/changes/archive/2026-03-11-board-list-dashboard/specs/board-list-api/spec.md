## ADDED Requirements

### Requirement: Listar boards disponibles para navegacion
El sistema SHALL exponer una operacion HTTP que permita obtener el catalogo de boards disponibles para el frontend en una sola respuesta.

#### Scenario: Lectura exitosa del listado
- **WHEN** el cliente solicita la coleccion de boards
- **THEN** la API responde con una lista de boards que incluye al menos `id` y `title` para cada item

### Requirement: Incluir metadatos de resumen por board
El sistema SHALL devolver por cada board del listado los contadores agregados necesarios para una tarjeta de dashboard sin requerir leer cada board completo por separado.

#### Scenario: Board con columnas y tarjetas
- **WHEN** el cliente consulta el listado y existe un board con contenido
- **THEN** la respuesta incluye para ese board un `columnCount` y un `cardCount` consistentes con los datos persistidos

#### Scenario: Board vacio
- **WHEN** el cliente consulta el listado y existe un board sin columnas ni tarjetas
- **THEN** la respuesta incluye ese board con `columnCount` igual a `0` y `cardCount` igual a `0`

### Requirement: Mantener orden deterministico del listado
El sistema SHALL devolver los boards en un orden estable para que el dashboard no cambie arbitrariamente entre consultas equivalentes.

#### Scenario: Multiples boards persistidos
- **WHEN** el cliente consulta el listado de boards mas de una vez sin cambios en la coleccion
- **THEN** la API responde los items en el mismo orden definido por `title` con desempate estable por `id`

### Requirement: Distinguir coleccion vacia de error
El sistema SHALL responder exitosamente con una coleccion vacia cuando no existan boards persistidos.

#### Scenario: Sin boards cargados
- **WHEN** el cliente consulta el listado y no existe ningun board en la base
- **THEN** la API responde `200` con una lista vacia en lugar de un error
