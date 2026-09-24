# Exploration: preload-presentaciones-producto

Change: `preload-presentaciones-producto` · Store: hybrid (OpenSpec + Engram) · Language: English (technical artifact; Spanish ubiquitous language preserved: Presentación, Marca, Línea, Denominación automática).

Read-only exploration. No production source was modified. Evidence read from real on-disk code and the authored API contract.

---

## Current State

The Producto create/edit form is `RegistrarActualizarProductoForm`
(`src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`). A single opening
effect (L235-280, deps `[producto]`) branches on the presence of `producto`:

**CREATE branch — `else` (L265-273):** loads two option lists only:
```
const [marcasResponse, lineasResponse] = await Promise.all([
  ProductoService.obtenerTotales({ denominacion: "" }, "marcas"),
  ProductoService.obtenerTotales({ denominacion: "" }, "lineas"),
]);
setMarcas(marcasResponse.data);
setLineas(lineasResponse.data);
```
`presentaciones` is never preloaded. It starts as `[]` (L103) and is filled only by
`handleBuscarPorDenominacion("PRESENTACION")` (L355-369), triggered by Enter in the
Presentación input (`handleEnterEnSelect` L388-390) or after creating a Presentación
(L763-771). That path calls `PresentacionService.select({ denominacion: denominacionPresentacion.trim() })`.

**EDIT branch — `if (producto)` (L238-264):** none of the three option lists is loaded. It only
`setValue`s the ids and `setSelected*`s:
```
setValue("lineaId", producto.linea.id || 0);       setSelectedLinea(producto.linea);
setValue("marcaId", producto.marca.id || 0);       setSelectedMarca(producto.marca);
setValue("presentacionId", producto.presentacion?.id || 0);
setSelectedPresentacion(producto.presentacion ?? null);
```
So in edit mode all three selectors receive `opciones = []`.

**Selector behavior** (`EntidadSelectorBase`, `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx` L82-99):
```
value={opciones.find((o) => o.id === selectedId) ?? selected}
options={opciones}
isDisabled={disabled}
```
The `?? selected` fallback means the current value still *displays* even with empty options. But the
select is enabled whenever `disabled` is false, and `disabled` is passed as
`producto && producto.sistema > 0` (L658, L678, L696). Therefore for a Producto with
`sistema === 0` (user-created), edit mode leaves the selector interactive with zero options —
the user cannot pick another Marca, Línea or Presentación, even though the documented edit flow
says the form "permite seleccionar marcas, líneas y presentaciones previamente registradas antes
de confirmar la actualización" (`docs/Analisis_Cambios.md` L313; corroborated by L304).

**Services / contract (verified):**
- `ProductoService.obtenerTotales(filtros, entidades)` from `createCrudService`
  (`src/utils/crudFactory.ts` L43) → `GET /producto/find-all-for-${entidades}/select`.
- The OpenAPI contract exposes `GET /api/producto/find-all-for-marcas/select` (L743) and
  `GET /api/producto/find-all-for-lineas/select` (L796) — both `{ data: [...], total }`
  (`ListadoConTotalDto`), optional `denominacion` query. **There is no `/producto/find-all-for-presentaciones/select`.**
- The only Presentación selection endpoint is `GET /api/presentacion/select`
  (`docs/contracts/openapi.json` L2091; `PresentacionService.select`, `presentacion-service.tsx` L10-11),
  optional `denominacion` query (L2094-2110), response `{ data: PresentacionDto[], total }`.
- `ApiService.get` returns the raw JSON body (`src/utils/apiService.ts` L14-25), so both calls
  yield `{ data, total }` with `data` as the array.
- `SelectPresentacion` = `{ id: number; denominacion: string }`
  (`interfaces-producto.tsx` L204-207); `PresentacionDto` is a superset, structurally compatible.

**Unfiltered call is the documented "list all active" path:** the `/presentacion/select`
description is "Devuelve las presentaciones activas que coinciden parcialmente por denominación",
with `denominacion` optional and `example: "1L"`. An empty/omitted `denominacion` returns all active
Presentaciones. This is exactly what `handleBuscarPorDenominacion` already relies on when the input
default `" "` is `.trim()`-ed to `""`.

---

## Affected Areas

- `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` — the opening effect (L235-280) is the single behavioral change site; `presentaciones` state (L103) already exists.
- `src/componentes/gestion-producto/presentacion/services/presentacion-service.tsx` — reused as-is, no change.
- `src/interfaces/gestion-producto/producto/interfaces-producto.tsx` — `SelectPresentacion` already models the projection, no change.
- `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx` — consumer; no change required (its `options`/`selected` contract already supports a populated edit-mode list).
- `docs/contracts/openapi.json` — evidence only; confirms no producto-scoped presentaciones endpoint.

---

## Approaches

1. **Symmetric option preload (all three lists, both branches)** — restructure the opening effect so the three option-list loads (`marcas`, `lineas`, `presentaciones`) run unconditionally in `Promise.all`, while the `producto` value `setValue`/`setSelected` precarga stays inside its `if (producto)` block.
   - Pros: one coherent change fixes the root cause for all three selectors; edit mode becomes consistent (no half-populated form); matches the documented edit flow; removes the create/edit asymmetry that caused the bug; single load site has no duplication with `handleBuscarPorDenominacion`.
   - Cons: touches Marca/Línea behavior beyond the literal Presentación ask; adds three parallel requests in edit mode; requires updating the `[producto]` effect deliberately.
   - Effort: Low.

2. **Presentación-only preload** — add presentaciones to the create `Promise.all` and add a separate `PresentacionService.select({ denominacion: "" })` load in the edit branch only.
   - Pros: smallest surface strictly tied to the user decision; does not alter Marca/Línea.
   - Cons: leaves edit mode half-fixed (Presentación dropdown populated, Marca/Línea still empty for `sistema === 0`) — an internally inconsistent UX; introduces a second, divergent load pattern for the same concern; more code than the symmetric fix.
   - Effort: Low.

3. **Split into two changes** — ship Presentación now (approaches 1 or 2) and a separate change for Marca/Línea edit preload.
   - Pros: strictest scope isolation; each change maps to its own proposal.
   - Cons: two nearly identical edits to the same effect; the first change knowingly ships an inconsistent edit form; reviewer sees the same code twice without extra insight.
   - Effort: Low per change, Medium coordination.

---

## Recommendation

**Adopt Approach 1** and keep Marca/Línea edit-mode preload **in this change**.

Evidence for including Marca/Línea here:
1. **Same root cause, same effect, same fix.** The defect is the `if/else` split in one effect: option lists are loaded only in `else`. Fixing only Presentación requires a second, different code path for the same concern, which is *more* code and *more* review surface than making the load unconditional.
2. **Documented edit requirement.** `docs/Analisis_Cambios.md` L313 states the edit modal must let the user select Marca, Línea and Presentación. The current `sistema === 0` edit path violates this for all three; fixing only one leaves a documented requirement partly unmet.
3. **Consistency of the selector contract.** `EntidadSelectorBase` is shared by all three selectors with an identical `options`/`selected` contract; populating only one produces a visibly inconsistent form.
4. **No contract risk.** All three loads use existing endpoints; no DTO, service or interface change is needed.

Concrete minimal shape (planning only, not applied): in the L235-280 effect, perform one
`Promise.all` of `obtenerTotales({denominacion:""},"marcas")`,
`obtenerTotales({denominacion:""},"lineas")`, and `PresentacionService.select({ denominacion: "" })`
→ `setMarcas(...data)`, `setLineas(...data)`, `setPresentaciones(response?.data ?? [])`; then keep
the existing `if (producto) { setValue/setSelected... }` block verbatim. Use `?? []` for the
presentaciones result for the same defensive reason the existing `handleBuscarPorDenominacion`
uses it (L359).

If the orchestrator/user prefers strict scope discipline over consistency, Approach 2 is the fallback,
but it should be recorded as an explicit accepted inconsistency.

---

## Risks

- **Silent empty list at preload.** `handleBuscarPorDenominacion("PRESENTACION")` (L360-368) shows a warning alert when `total === 0`; a preload does not. Keep parity with Marca/Línea (silent) to avoid new alert noise, and keep the warning only on explicit Enter. Decide explicitly in the spec.
- **No loading/error UX change.** The effect only `console.error`s on failure (L274-276); a preload that fails silently yields an empty dropdown. This is pre-existing behavior; do not expand scope unless the proposal says so.
- **Duplicate/in-flight requests.** `handleBuscarPorDenominacion` refetches on Enter; no request sequencing exists. Preloading replaces options, and Enter-triggered filtered loads may race. Existing behavior; note but do not fix here.
- **Edit with inactive/deleted selection.** If the Producto's current Marca/Línea/Presentación is no longer active, the unfiltered active list will not contain its id; `EntidadSelectorBase` still shows it via the `?? selected` fallback, so display is preserved. Confirm this is acceptable in the spec.
- **`sistema > 0` products.** Their selectors stay disabled (`producto && producto.sistema > 0`), so the preload is harmless but unused; do not couple loading to `sistema`.
- **Denominación automática (CR-005) interaction.** The suggestion effect (L188-233) reads `marcas`/`lineas`/`presentaciones` but returns early when `producto` is present (L190), so preloading in edit mode cannot alter the automatic `denominacion`. Verify this in the spec's boundary scenarios.
- **Type looseness.** `ApiService.get` returns `any`, so swapping response shapes would not be caught by `tsc`; the spec must pin the `{ data, total } → data` contract for both services.

---

## Ready for Proposal

Yes. The change is low-effort and well-bounded: one effect in one file, existing endpoints, no contract
or interface changes. The proposal should record the explicit scope decision on Marca/Línea edit
preload (recommended: included), the empty-list/silent-alert decision, and the edit-mode
inactive-selection boundary.
