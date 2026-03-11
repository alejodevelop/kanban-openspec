## 1. Caso de uso y contrato

- [ ] 1.1 Implementar la consulta agregada de tablero, columnas y tarjetas usando el schema existente
- [ ] 1.2 Definir la serializacion de la respuesta JSON con orden estable por `position`

## 2. Exposicion HTTP

- [ ] 2.1 Registrar `GET /api/boards/:boardId` y manejar exito, validacion minima y not found
- [ ] 2.2 Preparar fixtures o seed para validar el endpoint localmente y en pruebas

## 3. Verificacion

- [ ] 3.1 Agregar pruebas de integracion para lectura exitosa del tablero
- [ ] 3.2 Agregar pruebas para tablero inexistente y revisar que el contrato sea consumible por el frontend
