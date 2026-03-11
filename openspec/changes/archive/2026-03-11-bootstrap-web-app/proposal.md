## Why

El proyecto declara una direccion hacia React, pero el repositorio todavia no tiene `packages/web` ni una aplicacion que pueda consumir la API. Sin esa base, no hay lugar donde validar la experiencia de usuario ni iterar sobre el contrato frontend-backend.

## What Changes

- Crear el package `packages/web` con React y Vite.
- Preparar scripts de workspace para desarrollar y validar la aplicacion web.
- Definir una shell inicial con routing y una configuracion clara del cliente HTTP.
- Centralizar la URL base de la API para consumo desde el navegador.
- Dejar fuera la renderizacion real del tablero y cualquier mutacion.

## Capabilities

### New Capabilities
- `web-app-foundation`: base operativa del frontend React para consumir la API del sistema.

### Modified Capabilities
- Ninguna.

## Impact

- El monorepo pasara a tener una capa `web` real ademas de `api`.
- Se agregaran dependencias y scripts de desarrollo del frontend.
- Los siguientes changes podran validar flujos visuales sin mezclar bootstrap con logica de negocio.
