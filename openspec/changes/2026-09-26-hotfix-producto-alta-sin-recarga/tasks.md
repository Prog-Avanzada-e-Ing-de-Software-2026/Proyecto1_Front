# Tasks: Hotfix — Producto Post-Mutation List Behavior

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~15–20 (two handlers in one file) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | single-pr |

Decision needed before apply: No — budget risk Low, single PR
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely commit |
|------|------|---------------|
| 1 | Create success refreshes only with an active search | `fix(producto): refresca el listado al crear solo con búsqueda activa` |
| 2 | Edit success reloads by active criterion | `fix(producto): recarga la edición según el criterio activo` |

## 1. Create flow

- [x] 1.1 In `consultar-producto.tsx`, add `busquedaRapida` to the `useFiltrosContext` destructure and a `refrescarListadoVigente` helper (CR → `ejecutarBusquedaActivaRef`; `busquedaRapida` → `handleBuscarProductosRapido`; else → `handleBuscarProductos`).
- [x] 1.2 In `handleSuccess`, keep `closeModal()` + success alert and call the helper only when `criterioBusqueda` is set or `modoBusqueda === null && (busquedaRapida || buscar.cont > 0)`.
- [x] 1.3 Confirm `onSuccessAlta` still receives the message and the modal closes; no list request is issued in the empty/no-criterion state.

## 2. Edit flow

- [x] 2.1 In `handleActualizarSuccess`, replace the unconditional `handleBuscarProductos()` with `refrescarListadoVigente()` when `criterioBusqueda` is set or `modoBusqueda === null`; no request otherwise.
- [x] 2.2 Confirm the criterion mapping matches the existing search flows (`ejecutarBusquedaActiva` CR criterion, `handleBuscarProductosRapido` código, `handleBuscarProductos` filters/legacy) and that the pagination effect's deps/identity are unchanged.

## 3. Verification

- [x] 3.1 Run `yarn build` and record the result. → PASS (`✓ built in 3.89s`).
- [x] 3.2 Run `yarn tsc -b` and `yarn lint`; classify failures as pre-existing vs introduced. → `tsc` fails with pre-existing errors in unrelated files (0 errors in `consultar-producto.tsx`); `lint` reports only pre-existing errors/warnings in the file (empty `finally` blocks at `:222`/`:244`). No new failures introduced.
- [ ] 3.3 Manually verify: create with CR mode/no criterion → no request, empty table; create after denominación/Línea/SuperLínea, código, or sidebar search → same criterion re-searched; edit under the same criteria → re-searched; edit with no CR mode → legacy refresh. → PENDING (requires running app; not executed here).
