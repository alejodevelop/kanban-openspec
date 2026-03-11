## Why

El proyecto necesita una base de datos inicial para persistir la estructura central de Kanban antes de implementar APIs y UI reales. Hacerlo ahora reduce ambiguedad en el dominio, permite definir contratos claros y evita que backend y frontend diverjan sobre la forma de los datos.

## What Changes

- Crear un modelo de datos relacional para tableros Kanban con `boards`, `columns` y `cards`.
- Definir claves primarias, claves foraneas, reglas de borrado y restricciones de integridad para la jerarquia tablero -> columna -> tarjeta.
- Incluir campos de orden y metadatos basicos (`createdAt`, `updatedAt`) para soportar renderizacion y reordenamiento futuro.
- Preparar migraciones y tipos de Drizzle ORM para que la aplicacion Express y React consuman el mismo contrato de datos.
- Excluir autenticacion, comentarios, adjuntos y automatizaciones; esos cambios quedaran para iteraciones posteriores.

## Capabilities

### New Capabilities
- `kanban-data-model`: Modelo persistente para tableros, columnas y tarjetas, incluyendo relaciones, restricciones y campos operativos minimos.

### Modified Capabilities
- Ninguna.

## Impact

- Base de datos PostgreSQL y migraciones iniciales de Drizzle.
- Nuevos archivos de esquema y configuracion tipada para el dominio Kanban.
- Futuras APIs de Express y vistas de React dependeran de estos nombres de tabla, relaciones y reglas de integridad.
