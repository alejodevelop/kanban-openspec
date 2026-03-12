## 1. API de listado de boards

- [x] 1.1 Crear el repositorio y use case para listar boards con `id`, `title`, `columnCount` y `cardCount` en orden deterministico.
- [x] 1.2 Exponer `GET /api/boards` en `packages/api/src/routes/boards.ts` y conectar la dependencia en `packages/api/src/app.ts`.
- [x] 1.3 Agregar pruebas de dominio y de ruta para respuesta exitosa, conteos correctos y coleccion vacia.

## 2. Dashboard inicial en frontend

- [x] 2.1 Extender `packages/web/src/features/boards/board-api.ts` con la lectura del listado de boards.
- [x] 2.2 Reemplazar `packages/web/src/routes/home-route.tsx` por un dashboard que renderice estados de carga, error, vacio y listado con enlaces a `/boards/:boardId`.
- [x] 2.3 Ajustar los estilos necesarios en `packages/web/src/styles.css` para soportar las tarjetas o filas de resumen del dashboard.

## 3. Verificacion end-to-end local

- [x] 3.1 Cubrir el dashboard con pruebas de componente para estados principales y navegacion.
- [x] 3.2 Ejecutar la suite relevante de API y web para validar el nuevo flujo de entrada.
