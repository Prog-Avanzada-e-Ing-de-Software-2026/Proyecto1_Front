# Verify Report: Hotfix — Producto Post-Mutation List Behavior

## Scope

- Change: `2026-09-26-hotfix-producto-alta-sin-recarga`
- Files: `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx`

## Commands

| Command | Result | Notes |
|---------|--------|-------|
| `yarn build` | PASS | `✓ built in 4.01s` (pre-existing chunk-size warning only). |
| `yarn tsc -b` | FAIL (pre-existing) | Many errors in unrelated files (missing modules in gestión-venta, sidebarFiltros, etc.). Grep confirms **no** error in `consultar-producto.tsx`. |
| `yarn lint` | FAIL (pre-existing) | In `consultar-producto.tsx` only pre-existing `no-empty` errors at `:223`/`:245`/`:270` (fetchLineas/fetchMarcas/fetchProveedores empty `finally`) and exhaustive-deps warnings. No new message introduced by this change. |

## Conformance

- `Alta refresca solo con búsqueda activa`: `handleSuccess` refreshes via `refrescarListadoVigente` only when `criterioBusqueda` is set, or `modoBusqueda === null` with `busquedaRapida`/`buscar.cont > 0`; otherwise no request and no list change. Implemented; static review confirms.
- `Recarga de edición según criterio activo`: `handleActualizarSuccess` refreshes via the same helper when `criterioBusqueda` is set or `modoBusqueda === null`; no request with a CR mode and no criterion. Implemented; static review confirms.

## Pending

- Manual runtime verification (create/edit scenarios) was not executed in this environment; requires the running app. No automated pass is claimed.
