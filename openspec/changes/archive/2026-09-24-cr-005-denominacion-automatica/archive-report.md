# Archive report — CR-005 Denominación automática

Fecha de archivo: 2026-09-24
Change: `cr-005-denominacion-automatica`
Store: hybrid (OpenSpec + Engram)
Topic key Engram: `sdd/cr-005-denominacion-automatica/archive-report`

## Estado al cierre (final-state authority)

- Implementación: **entregada y fusionada** vía PR #8 el 2026-09-23 (hecho de estado final provisto por el
  orquestador; máxima autoridad sobre los snapshots intermedios).
- Tareas: **8/8 completas** según `tasks.md` archivado (todas las casillas `[x]`); 0 pendientes.
- `state.yaml` registraba `archive: ready`, `taskProgress.allComplete: true`, `nextRecommended: archive`.
- Verificación (números finales, idénticos a los del snapshot `verify-report`):
  - `yarn build` → **exit 0**.
  - `yarn lint` → **exit 1** (17 errores, 128 warnings), fallas **preexistentes de baseline**, sin
    coincidencias en archivos de CR-005.
  - `yarn tsc -b` → **exit 2**, errores **preexistentes ajenos**, sin coincidencias en archivos de CR-005.
- Sin cambios en código productivo por este archivo. El working tree además contiene el trabajo
  `preload-presentaciones-producto` ya commiteado y el change sin seguimiento
  `fix-race-denominacion-autogenerada`; ninguno fue tocado.

## Spec canónica creada

- `openspec/specs/denominacion-automatica-producto/spec.md` — capacidad **nueva**; no existía spec
  canónica previa, por lo que el delta se copió mecánicamente como spec completa (copia por shell,
  `diff -r` vacío = byte-identidad con el delta archivado). No hubo fusión ni delta destructivo, por lo
  que no se requirió advertencia de merge.

## Contenido archivado

- `proposal.md` — presente.
- `specs/denominacion-automatica-producto/spec.md` — presente.
- `design.md` — presente.
- `tasks.md` — presente; 8/8 completas; 0 sin terminar.
- `verify-report.md` — presente (fecha 2026-09-17).
- `state.yaml` — presente.

## Hallazgos no resueltos (registrados honestamente, no corregidos aquí)

1. **Defecto diferido (HIGH) — caret al final en edición de denominación autogenerada.**
   La revisión del PR #8 identificó que, en el formulario de creación de Producto, editar la
   denominación autogenerada provoca que el primer click/keystroke mueva el caret al final de la línea
   (carrera entre el efecto detector de edición manual y el efecto de sugerencia a través de estado
   asíncrono). Se difiere **intencionalmente** a un change OpenSpec separado
   `fix-race-denominacion-autogenerada`, en planificación tras este archivo. No es un requisito
   pendiente de CR-005; es un defecto detectado en revisión.

2. **Recorrido manual CA-1..CA-3 sin confirmación en fuente de mayor rango.**
   `verify-report.md` (2026-09-17, snapshot intermedio) listaba como pendiente el recorrido UI manual de
   CA-1..CA-3 en Registrar Producto (usuario). Ninguna fuente de mayor rango (tasks o hechos de estado
   final del prompt de archivo) confirma explícitamente que ese recorrido se haya completado. Se
   registra como **no confirmado**, sin afirmar que pasó ni que quedó pendiente.

3. **Inconsistencia menor en `state.yaml` (no bloqueante).**
   `artifactPaths.verifyReport` es una lista vacía mientras `artifacts.verifyReport: done` y
   `verify-report.md` existe en disco. No se alteró el artefacto histórico.

## Rastreabilidad Engram

- No existían observaciones Engram bajo `sdd/cr-005-denominacion-automatica/` (artefactos solo en el
  store de archivos OpenSpec). No hay observation IDs de artefactos CR-005 que registrar.
- Contexto relacionado leído: obs **#755** (`sdd/fix-race-denominacion-autogenerada/explore`, cambio
  diferido) y **#754** (session summary de la sesión de trabajo previa).

## Verificación de archivo (readback obligatorio)

- Copia de spec canónica: `diff -r` delta vs copia → **vacío (exit 0)**.
- Movimiento a archivo: `git mv` exitoso; `diff -r` snapshot pre-movimiento vs destino → **vacío (exit 0)**.
- Directorio activo `openspec/changes/cr-005-denominacion-automatica` ya no existe.
- `design.md`, `proposal.md`, `spec.md`, `state.yaml`, `tasks.md`, `verify-report.md` archivados con
  bytes originales (renames detectados por git).
