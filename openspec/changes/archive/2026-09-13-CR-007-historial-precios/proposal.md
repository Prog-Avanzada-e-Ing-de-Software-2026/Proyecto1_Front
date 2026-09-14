# CR-007 — Historial de precios (frontend)

Estado: propuesta aprobada por instrucción explícita del usuario («go ahead»). Implementación en curso con contrato de backend provisto por el usuario.

## Intención y alcance

Implementar en el frontend la visualización del historial de cambios de precio de un producto, consultado desde la tabla de productos. El usuario podrá abrir desde la acción de fila de un producto un modal que muestra, paginado de a 10 registros, cada cambio de precio con fecha, precio anterior, precio nuevo y motivo (etiqueta sobre el enum de 5 valores). Es una consulta de solo lectura sobre el modelo de precios: no modifica precios, no registra cambios y no introduce fórmulas de cálculo.

## Contrato de backend (único cambio de contrato)

`GET /api/producto/:id/historial-precios?skip=<n>&take=<n>` con Bearer token. Roles: Root, Administrador, Empleado.

- `200` -> `CambioPrecioDto[]` ordenado `fecha` DESC y luego `id` DESC:
  `[ { "fecha": "2026-09-13T23:50:00.000Z", "precioAnterior": 132, "precioNuevo": 150, "motivo": "ActualizacionDePrecioDirecta" } ]`
- `404` si el producto no existe o está eliminado; `[]` si nunca tuvo cambios.
- `skip`/`take` opcionales (default `0`/`10`).
- `motivo` es un enum de 5 valores: `ActualizacionDeCosto`, `ActualizacionDeMargen`, `ActualizacionDePrecioPorLinea`, `ActualizacionDePrecioGlobal`, `ActualizacionDePrecioDirecta`.

La respuesta es un arreglo plano, sin campo `total`: la paginación del frontend no puede conocer el total exacto de registros. Por decisión del usuario se resuelve con una heurística «pedir take+1» (ver sección deuda técnica en `design.md`).

## Fuera de alcance

Backend, cambios de precio (edición/comandos), listas de precios, importaciones, móvil (`DatosCard` mantiene las acciones ocultas), permisos por rol distintos de los del endpoint, tests automatizados y reparación general del baseline.

## Dependencias y riesgos

- El endpoint no fue verificado contra un servidor en esta planificación; el frontend se implementa contra el contrato provisto.
- Respuesta sin `total`: los números de página pueden ser aproximados cuando existen más de dos páginas. Riesgo aceptado y registrado como deuda técnica.
- `ProductoService.obtenerId` actualmente devuelve el `Producto` completo; el modal obtiene sus propios datos con el nuevo método paginado.
- Permisos: la columna de acciones hoy se muestra únicamente para Administrador. Para respetar los roles del endpoint (Root/Admin/Empleado) se agrega un permiso específico sin ampliar la edición a roles ajenos.

## Rollback

Revertir únicamente los cambios de frontend de CR-007 (interfaz nueva, método de servicio, modal y wiring de acciones) restaura la tabla sin la acción de historial. Es una consulta de solo lectura: no hay datos persistidos que revertir.

## Entrega

Completar y revisar proposal → specs → design → tasks; posteriormente apply → verify → archive. Sin tests automatizados (`strict_tdd` permanece `false`); la verificación se realiza con `yarn build`, `yarn lint` y `yarn tsc -b` comparando contra baseline y con inspección del diff.