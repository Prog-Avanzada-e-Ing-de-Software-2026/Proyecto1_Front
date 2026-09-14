# Verification Report — CR-004 (partial-match product search by denominación, Línea, SuperLínea)

- **Change**: `2026-09-13-CR-004`
- **Branch**: `CR-004` (working tree UNCOMMITTED — no commit, branch, or PR was created)
- **Mode**: Standard (OpenSpec file persistence). `strict_tdd: false`, no test runner, no coverage command, no browser automation (`openspec/config.yaml`).
- **Phase**: `sdd-verify`, independent requirements/runtime verification.
- **Scope of the inspected artifact**: 8 modified tracked files + 2 new untracked files (see §0).
- **Authoritative spec totals**: 12 requirements, 23 scenarios (11/18 in `producto-busqueda-parcial`; 1/5 in `linea-superlinea-association`).
- **Overall status**: `partial` (NOT `pass`). Two runtime-observable scenarios cannot be executed by any agent in this repository.

### 0. Diff under verification (facts)

`git status --porcelain` shows only the CR-004 working-tree changes plus two pre-existing untracked directories (`docs/Pedidos de Cambio/CR-004/`, `openspec/changes/2026-09-13-CR-004/`) and the two new source files.

| File | State | Delta (numstat) |
|---|---|---|
| `openspec/config.yaml` | modified | `1 / 1` — **only `testing.detected_at` `2026-09-08` → `2026-09-13`** (confirmed by `git diff`). No other config change. |
| `src/interfaces/generales/interfaces-generales.tsx` | modified | `6 / 0` — `SelectOption { codigo, nombre, descripcion }` |
| `src/interfaces/gestion-producto/producto/interfaces-producto.tsx` | modified | `16 / 0` — `ProductoListResponse` + two search-param types |
| `src/utils/selectOption.ts` | **new** | guard `esSelectOptionArray` + `mapearSelectOptions` |
| `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` | modified | `5 / 20` — `obtenerSelect` now consumes `SelectOption[]` |
| `src/componentes/gestion-producto/linea/services/linea-service.tsx` | modified | `16 / 1` — `buscarSelect` → `/linea/select` |
| `src/componentes/gestion-producto/producto/services/producto-service.tsx` | modified | `11 / 0` — `buscarPorDenominacion`, `buscarPorSuperlinea` |
| `src/componentes/gestion-producto/producto/domain/permisos-producto.ts` | modified | `14 / 1` — two role predicates |
| `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` | modified | `210 / 5` — mode state, dispatcher, effect-owned fetch, mount |
| `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx` | **new** | presentational segmented control + Enter inputs/selectors |

Untouched (verified by reading): `header-producto.tsx`, `header-producto-lg.tsx`, `filtros-contesxt.tsx`, `sidebarFiltros.tsx`, `catalogos-context.tsx`, `crudFactory.ts`, `use-paginacion.ts`, `paginacion.tsx`, `entidad-selector-base.tsx`, `registrar-actualizar-linea.tsx`, `superlineas-selector.tsx`, `herramientas/reutilizables/busqueda-producto.tsx` (the TRAP file), and the legacy `/producto/find-all-for-lineas/select` flow. No dependency was added.

### Validator note

The task-mandated deliverable is this prose report with overall status `partial`. The strict envelope validator `gentle-ai sdd-verify-validate` (v1 schema `gentle-ai.verify-result/v1`, exit-orientated verdicts `pass|pass_with_warnings|fail`) is installed but is **not applicable to this format**: it admits only those three verdicts and requires a `yaml` envelope. The orchestrator explicitly required a prose report and an overall `partial` status, so no validator run was performed and the report is persisted as prose. This is recorded as an explicit deviation, not an oversight.

---

## 1. Per-requirement / per-scenario conformance matrix

Verdict vocabulary (exactly three values):
- **SATISFIED-BY-CODE** — the mandatory frontend behavior is implemented and provable by reading the diff; the observable *correctness of returned data* is still runtime-unverified.
- **SATISFIED-BY-CONTRACT** — the guarantee is owned by the backend contract; the frontend only forwards the untouched term/parameters and consumes `{ data, total }`.
- **UNVERIFIABLE-RUNTIME** — the guarantee is an exact runtime request/state fact that no static artifact can prove and that no harness in this repo can execute.

### 1.1 `producto-busqueda-parcial` (11 requirements, 18 scenarios)

#### Requirement: Partial-match semantics

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Case-insensitive match | Backend `QueryBuilderHelper.applyPartialCoincidence` emits `LOWER(<campo>) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin` (`producto.persistence-adapters.ts:453-488`; asserted by `query-builder-helpers.spec.ts:11-27`). Frontend forwards the raw term with **no normalization**: `consultar-producto.tsx:552-556` (`handleBuscarPorDenominacion` stores `terminoDenominacion` verbatim) → `consultar-producto.tsx:504-509` (`denominacion: criterio.valor`) → `producto-service.tsx:21-22` `buscarPorDenominacion` → `ApiService.get("/producto/search-by-denominacion", p)`. The controller method has **no** `@UsePipes(NormalizeDenominacionSearchPipe)` (unlike `search`/`search-by-rapido`), so nothing upper-cases or strips the term (`producto.controller.ts:139-159`). | **SATISFIED-BY-CONTRACT** |
| Accent-sensitive boundary (`cafe` ≠ `Café`) | Same fragment; the `utf8mb4_bin` binary collation applied to both sides makes the `LIKE` accent-sensitive (and the case fold is the only fold). Frontend forwards the term untouched: `busqueda-producto.tsx:132-138` `onChange={(e) => onCambiarTerminoDenominacion(e.target.value)}` → `consultar-producto.tsx:552-556`. No `.normalize()`, `toLowerCase()`, or accent stripping exists anywhere on the denominación path. | **SATISFIED-BY-CONTRACT** |
| Containment not prefix | The fragment wraps the term on both sides: `CONCAT('%', LOWER(:termino), '%')` (containment anywhere), not `'termino%'`. | **SATISFIED-BY-CONTRACT** |

#### Requirement: Search by partial denominación

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Denominación results | Enter handler `busqueda-producto.tsx:78-83` → `handleBuscarPorDenominacion` `consultar-producto.tsx:552-556` commits the criterion and resets pagination; the effect `consultar-producto.tsx:618-631` calls `ejecutarBusquedaActivaRef.current()`; the denominación branch `consultar-producto.tsx:504-509` calls `ProductoService.buscarPorDenominacion({denominacion, skip, take})`; results/`total` mapped 1:1 at `consultar-producto.tsx:524-525`. `take` is `PAGINACION.TAKE_DEFAULT` = 10 (`use-paginacion.ts:9`, consumed at `consultar-producto.tsx:107`). Listing is frontend; "active matching" is backend-owned. | **SATISFIED-BY-CODE** |

#### Requirement: Search by Línea selection

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Select a Línea | Selector Enter `busqueda-producto.tsx:85-90` → `handleBuscarLineas` `consultar-producto.tsx:558-572` → `LineaService.buscarSelect(terminoLinea)` `linea-service.tsx:27-35` (`GET /linea/select?denominacion`, raw term); selection `handleSeleccionarLinea` `consultar-producto.tsx:574-585` commits `{tipo:"linea", lineaId}` + `resetearPaginacion()`; effect → `ejecutarBusquedaActiva` línea branch `consultar-producto.tsx:510-515` reuses `ProductoService.obtener({lineaId, skip, take})` (`/producto/search-by`). Endpoint/roles match the backend (`linea.controller.ts:63-71`). | **SATISFIED-BY-CODE** |

#### Requirement: Search by SuperLínea selection

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Select a SuperLínea | Selector Enter `busqueda-producto.tsx:92-97` → `handleBuscarSuperlineas` `consultar-producto.tsx:587-601` → `SuperLineaService.obtenerSelect(terminoSuperlinea)` `superlinea-service.ts:18-26` (`GET /superlinea/select`); selection `handleSeleccionarSuperlinea` `consultar-producto.tsx:603-614` commits `{tipo:"superlinea", superLineaId}`; effect → `buscarPorSuperlinea` `consultar-producto.tsx:516-521` → `producto-service.tsx:24-25` (`/producto/search-by-superlinea?superLineaId&skip&take`). Backend returns all active Productos of all the SuperLínea's Líneas (`producto.persistence-adapters.ts:490-511`). | **SATISFIED-BY-CODE** |

#### Requirement: Enter-only trigger

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Typing does not search | Typing only writes local term state: `busqueda-producto.tsx:136`/`148`/`167` → `setTerminoDenominacion`/`setTerminoLinea`/`setTerminoSuperlinea`; no handler commits a criterion, so the fetch effect (`consultar-producto.tsx:618-631`) never re-runs. The pre-existing código debounce effect early-returns while a CR mode is engaged: `consultar-producto.tsx:150-159` (`if (modoBusquedaRef.current !== null) return;` at L154). Only Enter (`busqueda-producto.tsx:78-97`) commits a criterion. | **SATISFIED-BY-CODE** |
| Enter searches once | Static path: handlers `consultar-producto.tsx:552-556`, `574-585`, `603-614` are pure state setters (commit criterion + `resetearPaginacion()`); the effect `consultar-producto.tsx:618-631` is the single fetch owner with deps `[criterioBusqueda, modoBusqueda, paginaActual, filtrosInicializados, take, setEntidadesTotales]` (L631). Exact "exactly one request when starting from a page > 1" is a runtime count that requires the running app + backend. See §3(a). | **UNVERIFIABLE-RUNTIME** |

#### Requirement: Mode exclusivity

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Mode switch resets | `handleCambiarModo` `consultar-producto.tsx:544-550` sets the mode, nulls `criterioBusqueda`, clears `productos`/`entidadesTotales`, and `resetearPaginacion()`; the effect then takes the third branch (`criterioBusqueda === null` && `modoBusqueda !== null`) at `consultar-producto.tsx:626-630`, which clears and issues **no** request. The exact runtime observation "the list clears and stays empty with zero legacy results/requests" needs a running app. See §3(b). | **UNVERIFIABLE-RUNTIME** |

#### Requirement: Pagination

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Page count from total | Backend `total` is produced by `getManyAndCount()` (`producto.persistence-adapters.ts:480`/`509`) and returned as `{ data, total }`; the frontend consumes it verbatim: `consultar-producto.tsx:524-525` (`setEntidadesTotales(productosBuscados.total)`), and the page count derives from it in `paginacion.tsx:21` (`Math.ceil(entidadesTotales / take)`). Page size is `take` = 10. | **SATISFIED-BY-CONTRACT** |
| Beyond the last page | Backend clips with `query.skip(skip).take(take)` and returns whatever slice exists (empty for out-of-range), without error (`producto.persistence-adapters.ts:478-482`/`507-511`). Two frontend defenses: the guard `if (!termino) return { data: [], total: 0 }` (`producto.persistence-adapters.ts:458-461`) and `Paginacion` disabling navigation outside `[1, totalPaginas]` (`paginacion.tsx:25-30`, `101`/`125`). The scenario is about a request past N, whose emptiness is backend-owned. | **SATISFIED-BY-CONTRACT** |

#### Requirement: Active-only results

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Soft-deleted excluded | Backend `busquedaPorCoincidenciaParcial` applies `.where('producto.deletedAt IS NULL')` (`producto.persistence-adapters.ts:468`); the SuperLínea path also filters `linea.deletedAt IS NULL` and `superLinea.deletedAt IS NULL` (`producto.persistence-adapters.ts:502-504`); `/linea/select` and `/superlinea/select` filter soft-deleted in their own `busquedaPorCoincidenciaParcial` (`linea.persistence-adapter.ts`, `superlinea.persistence-adapter.ts`). The frontend does no filtering of its own and consumes the returned `data` unchanged (`consultar-producto.tsx:524`). | **SATISFIED-BY-CONTRACT** |

#### Requirement: Empty or whitespace term

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Whitespace-only term | Guard in the dispatcher: `consultar-producto.tsx:496-500` (`if (criterio.tipo === "denominacion" && criterio.valor.trim() === "") { setProductos([]); setEntidadesTotales(0); return; }`) — the `return` happens **before** any service call, so no request is issued; `finally { setLoading(false) }` still runs (`consultar-producto.tsx:536-538`). The backend adds the same `trim()`-to-empty short-circuit (`producto.persistence-adapters.ts:458-461`) as a second layer. | **SATISFIED-BY-CODE** |

#### Requirement: Search failure handling

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Request failure | `ejecutarBusquedaActiva` wraps the dispatch in `try/catch` (`consultar-producto.tsx:495-538`); the catch surfaces `addAlert({type: TipoAlerta.ERROR, ...})` (`consultar-producto.tsx:526-535`) and deliberately **never** touches the page-level `error` state, so the list stays rendered (`productos` is only written in the success branch, L524). Selector-option failures are handled identically (`consultar-producto.tsx:562-571`, `591-600`). An expired token surfaces as an axios rejection in `ApiService.get` (`apiService.ts:11-24`) and lands in the same catch. | **SATISFIED-BY-CODE** |

#### Requirement: Role-restricted search modes

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Role permitted by both kinds (`Root`/`Administrador`/`Empleado`) | `permisos-producto.ts:25-36` both predicates true → `consultar-producto.tsx:73-75` → `busqueda-producto.tsx:69-76` pushes `denominacion`, `linea`, `superlinea` → all three segments rendered (`busqueda-producto.tsx:106-121`). | **SATISFIED-BY-CODE** |
| Denominación-only role (`Vendedor`/`Repositor`/`Repartidor`) | `puedeBuscarPorSeleccion` false (`permisos-producto.ts:33-36`) → `busqueda-producto.tsx:73-76` adds no selection segments and the selector panels are gated by `puedeBuscarPorSeleccion` (`busqueda-producto.tsx:143`, `162`), so `LineaService.buscarSelect` / `SuperLineaService.obtenerSelect` are unreachable → no `/linea/select`, `/superlinea/select`, or `/producto/search-by-superlinea` request. | **SATISFIED-BY-CODE** |
| Role permitted by neither (`Cobrador`) | Both predicates false → the page does not mount the component at all: `consultar-producto.tsx:731` gates the mount on `(permitidoBuscarPorDenominacion || permitidoBuscarPorSeleccion)`, so no empty control, no segment, no CR request. `modoBusqueda` initializes to `null` (`consultar-producto.tsx:77-79`) preserving the legacy código/sidebar flows. | **SATISFIED-BY-CODE** |
| Offered modes work | Each offered mode's segment drives the same single-owner effect to its service (§ rows above): denominación `consultar-producto.tsx:504-509`, línea `510-515`, superlínea `516-521`; results and `total` mapped at `524-525`. Endpoint role sets were cross-checked against the backend controllers (`producto.controller.ts:139-174`, `linea.controller.ts:63-71`, `superlinea.controller.ts:51-59`). | **SATISFIED-BY-CODE** |

### 1.2 `linea-superlinea-association` — MODIFIED requirement (1 requirement, 5 scenarios)

Only `superlinea-service.ts` is inside the CR-004 diff for this capability; the create/edit form and its selector are pre-existing and were re-read to confirm the modified contract still holds.

| Scenario | Evidence (file:line / symbol) | Verdict |
|---|---|---|
| Required selection and payload | Pre-existing create path submits the identifier: `registrar-actualizar-linea.tsx:114-136` (`superLineaId: Number(superLineaId)` in the create payload; `CreateLineaDto.superLineaId` required at `linea-service.tsx:13-20`). The selector maps `onChange` → `setValue("superLineaId", superLinea?.id)` (`registrar-actualizar-linea.tsx:192-194`). | **SATISFIED-BY-CODE** |
| Missing selection or empty catalog | Empty-catalog message is rendered: `superlineas-selector.tsx:44-46` (`Primero debe registrar una SuperLínea.`); required-field validation and the error slot flow through `EntidadSelectorBase` (`error` prop, `entidad-selector-base.tsx:96-100`). | **SATISFIED-BY-CODE** |
| Edit unchanged association | `registrar-actualizar-linea.tsx:117-123` destructures `superLineaId` out of the payload and only re-adds it when `superLineaId !== superLineaInicialId`, so an unchanged association omits `superLineaId`. | **SATISFIED-BY-CODE** |
| Edit reassignment and failures | Same conditional spread sends the new id only on change (`registrar-actualizar-linea.tsx:122`); the surrounding `try/catch` routes API failures (403/404) to `setError("root", … parseApiError(error))` (`registrar-actualizar-linea.tsx:137-139`). Error-copy specifics are runtime-observable and were not executed. | **SATISFIED-BY-CODE** |
| Options resolve after the shape change | `superlinea-service.ts:18-26` now consumes the flat `SelectOption[]` shape: `esSelectOptionArray(response)` guard + `mapearSelectOptions(response)` (`utils/selectOption.ts:3-19`, `codigo → id`, `nombre → denominacion`). The sole caller `registrar-actualizar-linea.tsx:75-95` (→ `SuperlineasSelector`, `superlineas-selector.tsx:26-42`) still receives `{id, denominacion}` and `EntidadSelectorBase` resolves options via `getOptionValue={(o) => String(o.id)}` (`entidad-selector-base.tsx:77-94`). The obsolete `{data,total}` guard (`isListResponse`) was removed with its only call site. | **SATISFIED-BY-CODE** |

**Matrix totals**: 23 scenarios = 6 SATISFIED-BY-CONTRACT + 15 SATISFIED-BY-CODE + 2 UNVERIFIABLE-RUNTIME.

---

## 2. Static gate comparison vs baseline

Baseline logs: `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-baseline\{tsc,lint,build}.txt`.
Current logs: `C:\Users\mateo\AppData\Local\Temp\opencode\cr004-verify\{tsc,lint,build}.txt`.
All three commands ran in the foreground with `corepack yarn` (never global `yarn`).

| Command | Baseline | Now | New / removed | Verdict |
|---|---|---|---|---|
| `corepack yarn tsc -b` | exit **2**, **123** errors | exit **2**, **123** errors | **0 new / 0 removed**; normalized set (file + `TS` code + message, line/col stripped) `Compare-Object` → **0 diff rows** | **PASS (no regression)** |
| `corepack yarn lint` | exit **1**, **152** problems (**21** errors, **131** warnings) | exit **1**, **152** problems (**21** errors, **131** warnings) | **0 new / 0 removed**; normalized set (file + severity + message, line/col stripped) → **152 vs 152, 0 diff rows** | **PASS (no regression)** |
| `corepack yarn build` | exit **0**, `2413 modules transformed` | exit **0**, `2415 modules transformed` (`✓ built in 36.44s`) | **+2 modules** = the two new files `src/utils/selectOption.ts` and `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx`; exit still 0 | **PASS** |

Evidence hashes of the current logs (SHA-256):
- `tsc.txt` → `e57d91f0c3d44ac2e05f2871b1abc38091e53756c794a6cd2a6a3b763d0a0751`
- `lint.txt` → `6022e5db1720494eb74f29d45493a1676caf7ab4c69a2fa7ce7c51473fde5755`
- `build.txt` → `dd487735b750dba6f002dbd361bdb64de4ecf030debbb7e1eb3f3ae83c2100dc`

### Counts are not enough — the error sets were compared

Because the totals match, the sets were also normalized to `file|code|message` (line/col dropped) and compared element-by-element; both produced **0 differences**. Only line numbers shifted, all explainable by authored insertions above pre-existing problems:

- `tsc`: the pre-existing `consultar-producto.tsx` `TS2322` (`Property 'onMovimientos' does not exist on type 'IntrinsicAttributes & Props'`) moved from `(557,19)` to `(762,19)`. Code distribution is unchanged: `TS2307=43, TS2322=41, TS2345=19, TS2339=8, TS2304=8, TS2305=4`.
- `lint` in `consultar-producto.tsx`: the three pre-existing `no-empty` `finally {}` blocks (`fetchLineas`/`fetchMarcas`/`fetchProveedores`) moved to **202:15 / 224:15 / 249:15** (baseline had the same three); the pre-existing `no-useless-catch` in `producto-service.tsx` moved `18:5 → 29:5`.

**Every remaining error and warning is pre-existing.** No lint/tsc problem file, rule, message, or code is new or removed by CR-004. No file outside the CR-004 path contributed a new problem.

---

## 3. Manual runtime checks — NOT EXECUTED

This repository has **no browser automation and no running frontend/backend harness** (`strict_tdd: false`; `yarn` scripts are only `build`/`lint`/`dev`; `/api` requires a live backend). The two checks below are therefore **UNEXECUTED** by this or any prior agent run, and require a human with a running app + backend + browser. No pass is claimed for either.

### (a) Enter/selection issues exactly ONE request (from a page > 1) — UNEXECUTED, REQUIRES HUMAN

- **Spec expectation**: `producto-busqueda-parcial` → *Enter-only trigger* → **Enter searches once**: "exactly one search request MUST be issued".
- **Code path that is supposed to guarantee it**: the bounded correction made the **pagination effect the single fetch owner**. Handlers are pure state setters — `handleBuscarPorDenominacion` `consultar-producto.tsx:552-556`, `handleSeleccionarLinea` `574-585`, `handleSeleccionarSuperlinea` `603-614` — each commits the criterion and calls `resetearPaginacion()` (`use-paginacion.ts:18-22`, which sets `skip=0` **and** `paginaActual=1`). React batches those event updates into one render, after which the effect at `consultar-producto.tsx:618-631` runs **once**. Its dependency array is `[criterioBusqueda, modoBusqueda, paginaActual, filtrosInicializados, take, setEntidadesTotales]` (L631) and its criterion branch calls `ejecutarBusquedaActivaRef.current()` (L620-622), which dispatches exactly one of the three services. The earlier double-request came from handlers calling `ejecutarBusquedaActiva(...)` directly while also resetting `paginaActual`; that direct call no longer exists in any handler.
- **Residual runtime uncertainty**: an extra render/effect pass driven by a parent re-render or by `setEntidadesTotales` identity cannot be excluded statically; only a network-tab count from a page > 1 can prove "exactly one". Not verifiable in this repo.

### (b) Mode switch shows NO legacy results (from a page > 1) — UNEXECUTED, REQUIRES HUMAN

- **Spec expectation**: `producto-busqueda-parcial` → *Mode exclusivity* → **Mode switch resets**: "pagination MUST reset and prior results MUST NOT remain" (and no legacy list repopulation).
- **Code path that is supposed to guarantee it**: `handleCambiarModo` `consultar-producto.tsx:544-550` sets the new mode, nulls `criterioBusqueda`, clears `productos`/`entidadesTotales`, and `resetearPaginacion()`. The single-owner effect (`consultar-producto.tsx:618-631`) then takes the third branch — `criterioBusqueda` falsy **and** `modoBusqueda !== null` — at L626-630, which clears results and issues **no** request. Legacy `handleBuscarProductos()` is reachable only when `modoBusqueda === null` (L623-625), so a CR mode cannot repopulate from the legacy fetch. This is the Defect 2 fix.
- **Residual runtime uncertainty**: only observing the rendered list (clears and stays empty) and the absence of a legacy `/producto/search-by` call after a mode switch on page > 1 proves it. Not verifiable in this repo.

---

## 4. Residual risks carried from `apply-progress.md`

| # | Residual (as flagged) | Assessment |
|---|---|---|
| i | **No initial auto-load for permitted roles.** `modoBusqueda` initializes to `"denominacion"` (`consultar-producto.tsx:77-79`) and `criterioBusqueda` starts `null`, so on mount the effect takes the "CR mode engaged, no criterion" branch (`consultar-producto.tsx:626-630`) and clears results **without** pre-loading the legacy list. | **Not a spec violation** (no scenario mandates an initial auto-load) but a **behavior change vs. the legacy page**, which auto-loaded via `handleBuscarProductos()` once `filtrosInicializados`. For `Cobrador` (`modoBusqueda === null`) the legacy auto-load is preserved. **Accepted behavior** — flag as UX regression risk, not a gate failure. |
| ii | **Sidebar `buscar.cont` reclaim can re-run an idempotent legacy fetch.** `consultar-producto.tsx:161-168` clears `modoBusqueda`/`criterioBusqueda` and calls `handleBuscarProductos(true)` directly; because both are now effect deps, the effect can run once more and repeat the same idempotent legacy fetch. | **Not a spec violation.** The corrected design explicitly keeps this effect unchanged and describes that next run. Same query, same result → **accepted behavior** (a possible redundant request, no data divergence). |
| iii | **Open questions U2 / U3 in `tasks.md`** — (U2) sidebar filter search passively clears the active CR mode; (U3) código quick search stays the legacy default rather than becoming a fourth segment. | **Accepted behavior.** Neither is covered by a `producto-busqueda-parcial` scenario; U2 is exactly residual (ii) and is the design's assumed exclusivity behavior; U3 leaves the código debounce/quick search untouched (and neutralized while a CR mode is engaged, `consultar-producto.tsx:150-159`). Both remain open product confirmations, not spec gaps. |

Additional observation (not in apply-progress): clicking the **already-active** mode button still calls `onCambiarModo` (`busqueda-producto.tsx:117`, unconditional), which clears the criterion and current results. No scenario covers re-clicking the active mode, so this is a **SUGGESTION** (guard with `if (modoBusqueda === modo.valor) return;`), not a violation.

---

## 5. Verdict

**Overall status: `partial`.** Not `pass`, and deliberately not `fail`: every scenario is either code-satisfied, contract-owned, or blocked only by the absence of a runtime harness.

- **Code-satisfied (15 scenarios)**: Denominación results; Select a Línea; Select a SuperLínea; Typing does not search; Whitespace-only term; Request failure; all four `Role-restricted search modes` scenarios; and all five `linea-superlinea-association` scenarios. Evidence is the diff plus re-read unchanged callers; endpoints, params, and role sets were cross-checked against the read-only backend.
- **Contract-owned (6 scenarios)**: Case-insensitive match; Accent-sensitive boundary; Containment not prefix; Page count from total; Beyond the last page; Soft-deleted excluded. Each is enforced by the backend (`applyPartialCoincidence` with `utf8mb4_bin`, `deletedAt IS NULL`, `getManyAndCount`) and the frontend's only obligation — forwarding the untouched term/parameters and consuming `{ data, total }` — is verified at `consultar-producto.tsx:504-525`, `linea-service.tsx:27-35`, `producto-service.tsx:21-25`, `superlinea-service.ts:18-26`.
- **Runtime-unverified (2 scenarios)**: **Enter searches once** and **Mode switch resets** (§3 a/b). The code path is correct by construction (single-owner effect), but "exactly one request" and "list clears with no legacy results" are runtime facts.

**What a human must run to close the change**: start the frontend (`corepack yarn dev`) against the backend, log in as a permitted role, and from a results page > 1 (a) press Enter and observe exactly one `/producto/search-by-denominacion` request in the network tab, and (b) switch mode and confirm the list clears, stays empty, and issues no `/producto/search-by` request. Also worth executing during the same session: a `cafe` vs `Café` check, a Línea/SuperLínea selection, a whitespace-only Enter, and a forced failure/expired-token case. Alternatively, adding a test runner (out of CR-004 scope; `strict_tdd: false`) would convert these and the six contract-owned scenarios into automated evidence.

### Static gate summary

`tsc -b` exit 2 / 123 errors, `lint` exit 1 / 152 problems, `build` exit 0 — all **identical to baseline** in content (normalized set diff = 0 for tsc and lint); build gained exactly the two new modules. **No regression introduced by CR-004.** Task 5.2 remains unchecked (manual, cannot be executed here).
