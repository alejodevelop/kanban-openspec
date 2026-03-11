## Context

Aunque la configuracion general del proyecto apunta a React, el repositorio actual no tiene package web, cliente HTTP ni punto de entrada del navegador. Eso impide probar la API desde una UI real y tambien posterga decisiones basicas de estructura frontend.

Paths nuevos esperados para este cambio: `packages/web/package.json`, `packages/web/index.html`, `packages/web/src/main.tsx`, `packages/web/src/App.tsx`, `packages/web/src/routes/`, `packages/web/src/lib/api-client.ts` y ajustes en el `package.json` raiz para scripts de workspace.

## Goals / Non-Goals

**Goals:**
- Crear una aplicacion React/Vite arrancable dentro del monorepo.
- Dejar una shell con routing minimo y estructura clara para features futuras.
- Centralizar la configuracion de consumo de API en el frontend.
- Asegurar que la app pueda ejecutarse localmente junto al backend.

**Non-Goals:**
- Renderizar un tablero real desde la API.
- Diseñar el sistema visual final del producto.
- Introducir flujos de autenticacion o manejo complejo de estado global.

## Decisions

### 1. Crear `packages/web` como workspace independiente
La aplicacion web vivira en un package propio para mantener limites claros entre `api` y `web`, y para poder ejecutar scripts de cada lado sin mezclar responsabilidades.

Alternativas consideradas:
- Colocar frontend dentro de `packages/api`. Se descarta porque mezcla runtime de servidor y navegador.

### 2. Usar React con Vite para el bootstrap del navegador
Vite reduce friccion para levantar la app y es una base razonable para iterar rapido en UI.

Alternativas consideradas:
- Incorporar un framework mas opinionado desde el inicio. Se descarta para no convertir este cambio en una decision mayor de producto.

### 3. Definir un cliente HTTP propio y pequeno
El frontend tendra un wrapper simple para leer la URL base de la API y concentrar fetch, manejo de errores y configuracion comun.

Alternativas consideradas:
- Hacer llamadas directas a `fetch` desde cada componente. Se descarta por duplicacion temprana de configuracion.

### 4. Mantener el bootstrap de UI separado de la primera pantalla de tablero
Este cambio deja lista la infraestructura del frontend, pero no consume todavia el endpoint de lectura real. Esa separacion hace mas facil revisar y depurar si el problema es de bootstrap o de datos.

Alternativas consideradas:
- Crear la web y el board view en el mismo cambio. Se descarta porque mezclar bootstrap y feature haria mas difuso el feedback.

## Risks / Trade-offs

- [Aplazar la pantalla real del tablero puede hacer sentir este cambio poco visible] -> Mitigacion: mantenerlo pequeno y usarlo enseguida para conectar `render-board-from-api`.
- [Sin una libreria de datos todavia, algunas decisiones podrian rehacerse luego] -> Mitigacion: usar un cliente HTTP minimo y posponer cualquier decision pesada de estado remoto.
- [Configurar el frontend antes de CORS o puertos finales puede generar ajuste posterior] -> Mitigacion: centralizar la URL base de la API y no dispersarla en componentes.

## Migration Plan

1. Crear `packages/web` y sus scripts de desarrollo.
2. Agregar entrypoint, shell base y routing inicial.
3. Implementar un cliente HTTP configurable por entorno.
4. Verificar que la app web arranca y puede convivir con la API local.
5. Si hay rollback, retirar el package web y los scripts asociados.

## Open Questions

- Queda para el siguiente cambio la decision exacta de las rutas de board y la forma visual de la primera pantalla real.
