## 1. Base de datos y esquema

- [ ] 1.1 Crear la configuracion base de Drizzle para PostgreSQL y registrar el punto de entrada del esquema.
- [ ] 1.2 Implementar los esquemas de `boards`, `columns` y `cards` con UUIDs, timestamps, campos obligatorios y relaciones.
- [ ] 1.3 Definir indices y restricciones para el orden por tablero/columna y para la integridad referencial.

## 2. Migracion y validacion

- [ ] 2.1 Generar la migracion SQL inicial y validar que crea las tablas esperadas.
- [ ] 2.2 Agregar una prueba o verificacion automatizada minima que cargue el esquema y falle si faltan relaciones clave.
- [ ] 2.3 Documentar en el codigo como importar el esquema compartido desde backend y futuras capas de acceso a datos.
