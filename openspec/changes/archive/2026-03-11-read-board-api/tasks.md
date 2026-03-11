## 1. Caso de uso y contrato

- [x] 1.1 Implementar la consulta agregada de tablero, columnas y tarjetas usando el schema existente
- [x] 1.2 Definir la serializacion de la respuesta JSON con orden estable por `position`

## 2. Exposicion HTTP

- [x] 2.1 Registrar `GET /api/boards/:boardId` y manejar exito, validacion minima y not found
- [x] 2.2 Preparar fixtures o seed para validar el endpoint localmente y en pruebas

## 3. Verificacion

- [x] 3.1 Agregar pruebas de integracion para lectura exitosa del tablero
- [x] 3.2 Agregar pruebas para tablero inexistente y revisar que el contrato sea consumible por el frontend
