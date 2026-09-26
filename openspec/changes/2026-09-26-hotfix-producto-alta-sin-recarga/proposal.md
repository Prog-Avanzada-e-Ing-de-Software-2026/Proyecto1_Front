# Proposal: Hotfix — Producto Create Must Not Reload the List; Edit Reloads by Active Criterion

## Intent

Stop the Producto creation flow from blindly issuing a list request (`GET /producto`) and replacing the visible list. On creation, refresh the list ONLY when the user has an active search with a criterion, keeping that criterion; when the table is empty or has no criterion, issue no request. On update (edit), refresh the list respecting the active search criterion instead of always falling back to the legacy unfiltered query.

## Motivating Defect

In `ConsultarProductos`, `handleSuccess` (create) calls `ProductoService.obtener(...)` and repopulates `productos`/`entidadesTotales` right after a successful creation, always with the legacy unfiltered query. This violates the CR-004 behavior where a CR mode with no committed criterion keeps the table empty and issues no request (`producto-busqueda-parcial`), and it ignores the user's active search criterion when one exists.

Separately, `handleActualizarSuccess` (edit) always calls the legacy `handleBuscarProductos()`, which ignores the active CR search criterion (denominación / Línea / SuperLínea), the código quick search, and replaces the filtered results with an unfiltered list.

## Scope

### In Scope

- On successful creation: refresh the list keeping the active user criterion (CR-004 partial search, código quick search, or sidebar filters) when a search is active; issue no request and change nothing when the table is empty or has no criterion.
- Make the post-edit refresh respect the active criterion: CR search criterion when committed, código quick search, sidebar filters, or legacy query, and no request when a CR mode is active without a committed criterion.
- Keep the create/edit success notifications and modal close behavior unchanged.
- Keep list state intact on success (no unintended clearing).

### Out of Scope

- Changing entry behavior: the table stays empty until a search (CR-004 behavior is preserved).
- Changing the `RegistrarActualizarProductoForm` submit flow, payloads, services, or HTTP contracts.
- Adding new search modes, changing pagination, or changing sidebar/quick-search behavior.
- Introduction of an automated test runner.

## Capabilities

### New Capabilities

- `producto-listado-tras-mutacion`: behavior of the Producto list after a create or update.

### Modified Capabilities

None.

## Approach

Keep the change inside `ConsultarProductos`. Add one `refrescarListadoVigente` helper that dispatches by active criterion: CR partial search (`criterioBusqueda`) → `ejecutarBusquedaActiva`; código quick search (`busquedaRapida`) → `handleBuscarProductosRapido`; otherwise → `handleBuscarProductos` (sidebar filters/legacy).

- `handleSuccess` (create): close the modal and show the success alert, then call the helper ONLY when a search is active (`criterioBusqueda` set, or no CR mode with `busquedaRapida` or `buscar.cont > 0`). In the empty/no-criterion state, issue no request and do not touch the list.
- `handleActualizarSuccess` (edit): close the modal and show the success alert, then call the helper when a CR criterion is committed or no CR mode is active; with a CR mode and no criterion, issue no request.

## User Impact

Creating a Producto refreshes the currently searched/filtered listing keeping the user's criterion, and does nothing when the table is empty or has no criterion. Editing a Producto refreshes the currently searched/filtered listing instead of resetting it to an unfiltered list.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` | Modified | `handleSuccess` and `handleActualizarSuccess` list behavior. |
| `openspec/changes/2026-09-26-hotfix-producto-alta-sin-recarga/specs/producto-listado-tras-mutacion/spec.md` | Added | Delta spec for post-mutation list behavior. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| A new product is not visible until the user searches when the table was empty | High (intended) | Accepted by requirement: with no active search, creation does not load the list. |
| Create refresh reuses a stale criterion/mode | Low | Refresh is delegated to the same active-criterion dispatch the page already uses; the handler is recreated each render. |
| Edit refresh emits the wrong query (legacy vs criterion) | Medium | Mirror the pagination effect's exact branch order and verify both paths manually. |
| Stale closure over criterion/mode in the edit handler | Low | The handler is recreated each render and passed down on each render; criterion/mode cannot change while the edit modal is open. |

## Dependencies

- Existing `ProductoService.obtener`, `buscarPorDenominacion`, `buscarPorSuperlinea`, and `obtener({ lineaId })` contracts.
- Existing pagination state (`usePaginacion`) and CR-004 mode state.

## Rollback Plan

Revert the single code file to restore the previous create/update reload behavior. No persisted data or migration requires reversal.

## Success Criteria

- [ ] Successful creation refreshes the list keeping the active criterion (CR partial search / código quick search / sidebar filters) when a search is active.
- [ ] Successful creation with an empty table or no criterion issues no list request and does not change the list.
- [ ] Successful edit refreshes the list honoring the active criterion.
- [ ] Successful edit with a CR mode active and no committed criterion issues no request.
- [ ] Entry remains empty until a search.
