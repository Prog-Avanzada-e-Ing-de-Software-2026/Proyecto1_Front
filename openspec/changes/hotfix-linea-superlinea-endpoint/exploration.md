## Exploration: Hotfix Línea SuperLínea select endpoint

### Current State

The nested Línea form loads SuperLínea options through `RegistrarActualizarLineaForm.cargarSuperlineas`, which calls `SuperLineaService.obtenerSelect()` and passes the returned `SelectSuperlinea[]` to `SuperlineasSelector`. The service currently requests `GET /superlinea/select` and validates an envelope shaped as `{ data: [...], total: number }` before mapping each option to `{ id, denominacion }`.

The authorized backend contract for this hotfix is different: `GET /linea/find-all-for-superlinea/select?denominacion` returns a top-level array. Each item has at least numeric `id` and string `denominacion`, alongside audit fields. Therefore the current service validation will reject the new response even when the endpoint is reachable. The selector currently performs an initial unfiltered load; the current on-disk Línea form does not contain the previously remembered denomination debounce/request-sequencing flow, so this hotfix must not assume that behavior is present.

The response's audit fields are irrelevant to the selector contract. `SelectSuperlinea` already models the required projection, so no interface change is needed. The frontend must continue to treat the backend response as authoritative and must not add client-side active-state filtering.

### Affected Areas

- `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` — sole request/response adapter used by the Línea form; change the `obtenerSelect` path and validate a top-level array while projecting only `id` and `denominacion`.
- `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx` — existing loading, error, required-selection, submission blocking, and nested SuperLínea refresh behavior must remain unchanged; no orchestration change is required for an endpoint-only hotfix.
- `src/componentes/gestion-producto/linea/componentes/superlineas-selector.tsx` — existing selector contract remains compatible with `SelectSuperlinea[]`; no change is required.
- `src/interfaces/gestion-producto/superlinea/interfaces-superlinea.tsx` — `SelectSuperlinea` already matches the minimum response projection; audit fields should not be added to the UI contract.
- `openspec/specs/linea-superlinea-association/spec.md` — current requirement names the old `/api/superlinea/select` contract and must be reconciled in the proposal/spec phase if the endpoint change is approved.
- `docs/Analisis_de_Dominio.md` — confirms Línea/Catálogo belongs to the included Catálogo/Inventario scope, but defines no endpoint or transport rule.

### Compatibility Implications

- The new endpoint's top-level array is incompatible with `isListResponse`; retaining that validator would block all options with the existing normalized error.
- The query parameter is part of the endpoint contract. The current `obtenerSelect()` signature sends no parameter, so the smallest endpoint-only implementation can preserve the current initial load only if the backend accepts the omitted query; if `denominacion` is mandatory, the call must explicitly send `{ denominacion: "" }`. This requirement needs confirmation in design from the backend contract or existing API evidence.
- The service is shared at the SuperLínea feature boundary, but CodeGraph identifies `obtenerSelect` as consumed by the Línea form. CRUD search, create, update, delete, and audit endpoints are unaffected.
- Existing error handling, required `superLineaId`, numeric selection, nested `+` creation, and submission blocking remain compatible because they consume only the projected array.

### Approaches

1. **Update the existing service adapter only** — replace the URL, validate a top-level array with the minimum fields, and map the projection.
   - Pros: smallest blast radius; preserves the form, selector, interfaces, and established error flow.
   - Cons: requires deciding whether the empty `denominacion` query must be sent explicitly; does not add denomination filtering behavior that is absent from the current on-disk form.
   - Effort: Low

2. **Add endpoint-specific service and form filtering orchestration** — introduce a separate method/contract for query-driven loading and wire denomination state into the Línea form.
   - Pros: supports a mandatory query and interactive filtering explicitly.
   - Cons: broader than the authorized endpoint hotfix; risks reintroducing behavior from stale prior memory and changes UX beyond the named request.
   - Effort: Medium

### Recommendation

Use Approach 1 for this named hotfix. Change only `SuperLineaService.obtenerSelect` and its response validator/projection, preserving all Línea association safeguards. During proposal/design, resolve the single contract ambiguity—whether the initial request must serialize `denominacion=`—against authoritative backend evidence. Treat denomination typing/debounce as a separate change unless the approved acceptance criteria explicitly require it, because it is not present in the current repository state.

### Risks

- Sending no query when the backend requires `denominacion` could produce a 400 and leave Línea creation blocked; explicitly sending an empty string may be required.
- Accepting an arbitrary array without validating numeric `id` and string `denominacion` could pass malformed options into selection and payload conversion.
- Updating the shared service incorrectly could affect any future or indirect consumer, although CodeGraph found the select method's relevant current caller in the Línea form.
- The active specification currently documents a different endpoint and envelope; implementation must not proceed until the requirement delta is reconciled through OpenSpec.
- No automated test runner is configured; verification will rely on build, lint, and type-check commands with baseline failures reported separately.

### Ready for Proposal

Yes, for a tightly scoped endpoint-contract hotfix. The proposal should state the exact URL/query serialization, top-level array validation and projection, preserved Línea safeguards, and the explicit non-goal of adding or restoring denomination-filter UI behavior.
