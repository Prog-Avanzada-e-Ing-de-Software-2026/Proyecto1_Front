# Proposal: Preload Producto Selector Options

## Intent

Ensure the Producto create and edit form opens with usable Marca, Línea, and Presentación option lists. The current opening effect loads only Marca and Línea during creation and loads no options during editing, leaving editable selectors empty despite the documented requirement that an existing Producto can be reassigned to previously registered values.

## Scope

### In Scope
- Preload active Marca, Línea, and Presentación options unconditionally when the Producto form opens in either create or edit mode.
- Include Marca and Línea edit-mode preload in this change because all three selectors share the same root cause and existing service contracts.
- Surface a user-facing error alert through the existing `useAlerts()` mechanism and `TipoAlerta.ERROR` when the opening preload fails.
- Show a clear Spanish inline empty-state message when a preloaded selector option list is empty, using a backward-compatible optional `EntidadSelectorBase` prop where that shared selector is used.
- Preserve the current Producto value preload, inactive-selection display fallback, explicit Enter search behavior, and edit-mode Denominación automática guard.

### Out of Scope
- Changes to endpoints, DTOs, services, interfaces, payloads, or backend business rules.
- Loading indicators, `isLoading` state, spinners, cancellation, partial-success loading, or request sequencing.
- Changes to selector disabling rules, explicit Enter filtering, nested entity creation, or Producto submission behavior.

## Capabilities

### New Capabilities
- `producto-selector-option-preload`: Defines option availability for Marca, Línea, and Presentación when opening the Producto form in create and edit modes, including preload-failure alerts, localized empty states, and preservation of existing selected values.

### Modified Capabilities
None.

## Approach

Refactor the opening `useEffect` in `RegistrarActualizarProductoForm` so one unconditional `Promise.all` loads Marca and Línea through `ProductoService.obtenerTotales({ denominacion: "" }, ...)` and Presentación through `PresentacionService.select({ denominacion: "" })`. Populate all three option states from each response's `data` collection. Keep the existing `if (producto)` `setValue` and `setSelected` value-preload statements verbatim after the option loads. If that preload fails, the existing catch path will add a safe user-facing error through `addAlert` with `TipoAlerta.ERROR` instead of relying only on `console.error`.

Extend `EntidadSelectorBase` with an optional empty-message prop that is forwarded to React Select only when supplied; omitting it preserves React Select's current default and leaves unrelated consumers unchanged. Producto's Marca and Presentación selector adapters will opt into the localized preload message. The Producto Línea selector currently renders React Select directly rather than using `EntidadSelectorBase`, so it will receive equivalent localized empty-state handling without migrating selector architecture in this change.

The existing Presentación Enter-search WARNING alert remains unchanged. To avoid double messaging, the recommended spec-level rule is that the inline empty message represents the opening preload/render state, while a zero-result explicit Presentación Enter search continues to use the existing WARNING alert without simultaneously presenting a second custom empty-state message. The specification must define that transition explicitly. The shared selector's `options.find(...) ?? selected` fallback remains unchanged so an inactive current selection continues to display. The CR-005 Denominación automática suggestion remains unaffected because its effect returns early in edit mode.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` | Modified | Make the three option-list requests unconditional, alert on preload failure, and coordinate preload versus explicit-search empty messaging while preserving edit value preload. |
| `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx` | Modified | Add an optional, backward-compatible empty-message prop without changing consumers that omit it. |
| `src/componentes/gestion-producto/producto/componentes/configuracion/marcas-selector.tsx` | Modified | Forward Producto's localized preload empty-state message to the shared selector. |
| `src/componentes/gestion-producto/producto/componentes/configuracion/presentacion-selector.tsx` | Modified | Forward Producto's localized preload empty-state message while preserving the explicit Enter WARNING behavior. |
| `src/componentes/gestion-producto/producto/componentes/configuracion/lineas-selector.tsx` | Modified | Configure equivalent localized empty-state behavior on its direct React Select instance. |
| `openspec/changes/preload-presentaciones-producto/specs/producto-selector-option-preload/spec.md` | New | Specify create/edit preload behavior, error and empty states, message precedence, and boundary cases in the next phase. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Adding Presentación to `Promise.all` means one failed request prevents all three state updates. | Low | Surface one safe ERROR alert for the failed preload attempt and keep partial-success semantics out of scope. |
| Presentación could show both the inline empty state and its existing Enter-search WARNING. | Medium | Specify message precedence: inline messaging is for opening preload/render state; the existing WARNING owns an explicit zero-result Enter search. |
| The optional shared-selector prop could unintentionally change unrelated consumers. | Low | Preserve React Select's current default whenever the prop is omitted and verify existing consumers remain behaviorally unchanged. |
| An explicit Enter search can overlap with the opening preload and replace options out of order. | Low | Preserve the existing search behavior and record request sequencing as out of scope. |
| Active-option responses may omit an inactive current selection. | Low | Preserve the existing `?? selected` display fallback unchanged. |
| Preloaded options could affect CR-005 Denominación automática. | Low | Keep its existing edit-mode early return and verify create suggestions and edit values remain unchanged. |

## Rollback Plan

Revert the opening-effect refactor, preload error alert, Producto-specific empty-state wiring, and optional shared-selector prop to restore the current branch-specific loading and React Select defaults. No data migration, API rollback, DTO change, or persisted-state cleanup is required because the change only affects local form loading and presentation behavior.

## Dependencies

- Existing `ProductoService.obtenerTotales` Marca and Línea endpoints.
- Existing `PresentacionService.select({ denominacion: "" })` contract returning `{ data, total }`.
- Existing `useAlerts()`, `TipoAlerta.ERROR`, and alert rendering mechanism.
- React Select's `noOptionsMessage`-style customization contract, exposed through an optional `EntidadSelectorBase` prop.
- Existing `EntidadSelectorBase` selected-value fallback behavior.
- No new package, endpoint, DTO, service, or backend dependency.

## Success Criteria

- [ ] Opening the Producto form in create or edit mode requests Marca, Línea, and Presentación options together through one `Promise.all`.
- [ ] An editable existing Producto can select another available Marca, Línea, or Presentación without first pressing Enter.
- [ ] Existing edit-mode `setValue` and `setSelected` preload behavior remains unchanged.
- [ ] An inactive current selection remains visible through the existing `?? selected` fallback.
- [ ] A failed opening preload produces a user-facing `TipoAlerta.ERROR` alert rather than only a console message.
- [ ] Each empty preloaded option list presents a clear Spanish inline message instead of React Select's default English "No options" text.
- [ ] The existing Presentación Enter-search WARNING remains unchanged and is not duplicated by a simultaneous custom inline empty-state message.
- [ ] Consumers that do not opt into the optional shared-selector empty message retain their current behavior.
- [ ] No `isLoading` state, spinner, or other loading indicator is introduced.
- [ ] CR-005 Denominación automática remains unchanged in create mode and continues to return early in edit mode.
- [ ] No endpoint, DTO, service, interface, or submission-contract change is introduced.
