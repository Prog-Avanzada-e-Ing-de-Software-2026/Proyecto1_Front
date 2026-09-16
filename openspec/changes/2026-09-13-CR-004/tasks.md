# Tasks: CR-004 — Partial-match product search

## Review Workload Forecast (revised 2026-09-14 — maintainer scope reduction)

| Field | Value |
|-------|-------|
| Estimated changed lines | Remaining code delta ≈ 25–45 (A3/A4 feedback wiring in `consultar-producto.tsx` only; 6.1 withdrawn → no effect change). FULL unmerged change ≈ 515–535 (working tree ≈ 490 + amendment) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Maintainer choice: single PR with approved `size:exception` (slices 1–3 + feedback-only amendment), or fallback chain PR 3a (UI/wiring) → PR 3b (feedback amendment, ≈ 25–45 lines) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception (pending maintainer approval; fallback feature-branch-chain) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

Nothing is committed yet (last merge: CR-003). Under the cached `single-pr` delivery strategy, apply still requires an explicit maintainer-approved `size:exception`: the FULL unmerged diff remains >400 lines even after the scope reduction, although the remaining amendment delta itself is small (≈ 25–45 lines).

### Suggested Work Units (current)

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 4 | Amendment: search feedback toasts ONLY (tasks 6.2–6.3; 6.1 withdrawn) | PR 4 (or folded into the size-exception single PR) | `yarn tsc -b` | `yarn dev` + backend: Enter/blank/option/page-change pass (5.2) | `consultar-producto.tsx` feedback lines only (6.2–6.3); revert restores slice-3 bytes |

### Previous forecast (superseded 2026-09-14 by the maintainer scope reduction — kept for audit)

| Field | Value |
|-------|-------|
| Estimated changed lines | ≈ 530–570 for the FULL unmerged change: working tree ≈ 490 today (279+/28− across 8 tracked files + untracked `busqueda-producto.tsx` 167, `selectOption.ts` 16); Phase 6 adds ≈ 40–80 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Maintainer choice: single PR with approved `size:exception` (slices 1–3 + amendment), or fallback chain PR 3a (UI/wiring) → PR 3b (amendment, ≈ 40–80 lines) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception (pending maintainer approval; fallback feature-branch-chain) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

Nothing is committed yet (last merge: CR-003). Under the cached `single-pr` delivery strategy, apply requires an explicit maintainer-approved `size:exception` for this >400-line diff; the chained-PR fallback isolates the amendment as its own reviewable slice.

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 4 | Amendment: unfiltered listing + feedback toasts (tasks 6.1–6.3) | PR 4 (or folded into the size-exception single PR) | `yarn tsc -b` | `yarn dev` + backend: entry/switch/Enter/blank/page-change pass (5.2) | `consultar-producto.tsx` amendment lines only (6.1–6.3); revert restores slice-3 bytes |

### Historical forecast (superseded 2026-09-14 — kept for audit)

| Field | Value |
|-------|-------|
| Estimated changed lines | 320–400 (slice 3 remaining; PR 3 of 3) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 contracts+shape ✓ → PR 2 services ✓ → PR 3 UI + role gating (remaining) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain (tracker branch) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

Remaining (slice 3): `busqueda-producto` +150–200; `consultar-producto` +150–190; `permisos-producto` +8–12. Delivered: slices 1–2 (+≈150) and verified.

#### Historical work units 1–3 (DONE)

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Contracts + SuperLínea shape fix (DONE) | PR 1 | `yarn tsc -b` | Manual: Línea selector | types, `selectOption.ts`, `superlinea-service.ts` |
| 2 | CR service methods (DONE) | PR 2 | `yarn tsc -b` | N/A (no caller yet) | `producto-service.tsx`, `linea-service.tsx` |
| 3 | Mode UI + per-endpoint role gating + wiring (base = PR 2 branch) | PR 3 | `yarn tsc -b`, `yarn build` | Manual: per-role modes; `Cobrador` no mount/no request | `busqueda-producto.tsx`, `consultar-producto.tsx`, `permisos-producto.ts` |

No test runner (`strict_tdd: false`); static + manual.

## Phase 1 — Contracts & shared shape

- [x] 1.1 Add `SelectOption` to `interfaces-generales.tsx`; `ProductoListResponse` + search-param types to `interfaces-producto.tsx`. (PBP contracts, R2, R4; LSA)
- [x] 1.2 Create `src/utils/selectOption.ts`: `esSelectOptionArray` + `mapearSelectOptions` (`codigo→id`, `nombre→denominacion`). (LSA)
- [x] 1.3 Fix `superlinea-service.ts` `obtenerSelect(denominacion?)` to consume `SelectOption[]`; PR 1, never stranded. (LSA)

## Phase 2 — Feature services

- [x] 2.1 `producto-service.tsx`: add `buscarPorDenominacion` and `buscarPorSuperlinea`. (PBP R2, R4, R7)
- [x] 2.2 `linea-service.tsx`: add `buscarSelect` to `/linea/select`, mapped to `SelectLinea[]`. (PBP R3; LSA)
- [x] 2.3 Línea products reuse `ProductoService.obtener({lineaId,skip,take})`; no endpoint. (PBP R3)

## Phase 3 — Presentational component

- [x] 3.1 Create `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx`: controlled segmented control rendering ONLY the modes the role permits (`denominación` if `puedeBuscarPorDenominacion`; `Línea`/`SuperLínea` if `puedeBuscarPorSeleccion`) + denominación input + selectors via `EntidadSelectorBase` (`ocultarAgregar`); Enter-only, no fetch, no role mapping. (PBP R2–R5; `Role-restricted search modes`)
- [x] 3.2 Trap: never edit `herramientas/reutilizables/busqueda-producto.tsx` (`ConsultarProductosConFiltros`). (all)
- [x] 3.3 Add `puedeBuscarPorDenominacion(roles)` (`Root`/`Administrador`/`Empleado`/`Vendedor`/`Repositor`/`Repartidor`) and `puedeBuscarPorSeleccion(roles)` (`Root`/`Administrador`/`Empleado`) to `src/componentes/gestion-producto/producto/domain/permisos-producto.ts`, matching `puedeHacerAcciones` style; predicate foundation for 3.1/4.1. (`Role-restricted search modes` all three role scenarios)

## Phase 4 — Page wiring (`consultar-producto.tsx`)

- [x] 4.1 Add `modoBusqueda` + `criterioBusqueda` + term/options/selection state; `modoBusqueda` initializes to `"denominacion"` only when `puedeBuscarPorDenominacion(getRoles())`, else `null` (keeps legacy código active for `Cobrador`). (PBP R6; `Role-restricted search modes` neither)
- [x] 4.2 Mode switch resets `criterioBusqueda`, `productos`, `entidadesTotales`, `resetearPaginacion()`. (PBP R6)
- [x] 4.3 Dispatcher `ejecutarBusquedaActiva(skip,take)` for the 3 services; blank/whitespace empty, no request. (PBP R2, R3, R4, R7, R9)
- [x] 4.4 On failure `addAlert(ERROR)`; keep `productos` intact, never page-level `error`. (PBP R10)
- [x] 4.5 Pagination effect (L445-449): `criterioBusqueda ? ejecutarBusquedaActiva() : handleBuscarProductos()`. (PBP R7)
- [x] 4.6 Early-return código debounce (L116-122) when `modoBusqueda !== null`. (PBP R5)
- [x] 4.7 Sidebar `buscar.cont` effect (L124-128): clear `modoBusqueda`/`criterioBusqueda` before `handleBuscarProductos(true)`. (PBP R6)
- [x] 4.8 Mount `BusquedaProducto` once in `CardContent` (L548) only when `puedeBuscarPorDenominacion || puedeBuscarPorSeleccion`, passing both booleans; headers untouched. (PBP R2, R3, R4; `Role-restricted search modes`)
- [x] 4.9 No-capability state: when both predicates are false (`Cobrador`) render no mount — no empty segmented control — and issue no CR request; legacy código/sidebar flows unchanged. (`Role-restricted search modes` neither)

## Phase 5 — Verification (static + manual)

- [x] 5.1 Run `yarn tsc -b`, `yarn lint`, `yarn build`; compare to baseline. (all)
- [ ] 5.2 Manual: Enter-only (R5); `cafe`≠`Café` (R1); Línea/SuperLínea (R3/R4); mode reset (R6); pages (R7); whitespace (R9); failure (R10); Línea selector (LSA); per-role modes and `Cobrador` no mount/no request (`Role-restricted search modes`). Amendment scenarios (re-scoped 2026-09-14 to feedback-only after the maintainer scope reduction — the unfiltered-entry/switch-to-unfiltered checks were removed together with withdrawn 6.1; verify after 6.2–6.3): entry under a CR mode stays blank until search (no request, no toast — restored spec behavior); mode switch clears and is silent; Enter shows the count/no-results toast; blank Enter shows the hint with zero requests (DevTools Network); option searches report counts/no-matches; page changes and entry never toast; failed search shows only the existing ERROR; `Cobrador` untouched/unchanged.

## Phase 6 — Amendment: visible search feedback (2026-09-14; unfiltered listing WITHDRAWN same day)

Feedback strings (verbatim from design A3; `addAlert` with `autoClose: true, duration: 3000`, titles from `TituloAlerta`; `{término}` = trimmed criterion; one local singular/plural phrase builder shared by the three modes — do not duplicate wording):

| Event | TipoAlerta | Message |
|---|---|---|
| Denominación N=1 / N>1 | INFO | `Se encontró 1 producto para «{término}».` / `Se encontraron {total} productos para «{término}».` (`total` = service response) |
| Denominación no matches | WARNING | `No se encontraron productos para «{término}».` |
| Blank/whitespace Enter (any mode) | WARNING | `Escribe un término para buscar.` (no request issued) |
| Línea options N=1 / N>1 | INFO | `Se encontró 1 Línea para «{término}».` / `Se encontraron {n} Líneas para «{término}».` |
| Línea no matches | WARNING | `No se encontraron Líneas para «{término}».` |
| SuperLínea options N=1 / N>1 | INFO | `Se encontró 1 SuperLínea para «{término}».` / `Se encontraron {n} SuperLíneas para «{término}».` |
| SuperLínea no matches | WARNING | `No se encontraron SuperLíneas para «{término}».` |

- [ ] ~~6.1~~ **[WITHDRAWN 2026-09-14 — maintainer scope reduction — DO NOT IMPLEMENT]** ~~(A1/A2; spec `Unfiltered listing on entry` all scenarios + `Switch resets to unfiltered listing`) In `consultar-producto.tsx`, replace the no-criterion CR `else` branch (current L626-630: `setProductos([])`/`setEntidadesTotales(0)`) with `handleBuscarProductos()`; keep the two no-criterion branches separate (legacy vs CR-unfiltered ownership). `handleCambiarModo` keeps its explicit clear + `resetearPaginacion()` (A2). Verify statically: entry/mode-switch/unfiltered paging now fetch; `Cobrador` path (`modoBusqueda === null`) unchanged; blank-term early-return still yields empty, never the unfiltered branch (A1 third bullet).~~ **Audit:** the spec `Unfiltered listing on entry` was reverted; the no-criterion CR branch (L626-630) stays exactly as landed — clears `productos`/`entidadesTotales`, no request (entry stays blank-until-search). This task is withdrawn and must not be implemented; the only operative Phase 6 work is A3/A4 feedback (6.2–6.3).
- [x] 6.2 (A3/A4; spec `Visible search feedback` — `Denominación matches reported`, `Denominación no matches reported`, `Blank term hint shown`, `Feedback never clears results`) In `consultar-producto.tsx`, feedback wiring ONLY — independent of the withdrawn 6.1: do NOT touch the no-criterion CR `else` branch (L626-630 stays as landed). Add one-shot `pendienteFeedbackRef` set ONLY by the denominación Enter commit in `handleBuscarPorDenominacion`; consume it at fetch start in `ejecutarBusquedaActiva` and fire the denominación count/no-results toasts (INFO / WARNING, exact strings from the A3 table above) ONLY on success (page-change re-runs silent; failure keeps only the existing ERROR). At the existing blank-term early-return (L496-500), gated by the same ref, fire the blank-term hint `Escribe un término para buscar.` (WARNING, no request). Add the shared singular/plural phrase builder. Verify statically: refs set only on Enter; toasts never touch `productos`.
- [x] 6.3 (A3/A4; spec `Visible search feedback` — `Option search reported`, `Blank term hint shown`) In `consultar-producto.tsx`, add a blank-term guard at the top of `handleBuscarLineas` and `handleBuscarSuperlineas` (blank/whitespace → options cleared, hint toast `Escribe un término para buscar.` WARNING, NO request); after the service returns, fire option-count/no-matches toasts with the exact Spanish strings and TipoAlerta values from the A3 table above (INFO counts / WARNING no-matches, `«{término}»`, shared phrase builder). Selecting an option fires no toast. Verify statically: no request on blank term; counts use returned option length.
- [x] 6.4 Static verification of the feedback-only delta (tasks 6.2–6.3; 6.1 withdrawn, no effect change to verify): `yarn tsc -b`, `yarn lint`, `yarn build`; compare to recorded baselines (123 tsc / 152 lint / build exit 0) — 0 new problems. Manual scenarios ride on the feedback checks in the re-scoped 5.2.

## Open Questions

- Resolved (U6): per-endpoint gating — `Root`/`Administrador`/`Empleado` get all modes; `Vendedor`/`Repositor`/`Repartidor` denominación only; `Cobrador` none, no request.
- Open: sidebar filter search passively clears the active CR mode (U2).
- Open: código quick search stays the legacy default vs. a fourth segment (U3).
