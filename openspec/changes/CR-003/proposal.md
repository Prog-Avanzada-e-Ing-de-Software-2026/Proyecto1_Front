# Proposal: Create SuperLínea During Línea Creation

## Intent

Enable administrators to create a `SuperLínea` and assign one active `SuperLínea` when creating a `Línea` from Producto. This closes the frontend gap with required `CreateLineaDto.superLineaId` while leaving invariants to the backend.

## User Impact

Users retain the Producto → Línea entry path. Línea creation adds a required `SuperLínea` selector and adjacent `+`; an empty catalog explains that registration is required first. Nested success refreshes options without auto-selection.

## Scope

### In Scope
- Create `SuperLínea` with required `denominacion` and optional `observacion`.
- Load active `SuperLínea` options and require `superLineaId` when creating `Línea`.
- Preserve nested-form, validation, confirmation, and API-error patterns.

### Out of Scope
- Editing, deleting, consultation/management screens, and broader `SuperLínea` ABMC.
- Changing `Línea` edit behavior or adding `SuperLínea` management entry points outside Línea creation.
- Automatically selecting a newly created `SuperLínea` or changing Producto creation navigation.
- Frontend uniqueness, active-state, or association enforcement.

## Capabilities

### New Capabilities
- `superlinea-creation`: Nested `SuperLínea` creation with validation and API feedback.
- `linea-superlinea-association`: Active-option selection and required `SuperLínea` association during `Línea` creation.

### Modified Capabilities
None; no existing OpenSpec capability specifications are present.

## Approach

Extend create mode of `RegistrarActualizarLineaForm` with local option loading and nested-form orchestration. Keep form/Yup, service, interface, and presentation boundaries. Use `GET /api/superlinea/select`, `POST /api/superlinea`, and submit `superLineaId` through the Línea service. After nested creation, refresh only options and use established API-error normalization.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/componentes/gestion-producto/linea/` | Modified | Selector, nested form, validation, and services |
| `src/interfaces/gestion-producto/superlinea/` | Modified | Creation/select contracts |
| `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` | Compatible | Existing Producto → Línea entry remains unchanged |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Read/write naming mismatch (`superlinea` vs `superLineaId`) | Medium | Keep explicit read and create payload contracts |
| Shared Línea form unintentionally changes edit behavior | Medium | Gate new behavior to create mode |
| API failures or empty options block creation | Medium | Preserve state and show actionable Spanish feedback |

## Rollback Plan

Revert the create-mode selector, nested form/service, and `superLineaId` validation/payload changes. Producto → Línea remains available, subject to backend compatibility with the prior payload.

## Dependencies

- Documented backend contracts for `GET /api/superlinea/select`, `POST /api/superlinea`, and `POST /api/linea`.
- Existing authentication, Axios, React Hook Form/Yup, modal, and `parseApiError` infrastructure.

## Success Criteria

- [ ] A `SuperLínea` can be created from Línea creation with required-field validation and API feedback.
- [ ] Línea creation cannot submit without an active `SuperLínea` and sends `superLineaId`.
- [ ] Nested success refreshes options only; Producto navigation and Línea edit behavior remain unchanged.
