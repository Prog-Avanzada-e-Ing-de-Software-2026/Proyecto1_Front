# Design: CR-004 — Partial-match product search by denominación, Línea, SuperLínea

## Technical Approach

Enhance the existing `ConsultarProductos` page in place (proposal Approach). One page-local `modoBusqueda` state (`"denominacion" | "linea" | "superlinea" | null`) is the single owner of the result list and pagination; `null` means the existing legacy flows (código quick search + sidebar filters) operate unchanged. Three thin, explicit service methods wrap the verified endpoints via `ApiService.get`; `total` maps 1:1 to `entidadesTotales`. `SelectOption[]` is validated and mapped once in a shared util. No route, no shared-context change, no new dependency, no test framework.

## Architecture Decisions

| Area | Option chosen | Alternative rejected | Tradeoff / why |
|---|---|---|---|
| Mode UI | Segmented control (buttons from existing `Button`) inside a new `BusquedaProducto`; `denominación` segment offered when its endpoint permits, `Línea`/`SuperLínea` only when the selection endpoint permits (next row) | Tabs; three independent inputs | Makes exclusivity visible and swaps one panel; tabs imply navigation/content panels; 3 inputs permit ambiguity and violate mutual exclusivity (`producto-busqueda-parcial` spec). The single/absent-segment cases are handled by the gates (see no-capability state). |
| Search-mode role gates (per endpoint) | Two gates: `denominación` offered only to the roles its endpoint permits (`Root`/`Administrador`/`Empleado`/`Vendedor`/`Repositor`/`Repartidor`); `Línea`/`SuperLínea` only to `Root`/`Administrador`/`Empleado`. `Cobrador` (permitted by neither) gets no mode | (a) One binary gate; (b) offer all three and surface the 403; (c) widen the backend `@Roles` | The endpoint sets differ: `search-by-denominacion` is `@Roles('Root','Administrador','Empleado','Vendedor','Repartidor','Repositor')` (`producto.controller.ts:139-147`), while `/linea/select` (`linea.controller.ts:63-64`) and `/superlinea/select` (`superlinea.controller.ts:51-52`) are `@Roles('Root','Administrador','Empleado')`. The page is reachable by seven roles incl. `Cobrador` (`App.tsx:36`). One binary gate (a) either over-restricts `Vendedor`/`Repositor`/`Repartidor` or fires guaranteed 403s; (c) is a backend contract change outside CR-004. Per-endpoint frontend gating satisfies `Role-restricted search modes` without touching the backend. |
| State ownership | Page owns mode, terms, options, selections, committed `criterioBusqueda`; component is fully controlled | State inside `BusquedaProducto`; state in `FiltrosContext` | Results + `usePaginacion` already live in the page; mode-switch must reset them together. `FiltrosContext` is a shared, explicitly excluded non-goal (proposal). |
| Fetch ownership (Enter / selection / mode switch / page change) | The pagination effect is the SINGLE fetch owner: it depends on the committed `criterioBusqueda` and on `modoBusqueda`, and is the only caller of `ejecutarBusquedaActiva` / `handleBuscarProductos` for these flows; handlers only set state. **LANDED in apply round 1** — current effect L618-631, pure setters at L552-556 / L574-585 / L603-614; no `criterioBusquedaRef` remains in the tree | Handlers dispatch directly (the design's original prescription — superseded by apply round 1) | *(Historical, pre-apply-round-1 baseline:)* handler-owned dispatch issued a request AND changed `paginaActual` via `resetearPaginacion` (`use-paginacion.ts:18-22`), so the effect re-ran and repeated the same search whenever `paginaActual > 1` — Defect 1 (baseline `handleBuscarPorDenominacion` L562 + effect L627-635). It also fell through to the legacy fetch on mode switch — Defect 2 (baseline `handleCambiarModo` L550-556 + effect L631-633). One effect-owned fetch keyed on committed state makes Enter exactly one request. *(2026-09-14 amendment → same-day maintainer scope reduction: the A1/A2 "no-criterion → unfiltered listing" change is WITHDRAWN; the operative target is the ORIGINAL behavior — the no-criterion CR branch clears results and issues NO request — which is also what the tree already does (current else branch L626-630). This row therefore has no remaining code delta; the only remaining code delta of the amendment is the A3/A4 feedback toasts + `pendienteFeedbackRef` + blank-term guards. Defect 2's guarantee, "prior filtered results never remain", is kept by the explicit clear + pagination reset already in `handleCambiarModo` (current L544-550).)* |
| Service layer | Add explicit `ApiService.get` methods | Extend `createCrudService`/`crudFactory` | `crudFactory` methods are generic path templates shared across many entities (`crudFactory.ts` L18-43); CR routes are non-generic and `search-by-superlinea` takes `superLineaId`, not `lineaId`. Precedent: `superlinea-service.ts` L33-49 and `producto-service.tsx` L17-28 already add explicit methods. **Confirmed — do not extend `crudFactory`.** |
| `SelectOption[]` mapping | `SelectOption` in `interfaces-generales.tsx`; guard + `mapearSelectOptions` once in `src/utils/selectOption.ts` | Map locally in each service | `EntidadSelectorBase<T extends {id,denominacion}>` (L5-8) and both consumers need `{id,denominacion}`; one mapping prevents divergence. `obtenerSelect` keeps returning `SelectSuperlinea[]`, so `registrar-actualizar-linea.tsx` L80-96/L186-196 is untouched and the Línea create/edit flow is preserved (delta scenario “Options resolve after the shape change”). |
| Mode UI placement | New `BusquedaProducto` mounted once in `CardContent`; `header-producto.tsx`/`-lg.tsx` untouched | Add controls to both headers (proposal's estimate) | Headers are duplicated per breakpoint (page L697/L714); duplicating mode logic into both grows blast radius for no gain. One mount covers all breakpoints. Deviation from the proposal file table, not from any spec. |
| Search failures | Surface via existing `addAlert(ERROR)`; leave `productos` intact | Set page-level `error` | Page-level `error` replaces the whole list in the top-level ternary (page L680-691), violating “list state MUST remain intact” (`producto-busqueda-parcial`). Alerts (page L177, L285) keep the list visible. |
| Catálogo loads vs search | Keep `fetchLineas/Marcas/Proveedores` (L188-254) as-is | Merge into modes | Out of scope; sidebar catalog behavior must not change. |

**Role propagation.** The page resolves roles with `getRoles()` (`utils/auth.ts:44-47`, imported at `consultar-producto.tsx:33`) and converts them into pure-predicate capabilities in `producto/domain/permisos-producto.ts` (e.g. `puedeHacerAcciones`, L22-23; the two search predicates landed at L25-36 in apply round 1): `puedeAccionar={puedeHacerAcciones(getRoles())}` is passed to `DatosTabla` (`consultar-producto.tsx:758`). We follow that precedent with TWO predicates and TWO booleans (`consultar-producto.tsx:74-75`) passed into the `CardContent` mount (`consultar-producto.tsx:731-753`):
- `puedeBuscarPorDenominacion(getRoles())` → prop `puedeBuscarPorDenominacion` (true for `ROOT`/`ADMINISTRADOR`/`EMPLEADO`/`VENDEDOR`/`REPOSITOR`/`REPARTIDOR`).
- `puedeBuscarPorSeleccion(getRoles())` → prop `puedeBuscarPorSeleccion` (true for `ROOT`/`ADMINISTRADOR`/`EMPLEADO`).

The page computes both (it already owns `getRoles()` and capability derivation; the mode list must be known before mount). `BusquedaProducto` stays presentational: it derives its segment list from the two booleans (`denominación` if the first; `Línea`/`SuperLínea` if the second) and never maps roles itself. Selection roles are a subset of denominación roles, so any mounted control offers at least the `denominación` segment. Headers keep the raw `roles={getRoles()}` prop (`L698`, `L717`) and stay untouched. Rejected: deriving the gates inside the component from a raw `roles` prop — it would duplicate the role→capability mapping that `permisos-producto.ts` already owns.

**No-capability state (`Cobrador`).** Both predicates are false, so `puedeBuscarPorDenominacion || puedeBuscarPorSeleccion` is false and the page renders NO `BusquedaProducto` mount (conditional render, not an empty control). No segmented control, input, or selector appears, and no CR-mode request can be issued. `modoBusqueda` MUST initialize to `null` when `puedeBuscarPorDenominacion` is false, so the legacy código early-return (`modoBusqueda !== null`, task 4.6) does not gate the pre-existing legacy flows; `Cobrador` keeps the legacy código/sidebar behavior unchanged. Reachability by `Cobrador` is pre-existing (`App.tsx:36`); only the CR modes are removed. The 2026-09-14 amendment does not change this: after the same-day maintainer scope reduction the only operative amendment items are the A3/A4 feedback toasts, and `Cobrador` never reaches any feedback path (no CR control is mounted), so this state is zero-change and no CR search request is ever issued.

## Data Flow

**Current state (post apply round 1):** the mode/pagination effect is already the SINGLE fetch owner for the CR flows and the handlers already only commit state. The effect (`consultar-producto.tsx:618-631`) now matches the target below EXACTLY — after the 2026-09-14 maintainer scope reduction withdrew A1/A2, the operative no-criterion CR branch is the ORIGINAL clear (current L626-630), so there is no pending effect change. Target form (equals the current code):

```ts
useEffect(() => {
  if (!filtrosInicializados) return;
  if (criterioBusqueda) {
    ejecutarBusquedaActivaRef.current();        // CR search with current skip/take
  } else if (modoBusqueda === null) {
    handleBuscarProductos();                    // legacy ONLY when no CR mode is engaged
  } else {
    setProductos([]);                             // CR mode, no criterion: clear results, NO request (blank table until Enter — operative, restored after A1 withdrawal)
    setEntidadesTotales(0);
  }
}, [criterioBusqueda, modoBusqueda, paginaActual, filtrosInicializados, take, setEntidadesTotales]);
```

`criterioBusqueda` and `modoBusqueda` are real dependencies (landed). *(Historical, pre-apply-round-1 baseline:)* the old effect read `criterioBusquedaRef.current` and depended only on `[paginaActual, filtrosInicializados, take]` (baseline L627-635), so a criterion change alone never re-ran it; that ref no longer exists in the tree. The dispatcher reads the current `criterioBusqueda`/`skip`/`take` through `ejecutarBusquedaActivaRef` (L541-542), so a page change re-drives the active search with the new `skip`.

**Enter / selection → exactly one request.** Each handler (`handleBuscarPorDenominacion` L552-556, `handleSeleccionarLinea` L574-585, `handleSeleccionarSuperlinea` L603-614) is now a pure state setter — landed in apply round 1: commit the new criterion object, then `resetearPaginacion()`, and NOTHING else; the baseline direct `ejecutarBusquedaActiva(0, take, criterio)` dispatch is gone. `resetearPaginacion()` sets `skip = 0` AND `paginaActual = 1` (`use-paginacion.ts:18-22`). React batches both updates from the event into ONE render, so the effect runs ONCE after commit with the final criterion and page: exactly one fetch. *(That was the Defect 1 fix — historical baseline: the old handler fetched directly (baseline L562/L592/L622) and, when `paginaActual > 1`, `resetearPaginacion` changed `paginaActual`, re-running the effect for a second identical search. From page 1 the effect never re-ran (criterion was not a dependency), which is why the double request was missed.)*

**Mode switch → cleared results, no request.** `handleCambiarModo` (L544-550, already in the tree) sets `modoBusqueda`, clears `criterioBusqueda`, clears results, and resets pagination. The effect runs once with a null criterion and a CR `modoBusqueda` engaged, taking the else branch: results stay cleared (blank table until the next Enter) and NO request is issued. *(Historical baseline:)* the old effect fell through to `handleBuscarProductos()` (legacy sidebar fetch) on a null criterion (baseline L631-633), so once `paginaActual` changed it repopulated the list with legacy results. That Defect-2 fix is the operative design again (the amendment's A2 unfiltered-refetch was withdrawn by the maintainer on 2026-09-14): the explicit clear + `resetearPaginacion()` in `handleCambiarModo` guarantees prior filtered results or a later page never remain, and the no-criterion CR branch keeps the list empty until Enter (`Mode exclusivity`, `Enter-only trigger`).

**Type → no request.** Typing only updates local term state (L81-87); it never commits a criterion, so the effect does not re-run and no per-keystroke request is issued.

**Risk — object-identity criterion.** Because `criterioBusqueda` is an object in the effect deps, recreating it with equal fields would trigger an extra fetch. The design avoids this: only explicit user actions commit a new criterion object (the three Enter/selection handlers, plus `handleCambiarModo`'s clear); no effect or render-time derivation (e.g. `useMemo` on the term) reconstructs it, and typing touches only the term strings. Two Enters with the same term intentionally issue one explicit search each.

```
Mode switch ─► setModoBusqueda(m); setCriterioBusqueda(null); setProductos([]); setEntidadesTotales(0); resetearPaginacion()
Type        ─► local term state only                                   (NO request)
Enter       ─► setCriterioBusqueda({tipo,valor}); resetearPaginacion() (NO direct dispatch)
Select      ─► setSeleccion(x); setCriterioBusqueda({tipo,id}); resetearPaginacion()
                          │  (React batches → one render)
                          ▼
   effect [criterioBusqueda, modoBusqueda, paginaActual, filtrosInicializados, take]
      criterio                   ──► buscarPorDenominacion | obtener({lineaId}) | buscarPorSuperlinea ─► ApiService.get ─► {data,total}
      no criterio, modo === null ──► handleBuscarProductos()   (legacy)
       no criterio, modo !== null ──► setProductos([]); setEntidadesTotales(0)   (NO request — blank until Enter)
                          │
                          ▼
   setProductos(data); setEntidadesTotales(total) ─► DatosTabla / DatosCard
Page change ─► Paginacion.onChange ─► handlePageChange(skip,take,paginaActual) ─► effect[paginaActual,take] ─► ejecutarBusquedaActiva()
```

Línea/SuperLínea is a two-step cycle: **Enter in the selector input** → `LineaService.buscarSelect(term)` / `SuperLineaService.obtenerSelect(term)` → options (no product request yet; option-count toast fires here per A3); **select an option** → set the selection and commit `criterioBusqueda` + `resetearPaginacion()`; the effect then issues the product request exactly once.

Mode exclusivity is enforced by gating the two legacy drivers while a CR mode is engaged:
- Código debounce effect (L150-159): returns early when `modoBusquedaRef.current !== null` (L154, landed) → no per-keystroke refetch (`Enter-only trigger`).
- Sidebar `buscar.cont` effect (L161-168): clears `modoBusqueda`/`criterioBusqueda` and calls `handleBuscarProductos(true)` so legacy reclaims the list; `modoBusqueda = null` routes the next effect run to the legacy branch.

Role gates (render-time, before any request): `getRoles()` (`utils/auth.ts:44-47`) → `puedeBuscarPorDenominacion`/`puedeBuscarPorSeleccion` → two boolean props → `BusquedaProducto` renders 1–3 segments, or is not mounted when both are false. Selectors only mount under `puedeBuscarPorSeleccion`, so `LineaService.buscarSelect` / `SuperLineaService.obtenerSelect` are unreachable for `Vendedor`/`Repositor`/`Repartidor`/`Cobrador`; no `/linea/select` or `/superlinea/select` call (and no 403) can occur. Denominación is not offered to `Cobrador`, so no `/producto/search-by-denominacion` call occurs either.

## Amendment (2026-09-14) — Visible search feedback (operative); unfiltered listing WITHDRAWN

**[SCOPE REDUCTION 2026-09-14 — maintainer]** The spec was reverted: `Unfiltered listing on entry` is WITHDRAWN; `Visible search feedback` REMAINS. A1, A2 and A5 below are therefore WITHDRAWN (text kept for audit history only). The pre-amendment decision — "CR mode active with no criterion → clear results, NO request" — is SPEC-CONFORMANT again and is the operative design. A3 and A4 remain fully operative and stand alone; the only remaining code delta of this amendment is the A3/A4 feedback behavior.

Historical (pre-reduction): the spec had been amended with `Unfiltered listing on entry`, `Visible search feedback`, a clarified `Mode exclusivity` scenario, and an `Enter-only trigger` exemption for the entry listing, superseding the earlier "CR mode + no criterion → clear results, NO request" decision (effect else-branch, Data Flow, `consultar-producto.tsx:626-630`). That supersession is now itself superseded by the maintainer scope reduction above.

### ~~A1 — Unfiltered-listing mechanism~~ **[WITHDRAWN 2026-09-14 — maintainer kept only the feedback behavior]**

**[WITHDRAWN — audit text below; do not implement. The operative no-criterion CR branch remains the original clear with NO request.]** In the pagination effect's no-criterion CR branch, call the existing `handleBuscarProductos()` (legacy `ProductoService.obtener` with the just-initialized default `valoresFiltros` + current `skip`/`take`) instead of clearing `productos`. This covers entry, mode switch, and page changes while unfiltered ("paginated as elsewhere"). The two no-criterion branches now issue the same call; they stay separate to document ownership (legacy vs CR-unfiltered) and avoid a larger effect refactor.

- **Safe for `Cobrador`/no-capability roles**: their flow already runs this exact unfiltered fetch on entry and page change via the `modoBusqueda === null` branch — zero behavior change. The request is `GET /producto` (a pre-existing read the role can already make), not a CR search endpoint, so `Non-search role entry unchanged` ("no search request MUST be issued") holds: that phrase covers the CR endpoints.
- **Enter-only rule preserved**: the quick-código debounce effect (`consultar-producto.tsx:150-159`) keeps its `modoBusquedaRef.current !== null` early-return, so while a CR mode is active (including the preselected `denominacion`) typing in the código box stays neutralized. The entry/switch/paging fetch is driven by the pagination effect, never by keystrokes — it is the spec's "or for the unfiltered entry listing" exemption.
- **Blank term is not the unfiltered listing** (unchanged code path): Enter with a blank term still commits a blank criterion; `ejecutarBusquedaActiva`'s existing silent early-return (`L496-500`) yields an empty result set, never the unfiltered branch.

### ~~A2 — Mode switch~~ **[WITHDRAWN 2026-09-14 — maintainer kept only the feedback behavior]**

**[WITHDRAWN — audit text below; do not implement. Mode switch keeps the original clear-and-no-request semantics (operative `handleCambiarModo` behavior).]** `handleCambiarModo` keeps its explicit `setProductos([])` / `setEntidadesTotales(0)` and `resetearPaginacion()`: prior filtered results never remain (immediate clear; the loading spinner covers the refetch window) and a later page never remains (skip 0, page 1). The batched effect run then takes the A1 branch and lands on the unfiltered listing. The sidebar `buscar.cont` effect still exits the CR mode (`modoBusqueda = null`) before the filtered legacy list reclaims ownership — unchanged.

### A3 — Feedback vehicle: `addAlert` toasts **[OPERATIVE 2026-09-14 — stands alone after the scope reduction]**

Reused `useAlerts().addAlert` (`alertas.tsx` supports `TipoAlerta.{SUCCESS,ERROR,WARNING,INFO}`, `autoClose`, `duration`); `autoClose: true, duration: 3000`, titles from `TituloAlerta`. No new UI primitives, no dependencies, no change to `alertas.tsx`. Feedback never clears results (the `<Alertas>` overlay renders at `L798`, outside the list-state ternary). Exact Spanish strings (term = trimmed criterion; «» quotes; singular/plural variants via one local phrase builder so the three modes don't duplicate wording):

| Event | TipoAlerta | Message |
|---|---|---|
| Denominación matches, N=1 | INFO | `Se encontró 1 producto para «{término}».` |
| Denominación matches, N>1 | INFO | `Se encontraron {total} productos para «{término}».` (`total` = service response) |
| Denominación no matches | WARNING | `No se encontraron productos para «{término}».` |
| Blank/whitespace Enter (any mode) | WARNING | `Escribe un término para buscar.` (no request issued) |
| Línea options, N=1 / N>1 | INFO | `Se encontró 1 Línea para «{término}».` / `Se encontraron {n} Líneas para «{término}».` |
| Línea no matches | WARNING | `No se encontraron Líneas para «{término}».` |
| SuperLínea options, N=1 / N>1 | INFO | `Se encontró 1 SuperLínea para «{término}».` / `Se encontraron {n} SuperLíneas para «{término}».` |
| SuperLínea no matches | WARNING | `No se encontraron SuperLíneas para «{término}».` |
| Failed request | ERROR | existing error alerts unchanged |

INFO (not SUCCESS) reports counts: searching is informational, not a state-changing success; WARNING marks "nothing found / input needed". Firing points: the denominación count fires inside `ejecutarBusquedaActiva` after a successful response, gated by a one-shot `pendienteFeedbackRef` that only the Enter commit sets (consumed at fetch start, fired only on success); the blank-term hint for the denominación path fires at the existing blank-term early-return inside `ejecutarBusquedaActiva` (L496-500) — an unchanged code path — gated by that same one-shot ref so page-change re-runs stay silent (A4); it is the effect-owned counterpart of the option handlers' guard: hint shown, no request issued. Option counts fire inside `handleBuscarLineas` / `handleBuscarSuperlineas` after the service returns, with a new blank-term guard before the request (hint, no request, options cleared). Selecting an option fires no toast (a click, not Enter; the list visibly updates).

### A4 — Anti-noise rules **[OPERATIVE 2026-09-14 — stands alone after the scope reduction]**

- Entry load and page changes NEVER toast: on entry (and on mode switch) the no-criterion CR branch only clears state and issues NO request, so there is nothing to report; on page-change re-runs of `ejecutarBusquedaActiva` the feedback ref is false. These silence rules hold trivially now that A1 is withdrawn (entry never fetches under a CR mode, so entry never toasts).
- A failed search fires ONLY the existing ERROR — the count toast fires only after success, so error+count never co-fire for one Enter.
- Mode switch is silent (the restored clear issues no request; the withdrawn A2 refetch would have been silent too).
- `Cobrador` never reaches any feedback path (no CR control is mounted).

### ~~A5 — Rejected alternative~~ **[WITHDRAWN 2026-09-14 — moot after the scope reduction; audit text below]**

**[WITHDRAWN — this alternative was rejected in favor of A1; with A1 withdrawn the original clear-and-no-request behavior is restored and this comparison is moot.]** Initializing `modoBusqueda` to `null` on entry (re-engaging a mode only on first action). Rejected: it fixes only entry — the spec's `Mode active with no criterion yet` scenario still demands the same no-criterion branch change — and it drops the preselected segment and open input panel (`BusquedaProducto` renders no panel when mode is `null`), degrading the chosen segmented UX. The A1 branch edit covers entry, switch, and unfiltered paging in one change and is spec-conformant.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/interfaces/generales/interfaces-generales.tsx` | Modify | Add `SelectOption {codigo,nombre,descripcion}`. |
| `src/interfaces/gestion-producto/producto/interfaces-producto.tsx` | Modify | Add `ProductoListResponse` + search-param types. |
| `src/utils/selectOption.ts` | Create | `esSelectOptionArray` guard + `mapearSelectOptions` (single mapping point). |
| `src/componentes/gestion-producto/producto/services/producto-service.tsx` | Modify | Add `buscarPorDenominacion`, `buscarPorSuperlinea`. |
| `src/componentes/gestion-producto/linea/services/linea-service.tsx` | Modify | Add `buscarSelect` → `/linea/select`. |
| `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` | Modify | Change parser to `SelectOption[]`; optional `denominacion`. |
| `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx` | Create | Presentational segmented mode control + denominación input + Línea/SuperLínea selectors (reuse `EntidadSelectorBase` with `ocultarAgregar`). Accepts `puedeBuscarPorDenominacion` and `puedeBuscarPorSeleccion: boolean`; renders only the `denominación` segment when the second is false. Never mounted when both are false (the page decides). |
| `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` | Modify | **Apply round 1 landed:** mode/criterion state, effect-owned dispatcher keyed on committed `criterioBusqueda`/`modoBusqueda` (handlers no longer dispatch), conditional `CardContent` mount passing `puedeBuscarPorDenominacion={puedeBuscarPorDenominacion(getRoles())}` and `puedeBuscarPorSeleccion={puedeBuscarPorSeleccion(getRoles())}`, `modoBusqueda` initialized to `null` when denominación is not permitted. **Remaining delta (post 2026-09-14 scope reduction) — feedback only:** Enter/option feedback toasts via `addAlert` with one-shot `pendienteFeedbackRef`, blank-term guard hint in `ejecutarBusquedaActiva` (denominación) and in the option handlers (A3/A4). The withdrawn A1 leaves no effect change: the no-criterion CR branch (L626-630) stays exactly as landed — clears `productos`/`entidadesTotales`, no request. |
| `src/componentes/gestion-producto/producto/domain/permisos-producto.ts` | Modify | Add two predicates alongside existing `puedeHacerAcciones` (L22-23): `puedeBuscarPorDenominacion(roles)` true for `ROOT`/`ADMINISTRADOR`/`EMPLEADO`/`VENDEDOR`/`REPOSITOR`/`REPARTIDOR`; `puedeBuscarPorSeleccion(roles)` true for `ROOT`/`ADMINISTRADOR`/`EMPLEADO`. |

**Must NOT change:** `header-producto.tsx`, `header-producto-lg.tsx`, `filtros-contesxt.tsx`, `sidebarFiltros.tsx`, `catalogos-context.tsx`, `crudFactory.ts`, `use-paginacion.ts`, `paginacion.tsx`, `entidad-selector-base.tsx`, `registrar-actualizar-linea.tsx`, `superlineas-selector.tsx`, the legacy `/producto/find-all-for-lineas/select` flow, and the backend.

## Interfaces / Contracts

```ts
// interfaces-generales.tsx
export interface SelectOption { codigo: number; nombre: string; descripcion: string; }

// utils/selectOption.ts
export const esSelectOptionArray: (r: unknown) => r is SelectOption[];
export const mapearSelectOptions: (o: SelectOption[]) => { id: number; denominacion: string }[];

// interfaces-producto.tsx
export interface ProductoListResponse { data: ConsultarProducto[]; total: number; }
export interface BusquedaProductoPorDenominacionParams { denominacion: string; skip: number; take: number; }
export interface BusquedaProductoPorSuperlineaParams { superLineaId: number; skip: number; take: number; }

// producto-service.tsx
buscarPorDenominacion: (p: BusquedaProductoPorDenominacionParams) =>
  ApiService.get("/producto/search-by-denominacion", p) as Promise<ProductoListResponse>;
buscarPorSuperlinea: (p: BusquedaProductoPorSuperlineaParams) =>
  ApiService.get("/producto/search-by-superlinea", p) as Promise<ProductoListResponse>;
// Línea products: reuse baseService.obtener({ lineaId, skip, take }) → /producto/search-by (crudFactory L18-20)

// linea-service.tsx
buscarSelect: (denominacion: string) => Promise<SelectLinea[]>; // GET /linea/select?denominacion

// superlinea-service.ts
obtenerSelect: (denominacion?: string) => Promise<SelectSuperlinea[]>; // GET /superlinea/select

// permisos-producto.ts
export const puedeBuscarPorDenominacion = (roles: number[]) =>
  [Rol.ROOT, Rol.ADMINISTRADOR, Rol.EMPLEADO, Rol.VENDEDOR, Rol.REPOSITOR, Rol.REPARTIDOR]
    .some((r) => roles.includes(r));
export const puedeBuscarPorSeleccion = (roles: number[]) =>
  [Rol.ROOT, Rol.ADMINISTRADOR, Rol.EMPLEADO].some((r) => roles.includes(r));

// busqueda-producto.tsx props
interface BusquedaProductoProps {
  puedeBuscarPorDenominacion: boolean;
  puedeBuscarPorSeleccion: boolean;
  // …controlled term/options/selection + onSearch props
}

// consultar-producto.tsx — local model
type ModoBusqueda = "denominacion" | "linea" | "superlinea";
type CriterioBusqueda =
  | { tipo: "denominacion"; valor: string }
  | { tipo: "linea"; lineaId: number }
  | { tipo: "superlinea"; superLineaId: number };
```

## Testing Strategy

No test runner, coverage tool, or test CI job is configured (`openspec/config.yaml`; `AGENTS.md`). `strict_tdd: false`; no unit/integration/e2e layer will be designed. Verification is static + manual: `yarn tsc -b` (expect pre-existing failures), `yarn lint` (pre-existing), `yarn build`, plus manual scenarios for each mode (Enter-only, exclusivity reset, pagination, empty term, request failure) and for the operative amendment scope (A3/A4 feedback only): entry under a CR mode shows the blank cleared table with no request and no toast (A1's unfiltered entry listing is withdrawn); mode switch clears results and resets to page 1 (never prior filtered results or a later page) and is silent; Enter with matches shows the INFO count toast that auto-dismisses without clearing results; no-match and blank-term Enters show the WARNING toasts with no request; page changes and entry never toast; a failed search shows only the ERROR toast; `Cobrador` entry is byte-for-byte the pre-existing behavior. No automated pass will be claimed.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. This change is UI plus an HTTP client.

## Migration / Rollout

No migration required — additive, page-local state, no persisted data. Rollback: `git revert` the nine files above; no feature flag needed.

## Open Questions

- [x] U6 — RESOLVED (user decision): per-endpoint gating. `Root`/`Administrador`/`Empleado` see all three modes; `Vendedor`/`Repositor`/`Repartidor` see denominación only; `Cobrador` sees no mode and issues no request. Recorded in the decisions table, `Role propagation`, and the no-capability state above.
- [ ] Confirm the UX intent: using the existing sidebar filter search passively clears the active CR mode (legacy reclaims the list). Assumed yes for exclusivity. Not affected by the role gate.
- [ ] Confirm the código quick search stays where it is as the legacy default rather than becoming a fourth segment. Not affected by the role gate.

## Pre-existing observations (out of scope)

- The Línea create/edit form already calls `GET /superlinea/select` (`registrar-actualizar-linea.tsx:80` → `SuperLineaService.obtenerSelect`), which is `@Roles('Root','Administrador','Empleado')` (`superlinea.controller.ts:51-52`). Roles outside that set already received a 403 there before CR-004. Pre-existing; **NOT** part of this change; candidate follow-up.
- Verified backend `@Roles` for `GET /producto/search-by-denominacion` is `Root, Administrador, Empleado, Vendedor, Repartidor, Repositor` (`producto.controller.ts:139-147`); neither `Cobrador` nor `Cobrador2` is listed, though `Cobrador` can reach the page (`App.tsx:36`) and `Cobrador2` cannot. The updated spec places `Cobrador` outside both endpoint sets, so the frontend deliberately offers it no mode and issues no request — consistent with the backend. Pre-existing authorization boundary, outside CR-004 scope.
