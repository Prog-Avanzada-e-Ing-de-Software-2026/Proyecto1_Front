# Proposal: Fix Línea SuperLínea Select Contract

## Intent

Restore SuperLínea option loading in the Línea creation form by aligning its existing service adapter with the authorized backend contract. The request will use `/linea/find-all-for-superlinea/select?denominacion`, keeping the `denominacion` query key present for the current unfiltered initial load, and consume a top-level array containing numeric `id` and string `denominacion` fields.

## Scope

### In Scope

- Update the endpoint used by `SuperLineaService.obtenerSelect()`.
- Validate the top-level array response and project each valid item to `SelectSuperlinea`.
- Preserve current Línea loading, errors, required selection, submission blocking, and nested SuperLínea refresh behavior.
- Reconcile the existing Línea–SuperLínea association requirement with the new transport contract.

### Out of Scope

- Adding or restoring typed denomination search, debounce, request sequencing, or client-side filtering.
- Changing selector UI, Línea payload rules, edit behavior, SuperLínea CRUD endpoints, or backend invariants.
- Exposing response audit fields through the selector contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `linea-superlinea-association`: Replace the documented SuperLínea option endpoint and envelope with the authorized query-bearing endpoint and top-level array contract while preserving association behavior.

## Approach

Keep the change at the existing service boundary: request the authoritative literal endpoint with the query key present, reject responses that are not arrays of items with numeric `id` and string `denominacion`, and return only those two fields. No form orchestration or interface expansion is required.

## User Impact

Línea creation can load selectable SuperLíneas from the current backend contract without changing the form interaction or validation flow.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` | Modified | Update request and response adapter. |
| `openspec/specs/linea-superlinea-association/spec.md` | Modified | Reconcile endpoint and response requirements through a delta spec. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Query serialization differs from the backend route contract | Medium | Keep the `denominacion` key present exactly as authorized and verify the resulting request. |
| Malformed items reach the selector | Low | Validate every item's required field types before projection. |
| Existing form safeguards regress | Low | Limit implementation to the adapter and verify current loading and blocking behavior. |

## Dependencies

- Backend availability of `GET /linea/find-all-for-superlinea/select?denominacion` with the confirmed top-level array response.
- Existing `ApiService` request and error-normalization behavior.

## Rollback Plan

Revert the service adapter and requirement delta to `/superlinea/select` and its envelope contract. No persisted frontend data or migration requires reversal.

## Success Criteria

- [ ] The Línea creation form requests the authorized endpoint with the `denominacion` query key present.
- [ ] A valid top-level array becomes `SelectSuperlinea[]`; malformed responses follow the existing normalized error path.
- [ ] Existing form behavior remains unchanged, with no typed-search, debounce, or filtering UX introduced.
