# Mi Proyecto

## Tech Stack
- Runtime: Node.js 20.19, TypeScript 5.4 (strict mode)
- Frontend: React 19, Vite 6, Tailwind CSS 4
- Backend: Express 5, Prisma 6
- Base de datos: PostgreSQL 16
- Testing: Vitest (unit), Playwright (e2e)

## Arquitectura
Monorepo con dos packages:
- packages/api/ - Backend Express con patron MVC
- packages/web/ - Frontend React por feature

## Convenciones
- Archivos: kebab-case. Componentes: PascalCase
- Max 150 lineas por archivo
- Tests junto al archivo fuente

## Dominio
- Board: Tablero con columnas ordenables
- Column: Contenedor de cards con posicion
- Card: Unidad de trabajo con titulo, descripcion, tags