## 1. Runtime base

- [x] 1.1 Agregar dependencias y scripts para ejecutar el backend desde `packages/api`
- [x] 1.2 Crear la app Express, el entrypoint del servidor y la configuracion centralizada de entorno

## 2. Base de datos y salud operativa

- [x] 2.1 Implementar un cliente compartido de Drizzle usando el schema actual y `DATABASE_URL`
- [x] 2.2 Exponer `GET /health` con verificacion basica del proceso y de PostgreSQL

## 3. Verificacion

- [x] 3.1 Agregar pruebas de arranque y del endpoint de salud
- [x] 3.2 Validar que el runtime funciona localmente con la migracion inicial aplicada
