## 1. Contratos y persistencia backend

- [x] 1.1 Definir endpoints y payloads explicitos para reorder de columnas y tarjetas
- [x] 1.2 Implementar reescritura transaccional de posiciones y validacion del scope afectado

## 2. Interaccion de tablero

- [x] 2.1 Agregar controles de drag and drop o interaccion equivalente para mover columnas y tarjetas
- [x] 2.2 Reconciliar la UI con el orden persistido por el backend despues de cada operacion

## 3. Verificacion

- [x] 3.1 Agregar pruebas para reorder de columnas, reorder intracolumna y movimiento entre columnas
- [x] 3.2 Verificar que el nuevo orden persiste tras recarga y que payloads invalidos son rechazados
