## 1. Contratos y persistencia backend

- [ ] 1.1 Definir endpoints y payloads explicitos para reorder de columnas y tarjetas
- [ ] 1.2 Implementar reescritura transaccional de posiciones y validacion del scope afectado

## 2. Interaccion de tablero

- [ ] 2.1 Agregar controles de drag and drop o interaccion equivalente para mover columnas y tarjetas
- [ ] 2.2 Reconciliar la UI con el orden persistido por el backend despues de cada operacion

## 3. Verificacion

- [ ] 3.1 Agregar pruebas para reorder de columnas, reorder intracolumna y movimiento entre columnas
- [ ] 3.2 Verificar que el nuevo orden persiste tras recarga y que payloads invalidos son rechazados
