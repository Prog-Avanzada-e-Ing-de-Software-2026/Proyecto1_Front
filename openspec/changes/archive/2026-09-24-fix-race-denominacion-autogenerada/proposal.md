# Proposal: Fix Automatic Denomination First-Edit Race

## Intent

Fix a race in the Producto creation form where the first click-and-keystroke in an automatically suggested denominación is overwritten. The first manual edit must be preserved immediately: typed text must remain unchanged and the caret must not jump to the end.

## User Impact

Users can edit the suggested Denominación automática on the first attempt without losing input or cursor position. Existing generation, reactivation, and edit-mode behavior remains unchanged.

## Scope

### In Scope

- Replace the asynchronous suggestion-ownership state flag with a synchronous ref in the Producto create form.
- Preserve the current dependency on the watched denominación so clearing the field still reactivates the suggestion.
- Tighten the existing capability contract to cover the first manual edit explicitly.
- Verify the fix with the existing quality commands and a focused manual reproduction.

### Out of Scope

- Changes to the shared `FormInput`, cursor-management logic, services, DTOs, or HTTP contracts.
- Changes to the Denominación automática composition formula or its Marca, Línea, Presentación order.
- Changes to edit-mode preload behavior or backend defaults.
- Introduction of an automated test runner.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `denominacion-automatica-producto`: Strengthen manual-edit behavior so the first click or keystroke neither overwrites the user's text nor moves the caret, while preserving every existing CR-005 requirement and scenario.

## Capability Delta

The delta specification will fully restate the affected requirements and all scenarios that must survive replacement during archive.

### Modified Requirements

- **Edición manual**: A user MUST be able to edit a suggested denominación from the first interaction. The first click or keystroke MUST NOT cause the caret to move unexpectedly and MUST NOT replace the text entered by the user.
- **No sobrescritura**: Once the denominación differs manually from the latest automatic suggestion, the system MUST NOT overwrite it during the same update cycle or after subsequent Marca, Línea, or Presentación changes.

### Preserved Requirements and Scenarios

- **Generación en alta / Completa al tener los tres**: In create mode, selecting Marca, Línea, and Presentación continues to suggest the composed denominación.
- **Edición manual / Editable**: The suggested field remains manually editable.
- **No sobrescritura / No sobrescribe edición manual**: Manual text remains authoritative after selector changes.
- **Reactivación al vaciar / Vaciar reactiva**: An empty or whitespace-only field reactivates the current suggestion when all three source values remain selected.
- **Solo creación / Edición de producto existente**: Existing Producto edit mode continues to return early and preserve the persisted denominación.
- **Sin default backend**: No backend default or creation HTTP contract change is introduced.

### Added Acceptance Scenario

- **First manual edit is preserved**: Given an automatically suggested denominación in the Registrar Producto form, when the user places the caret within the text and types the first character, then the typed character remains, the value is not restored to the suggestion, and the caret remains at the user's edit position.

## Approach

In `RegistrarActualizarProductoForm`, replace `sugerenciaDenominacionActiva` state with a `useRef(!producto)` as the single source of truth. The edit-detector effect will update `.current` synchronously before the suggestion effect reads it in the same commit. Keep `denominacionActual` in the suggestion effect dependencies so an empty field still triggers suggestion regeneration. Do not alter the suggestion generator, shared input, or edit-mode preload effect.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` | Modified | Replace the asynchronous suggestion gate with a synchronous ref and preserve current effect ordering and dependencies. |
| `openspec/changes/fix-race-denominacion-autogenerada/specs/denominacion-automatica-producto/spec.md` | New | Define the MODIFIED delta for first-edit preservation while restating preserved behavior. |
| `openspec/specs/denominacion-automatica-producto/spec.md` | Modified at archive | Receive the approved delta after implementation and verification. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Clearing the field no longer reactivates the suggestion | Medium | Retain `denominacionActual` as a suggestion-effect dependency and manually verify **Vaciar reactiva**. |
| Selector changes overwrite a prior manual edit | Low | Use one synchronous ref as the ownership source and manually verify selector changes after editing. |
| Edit-mode preload behavior regresses | Low | Keep both create-only early returns and the preload effect unchanged; manually verify an existing Producto. |
| The race lacks automated regression coverage | Medium | Keep the source change minimal and run focused manual scenarios in addition to build, lint, and type-check commands. |

## Rollback Plan

Revert the local ref-based gate change and the corresponding delta specification. This restores the prior behavior without data migration, dependency changes, backend changes, or API rollback. If the fix causes a regression before full rollback, stop release and retain the current production implementation until a revised synchronous gating approach is approved.

## Dependencies

- Canonical capability `denominacion-automatica-producto`, now available after CR-005 archive.
- Existing React effect declaration order and synchronous ref writes within the form component.
- Manual browser access to the Registrar Producto and existing Producto flows for verification.

## Success Criteria

- [ ] In create mode with an active Denominación automática, the first click-and-keystroke preserves the typed text and does not move the caret to the end.
- [ ] Subsequent typing remains stable without value rollback or flicker.
- [ ] Selecting Marca, Línea, and Presentación still creates the expected suggestion.
- [ ] Changing a selector after a manual edit does not overwrite the manual denominación.
- [ ] Clearing the field fully reactivates and restores the current suggestion.
- [ ] Existing Producto edit mode preserves its persisted denominación and existing preload behavior.
- [ ] No backend default, service, DTO, HTTP contract, or shared `FormInput` changes are introduced.
- [ ] `yarn build` succeeds; `yarn lint` and `yarn tsc -b` introduce no failures beyond the documented baseline.
- [ ] The focused manual reproduction confirms the affected and preserved scenarios because no automated test runner is configured (`strict_tdd: false`).
