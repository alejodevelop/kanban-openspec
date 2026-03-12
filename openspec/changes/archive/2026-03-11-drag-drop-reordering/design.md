## Context

El sistema ya soporta reorder persistente de columnas y tarjetas, pero la interaccion actual basada en botones no representa bien el flujo principal de un tablero Kanban. Este cambio se concentra en `packages/web`, donde la vista del tablero debe pasar a una experiencia de drag and drop sin alterar los contratos backend ya existentes para persistir el orden.

La dificultad tecnica principal no esta en la persistencia sino en coordinar arrastre, estados visuales, accesibilidad y reconciliacion con la respuesta canonica del backend. Tambien hay que contemplar que columnas y tarjetas son listas anidadas, por lo que la solucion debe soportar reorder horizontal y vertical dentro de la misma pantalla.

## Goals / Non-Goals

**Goals:**
- Reemplazar botones de mover arriba/abajo por drag and drop para columnas y tarjetas.
- Mantener el uso de los endpoints de reorder ya definidos para persistir cambios.
- Mostrar feedback visual claro durante drag, over y drop.
- Preservar una alternativa accesible cuando el gesto de arrastre no pueda usarse.

**Non-Goals:**
- Rediseñar el layout general del tablero.
- Cambiar payloads, reglas de validacion o persistencia del backend.
- Resolver colaboracion en tiempo real o conflictos multiusuario.

## Decisions

### 1. Usar una libreria de drag and drop orientada a React con soporte accesible
Se adoptara `@dnd-kit` para modelar drag and drop de columnas y tarjetas porque funciona bien con React moderno, permite sensores de mouse, touch y keyboard, y ofrece primitives suficientes para listas anidadas sin imponer una estructura de markup cerrada.

Alternativas consideradas:
- HTML5 drag and drop nativo. Se descarta por ergonomia pobre en React, soporte desigual en touch y menor control sobre colisiones y overlays.
- React Beautiful DnD. Se descarta por mantenimiento menos favorable y menor flexibilidad para la composicion actual.

### 2. Mantener el backend como fuente canonica del orden
La UI actualizara el estado local para dar respuesta inmediata al usuario, pero despues del drop reconciliara con la respuesta del backend o revalidara el board. Asi se evita que el cliente conserve un orden visual que no coincida con el persistido.

Alternativas consideradas:
- Confiar solo en el reorder optimista local. Se descarta porque deja abierta divergencia frente a errores o normalizacion del servidor.

### 3. Modelar columnas y tarjetas con contextos de reorder separados pero coordinados
Las columnas usaran un contexto sortable horizontal a nivel board y cada columna tendra su contexto sortable vertical para tarjetas. El movimiento entre columnas se resolvera calculando origen, destino e indice final antes de invocar el endpoint existente.

Alternativas consideradas:
- Un unico contexto global para todos los elementos. Se descarta porque complica la deteccion de tipo de item y aumenta el riesgo de colisiones incorrectas.

### 4. Conservar una via accesible de fallback para reorder
Aunque el camino principal sera drag and drop, la vista debe seguir ofreciendo accion por teclado o controles alternativos cuando el arrastre no este disponible. Esto evita perder funcionalidad para usuarios con tecnologias asistivas o entornos limitados.

Alternativas consideradas:
- Eliminar por completo los controles previos. Se descarta porque degradaria accesibilidad y haria el flujo dependiente de puntero o touch.

## Risks / Trade-offs

- [La complejidad de drag and drop anidado puede introducir bugs visuales] -> Mitigacion: separar claramente sensores, ids de draggable y transformaciones por tipo de item.
- [El reorder optimista puede quedar desalineado con el backend] -> Mitigacion: reconciliar siempre con la respuesta persistida y restaurar estado previo ante error.
- [El fallback accesible puede divergir del flujo principal] -> Mitigacion: reutilizar la misma funcion de dominio para construir payloads de reorder desde drag o desde controles alternativos.

## Migration Plan

1. Incorporar la dependencia de drag and drop y wrappers de UI necesarios.
2. Reemplazar controles de botones por interacciones drag and drop para columnas y tarjetas.
3. Mantener y adaptar el fallback accesible para invocar el mismo flujo de persistencia.
4. Actualizar pruebas de interfaz y de integracion del flujo de reorder.
5. Si surge una regresion importante, retirar la capa drag and drop y dejar activo el fallback mientras se corrige.

## Open Questions

- Si el tablero debe mostrar un drag handle explicito en todos los breakpoints o permitir arrastre desde toda la tarjeta/columna.
- Si la reconciliacion post-drop se resolvera con la respuesta del mutation o con una recarga controlada del board completo.
