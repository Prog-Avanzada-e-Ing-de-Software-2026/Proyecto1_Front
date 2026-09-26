# Apply Progress: CR-004 — slices 1–3 + bounded correction (D1/D2 fixed) + apply round 2 (A3/A4 feedback)

**Change**: 2026-09-13-CR-004
**Mode**: Standard (strict_tdd: false — no test runner configured)
**Delivery**: chained PRs, `feature-branch-chain` (rounds 1–3) → 2026-09-14 maintainer scope reduction: **`size:exception` approved by maintainer 2026-09-14 — single PR** (apply round 2 onward)
**Branch**: CR-004 (uncommitted working-tree changes — no commit/branch/PR created, per repo policy)
**Chain position**: PR #1 targets the feature/tracker branch. PR #2 (services) targets the PR #1 branch. PR #3 (UI + wiring) targets the PR #2 branch.

## Slice Status Overview

| Slice / Work unit | Tasks | PR | Status |
|---|---|---|---|
| 1 — Contracts + SuperLínea shape fix | 1.1–1.3 | PR 1 | DONE (verified) |
| 2 — Feature services | 2.1–2.3 | PR 2 | DONE (verified) |
| 3 — Mode UI + per-endpoint role gating + wiring | 3.1–3.3, 4.1–4.9, 5.1 | PR 3 | DONE + bounded correction (D1/D2 fixed; 5.2 manual deferred) |
| 4 — Amendment feedback wiring (A3/A4; 6.1 WITHDRAWN) | 6.2–6.4 | size:exception single PR (folded) | DONE (statically verified; 5.2 manual deferred) |

---

# Slice 1 (PR 1 of 3) — Contracts + SuperLínea shape fix

## Completed Tasks

- [x] 1.1 Added `SelectOption` to `interfaces-generales.tsx`; `ProductoListResponse` + `BusquedaProductoPorDenominacionParams` + `BusquedaProductoPorSuperlineaParams` to `interfaces-producto.tsx`.
- [x] 1.2 Created `src/utils/selectOption.ts` with `esSelectOptionArray` (runtime guard: `codigo` number, `nombre`/`descripcion` strings) and `mapearSelectOptions` (`codigo → id`, `nombre → denominacion`).
- [x] 1.3 Fixed `superlinea-service.ts`: `obtenerSelect(denominacion?)` now consumes `SelectOption[]` via the shared guard/mapper and keeps returning `SelectSuperlinea[]`.

## Files Changed (slice 1)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/interfaces/generales/interfaces-generales.tsx` | Modified | Added `SelectOption { codigo, nombre, descripcion }`. |
| `src/interfaces/gestion-producto/producto/interfaces-producto.tsx` | Modified | Added `ProductoListResponse { data: ConsultarProducto[]; total }` and the two search-param types. Reused existing `ConsultarProducto` list item type. |
| `src/utils/selectOption.ts` | Created | Single mapping point: `esSelectOptionArray` guard + `mapearSelectOptions`. |
| `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` | Modified | `obtenerSelect(denominacion?)` → `GET /superlinea/select` with optional query param; validates `SelectOption[]`; maps to `SelectSuperlinea[]`; removed the obsolete `{data,total}` guard; preserved `contractError`. |

## Verification Commands (slice 1, exact observed results)

Baselines measured on this worktree BEFORE slice 1: `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-baseline\{tsc,lint,build}.txt`.
After-slice-1 outputs: `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-after\{tsc,lint,build}.txt`.

| Command | Exit | Observed result | vs baseline |
|---------|------|-----------------|-------------|
| `corepack yarn tsc -b` | **2** | 123 errors | 123 baseline → 123 after; **0 new, 0 removed** (set-compared on normalized first lines) |
| `corepack yarn lint` | **1** | 152 problems (21 errors, 131 warnings) | 152 baseline → 152 after; **0 new, 0 removed** (`no-empty` at `consultar-producto.tsx:162:15` is pre-existing) |
| `corepack yarn build` | **0** | `✓ 2414 modules transformed`, `built in 11.63s` | baseline `2413 modules`, `13.47s`; the +1 module is `src/utils/selectOption.ts`; still exit 0 |

## Work Unit Evidence (slice 1)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `corepack yarn tsc -b` → exit 2, 123 errors, **zero new** vs baseline (no focused test runner exists; type-check is the design's unit-1 command). |
| Runtime harness command/scenario and exact result | **Not executed in this automated run.** The applicable runtime boundary is the manual `Línea` create/edit selector (`registrar-actualizar-linea.tsx` → `SuperLineaService.obtenerSelect()`); driving a browser is out of scope and adding a test runner is out of scope/dependency-free. The caller was verified by reading it to compile unchanged against the new signature. Deferred to manual verification (tasks 5.2). |
| Rollback boundary | Revert exactly 4 files: `src/interfaces/generales/interfaces-generales.tsx`, `src/interfaces/gestion-producto/producto/interfaces-producto.tsx`, `src/utils/selectOption.ts` (delete), `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts`. |

## Deviations from Design (slice 1)

None — implementation matches `design.md` File Changes + Interfaces/Contracts for slice 1. The obsolete `isListResponse` helper in `superlinea-service.ts` was removed because the new parser replaces the only call site; `SuperLineaListResponseDto` is still imported for the untouched `obtener` method.

## Issues Found (slice 1)

None. `ConsultarProducto` was confirmed as the page's list item type (`useState<ConsultarProducto[]>`, `Column<ConsultarProducto>[]`), matching the design contract.

---

# Slice 2 (PR 2 of 3) — Feature services

## Completed Tasks

- [x] 2.1 `producto-service.tsx`: added `buscarPorDenominacion` (`GET /producto/search-by-denominacion`) and `buscarPorSuperlinea` (`GET /producto/search-by-superlinea`), both thin `ApiService.get` wrappers typed `Promise<ProductoListResponse>`. Reused slice-1 param/response types; no redeclaration.
- [x] 2.2 `linea-service.tsx`: added `buscarSelect(denominacion) => Promise<SelectLinea[]>` → `GET /linea/select?denominacion`; validated with the slice-1 shared `esSelectOptionArray` guard and mapped with `mapearSelectOptions` (single mapping point); mirrors slice-1's `contractError` convention.
- [x] 2.3 Confirmed by reading the code that a selected `Línea`'s products are fetched by reusing the existing `ProductoService.obtener({ lineaId, skip, take })` → `/producto/search-by`. **No new endpoint or method added.** (verified statement below)

## Files Changed (slice 2)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/componentes/gestion-producto/producto/services/producto-service.tsx` | Modified | Imported `ProductoListResponse` + the two `BusquedaProductoPor*Params` types; added `buscarPorDenominacion` and `buscarPorSuperlinea` as thin `ApiService.get(...) as Promise<ProductoListResponse>` methods (design contract style, matching `superlinea-service.ts`). |
| `src/componentes/gestion-producto/linea/services/linea-service.tsx` | Modified | Imported `SelectLinea` + `esSelectOptionArray`/`mapearSelectOptions`; added the slice-1 `contractError` helper; added `buscarSelect` consuming the plain `SelectOption[]` shape and returning `SelectLinea[]`. |

## Task 2.3 — verified statement (no endpoint added)

Reading the current code confirms the reuse path:
- `consultar-producto.tsx` L396–421 (`handleBuscarProductos`) builds `filtrosConPaginacion` including `lineaId: valoresFiltros.lineaId`, `skip`, `take`, then calls `ProductoService.obtener(filtrosConPaginacion)` and applies `{ data, total }`.
- `ProductoService.obtener` is inherited from `createCrudService("producto")` (`crudFactory.ts` L18–20) → `ApiService.get("/producto/search-by", filtros)`.

Therefore the selected-`Línea` result list can reuse `ProductoService.obtener({ lineaId, skip, take })` → `/producto/search-by`. Confirmed true; **no endpoint was invented and no method was added** for this path.

## Verification Commands (slice 2, exact observed results)

Baselines (unchanged, measured BEFORE any change): `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-baseline\{tsc,lint,build}.txt`.
After-slice-2 outputs: `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-slice2\{tsc,lint,build}.txt`.

| Command | Exit | Observed result | vs baseline |
|---------|------|-----------------|-------------|
| `corepack yarn tsc -b` | **2** | 123 errors | 123 → 123; **error set identical** (`Compare-Object` on all `error TS` lines → `TSC_SETS_IDENTICAL`); **0 new, 0 removed** |
| `corepack yarn lint` | **1** | 152 problems (21 errors, 131 warnings) | 152 → 152; **set identical ignoring line/col**; the only delta is the pre-existing `no-useless-catch` in `producto-service.tsx` shifting `18:5 → 29:5` (+11 authored lines above it); **0 new, 0 removed** |
| `corepack yarn build` | **0** | `✓ 2414 modules transformed`, `✓ built in 11.45s` | 2414 → 2414; still exit 0 (Browserslist staleness note is environmental, non-fatal) |

All three mandatory commands ran in the foreground. No new regression introduced.

## Work Unit Evidence (slice 2)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `corepack yarn tsc -b` → exit 2, 123 errors, **zero new** vs baseline (`TSC_SETS_IDENTICAL`). No focused test runner exists; type-check is the design's unit-2 command (`tasks.md` Suggested Work Units, unit 2). |
| Runtime harness command/scenario and exact result | **`N/A` — no caller yet.** Per `tasks.md` (unit 2: “Runtime harness: N/A (no caller yet)”), nothing wires these service methods until slice 3 mounts `BusquedaProducto` and the `consultar-producto.tsx` dispatcher. There is no reachable runtime path this slice can drive; browser driving is out of scope and adding a test runner is out of scope/dependency-free. |
| Rollback boundary | Revert exactly 2 files: `src/componentes/gestion-producto/producto/services/producto-service.tsx` and `src/componentes/gestion-producto/linea/services/linea-service.tsx`. These methods have no callers yet, so reverting removes only the slice-2 additions and removes no unrelated behavior; slice 1 (contracts) and slice 3 (UI) remain independently intact. |

## Deviations from Design (slice 2)

None — implementation matches `design.md` Interfaces/Contracts exactly (`buscarPorDenominacion`/`buscarPorSuperlinea` thin `ApiService.get` casts; `buscarSelect` → `/linea/select` returning `SelectLinea[]`). Wrapper style follows the design contract and the `superlinea-service.ts` precedent rather than the file's older try/catch methods, per the design's explicit contract. `mapearSelectOptions` returns `{id,denominacion}[]`, structurally assignable to `SelectLinea[]` (no second mapping).

## Issues Found (slice 2)

None. `SelectLinea` is `{ id: number; denominacion: string }` (`interfaces-linea.tsx` L34–37), matching the mapper's output shape.

---

# Slice 3 (PR 3 of 3) — Mode UI + per-endpoint role gating + wiring

## Completed Tasks

- [x] 3.1 Created `producto/componentes/busqueda-producto.tsx`: fully controlled, presentational segmented mode control + denominación input + Línea/SuperLínea selectors via the existing `EntidadSelectorBase` (`ocultarAgregar`). Renders only the modes the capability props permit (`denominacion` if `puedeBuscarPorDenominacion`; `linea`/`superlinea` if `puedeBuscarPorSeleccion`). No fetching, no role mapping, Enter-only (typing only updates page state; the selector Enter calls a page callback).
- [x] 3.2 TRAP respected: `herramientas/reutilizables/busqueda-producto.tsx` (`ConsultarProductosConFiltros`) was neither read-modified nor touched. Only the new file under `producto/componentes/` was created.
- [x] 3.3 Added `puedeBuscarPorDenominacion` and `puedeBuscarPorSeleccion` to `producto/domain/permisos-producto.ts`, in the existing `roles.includes(...) ||` predicate style (same file as `puedeHacerAcciones`), using the real `Rol` enum.
- [x] 4.1 Added `modoBusqueda` (`ModoBusqueda | null`, initialized to `"denominacion"` only when `puedeBuscarPorDenominacion(getRoles())`, else `null`), `criterioBusqueda`, and term/options/selection state.
- [x] 4.2 `handleCambiarModo` resets `criterioBusqueda`, `productos`, `entidadesTotales`, and calls `resetearPaginacion()`.
- [x] 4.3 `ejecutarBusquedaActiva(skip, take, criterio?)` dispatches to `buscarPorDenominacion` / `obtener({lineaId})` / `buscarPorSuperlinea`. Blank/whitespace denominación → empty result, **no request**.
- [x] 4.4 Failure path uses `addAlert(TipoAlerta.ERROR)`; `productos` is left intact and the page-level `error` is never set.
- [x] 4.5 Pagination effect now branches: `criterioBusqueda ? ejecutarBusquedaActiva() : handleBuscarProductos()`.
- [x] 4.6 Código debounce effect early-returns while `modoBusqueda !== null` (Enter-only guarantee for CR modes).
- [x] 4.7 Sidebar `buscar.cont` effect clears `modoBusqueda`/`criterioBusqueda` before `handleBuscarProductos(true)`.
- [x] 4.8 `BusquedaProducto` mounted once in `CardContent`, only when `puedeBuscarPorDenominacion || puedeBuscarPorSeleccion`, passing both capability booleans. Headers untouched.
- [x] 4.9 No-capability state (`Cobrador`): both predicates false → the component is not mounted at all (no empty segmented control) and no CR request can be issued; legacy código/sidebar flows unchanged.

## Files Changed (slice 3)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx` | Created | Controlled segmented mode control + denominación input + Línea/SuperLínea `EntidadSelectorBase` selectors; renders only permitted modes; no fetch. Exports `ModoBusqueda`. |
| `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` | Modified | Mode/criterion/term/options/selection state; ref mirrors for the debounce + pagination effects; three-service dispatcher with blank-term guard and alert-on-failure; mode-switch reset; sidebar mode clear; conditional `CardContent` mount passing both capability booleans. |
| `src/componentes/gestion-producto/producto/domain/permisos-producto.ts` | Modified | Added `puedeBuscarPorDenominacion` (Root/Administrador/Empleado/Vendedor/Repositor/Repartidor) and `puedeBuscarPorSeleccion` (Root/Administrador/Empleado). |

## Task 3.2 — TRAP verification (read-only)

`git status --porcelain` lists only `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx` as the new/untracked product-search component. `git diff --numstat` contains no entry for `src/componentes/herramientas/reutilizables/busqueda-producto.tsx`. The pre-existing `ConsultarProductosConFiltros` file is untouched.

## Verification Commands (slice 3, exact observed results)

Baselines (unchanged, measured BEFORE any change): `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-baseline\{tsc,lint,build}.txt`.
After-slice-3 outputs: `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-slice3\{tsc,lint,build}.txt`.

| Command | Exit | Observed result | vs baseline |
|---------|------|-----------------|-------------|
| `corepack yarn tsc -b` | **2** | 123 errors | 123 → 123. Error set diff = exactly **one line-number shift** for the pre-existing `DatosTabla` TS2322 in `consultar-producto.tsx` (`557,19 → 766,19`), caused by authored insertions above it. **0 new, 0 removed**; code distribution identical (TS2307=43, TS2322=41, TS2345=19, TS2339=8, TS2304=8, TS2305=4). |
| `corepack yarn lint` | **1** | 152 problems (21 errors, 131 warnings) | 152 → 152; normalized set (file + rule + message, ignoring line/col) **byte-identical** (`LINT_SETS_IDENTICAL`). **0 new, 0 removed.** `consultar-producto.tsx:162:15 no-empty` remains pre-existing. |
| `corepack yarn build` | **0** | `✓ 2415 modules transformed`, `✓ built in 12.02s` | baseline 2414 → 2415 modules; the +1 module is `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx`; still exit 0 (Browserslist staleness note is environmental, non-fatal). |

All three mandatory commands ran in the foreground. No new regression introduced.

## Work Unit Evidence (slice 3)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `corepack yarn tsc -b` → exit 2, 123 errors, **zero new** vs baseline (only the expected line-number shift of a pre-existing error). No test runner exists (`strict_tdd: false`); type-check is the design's unit-3 command. |
| Runtime harness command/scenario and exact result | **Partially N/A in this automated run.** The build (`corepack yarn build`, exit 0) is the only executable runtime boundary available without a browser/backend. The design's manual per-role scenarios (Enter-only, `cafe`≠`Café`, mode reset, `Cobrador` no-mount/no-request) require a running app + backend and are recorded as task 5.2 — deferred to `sdd-verify`. Static review confirms: typing only updates page state; requests are issued solely from Enter/selection; `Cobrador` never mounts the control (`puedeBuscarPorDenominacion || puedeBuscarPorSeleccion` is false). |
| Rollback boundary | Revert exactly 3 files: delete `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx`, and revert `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` + `src/componentes/gestion-producto/producto/domain/permisos-producto.ts`. Slices 1–2 (contracts/services) remain intact; nothing else references `BusquedaProducto` or the two predicates. |

## Deviations from Design (slice 3)

1. **Criterion passed to the dispatcher as an optional 3rd argument.** The design/task signature is `ejecutarBusquedaActiva(skip, take)`. Enter/selection handlers compute the criterion locally and pass it as a third optional argument because reading `criterioBusqueda` from the closure immediately after `setCriterioBusqueda` would see the stale (previous) value and silently skip the first search. The pagination path still calls `ejecutarBusquedaActiva()` with no argument, using the mirrored ref, exactly as described.
2. **Ref mirrors for `modoBusqueda`, `criterioBusqueda`, and the dispatcher**, consumed by the two pre-existing effects. The underlying React reason is behavioral, not cosmetic: adding `criterioBusqueda` (or `modoBusqueda`) to those effects' dependency arrays would fire an extra/incorrect request (double search on Enter from a later page; a spurious quick-search 400 ms after the sidebar clears the mode). The refs keep the exact `react-hooks/exhaustive-deps` warning set of the baseline (lint set identical).
3. **`ModoBusqueda` is exported from `busqueda-producto.tsx`** and imported by the page, rather than redefined in `consultar-producto.tsx`, to keep one owner of the union and avoid a circular type import.

None of these change observable behavior relative to the spec/design; they are implementation mechanics required for correctness and baseline preservation.

## Issues Found (slice 3)

1. **Double request on Enter when initiated from a page > 1 (design-level risk, not introduced by an implementation mistake).** `handleBuscarPorDenominacion`/selection both call `resetearPaginacion()` and then the dispatcher. If `paginaActual` was > 1, `resetearPaginacion()` changes it to 1, which re-runs the pagination effect; with a non-null criterion the effect also calls `ejecutarBusquedaActiva()`, so the same search is issued twice (handler + effect). From page 1 the reset is a no-op and only one request is sent. This tension is inherent to the prescribed 4.2/4.5 combination (`resetearPaginacion()` in the handler **and** a criterion-driven pagination effect) and is reported rather than silently patched, because the tasks prescribe both mechanisms. If `sdd-verify` treats "Enter searches once" (§Enter-only trigger) strictly from any page, the fix belongs in a design revision (e.g., let the effect own the fetch when a reset occurs, or dedupe in-flight requests). → **RESOLVED** by the Bounded Correction section below (the effect is now the single fetch owner).
2. **Mode switch with `criterioBusqueda = null` can transiently re-run the legacy list.** Switching mode resets the criterion (4.2). If that reset also changes `paginaActual`, the pagination effect sees a null criterion and calls the legacy `handleBuscarProductos()`. This is the design's prescribed `criterioBusqueda ? … : handleBuscarProductos()` behavior; the empty list set by 4.2 is then repopulated by legacy filters until the user searches. Reported for `sdd-verify`; not changed to respect the explicit task instructions. → **RESOLVED** by the Bounded Correction section below (`modoBusqueda === null` guard keeps legacy out of a CR mode).

## Remaining Tasks (slice 3 / PR 3)

- [ ] 5.2 Manual verification (Enter-only, `cafe`≠`Café`, Línea/SuperLínea, mode reset, pagination, whitespace, failure, Línea selector, per-role modes, `Cobrador` no mount/no request). **Not executed in this automated apply run** — needs a running frontend + backend + browser; explicitly deferred to `sdd-verify`. Not marked complete to avoid fabricating evidence.

## Workload / PR Boundary (slice 3)

- Mode: **chained PR slice** (`feature-branch-chain`), PR 3 of 3 (base = PR 2 branch).
- Current work unit: **3 — Mode UI + per-endpoint role gating + wiring**.
- Starts from: slices 1–2 present (contracts + `SelectOption` mapper + services `buscarPorDenominacion`/`buscarPorSuperlinea`/`buscarSelect`). Ends with: the `ConsultarProductos` page offering per-role search modes that issue requests only on Enter/selection, with dispatcher + pagination re-drive + legacy reclaim.
- Authored diff (slice 3 only, `git diff --numstat` + new file): **+379 / −5 = 384 changed lines** (consultar-producto +213/−4; permiso-producto +14/−1; busqueda-producto +152/−0). Within the 320–400 estimate; no `size:exception` needed.
- Rollback boundary: the 3 files listed above. No dependency, route, context, or backend change.
- Chain strategy: `feature-branch-chain` (per the resolved delivery context). `tasks.md`'s Review Workload Forecast block was left untouched (no re-planning).

---

# Bounded Correction (post-verify) — effect as single fetch owner

Confined to `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx`. Task checkboxes in `tasks.md` were left as they are.

## Defects fixed (both confirmed by reading the code)

- **Defect 1 — duplicate CR request on Enter/selection when `paginaActual > 1`.** The three handlers (`handleBuscarPorDenominacion`, `handleSeleccionarLinea`, `handleSeleccionarSuperlinea`) committed the criterion AND dispatched directly (`ejecutarBusquedaActiva(0, take, criterio)`) while also calling `resetearPaginacion()`. Because `resetearPaginacion()` changes `paginaActual` to 1, the pagination effect re-ran and issued the SAME search again. Violates `producto-busqueda-parcial` → "Enter searches once" ("exactly one search request MUST be issued"). From page 1 the double was masked because the reset was a no-op.
- **Defect 2 — legacy repopulation on mode switch.** `handleCambiarModo` set `criterioBusqueda = null`; with `paginaActual > 1` the effect re-ran and fell through to `handleBuscarProductos()` (legacy), repopulating the list. Violates `producto-busqueda-parcial` → "Mode switch resets" ("pagination MUST reset and prior results MUST NOT remain").

## Correction applied (per the corrected `design.md` Data Flow)

1. **Handlers are pure state setters.** Removed every direct `ejecutarBusquedaActiva(...)` call from the three handlers; each now only commits its criterion and calls `resetearPaginacion()`. The committed criterion per handler is unchanged.
2. **Effect re-keyed and made the single fetch owner.** Deps now `[criterioBusqueda, modoBusqueda, paginaActual, filtrosInicializados, take, setEntidadesTotales]`.
3. **Three-branch effect body:** committed criterion → `ejecutarBusquedaActivaRef.current()` (one CR request); no criterion + `modoBusqueda === null` → legacy `handleBuscarProductos()`; no criterion + CR mode engaged → clear results, no request.
4. **Page changes re-drive the active search once**: `paginaActual`/`take` remain deps, so a page change runs the effect once against the current `skip`/`take`.
5. **Dead code trimmed:** removed the now-unused `criterioBusquedaRef` and the now-unused optional `skipParam`/`takeParam`/`criterioActivo` parameters of `ejecutarBusquedaActiva`. `modoBusquedaRef` is kept (still used by the código debounce early-return).

## Preserved unchanged

Enter-only (no request per keystroke); the código debounce early-return while a CR mode is engaged; the sidebar `buscar.cont` reclaim; per-endpoint role gating; the `Cobrador` no-mount/no-request state; the page-level `addAlert(ERROR)` failure handling (never the page-level `error`); the single `CardContent` mount; headers untouched.

## Manual checks required (human / `sdd-verify`)

- **(a)** While on a results page > 1, pressing Enter (or selecting a Línea/SuperLínea) issues **exactly ONE** request.
- **(b)** While on a page > 1, switching search mode shows **no legacy results** — the list clears and stays empty (no request).

## Verification Commands (bounded correction, exact observed results)

Baselines (unchanged, measured BEFORE any change): `...\cr004-baseline\{tsc,lint,build}.txt`.
After-correction outputs: `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-fix\{tsc,lint,build}.txt`.

| Command | Exit | Observed result | vs baseline |
|---------|------|-----------------|-------------|
| `corepack yarn tsc -b` | **2** | 123 errors | 123 → 123; normalized set (file+code+message, line/col stripped) `TSC_SETS_IDENTICAL`; distribution identical (TS2307=43, TS2322=41, TS2345=19, TS2339=8, TS2304=8, TS2305=4). **0 new, 0 removed**. |
| `corepack yarn lint` | **1** | 152 problems (21 errors, 131 warnings) | 152 → 152; normalized set (file+rule+message, line/col stripped) `LINT_SETS_IDENTICAL`. **0 new, 0 removed**. |
| `corepack yarn build` | **0** | `✓ 2415 modules transformed`, `✓ built in 14.50s` | 2415 → 2415 modules; still exit 0. |

All three mandatory commands ran in the FOREGROUND. No new regression introduced.

## Work Unit Evidence (bounded correction)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `corepack yarn tsc -b` → exit 2, 123 errors, `TSC_SETS_IDENTICAL` vs baseline (zero new). No test runner exists (`strict_tdd: false`); type-check is the design's unit-3 command. |
| Runtime harness command/scenario and exact result | `corepack yarn build` → exit 0 (the only executable boundary available without a browser + backend). The two behavioral checks (a) and (b) are recorded above as manual and deferred to `sdd-verify`. |
| Rollback boundary | Revert only `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` to its slice-3 bytes — the correction is confined to this one file; slices 1–3 and every other file remain intact. |

## Deviations from Design (bounded correction)

1. `setEntidadesTotales` added to the effect dependency array (the design showed `[... take]` with "e.g."). It is a stable `useState` setter returned by `usePaginacion`; `react-hooks/exhaustive-deps` cannot statically prove its stability, so including it keeps the normalized lint problem set byte-identical to baseline. Behavior-neutral.
2. `ejecutarBusquedaActiva`'s now-unused optional parameters were removed (explicitly permitted: "trim genuinely-dead code in it").

## Issues Found (bounded correction)

1. **(Residual, follows from the corrected design — flag for verify)** For roles permitted to search (`Root`/`Administrador`/`Empleado`/`Vendedor`/`Repositor`/`Repartidor`), `modoBusqueda` initializes to `"denominacion"` (task 4.1), so on mount the three-branch effect takes the "CR mode engaged, no criterion" branch: results start empty and the legacy list is NOT pre-loaded. This is not one of the two defects and no spec scenario mandates an initial auto-load.
2. **(Residual, follows from the corrected design — flag for verify)** The sidebar `buscar.cont` reclaim still calls `handleBuscarProductos(true)` directly while also clearing `modoBusqueda`/`criterioBusqueda`; because those are now effect deps, the effect can run once more and repeat the idempotent legacy fetch. The corrected design explicitly keeps this effect unchanged and describes that next run, so it is out of scope for this bounded correction.
3. No other issue found; Defect 1 and Defect 2 are fixed at their root cause (single fetch owner).

## Bounded Correction — file changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` | Modified | Handlers became pure state setters (direct dispatch removed); pagination effect re-keyed on `criterioBusqueda`/`modoBusqueda` + three-branch body; dead `criterioBusquedaRef` and dead dispatcher params trimmed. |

---

# Apply Round 2 (2026-09-14) — Amendment: visible search feedback (A3/A4 only; 6.1 WITHDRAWN)

`size:exception approved by maintainer 2026-09-14 — single PR` (full unmerged change >400 lines; the round-2 delta itself is small). Task 6.1 was NOT implemented: the no-criterion CR `else` branch (effect, now L697-701) stays byte-for-byte as landed — clears `productos`/`entidadesTotales`, no request.

## Completed Tasks (round 2)

- [x] 6.2 Denominación feedback wiring in `consultar-producto.tsx`: module-level shared singular/plural phrase builder `fraseResultadosBusqueda(cantidad, singular, plural, termino)` (one wording owner for all three modes; count 0 renders the no-results variant); component-level `avisarTerminoVacio()` (WARNING `Escribe un término para buscar.`) and `avisarResultados()` (INFO counts / WARNING no-matches, `TituloAlerta.{INFO,WARNING}`, `autoClose: true, duration: 3000`); one-shot `pendienteFeedbackRef` armed ONLY by the Enter commit in `handleBuscarPorDenominacion`, consumed (read + reset) at the very start of `ejecutarBusquedaActiva`; blank-term early return fires the hint only when the flag was armed (still no request); after a successful denominación response the count toast uses the service `total` (0 → WARNING no-results); ERROR path unchanged and never co-fires with a count toast.
- [x] 6.3 Option-handler feedback: blank/whitespace guard at the top of `handleBuscarLineas` and `handleBuscarSuperlineas` (clear options, hint toast, NO request); after success, `avisarResultados(opciones.length, …)` with exact A3 nouns (`Línea`/`Líneas`, `SuperLínea`/`SuperLíneas`) and the trimmed term in `«…»`. Selection handlers (`handleSeleccionarLinea`/`handleSeleccionarSuperlinea`), `handleCambiarModo`, effect deps, headers, sidebar flows, services, and `busqueda-producto.tsx` untouched → selections, page changes, mode switches, and entry never toast (A4).
- [x] 6.4 Static verification of the feedback-only delta — all three commands re-run against the recorded baselines; 0 new problems (exact results below).

## Files Changed (round 2)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` | Modified | A3/A4 feedback wiring ONLY: phrase builder + two toast helpers + `pendienteFeedbackRef` (arm on Enter / consume at fetch start) + gated blank-term hint and count toasts in `ejecutarBusquedaActiva` + blank guards and count toasts in the two option handlers. Round-2 delta: +71 lines (git numstat 210→281 added vs HEAD), 0 deletions; includes English comments and the verbatim Spanish UI strings from design A3. |

## Verification Commands (apply round 2, exact observed results)

Baselines (unchanged, measured BEFORE any change): `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-baseline\{tsc,lint,build}.txt`.
After-round-2 outputs: `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-round2\{tsc,lint,build}.txt`.

| Command | Exit | Observed result | vs baseline |
|---------|------|-----------------|-------------|
| `corepack yarn tsc -b` | **2** | 123 errors | 123 → 123; normalized set (file+code+message, `(line,col)` stripped) `TSC_SETS_IDENTICAL`. **0 new, 0 removed.** |
| `corepack yarn lint` | **1** | 152 problems (21 errors, 131 warnings) | 152 → 152; normalized set (file+severity+message, line/col stripped) `LINT_SETS_IDENTICAL`. **0 new, 0 removed.** |
| `corepack yarn build` | **0** | `✓ 2415 modules transformed`, `✓ built in 33.14s` | still exit 0; module count unchanged (no new files; Browserslist staleness note is environmental, non-fatal). |

All three mandatory commands ran in the FOREGROUND. `node_modules` was present — no install needed. No new regression introduced.

## Work Unit Evidence (round 2 — unit 4, feedback-only amendment)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `corepack yarn tsc -b` → exit 2, 123 errors, `TSC_SETS_IDENTICAL` vs baseline (zero new). No test runner exists (`strict_tdd: false`); type-check is the tasks' unit-4 focused command. |
| Runtime harness command/scenario and exact result | `corepack yarn build` → exit 0 (only executable boundary without browser + backend). The A3/A4 behavioral scenarios (Enter count toast, blank-Enter hint with zero requests in DevTools Network, silent selection/page-change/mode-switch) require `yarn dev` + backend and are the re-scoped manual task 5.2 — explicitly NOT executed in this automated run, deferred to the manual pass; 5.2 left unchecked. |
| Rollback boundary | Revert ONLY the round-2 feedback lines in `consultar-producto.tsx` (phrase builder, two toast helpers, `pendienteFeedbackRef` + its arm/consume/gate sites, blank guards, count-toast calls) — restores the bounded-correction bytes; slices 1–3 and every other file remain intact. |

## Deviations from Design (round 2)

1. Toast firing is wrapped in two component-local helpers (`avisarTerminoVacio`, `avisarResultados`) instead of inlining five `addAlert` calls — the design's "one local phrase builder… do not duplicate wording" extended to the shared `autoClose/duration/title` shape. Same strings, same TipoAlerta mapping, same firing points.
2. The denominación count toast is additionally gated on `criterio.tipo === "denominacion"` (defensive; the flag can only be armed by the denominación Enter commit anyway).
3. Option handlers keep passing the RAW term to the service (existing behavior); only the toast uses the trimmed term, per A3 ("term = trimmed criterion").

## Issues Found (round 2)

None. Static review confirms: `pendienteFeedbackRef.current = true` appears exactly once (Enter commit); consumption is at fetch start (read + reset); no toast path writes `productos`/`entidadesTotales` (spec `Feedback never clears results`); the withdrawn 6.1 else-branch is untouched.
