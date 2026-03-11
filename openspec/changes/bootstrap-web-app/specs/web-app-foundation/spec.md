## ADDED Requirements

### Requirement: Iniciar la aplicacion web del proyecto
El sistema SHALL proveer una aplicacion frontend arrancable en `packages/web` usando React y un flujo de desarrollo local compatible con el monorepo.

#### Scenario: Arranque del frontend
- **WHEN** el desarrollador ejecuta el script de desarrollo del frontend
- **THEN** la aplicacion web arranca desde `packages/web` y muestra su shell base

### Requirement: Centralizar la configuracion de consumo de API
El sistema SHALL definir una configuracion unica para la URL base del backend y un cliente HTTP reutilizable para las features del frontend.

#### Scenario: Consumo preparado para futuras features
- **WHEN** una feature del frontend necesita llamar a la API
- **THEN** puede reutilizar un cliente centralizado sin duplicar configuracion de URL y manejo basico de errores

### Requirement: Proveer una shell navegable para nuevas features
El sistema SHALL incluir una estructura inicial de app y routing que permita agregar pantallas sin rehacer el bootstrap del frontend.

#### Scenario: Entrada a la shell base
- **WHEN** el usuario abre la aplicacion web
- **THEN** la app carga una estructura base navegable lista para recibir futuras vistas funcionales
