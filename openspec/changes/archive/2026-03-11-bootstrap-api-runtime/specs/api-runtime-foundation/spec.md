## ADDED Requirements

### Requirement: Iniciar el runtime HTTP del backend
El sistema SHALL arrancar una aplicacion HTTP en `packages/api` usando configuracion centralizada de entorno y un puerto configurable.

#### Scenario: Arranque correcto del servicio
- **WHEN** el proceso del backend inicia con la configuracion minima requerida
- **THEN** la aplicacion crea la instancia HTTP y queda lista para recibir solicitudes

### Requirement: Compartir acceso tipado a PostgreSQL
El sistema SHALL crear un cliente reutilizable de Drizzle enlazado al schema Kanban existente y configurado mediante `DATABASE_URL`.

#### Scenario: Inicializacion del acceso a datos
- **WHEN** un modulo del backend necesita operar sobre tableros, columnas o tarjetas
- **THEN** puede importar un cliente compartido ya conectado al schema tipado del proyecto

### Requirement: Exponer verificacion operativa del servicio
El sistema SHALL exponer un endpoint de salud que reporte el estado del proceso y el resultado de una verificacion basica de conectividad a PostgreSQL.

#### Scenario: Dependencias disponibles
- **WHEN** se consulta el endpoint de salud y la base de datos esta disponible
- **THEN** la respuesta indica que el backend esta operativo y que la conexion a PostgreSQL puede verificarse

#### Scenario: Base de datos no disponible
- **WHEN** se consulta el endpoint de salud y PostgreSQL no puede alcanzarse
- **THEN** la respuesta indica fallo operativo de la dependencia y no reporta un estado saludable completo
