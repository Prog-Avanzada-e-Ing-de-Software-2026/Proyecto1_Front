# Exploration: CR-004 — Frontend search by denominación / línea / superlínea (partial matches)

Change: `2026-09-13-CR-004` · Store: hybrid (OpenSpec + Engram) · Language: English (technical artifact; Spanish ubiquitous language preserved).

Sources: `docs/Pedidos de Cambio/CR-004/CR-004.md` (frontend) and the archived backend change
`Proyecto1_Back/openspec/changes/archive/2026-09-13-cr-004-busqueda-coincidencias-parciales/` + backend source (read-only).

---

## 1. Exact backend contract (authoritative)

Global facts:
- Global route prefix `api` — `Proyecto1_Back/src/main.ts` L36 (`app.setGlobalPrefix('api')`).
- All three controllers are guarded: `@UseGuards(AuthGuard)` (`producto.controller.ts` L40, `linea.controller.ts` L32, `superlinea.controller.ts` L30). Requests need `Authorization: Bearer <token>`.
- Active-only is enforced in persistence (soft delete), not in the controllers.

### HU-1 — Products by denominación

| Item | Value | Citation |
|---|---|---|
| Verb / route | `GET /api/producto/search-by-denominacion` | `producto.controller.ts` L139-159 |
| Query params | `denominacion?: string` (optional, controller default `''`), `skip: number` = 0 (min 0), `take: number` = 10 (min 1), `incluirEliminados?: boolean` (optional, **accepted but ignored**) | `common/dto/busquedas/pagination-with-denominacion.dto.ts` L5-27; controller L153; ignore confirmed by `verify-report.md` S-04 L230 |
| Response | `{ data: GetProductoDto[]; total: number }` | `producto.service.ts` L255-271; `paginacion-utils.ts` L9-11 |
| Matching | case-insensitive + accent-sensitive containment | `design.md` L74-84; `verify-report.md` L134 |
| Empty/whitespace term | `{ data: [], total: 0 }`, no DB query | `verify-report.md` L141 |
| Roles | Root, Administrador, Empleado, Vendedor, Repartidor, Repositor | controller L140-147 |

### HU-2 — Línea selection (search) + products of selected línea

| Item | Value | Citation |
|---|---|---|
| Verb / route | `GET /api/linea/select` | `linea.controller.ts` L63-71 |
| Query params | `denominacion?: string` (optional, default `''`). **No `skip`/`take`** | `linea/dto/select-linea.dto.ts` L3-7; controller L69 |
| Response | `SelectOption[]` = `{ codigo: number; nombre: string; descripcion: string }[]` | `common/interface/select-option.ts` L1-5; `linea.controller.ts` L68-70; `linea.service.ts` L112-116 |
| Mapping | `id→codigo`, `denominacion→nombre`, `observacion ?? ''→descripcion` | `design.md` L34, L95 |
| Active-only + accent-sensitive | adapter + `LineaMapper.toSelectOption` | `verify-report.md` L112-123 |
| Roles | Root, Administrador, Empleado | controller L64 |
| Products of selected línea | **No new endpoint.** Only existing mechanism: `GET /api/producto/search-by` with `lineaId` | `producto.controller.ts` L102-137; `SearchProductoPaginationWithDto` L4-68; `producto.persistence-adapters.ts` L220-296 (`linea.id = :linea_id` L276-278, `deletedAt IS NULL` L285) |

> `design.md` L117 and `verify-report.md` S-05 L231 record that HU-2 "products of a selected línea" has **no dedicated delta spec** and was implicitly left to the pre-existing `findBy` `lineaId` filter. Treat this route as the working contract, flagged as an assumption (see §6 U2).

### HU-3 — Superlínea selection (search) + products by superlínea

| Item | Value | Citation |
|---|---|---|
| Verb / route | `GET /api/superlinea/select` | `superlinea.controller.ts` L51-59 |
| Query params | `denominacion?: string` (optional, default `''`) | `superlinea/dto/select-superlinea.dto.ts` L3-7; controller L57 |
| Response | `SelectOption[]` (`codigo`/`nombre`/`descripcion`) | controller L56-58; same shape as HU-2 |
| Roles | Root, Administrador, Empleado | controller L52 |
| Products by superlínea | `GET /api/producto/search-by-superlinea` | `producto.controller.ts` L161-174 |
| Query params | `superLineaId: number` **required** (no default), `skip` = 0 (min 0), `take` = 10 (min 1) | `search-producto-superlinea.dto.ts` L5-21 |
| Response | `{ data: GetProductoDto[]; total: number }` | `producto.service.ts` L273-289 |
| Active-only | join filters `producto`, `linea`, `superLinea` `deletedAt IS NULL` | `producto.persistence-adapters.ts` L502-504 |
| Roles | Root, Administrador, Empleado, Vendedor, Repartidor, Repositor | controller L162-169 |

### Product DTO returned by all three product queries (`GetProductoDto`)
`id, denominacion, codigoProveedorDenominacion, codigoProveedor, proveedor, ubicacion, stock, alicuota, costo, precio, precioConIva, sistema, observacion, utilizaStockMinimo, stockMinimo, utilizaPack, cantidadPorPack, codigoReferencia` — `get-producto.dto.ts` L14-135; produced by `ProductoMapper.toBusquedaDto` (`producto.mapper.ts` L16-48).

**HTTP layer baseline**: `apiUrl = import.meta.env.VITE_API_URL` (`src/utils/axiosConfig.ts` L1-3); `ApiService.get(url, params)` sends `params` and `Authorization: Bearer <localStorage Token>` and returns `response.data` (`src/utils/apiService.ts` L5-25).

---

## 2. Current frontend state

### 2.1 HTTP layer
- `src/utils/axiosConfig.ts` — only `apiUrl` from `VITE_API_URL` (L1-3).
- `src/utils/apiService.ts` — `get/post/put/delete/patch`; `get` passes `params` and auth header; returns unwrapped `data` (L14-25). A generic query-param mechanism already exists.
- `src/utils/crudFactory.ts` — `createCrudService<T>(baseEndpoint)` exposes generic methods: `obtener(filtros) → GET /{base}/search-by` (L18-20), `obtenerTotales(filtros, entidades) → GET /{base}/find-all-for-{entidades}/select` (L43), plus `obtenerDesde`, `obtenerRapido`, etc. Params are passed straight through.
- `src/utils/consultarEntidad.tsx` — legacy generic list component with client-side `searchTerm` (L37, L110); **no callers** (CodeGraph blast radius empty). Not the current pattern.

### 2.2 Product feature (`src/componentes/gestion-producto/producto/`)
- Page `utils/consultar-producto.tsx` (`ConsultarProductos`, L37): local `productos`; pagination via `usePaginacion(PAGINACION.TAKE_DEFAULT)` (L65-73); filters via `useFiltrosContext` (L77-86); catalog setters `setLineas/setMarcas/setProveedores` (L91-95).
- `handleBuscarProductos` (L396-421) calls `ProductoService.obtener({denominacion, codigoProveedor, codigoReferencia, ..., lineaId, marcaId, proveedorId, conStock, skip, take})` → `/producto/search-by`. Triggered by sidebar `buscar.cont` (L124-128) and pagination (L445-449).
- `handleBuscarProductosRapido` (L423-441) → `/producto/search-by-rapido`; auto-triggered on keystroke with a 400 ms debounce (L116-122) — **not** Enter.
- Service `services/producto-service.tsx`: spreads `createCrudService("producto")` (L11-14); no `search-by-denominacion` / `search-by-superlinea` methods.
- Header `componentes/header-producto.tsx`: only a "Código..." input whose Enter handler is **commented out** (L55). No denominación search box and no Enter-triggered search anywhere in the product page.

### 2.3 Pagination
- Hook `src/hooks/use-paginacion.ts`: `{paginaActual, entidadesTotales, skip, take, setEntidadesTotales, handlePageChange(skip,take,paginaActual), resetearPaginacion}` (L3-39).
- UI `src/componentes/herramientas/reutilizables/paginacion.tsx`: `totalPaginas = ceil(entidadesTotales/take)` (L21); props `{entidadesTotales, take, paginaActual, onChange}`; custom Buttons + `react-select` page-size.
- `src/config/paginacion.ts`: `TAKE_DEFAULT = 10` (L2) — matches CR-004's 10-per-page.
- **Correction:** `react-paginate` is a dependency (`package.json` L51) but has **0 usages**; the app uses the custom `Paginacion` component.

### 2.4 Filters
- `src/context/filtros-contesxt.tsx` (`FiltrosProvider`): `valoresFiltros` fields include `denominacion, lineaId, denominacionLinea, marcaId, ...` (L5-50); search trigger `buscar:{cont,componente}` (L52-55, L124); counters `buscarMarcas`/`buscarLineas` (L126-127). Wired to `/producto/search-by` (accent-insensitive), **not** to the CR-004 endpoints.
- Mounted twice: globally in `src/main.tsx` L15 and again inside `AdministracionPage` L38 (product page uses the inner instance).
- `src/context/filtros-componentes-context.tsx` (`FiltrosComponentesProvider`) — **dead code**: defined but never mounted nor consumed anywhere in `src`.
- `src/hooks/useFiltrosIniciales.ts` L3-5 + `src/config/filtros-iniciales.ts` L3-9 — only `"consultar-producto"` is defined.
- `src/componentes/sidebarFiltros.tsx` already sets Enter handlers for línea (L359-363) and marca (L514-518) that increment `buscarLineas`/`buscarMarcas`. Only `cambio-precios-masivo` and `lista-precios` consume those counters; `consultar-producto.tsx` does **not** (it refetches on text change, L165-167). So "Enter-only" is inconsistent today.

### 2.5 Catalogs
- `src/context/catalogos-context.tsx` (`CatalogosProvider`, mounted in `main.tsx` L16): holds `lineas/sublineas/marcas/clientes/proveedores/condicionesIva/provincias/familiasBanco` (L11-28), **no superlíneas**. It does not fetch; pages populate it via `obtenerTotales`.
- The product page loads líneas/marcas/proveedores with `ProductoService.obtenerTotales({denominacion}, "lineas"|"marcas"|"proveedores")` → `/producto/find-all-for-lineas/select` etc. (L148-214). That legacy endpoint returns `{data, total: 1}` with `{id, denominacion}` (`linea.service.ts` `findAllFor` L95-110) — a **different** contract from CR-004 `/linea/select`.

### 2.6 Línea / Superlínea UI
- `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx` — `EntidadSelectorBase<T extends {id,denominacion}>`: denominación `<input onKeyDown={onEnterInput}>` + `react-select` + optional "+" (L35-120). Exactly the reusable Enter-triggered selector shape.
- Consumer `linea/componentes/superlineas-selector.tsx` (L28-42) — but its `onEnterInput` is a no-op (`event.preventDefault()`) and options are loaded in bulk (`RegistrarActualizarLineaForm` L75-95 via `SuperLineaService.obtenerSelect()`), not searched on Enter.
- Available libs: `react-select` (used widely), `@headlessui/react`, `cmdk`, `@radix-ui/react-select` (`package.json` L18, L30, L41, L53).

### 2.7 Live specs already in `openspec/specs/`
- `linea-superlinea-association/spec.md` L11: "In Línea create mode, the system MUST load active options from `/api/superlinea/select`…". CR-004 changes that endpoint's response shape → **must be reconciled**.
- `superlinea-creation/spec.md`, `superlinea-management/spec.md` — CRUD/audit/navigation; no direct search conflict beyond the select-shape reconciliation.

### 2.8 Prior art (frontend conventions)
- `2026-09-12-CR-003/design.md` L15, L21, L49 and `exploration.md` L12 establish `/api/superlinea/select` → `{ data, total }` with the service validating that envelope.
- `2026-09-13-CR-003-P2/design.md` L5, L24-26 — selector via `/superlinea/select`, `transformData`, feature-service conventions.
- Both cite `docs/contracts/openapi.json` as the "authoritative contract", but **that file does not exist** in the frontend now (`docs/` contains only `Analisis_de_Dominio.md` and CR files). The citation is stale.

---

## 3. Contradictions (CR text vs backend contract vs current frontend)

1. **`/superlinea/select` shape break (HIGH).** Frontend `SuperLineaService.obtenerSelect()` validates `{data, total}` entities with `id/denominacion` and maps them (`superlinea-service.ts` L16-41). Backend CR-004 now returns a plain `SelectOption[]` (`superlinea.controller.ts` L56-58). `isListResponse` rejects an array → `obtenerSelect` throws `contractError` → the Superlínea selector in `RegistrarActualizarLineaForm` breaks. The live spec `linea-superlinea-association` L11 still requires loading from this endpoint. CR-004 must fix the frontend parser/shape.
2. **Accent sensitivity.** CR-004 requires accent-sensitive matching. The existing product `search-by` uses `UPPER(producto.denominacion) LIKE UPPER(:denominacion)` under default collation `utf8mb4_0900_ai_ci` (accent-insensitive) and `NormalizeDenominacionSearchPipe` uppercases the term (`normalize-denominations-search.pipe.ts` L19). So the current denominación filter does **not** satisfy CR-004; the new endpoints are required.
3. **Enter-only trigger.** CR-004 requires search **only** on Enter. Today the product quick search fires on keystroke (debounced, L116-122) and the filter search fires on the sidebar button (L124-128); the sidebar's Enter counters for línea/marca are not consumed by the product page. Inconsistent with the requirement.
4. **Two coexisting línea-selection contracts.** `/producto/find-all-for-lineas/select` (`{data, total:1}`) vs new `/linea/select` (`SelectOption[]`). The frontend uses the former for filters; CR-004 HU-2 is the latter. A choice must be made (recommendation: use `/linea/select` for the new flow, leave the legacy filter untouched).
5. **Stale contract doc.** `docs/contracts/openapi.json` is referenced by prior artifacts but absent.

---

## 4. Affected areas (smallest set)

| File | Change |
|---|---|
| `src/componentes/gestion-producto/producto/services/producto-service.tsx` | Add `buscarPorDenominacion(params)` → `/producto/search-by-denominacion` and `buscarPorSuperlinea(params)` → `/producto/search-by-superlinea` (via `ApiService.get`). |
| `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` | Fix `obtenerSelect(denominacion?)` to parse `SelectOption[]`; map `codigo→id`, `nombre→denominacion`. |
| `src/componentes/gestion-producto/linea/services/linea-service.tsx` | Add `buscarSelect(denominacion)` → `/linea/select` (slim `SelectOption[]`). |
| `src/interfaces/gestion-producto/producto/interfaces-producto.tsx` (or new search-interfaces file) | Types for search params/responses if not inline. |
| New shared type | `SelectOption` `{codigo,nombre,descripcion}` and/or a mapper to `{id,denominacion}`. |
| `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` | Wire the three Enter-triggered searches + reuse `usePaginacion`/`Paginacion`. |
| `src/componentes/gestion-producto/producto/componentes/header-producto.tsx` (+ `header-producto-lg.tsx`) | Add Enter-triggered search inputs/selectors. |
| `openspec/specs/linea-superlinea-association/spec.md` | Delta to reconcile `/superlinea/select` shape (archive phase). |

Optional / only if shared state is needed: `src/context/filtros-contesxt.tsx`. Prefer local page state to avoid touching the shared filter context.

---

## 5. Answers to the required questions

1. **Endpoints/params/response** — see §1 (each row cited).
2. **Existing infra vs new abstractions** —
   - HU-1: mostly existing infra (pagination UI + `ApiService.get`); new = one service method + an Enter input.
   - HU-2: selection needs a new `/linea/select` service method + shape mapping; product listing reuses `/producto/search-by?lineaId=` and existing pagination. `EntidadSelectorBase` gives the Enter+combobox pattern but its Enter is currently a no-op → wrap it.
   - HU-3: selection reuses `/superlinea/select` but the current parser is wrong (must fix); product listing uses the new `/producto/search-by-superlinea`.
3. **Smallest file set** — §4 (≈6-8 files + 1 spec delta).
4. **Extend generic CRUD/query utilities?** — No. The new routes are non-generic names, and extending `crudFactory` would broaden a shared surface. Use explicit `ApiService.get` methods inside the feature services (as `superlinea-service.ts` already does). A dedicated search service/abstraction is not warranted; thin methods suffice.
5. **Are líneas/superlíneas client-side?** — Líneas: only the legacy `{id,denominacion}` list loaded per-page into `CatalogosContext`; not the CR-004 `/linea/select`. Superlíneas: **not** in `CatalogosContext`; fetched ad hoc by `RegistrarActualizarLineaForm`. So HU-2/HU-3 selections must be fetched by search, not read from a catalog.
6. **Contradictions** — §3.
7. **UNKNOWNs** — §6.

---

## 6. UNKNOWNs (do not guess)

- **U1 — Target surface (product decision).** Is CR-004 an enhancement of the existing `/admin/producto` page (denominación input + línea/superlínea selectors) or a new dedicated search screen/route? The CR describes HUs, not placement. Owned by proposal/design.
- **U2 — HU-2 products contract.** No backend endpoint was created for "products of a selected línea"; `design.md` L117 leaves it open. Assumption: use `GET /api/producto/search-by?lineaId=&skip=&take=`. Confirm before spec.
- **U3 — `/superlinea/select` final shape.** Code returns `SelectOption[]`; the live frontend spec still describes a load from that endpoint. Confirm the frontend must adopt `codigo/nombre/descripcion` and emit an `linea-superlinea-association` delta.
- **U4 — Search-mode composition.** Whether the three searches coexist on one page (denominación + línea + superlínea) or are mutually exclusive modes; affects pagination reset and state.
- **U5 — `total`/page semantics.** Confirm `total` maps 1:1 to `entidadesTotales` for `Paginacion` (evidence supports yes: `paginacion-utils.ts`).
- **U6 — Responsiveness/role gating** of the new search controls (existing pages gate Add actions by role). Not specified by the CR.

---

## 7. Recommendation

**Option A — enhance the existing `ConsultarProductos` page** (recommended): add an Enter-triggered denominación input and línea/superlínea search selectors reusing `usePaginacion` + `Paginacion`, `EntidadSelectorBase`/`react-select`, and thin service methods. Pros: minimal files, matches established patterns, no new route/menu, reuses pagination and selector. Cons: the page is already large (644 lines); 3 modes need clear UX. Effort: Medium.

**Option B — new dedicated search route/screen.** Pros: isolated, cleaner 3-tab UX. Cons: new route/menu/guard, duplicate list rendering, larger blast radius; the CR does not ask for a new screen. Effort: High.

**Option C — rewire the shared `FiltrosContext`/sidebar to the new endpoints.** Pros: reuses existing plumbing. Cons: the context is shared across modules and wired to `/producto/search-by`; changing it risks regressions; the generic sidebar does not model "select a línea → list its products". Effort: High/risky. Rejected.

Also required regardless of option: fix `SuperLineaService.obtenerSelect()` to the new `SelectOption[]` shape (contradiction #1).

---

## 8. Risks

- Breaking the Línea create/edit Superlínea selector if the `/superlinea/select` shape fix is missed (contradiction #1).
- Treating the existing `search-by` as CR-004-compliant (it is accent-insensitive).
- Reusing `/producto/find-all-for-lineas/select` for HU-2 when the contract is `/linea/select`, or vice versa, leaving two divergent línea lists.
- Placing search state in the shared `FiltrosContext` and regressing other modules.
- Baseline: `node_modules` is **absent**, so `yarn build`, `yarn lint`, and `yarn tsc -b` cannot be run; no build/test result may be claimed. `openspec/config.yaml` baseline records build passing, lint/type-check failing pre-existing.
- `docs/contracts/openapi.json` (cited by prior artifacts) is absent — do not rely on it.

---

## 9. Ready for Proposal

**Yes** for the three flows, using the cited backend contract and Option A, with U1-U4 resolved during proposal/design. `sdd-research` (external evidence) is **not warranted**: the contract is fully derivable from the backend archived artifacts + source, and `react-select` is already in use; no external/library research is needed.
