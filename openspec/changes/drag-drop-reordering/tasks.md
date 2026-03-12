## 1. Preparar la base de drag and drop

- [ ] 1.1 Agregar y configurar la libreria de drag and drop elegida en `packages/web`.
- [ ] 1.2 Extraer utilidades compartidas para identificar columnas, tarjetas y destinos de reorder sin duplicar logica entre drag y fallback.

## 2. Reemplazar el reorder por botones en la UI

- [ ] 2.1 Implementar drag and drop horizontal para columnas reutilizando el flujo de persistencia existente.
- [ ] 2.2 Implementar drag and drop vertical para tarjetas dentro de la misma columna y entre columnas.
- [ ] 2.3 Agregar feedback visual de arrastre, placeholder o overlay para mostrar con claridad la posicion de drop.

## 3. Mantener accesibilidad y validacion funcional

- [ ] 3.1 Preservar o rehacer una alternativa accesible de reorder por teclado o controles equivalentes que use el mismo flujo de dominio.
- [ ] 3.2 Manejar reconciliacion de estado y rollback visual cuando la persistencia del reorder falle.

## 4. Verificar el cambio

- [ ] 4.1 Actualizar pruebas de frontend para cubrir reorder de columnas por drag and drop.
- [ ] 4.2 Actualizar pruebas de frontend para cubrir reorder de tarjetas dentro y entre columnas, incluyendo el fallback accesible.
