## 1. Base de datos y esquema

- [x] 1.1 Crear la configuracion base de Drizzle para PostgreSQL y registrar el punto de entrada del esquema.
- [x] 1.2 Implementar los esquemas de `boards`, `columns` y `cards` con UUIDs, timestamps, campos obligatorios, `cards.description` opcional y relaciones sin `cards.board_id` redundante.
- [x] 1.3 Definir indices y restricciones para el orden por tablero/columna y para la integridad referencial.

## 2. Migracion y validacion

- [x] 2.1 Generar la migracion SQL inicial y validar que crea las tablas esperadas.
- [x] 2.2 Agregar una prueba o verificacion automatizada minima que cargue el esquema y falle si faltan relaciones clave, cubriendo derivacion de tablero desde `column_id` y `description` opcional en tarjetas.
- [x] 2.3 Documentar en el codigo como importar el esquema compartido desde backend y futuras capas de acceso a datos.
- [x] 2.4 Verificar que schema y migracion inicial mantengan nomenclatura tecnica en ingles para tablas y columnas.
