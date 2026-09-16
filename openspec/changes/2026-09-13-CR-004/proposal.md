# Proposal: CR-004 — Partial-match product search by denominación, línea, superlínea

## Intent

`ConsultarProductos` cannot search by partial denominación nor list a `Línea`/`SuperLínea`'s products, though the backend exposes accent-sensitive partial-match endpoints. This change wires the page to them; no domain change.

## User Impact

- Partial denominación + Enter → matching active `Producto`s, 10/page.
- Partial `Línea`/`SuperLínea` + Enter → select → its active `Producto`s, 10/page.

## Scope

### In Scope

- Denominación: `GET /api/producto/search-by-denominacion` (skip/take).
- `Línea`: `GET /api/linea/select?denominacion` (`SelectOption[]`, unpaginated); products via `GET /api/producto/search-by?lineaId&skip&take`.
- `SuperLínea`: `GET /api/superlinea/select?denominacion`; products via `GET /api/producto/search-by-superlinea?superLineaId&skip&take`.
- Enter-only trigger; reuse `usePaginacion`/`Paginacion` (`TAKE_DEFAULT=10`), `ApiService.get`, `EntidadSelectorBase`/`react-select`.
- **Adapt `SuperLineaService.obtenerSelect()` to `SelectOption[]` (`codigo`/`nombre`/`descripcion`)** so the `Línea` selector keeps working.
- Delta to `linea-superlinea-association`.

### Out of Scope

- Backend work; new route/menu/guard; legacy `/producto/find-all-for-lineas/select`; on-keystroke/debounced search; new dependencies; test framework.

### Non-Goals

- Search state in shared `FiltrosContext` (regression risk) — local state only.
- Role gating (see Open Questions).

## Capabilities

### New Capabilities

- `producto-busqueda-parcial`: Enter-triggered partial-match `Producto` search by denominación and by selected `Línea`/`SuperLínea`.

### Modified Capabilities

- `linea-superlinea-association`: `SuperLínea` selector consumes the `/api/superlinea/select` `SelectOption[]` shape.

## Approach

Enhance the existing surface. Three **mutually exclusive** modes; the active one owns results/pagination, reset on switch. Fires only on Enter. State stays local; HTTP in feature services; `total` → `entidadesTotales` 1:1.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `producto/services/producto-service.tsx` | Modified | Add `buscarPorDenominacion`, `buscarPorSuperlinea`. |
| `linea/services/linea-service.tsx` | Modified | Add `/linea/select` method. |
| `superlinea/services/superlinea-service.ts` | Modified | Fix `obtenerSelect` shape (L16-41). |
| `producto/utils/consultar-producto.tsx` | Modified | Wire modes + paging reset. |
| `producto/componentes/busqueda-producto.tsx` | New | Presentational segmented mode control + Enter inputs/selectors, mounted once in `CardContent` (design decision: headers stay untouched). |
| `src/utils/selectOption.ts` | New | Shared `SelectOption[]` guard + mapping. |
| `interfaces/.../producto/interfaces-producto.tsx` | Modified | Search types. |
| `openspec/specs/linea-superlinea-association/spec.md` | Modified | Select-shape delta. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `obtenerSelect` fix missed → selector breaks | High | In-scope task + delta. |
| Wrong línea endpoint → divergent lists | Med | `/linea/select` only. |
| Shared-context regression | Med | Local state. |
| Baseline unverifiable (`node_modules` absent) | High | No pass claims. |

## Dependencies

- Backend CR-004 endpoints (verified).
- Existing `react-select`, `usePaginacion`, `Paginacion`, `EntidadSelectorBase`.

## Rollback Plan

Revert affected files via git; additive and page-local with no persisted state.

## Success Criteria

- [ ] Each mode searches only on Enter; lists active matches 10/page.
- [ ] Only the active mode drives results/pagination; switching resets it.
- [ ] Línea `SuperLínea` selector still works with `SelectOption[]`.
- [ ] `FiltrosContext` and legacy endpoints untouched; no new dependencies.

## Traceability

- HU-1/2/3 → `producto-busqueda-parcial` (denominación/línea/superlínea modes).

## Open Questions

- U6: role/responsiveness gating (CR silent); default mirror current read access.
