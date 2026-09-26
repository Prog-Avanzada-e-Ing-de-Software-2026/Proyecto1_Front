# Design: Hotfix — Producto Post-Mutation List Behavior

## Technical Approach

Single-file change in `ConsultarProductos` (`src/componentes/gestion-producto/producto/utils/consultar-producto.tsx`). No service, interface, or state-shape changes.

The pagination effect (`consultar-producto.tsx:691-704`) is the existing single owner of the criterion dispatch. A small `refrescarListadoVigente` helper centralizes the criterion dispatch; create and edit call it under different guards.

## Architecture Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Create success | `handleSuccess` refreshes only when a search is active (`criterioBusqueda` set, or no CR mode with `busquedaRapida` or `buscar.cont > 0`); otherwise no request, no list mutation | Requirement `Alta refresca solo con búsqueda activa`: keeps the user's criterion when the table is loaded by a search, and preserves the CR-004 empty/no-criterion state. |
| Edit success | `handleActualizarSuccess` dispatches when a CR criterion is committed or no CR mode is active; no request when a CR mode has no criterion | Requirement `Recarga de edición según criterio activo`; reusing the effect's branch order avoids divergence between entry/switch/paging and post-edit refresh. |
| Dispatch reuse | Extract a local `refrescarListadoVigente` helper (CR → `ejecutarBusquedaActivaRef`; `busquedaRapida` → `handleBuscarProductosRapido`; else → `handleBuscarProductos`) called by create/edit | Plain local function, NOT referenced from the pagination effect's dependency array, so the effect's identity/deps stay untouched and no re-run loop is introduced. Centralizes the criterion mapping for both mutations. |
| Active-search predicate | `criterioBusqueda !== null \|\| (modoBusqueda === null && (busquedaRapida \|\| buscar.cont > 0))` | Prevents a stale `busquedaRapida`/`buscar.cont` from triggering a legacy refresh while a CR mode owns the list. |
| Criterion lookup | Read `criterioBusqueda`/`modoBusqueda`/`busquedaRapida`/`buscar` from the render closure; call `ejecutarBusquedaActivaRef.current()` for the CR path | Same accessor the effect uses, so the latest committed criterion/skip/take is used. The handlers are recreated each render and passed down on each render. |

## Data Flow

```
refrescarListadoVigente()
   criterioBusqueda present ─► ejecutarBusquedaActivaRef.current()      (same criterion, current page)
   busquedaRapida           ─► handleBuscarProductosRapido()            (same código/exacto)
   else                     ─► handleBuscarProductos()                  (sidebar filters / legacy)

Alta success ─► closeModal(); addAlert(SUCCESS)
   hayBusquedaActiva (criterioBusqueda, o modo null y (busquedaRapida || buscar.cont > 0))
        ─► refrescarListadoVigente()
   else ─► (nothing)                                                    (empty table stays empty)

Edición success ─► closeModal(); addAlert(SUCCESS)
   criterioBusqueda || modoBusqueda === null ─► refrescarListadoVigente()
   CR mode, no criterio                      ─► (nothing)               (list stays empty)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx` | Modify | Add `busquedaRapida` to the `useFiltrosContext` destructure; add `refrescarListadoVigente`; `handleSuccess` refreshes only under the active-search predicate; `handleActualizarSuccess` uses the same helper under the criterion/no-CR-mode guard. |

**Must NOT change:** the pagination effect (`:691-704`), the CR-004 mode handlers, `ProductoService`, `RegistrarActualizarProductoForm`, `producto-modales.tsx`, headers, filters, and the backend.

## Testing Strategy

No test runner, coverage tool, or test CI job is configured (`openspec/config.yaml`; `AGENTS.md`). `strict_tdd: false`. Verification is static plus focused manual:

- `yarn tsc -b` (expect pre-existing failures), `yarn lint` (pre-existing), `yarn build`.
- Manual: create a Producto with a CR mode active and no criterion (empty table) → no list request, table stays empty.
- Manual: search by denominación / Línea / SuperLínea, then create → same criterion re-searched; same after edit.
- Manual: código quick search, then create → same código re-searched.
- Manual: sidebar filters, then create → same filters refreshed.
- Manual: no CR mode active, edit → legacy list refresh.
- No automated pass will be claimed.

## Migration / Rollout

None. Page-local behavior only. Rollback: `git revert` the single file.

## Open Questions

None — behavior confirmed by the maintainer (2026-09-26): entry stays empty; create does not load; edit reloads honoring the active criterion.
