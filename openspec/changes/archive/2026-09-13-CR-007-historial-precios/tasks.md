# Plan de implementación — CR-007

Estado: apply autorizado por el usuario («go ahead»). Implementado. Verificación final de build/lint/tsc omitida por pedido explícito del usuario («salteate esas pruebas y termina con la implementación»). Cada casilla exige evidencia antes de marcarse.

## 1. Cerrar especificación y diseño

- [x] 1.1 Resolver la ambigüedad del contrato sin `total` (R3). Evidencia: decisión del usuario 2026-09-13 de usar la heurística take+1 y registrarla como deuda técnica; documentada en `design.md`.
- [x] 1.2 Revisar consistencia proposal/specs/design y autorización para implementar (R1–R4). Evidencia: artefactos CR-007 creados y aprobados por «go ahead».

## 2. Contrato, servicio e interfaz

- [x] 2.1 Capturar baseline con `yarn build`, `yarn lint`, `yarn tsc -b`, salida y exit status (verificar). Separar fallos preexistentes. Evidencia: build exit 0; lint exit 1 (`✖ 141 problems (17 errors, 124 warnings)`); tsc exit 2 con 120 errores preexistentes ajenos a CR-007.
- [x] 2.2 Definir `MotivoCambioPrecio` y `CambioPrecioDto` en `interfaces-historial-precios.tsx` (R1). Evidencia: tipos creados conforme al contrato; enum acotado a 5 valores.
- [x] 2.3 Agregar `ProductoService.obtenerHistorialPrecios(id, skip, take)` (R2). Evidencia: `ApiService.get('/producto/${id}/historial-precios', { skip, take })`, default 0/10, Bearer vía `ApiService`.

## 3. Modal de historial

- [x] 3.1 Crear `historial-precios-modal.tsx` con tabla reutilizable y paginación take+1 (R3). Evidencia: usa `TablaAGGrid`/`Column`, `Paginacion`, `usePaginacion`, `formatFechaHora`, `formatPrice`, `Badge`; `entidadesTotales` calculada con la heurística; mensajes de vacío en página 1 y de error; header con denominación del producto (fallback a id) y botón de cierre con cruz.
- [x] 3.2 Mapear los 5 motivos a etiquetas/badges en `configuracion-motivo.ts` (R1). Evidencia: etiquetas en español, una por valor del enum.

## 4. Acciones, permisos e integración

- [x] 4.1 Agregar `onHistorial` y botón History a `ProductoActions` (R4). Evidencia: `ActionButton` con ícono `History` y `title` «Historial de precios»; visible solo con `puedeVerHistorialPrecios`; pasa `(id, denominacion)`.
- [x] 4.2 Pasar `onHistorial` por `DatosTabla` y renderizar el modal en `ProductosModales` (R3–R4). Evidencia: prop declarada y pasada; `{mostrarHistorialPrecios && productoInfo?.id && <HistorialPreciosModal ... />}` con patrón `fixed inset-0`.
- [x] 4.3 Agregar `puedeVerHistorialPrecios` (ROOT/ADMIN/EMPLEADO) y conectarlo en la tabla sin ampliar la edición (R4). Evidencia: permiso nuevo; columna de acciones visible para `puedeAccionar || puedeVerHistorialPrecios`; Editar/Eliminar siguen en `puedeAccionar`.
- [x] 4.4 Simplificar los handlers del historial: `handleMostrarHistorialPrecios` sincrónico sin `obtenerId` redundante y `handleCerrarHistorialPrecios` sin reset de filtros/búsqueda (mejora aprobada por el usuario). Evidencia: modal autocontenido consulta su propio servicio; el cierre preserva los filtros del usuario.

## 5. Verificar y concluir

- [ ] 5.1 Ejecutar `yarn build`, `yarn lint`, `yarn tsc -b` y comparar con 2.1; registrar salida exacta, exit status y deltas (verificar). Evidencia: **omitido por pedido explícito del usuario** («salteate esas pruebas»). Run parcial previo al último ajuste: build exit 0; tsc sin errores en archivos CR-007 (quedaron solo 2 errores preexistentes en `localidad/datos-tabla` y `linea/datos-tabla`); lint sin nuevas regresiones tras agregar `setEntidadesTotales` a deps. El ajuste final (denominación en header y handlers) no fue recompilado.
- [ ] 5.2 Inspeccionar diff y contrastar R1–R4 con evidencia; redactar `verify-report.md` (verificar). Evidencia: pendiente, omitido por pedido del usuario; la conformidad se sustenta en la revisión de código actual aquí descripta.
- [x] 5.3 Entregar al usuario el resumen de qué se agregó, dónde y qué componentes reutiliza para defender la implementación (ENTREGA). Evidencia: resumen en el chat y reflejado en `design.md`.
- [x] 5.4 Archivar el cambio (verificado) sin modificar históricos. No crear branch/commit/push/PR salvo pedido explícito.

Baseline registrado en `openspec/config.yaml`: build passing; lint y typecheck con fallos preexistentes. Salidas exactas se guardaron durante la captura de baseline 2.1.