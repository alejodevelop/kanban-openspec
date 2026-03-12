## Purpose

Definir el dashboard inicial del frontend en `/` para listar los boards disponibles, comunicar sus estados principales y permitir entrar a cada tablero desde una vista resumida.

## Requirements

### Requirement: Mostrar dashboard inicial con boards disponibles
El sistema SHALL usar la ruta inicial del frontend para mostrar un dashboard con el listado de boards obtenido desde la API.

#### Scenario: Dashboard con boards
- **WHEN** la ruta `/` carga y la API devuelve boards disponibles
- **THEN** la interfaz muestra una tarjeta o fila por cada board con su titulo y resumen

### Requirement: Comunicar estados de carga, error y vacio
El sistema SHALL representar de forma explicita los estados principales del dashboard mientras consulta el listado de boards.

#### Scenario: Carga en progreso
- **WHEN** la ruta `/` inicia la consulta del listado y la respuesta aun no llega
- **THEN** la interfaz muestra un estado de carga identificable

#### Scenario: Error al consultar el listado
- **WHEN** la consulta del dashboard falla por red o servidor
- **THEN** la interfaz muestra un mensaje de error comprensible para la persona usuaria

#### Scenario: Sin boards disponibles
- **WHEN** la API responde una lista vacia
- **THEN** la interfaz muestra un estado vacio especifico y no una pantalla en blanco

### Requirement: Permitir entrar a un board desde el dashboard
El sistema SHALL ofrecer una navegacion directa desde cada board listado hacia su vista detallada existente.

#### Scenario: Navegacion a board individual
- **WHEN** la persona usuaria activa el enlace o CTA de un board listado
- **THEN** el frontend navega hacia `/boards/:boardId` usando el identificador correspondiente

### Requirement: Mostrar el resumen principal de cada board
El sistema SHALL presentar para cada board listado los metadatos de resumen entregados por la API para ayudar a elegir a cual entrar.

#### Scenario: Resumen visible por board
- **WHEN** el dashboard renderiza un board listado
- **THEN** la interfaz muestra al menos el total de columnas y el total de tarjetas asociado a ese board
