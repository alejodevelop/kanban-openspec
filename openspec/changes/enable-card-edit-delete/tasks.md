## 1. Backend de gestion de tarjetas

- [ ] 1.1 Implementar endpoints o handlers para editar `title` y `description` de tarjetas existentes con validacion de titulo.
- [ ] 1.2 Implementar eliminacion de tarjetas existentes y devolver respuestas claras para casos de tarjeta inexistente.
- [ ] 1.3 Agregar o actualizar pruebas backend para cubrir edicion valida, errores de validacion y eliminacion.

## 2. Interfaz del tablero

- [ ] 2.1 Agregar controles visibles de editar y eliminar en cada tarjeta renderizada del tablero.
- [ ] 2.2 Implementar flujo de edicion con formulario/modal que envie la mutacion y actualice la tarjeta en el estado local.
- [ ] 2.3 Implementar confirmacion previa a la eliminacion y retirar la tarjeta del estado local cuando la API responda exitosamente.
- [ ] 2.4 Mostrar estados de carga y error comprensibles para operaciones de edicion y eliminacion.

## 3. Verificacion end-to-end

- [ ] 3.1 Verificar que una tarjeta creada pueda editarse sin recargar toda la pagina.
- [ ] 3.2 Verificar que una tarjeta eliminada desaparezca del tablero y no vuelva a aparecer en lecturas posteriores.
