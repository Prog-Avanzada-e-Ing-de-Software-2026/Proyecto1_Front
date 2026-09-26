# Apply Progress: CR-003-P2

## Work Unit 1: Standalone SuperLínea management

**Mode**: Standard (strict TDD is disabled; no test runner is configured)

### Completed Tasks

- [x] 1.1 SuperLínea DTOs and seven explicit API contracts.
- [x] 2.1 Standalone/nested form validation, creation, update, and preserved API-error state.
- [x] 2.2 Paginated query coordinator and modal state.
- [x] 2.3 Filters, responsive table/cards, and headers without print or restore actions.
- [x] 2.4 Form and audit modal composition.
- [x] 3.3 Route and menu entry with Línea-equivalent route placement and menu roles.

### Partially Verified Task

- [ ] 4.1 Static checks completed; authenticated backend CRUD, pagination, audit, and API error scenarios require a live session and remain unverified.

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `yarn build` — exit 0; 2,413 modules transformed and production build completed in 7.44 seconds. |
| Runtime harness command/scenario and exact result | N/A — no authenticated backend session was provided, so CRUD, pagination, audit, and 403/404/409 responses were not exercised. |
| Static scenario checks | The explicit service exposes select, create, search, detail, update, delete, and audit contracts. A source scan found no `imprimir` or `restaur` action in the SuperLínea module. Route `/admin/superlinea` is a sibling of `linea`; its menu item is under the same Configuración role gate. |
| Rollback boundary | Revert the standalone SuperLínea module, `src/App.tsx`, and `src/componentes/menu/menuItems-definicion.ts`; the Línea association work unit remains untouched. |

### Quality Commands

| Command | Observed result |
|---|---|
| `yarn build` | Passed (exit 0). |
| `yarn lint` | Failed with 21 errors and 132 warnings, all reported outside this work unit; baseline comparison is limited to the documented pre-existing failure state. |
| `yarn tsc -b` | Failed on existing project-wide errors outside this work unit; no error was reported from SuperLínea files added or changed by this unit. |

### Delivery Boundary

- Delivery mode: feature-branch-chain.
- Intended boundary: work unit 1 only; proposed PR base is tracker branch `CR-003`.
- No branch, commit, push, pull request, merge, or target change was performed.

## CR-003-P2 Narrow Correction: Stop SuperLínea search loop

**Failed evidence revision remediated**: `sha256:74c415478ca7f6c8584f4a9de4c4db0c4aca64e7bd52dc2d76a7bf51a21ca1bb`

### Scope

`buscar` no longer depends on the render-unstable `addAlert` callback from `useAlerts`. A local ref receives the latest alert callback in a separate effect, while the fetch callback depends only on `filtros`, `skip`, and `take`. The fetch effect therefore runs initially and when those query inputs change, but not after its own loading-state render.

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Build command and exact result | `yarn build` — exit 0; 2,413 modules transformed and production build completed in 3.67 seconds. |
| Focused static check and exact result | Inspected `buscar` dependency set: `[filtros, skip, take]`. Its `useEffect` remains `[buscar]`; `addAlert` is absent from the fetch callback and is refreshed only by the separate `[addAlert]` ref effect. Result: the loading render cannot change `buscar`, while filter and pagination state changes still do. |
| Runtime harness command/scenario and exact result | N/A — browser reproduction was explicitly deferred to the maintainer; no browser runtime proof is claimed. |
| Rollback boundary | Revert the `addAlertRef` import, ref-refresh effect, catch invocation, and `buscar` dependency change in `src/componentes/gestion-producto/superlinea/utils/consultar-superlinea.tsx`; no other behavior or work unit is removed. |

## CR-003-P2 Narrow Runtime Correction: Audit role visibility

**Status**: Awaiting user runtime reproduction. Task 4.1 remains open and is not marked complete.

### Scope

`InformacionAuditoria` no longer decodes a nonexistent `rolId` JWT claim or requests a role from `UsuarioService`. The shared component now renders the record ID only when `hasRole(Rol.ROOT)` evaluates to true, using the existing `roles: number[]` authentication contract. All other audit details remain unchanged.

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `yarn build` — exit 0; 2,413 modules transformed and production build completed in 3.64 seconds. |
| Static inspection and exact result | Inspected `src/componentes/herramientas/reutilizables/informacion-auditoria.tsx`: it imports `hasRole` and `Rol`; it has no `UsuarioService`, `obtenerRol`, `jwtDecode`, `rolId`, `useEffect`, or `useState` import/call; the ID block is guarded exactly by `hasRole(Rol.ROOT)`. |
| Runtime harness command/scenario and exact result | N/A — browser reproduction is explicitly reserved for the user. No browser runtime proof is claimed. |
| Rollback boundary | Revert the `hasRole`/`Rol` imports and the Root ID guard in `src/componentes/herramientas/reutilizables/informacion-auditoria.tsx`; no unrelated behavior or prior correction evidence is removed. |

### Delivery Boundary

- Delivery mode: feature-branch-chain.
- Intended boundary: narrow shared audit correction only; its eventual PR targets the immediate prior chain branch, never `develop` directly.
- No branch, commit, push, pull request, merge, or target change was performed.

## CR-003-P2 Maintainer Runtime Settlement: Audit role visibility

**Failed evidence revision remediated**: `sha256:b9dbec6ab180526116dcf642916eef34d6a003edb30a284423b5c43209f2a5f1`

### Observed Runtime Evidence

The maintainer, after the audit-role correction, opened SuperLínea audit through the `i` action. Audit data displayed correctly, and the backend produced neither a `/api/rol/undefined` request nor an associated error log.

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | No automated test command exists for this browser-only runtime settlement; `strict_tdd` is inactive. |
| Runtime harness command/scenario and exact result | Maintainer browser reproduction — opened SuperLínea audit using the `i` action after the audit-role correction. Result: audit data displayed correctly; no `/api/rol/undefined` backend request and no associated backend error log occurred. |
| Rollback boundary | This evidence record can be reverted from `openspec/changes/CR-003-P2/apply-progress.md` without changing source behavior or removing prior work-unit evidence. |

### Verification Status

- Passed runtime scenario: SuperLínea audit opened through the `i` action without the invalid role request or backend error.
- Task 4.1 remains unchecked. The merged progress still lacks authenticated runtime evidence for SuperLínea search and pagination, create/update/delete CRUD flows, validation boundaries, normalized 403/404/409 API-error handling, and absence of print/restore actions.

## Work Unit 2: Editable Línea–SuperLínea association

**Mode**: Standard (strict TDD is disabled; no test runner is configured)

### Completed Tasks

- [x] 1.2 Línea update contract with optional `superLineaId`.
- [x] 3.1 Edit-mode option loading, association initialization, and conditional reassignment payload.
- [x] 3.2 Preserved nested creation, cancellation, parent form state, and option refresh without automatic selection.

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `git diff --check && rg -n "UpdateLineaDto|superLineaId: linea\\.superlinea\\.id|cargarSuperlineas\\(\\)|superLineaId !== linea\\.superlinea\\.id|<SuperlineasSelector" ...` — exit 0. The static review confirms the optional DTO, edit default from `linea.superlinea.id`, option load in both modes, conditional payload inclusion, and selector rendering in both modes. |
| Runtime harness command/scenario and exact result | Pending maintainer browser verification — no authenticated backend/browser session was available. Required scenarios: unchanged edit omits `superLineaId`; reassignment sends it; loading/403/404 failures retain the form with an actionable error; create, nested `+`, cancellation, and refresh without automatic selection remain intact. |
| Quality commands | `yarn build` — exit 0; 2,413 modules transformed and production build completed in 6.20 seconds. `yarn lint` — exit 1 with 21 errors and 131 warnings; the only cited file from this unit is its pre-existing missing-dependency warning at `registrar-actualizar-linea.tsx:112`, with no new lint error. `yarn tsc -b` — exit 2 on existing project-wide errors; no diagnostic cited a file changed by this unit. |
| Rollback boundary | Revert `src/interfaces/gestion-producto/linea/interfaces-linea.tsx`, `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx`, `src/componentes/gestion-producto/linea/services/linea-service.tsx`, and the selector/payload changes in `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx`. This retains standalone SuperLínea behavior and all prior work-unit evidence. |

### Delivery Boundary

- Delivery mode: feature-branch-chain.
- Intended boundary: Work Unit 2 only, based on the immediate Work Unit 1 branch and never targeting `develop` directly.
- No branch, commit, push, pull request, merge, or target change was performed.

### Verification Status

- Tasks 1.2, 3.1, and 3.2 are implemented and statically verified.
- Tasks 4.1 and 4.2 remain unchecked; authenticated browser scenarios remain the maintainer's pending verification.

## CR-003-P2 Focused Remediation: Safe Línea edit association access

**Failed evidence revision remediated**: `sha256:744a75ed5b97e2a0cf7ba03ded3afd6d223b6833f49ca95c9cf961753833d1e4`

### Root Cause and Contract Reconciliation

The edit flow obtains the Línea with `GET /api/linea/{id}` and passes that response directly from `ConsultarLineas` to `RegistrarActualizarLineaForm`. OpenAPI documents the association as required camel-case `superLinea`, while the existing frontend model used lower-case `superlinea` as a required property. The reproduced response omits that lower-case property, so both edit default initialization and the update comparison dereferenced `undefined`.

The model now represents both observed lower-case and documented camel-case association fields as optional. Defaults and the unchanged-update comparison resolve the documented field first, then the observed legacy field, with optional chaining. If neither field exists, an unchanged save omits `superLineaId`; selecting a SuperLínea still sends its selected ID.

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `git diff --check && rg -n 'superLineaId: linea\.superLinea\?\.id \?\? linea\.superlinea\?\.id|const superLineaInicialId = linea\.superLinea\?\.id \?\? linea\.superlinea\?\.id|superLineaId !== superLineaInicialId' ...` — exit 0. It found the optional-chain fallback in `transformData`, the same safe initial-ID resolution, and the comparison against that resolved value. |
| Runtime harness command/scenario and exact result | N/A — maintainer browser reproduction remains pending by instruction. No browser success is claimed. |
| `yarn build` | Passed (exit 0): 2,413 modules transformed; production build completed in 4.09 seconds. |
| `yarn lint` | Failed (exit 1): 21 errors and 131 warnings, all outside the changed remediation lines. The existing warning at `registrar-actualizar-linea.tsx:112` remains; no changed-file lint error was reported. |
| `yarn tsc -b` | Failed (exit 2) on pre-existing project-wide diagnostics. No diagnostic cited `interfaces-linea.tsx`, `interfaces-validaciones-linea.tsx`, or `registrar-actualizar-linea.tsx`. |
| Rollback boundary | Revert the optional association fields in `src/interfaces/gestion-producto/linea/interfaces-linea.tsx`, the safe default in `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx`, and the safe initial-ID comparison in `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx`. This leaves standalone SuperLínea behavior, nested `+`, cancellation, parent state, and all prior evidence intact. |

### Delivery Boundary

- Delivery mode: feature-branch-chain.
- Intended boundary: focused Work Unit 2 remediation only; its eventual PR targets the immediate prior chain branch, never `develop` directly.
- No branch, commit, push, pull request, merge, or target change was performed.

### Verification Status

- Source-level remediation is complete; runtime browser confirmation remains pending with the maintainer.
- Tasks 4.1 and 4.2 remain unchecked.

## CR-003-P2 Asentamiento de evidencia runtime: asociación editable de Línea–SuperLínea

**Revisión de evidencia fallida subsanada**: `sha256:aefcee6f4f1d42a998ed86046134ffb6d25306474a71807b6ca7d1072288f4be`

### Evidencia runtime observada

El mantenedor confirmó, después de la corrección opcional de la asociación de SuperLínea, que la edición de Línea abre sin pantalla blanca. Guardar cambios en otro campo sin reasignar conserva la SuperLínea existente; seleccionar otra SuperLínea actualiza y persiste la reasignación. La creación de una SuperLínea mediante el flujo anidado `+` actualiza las opciones sin seleccionarla automáticamente y preserva los datos de la Línea padre; cancelar esa creación conserva el estado del formulario padre.

También confirmó que los errores de actualización del backend conservan el formulario y muestran el error normalizado. Al bloquear `GET /superlinea/select`, la aplicación se degrada de forma controlada: no hay pantalla blanca, se muestra un error, el selector queda sin opciones, la actualización se deshabilita y cerrar o cancelar deja la aplicación funcional.

No se creó destructivamente un catálogo de producción genuinamente vacío. En su lugar, se verificó el recorrido controlado de fallo de carga del catálogo.

### Evidencia de la unidad de trabajo

| Evidencia | Resultado |
|---|---|
| Comando de prueba focal y resultado exacto | No existe un comando de prueba automatizado para este asentamiento de navegador; `strict_tdd` está inactivo. No se ejecutaron build, lint ni type-check porque esta actualización solo registra evidencia y no modifica bytes de código fuente. |
| Comando/escenario de harness runtime y resultado exacto | Reproducción en navegador confirmada por el mantenedor: (1) abrir edición de Línea; sin pantalla blanca; (2) guardar otro campo sin reasignar; conserva la SuperLínea; (3) reasignar otra SuperLínea; el cambio se actualiza y persiste; (4) crear mediante `+`; refresca opciones sin selección automática y conserva datos padre; (5) cancelar creación anidada; conserva estado padre; (6) provocar error de actualización; conserva formulario y muestra error normalizado; (7) bloquear `GET /superlinea/select`; no hay pantalla blanca, se muestra error, no hay opciones, actualizar queda deshabilitado y cerrar/cancelar mantiene la aplicación funcional. |
| Límite de reversión | Revertir únicamente este asentamiento de `openspec/changes/CR-003-P2/apply-progress.md`; no modifica comportamiento de fuente ni elimina evidencia previa. |

### Estado de verificación de la tarea 4.2

- Evidencia cubierta: edición sin cambio, reasignación, creación anidada mediante `+`, refresco sin selección automática, conservación del estado padre, cancelación y degradación ante fallo de carga; además, un error de actualización conserva el formulario y se normaliza.
- La tarea 4.2 permanece sin marcar. No se comprobó un catálogo genuinamente vacío: el recorrido confirmado fue un fallo controlado de `GET /superlinea/select`, que no demuestra que el endpoint responda sin opciones. Tampoco se informó una alta exitosa de Línea con una SuperLínea seleccionada, ni se identificaron específicamente respuestas 403 y 404 de actualización; por ello no están cubiertos de forma veraz todos los subescenarios explícitos de alta, catálogo vacío y fallos.
- La tarea 4.1 no cambia y permanece sin marcar.

## CR-003-P2 Asentamiento final de evidencia runtime: asociación editable de Línea–SuperLínea

**Revisión de evidencia fallida subsanada**: `sha256:7428775c2e8740132fc9d0e0f5ab8e8bf40a175f8aca7fa6b4eeed00b8458ac3`

### Evidencia runtime observada

El mantenedor confirmó evidencia adicional, acumulada con el asentamiento anterior: una alta de Línea exitosa con una SuperLínea seleccionada; el comportamiento correcto ante un catálogo de SuperLíneas genuinamente vacío; y errores de actualización 404 y 403 que conservan el formulario y muestran el error normalizado. El 403 se verificó contra una Línea protegida con `sistema: 1`; el `fieldset` deshabilitado se retiró temporalmente en DevTools solo para alcanzar la ruta de autorización del backend, que rechazó la actualización como se esperaba.

### Evidencia de la unidad de trabajo

| Evidencia | Resultado |
|---|---|
| Comando de prueba focal y resultado exacto | No existe un comando de prueba automatizado para este asentamiento de navegador; `strict_tdd` está inactivo. No se ejecutaron build, lint ni type-check porque esta actualización solo registra evidencia y no modifica bytes de código fuente. |
| Comando/escenario de harness runtime y resultado exacto | Reproducción en navegador confirmada por el mantenedor, acumulada con la evidencia previa: (1) alta de Línea con una SuperLínea seleccionada, completada correctamente; (2) catálogo de SuperLíneas genuinamente vacío, gestionado correctamente; (3) actualización que recibe 404, conserva el formulario y muestra el error normalizado; (4) actualización de una Línea protegida con `sistema: 1` que recibe 403, conserva el formulario y muestra el error normalizado. Para el último caso, el `fieldset` se retiró temporalmente en DevTools únicamente para alcanzar la autorización del backend; el backend rechazó la actualización como se esperaba. |
| Límite de reversión | Revertir únicamente este asentamiento de `openspec/changes/CR-003-P2/apply-progress.md`; no modifica comportamiento de fuente ni elimina evidencia previa. |

### Estado de verificación de la tarea 4.2

- Evidencia completa de LA-R1/R2: alta con SuperLínea seleccionada, catálogo genuinamente vacío, edición sin cambio, reasignación, errores de carga, actualización 404, actualización 403 de un registro protegido, creación anidada mediante `+`, refresco sin selección automática, conservación del estado padre y cancelación.
- La tarea 4.2 queda marcada como completada: todos sus escenarios runtime explícitos están cubiertos por la evidencia acumulada.
- La tarea 4.1 no cambia y permanece sin marcar.

## CR-003-P2 Focused Correction: Shared pagination quantity menu placement

**Status**: Awaiting maintainer browser reproduction. Task 4.1 remains open and is not marked complete.

### Root Cause

The shared `Paginacion` selector portals its menu to `document.body`, but had no explicit placement or viewport positioning. React Select therefore used its default downward placement and non-fixed positioning, allowing the menu to affect the observed page presentation in SuperLínea management.

### Correction

The shared quantity selector now sets `menuPlacement="top"` and `menuPosition="fixed"` while retaining `menuPortalTarget={document.body}` and its existing portal z-index. This opens the menu above its control and keeps the portaled menu viewport-positioned. Option values, page-reset behavior, visual styles, accessibility, and all 14 callers are unchanged.

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `git diff --check` — exit 0; no whitespace errors. No automated test runner is configured and `strict_tdd` is inactive. |
| Runtime harness command/scenario and exact result | N/A — browser reproduction is explicitly reserved for the maintainer. Required scenario: in SuperLínea management, open and close the quantity selector; the menu opens upward without shifting the interface or revealing a yellow background strip. |
| `yarn build` | Passed (exit 0): 2,413 modules transformed; production build completed in 3.61 seconds. |
| `yarn lint` | Failed (exit 1): 21 errors and 131 warnings, matching the documented baseline failure state. The changed file has one pre-existing warning at `paginacion.tsx:11` (`react-refresh/only-export-components`); no lint error is reported from the added props. |
| `yarn tsc -b` | Failed (exit 2) on existing project-wide diagnostics; no diagnostic cites `src/componentes/herramientas/reutilizables/paginacion.tsx`. |
| Rollback boundary | Revert `menuPlacement="top"` and `menuPosition="fixed"` in `src/componentes/herramientas/reutilizables/paginacion.tsx`; this restores only the prior shared quantity-menu positioning behavior. |

### Delivery Boundary

- Delivery mode: feature-branch-chain, focused shared-correction slice.
- Intended boundary: the two explicit React Select positioning props and this evidence record only; no branch, commit, push, pull request, merge, or target change was performed.
- Authored source impact: 2 added lines; within the review budget.

### Verification Status

- Static implementation and required quality commands are complete.
- Task 4.1 remains unchecked until the maintainer confirms the browser scenario.

## CR-003-P2 Asentamiento final de evidencia runtime: gestión de SuperLínea

**Revisión de evidencia fallida subsanada**: `sha256:07fe1d31231adc16e8de636f130c51a750e89fdb2202a1d190008305e53f2228`

### Evidencia runtime observada

El mantenedor confirmó que, acumulada con la evidencia previa de auditoría y la corrección visual focalizada, la totalidad de los escenarios de la tarea 4.1 se comporta correctamente en una sesión autenticada de navegador. La búsqueda por denominación y la limpieza de filtros funcionan; la paginación cambia de página sin solicitudes repetidas ni carga infinita; y el selector de cantidad abre hacia arriba sin desplazar la interfaz ni exponer la franja amarilla. Seleccionar otra cantidad pagina correctamente.

También confirmó altas y actualizaciones válidas, los límites de validación de denominación requerida y longitud máxima, y el error normalizado por denominación duplicada, conservando el estado del formulario. La eliminación exitosa y los errores normalizados 409 por dependencia, 403 por registro protegido y 404 por registro inexistente o desactualizado se comunicaron sin eliminar indebidamente el estado disponible. La auditoría abre mediante la acción `i`, muestra los datos correctos y no genera ninguna solicitud `/rol/undefined`. No se expone ninguna acción de impresión ni restauración.

### Evidencia de la unidad de trabajo

| Evidencia | Resultado |
|---|---|
| Comando de prueba focal y resultado exacto | No existe un comando de prueba automatizado para este asentamiento de navegador; `strict_tdd` está inactivo. No se ejecutaron verificaciones de fuente porque esta actualización solo registra evidencia confirmada por el mantenedor. |
| Comando/escenario de harness runtime y resultado exacto | Reproducción en navegador confirmada por el mantenedor: (1) búsqueda por denominación y limpieza de filtros; (2) cambio de páginas sin solicitudes repetidas ni carga infinita; (3) alta válida, límites requerido/máximo y error normalizado de denominación duplicada; (4) actualización válida y error duplicado con estado de formulario conservado; (5) eliminación exitosa y respuestas normalizadas 409 por dependencia, 403 de registro protegido y 404 de registro desactualizado; (6) auditoría con `i`, datos correctos y sin solicitud `/rol/undefined`; (7) ausencia de impresión y restauración; (8) selector de cantidad abierto hacia arriba sin desplazamiento ni franja amarilla, con paginación correcta al seleccionar otra cantidad. Resultado: todos los escenarios confirmados correctamente. |
| Límite de reversión | Revertir únicamente este asentamiento de `openspec/changes/CR-003-P2/apply-progress.md` y la marca de la tarea 4.1 en `openspec/changes/CR-003-P2/tasks.md`; no modifica comportamiento de fuente ni elimina evidencia previa. |

### Estado de verificación final

- La tarea 4.1 queda marcada como completada: la evidencia acumulada cubre SM-R1–R3 y SC-R1–R2, incluidos búsqueda, paginación, CRUD, validación, auditoría, errores 403/404/409 y ausencia de impresión/restauración.
- La tarea 4.2 permanece marcada como completada.
- Las 11 tareas de CR-003-P2 están marcadas como completadas.
