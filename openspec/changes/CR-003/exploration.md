## Exploration: CR-003 — SuperLínea in Línea creation

### Current State
Product creation renders `LineasSelector`, which owns the Línea select and its adjacent `+` button. The product form opens `RegistrarActualizarLineaForm` through local modal state; after Línea creation, the current wiring must be inspected further to confirm how the new Línea is refreshed and selected. `RegistrarActualizarLineaForm` currently submits only denomination, observation, and optional stock-minimum fields, using React Hook Form plus a Yup schema. Although the `Linea` read interface already includes `superlinea`, the Línea form values and schema do not.

The OpenAPI contract requires `superLineaId` on `CreateLineaDto`, permits it on `UpdateLineaDto`, and exposes `/api/superlinea/select` plus `POST /api/superlinea`. The existing frontend already has `Superlinea` and `SelectSuperlinea` interfaces, but no discovered SuperLínea service, catalog-context collection, or established SuperLínea form/lifecycle UI. The domain analysis does not yet mention SuperLínea; CR-003 is the authoritative domain change for this scope.

### Affected Areas
- `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` — opens the Línea nested form and owns product-form integration.
- `src/componentes/gestion-producto/producto/componentes/configuracion/lineas-selector.tsx` — established Línea select and adjacent `+` interaction pattern.
- `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx` — must add required SuperLínea selection and inline creation orchestration without changing the existing form model unnecessarily.
- `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` — currently lacks `superLineaId` in `FormValues`, Yup validation, and transformation.
- `src/componentes/gestion-producto/linea/services/linea-service.tsx` — generic CRUD service posts Línea payloads; the payload must align with `superLineaId`.
- `src/interfaces/gestion-producto/linea/interfaces-linea.tsx` — already models the read-side `superlinea` relation; naming differs from the API write field.
- `src/interfaces/gestion-producto/superlinea/interfaces-superlinea.tsx` — provides select/read contracts but no create-form contract.
- `src/context/catalogos-context.tsx` — currently stores Línea and other catalogs, but not SuperLínea options.
- `docs/Pedidos de Cambio/CR-003/CR-003.md` — requires an active selectable SuperLínea and says an unavailable catalog must be reported; this exploration scope intentionally excludes standalone lifecycle screens.
- `docs/contracts/openapi.json` — defines `/api/superlinea/select`, `CreateSuperLineaDto`, and the required Línea `superLineaId` DTO field.

### Approaches
1. **Extend the existing Línea form with a nested SuperLínea form** — Add a SuperLínea selector and adjacent `+` in `RegistrarActualizarLineaForm`; open a small inline/modal child form using the established `Card`, header, confirmation, `react-hook-form`, and `parseApiError` patterns. On successful creation, refresh/select the returned SuperLínea.
   - Pros: preserves the current Producto → Línea nesting and visual/form conventions; keeps the change limited to the Línea creation path; naturally supports the requested inline `+` behavior.
   - Cons: requires explicit refresh/selection state and a new SuperLínea create service/form contract; must avoid accidentally enabling broader lifecycle UI.
   - Effort: Medium

2. **Create a reusable SuperLínea catalog/form feature first, then compose it into Línea** — Build a standalone SuperLínea feature and expose it to the Línea form as a selector plus callback.
   - Pros: cleaner reuse if standalone SuperLínea management is immediately required later; separates catalog retrieval from Línea orchestration.
   - Cons: expands scope into lifecycle architecture explicitly excluded by CR-003 request; adds files and state before the requested flow is proven; risks inconsistent modal behavior.
   - Effort: High

### Recommendation
Use Approach 1. Extend the existing Línea form only for registration and selection: load active options from `/api/superlinea/select`, validate `superLineaId` as required, submit `superLineaId` for Línea creation, and create a new SuperLínea through `POST /api/superlinea` from the adjacent `+` flow. Preserve existing Spanish UI copy and form/schema separation. Do not add edit, delete, listing, or broader SuperLínea lifecycle screens.

Before proposal, resolve the following contract details rather than inferring them: whether the select endpoint response is exactly `SelectSuperlinea[]` or wrapped; whether the create response returns the created entity (needed for immediate selection) or only a message; and whether “inline” means an embedded child panel or the repository’s existing full-screen modal pattern. Also confirm whether the modified Línea edit path must display/change SuperLínea now: CR-003 acceptance criteria mention modified Línea, while the requested scope specifically describes Product creation → Línea creation and excludes broader lifecycle UI.

### Risks
- The API uses `superLineaId` while frontend read models use `superlinea`; careless reuse can produce a type- or payload-name mismatch.
- No existing SuperLínea service or catalog state was found, so refresh and selection behavior need an explicit design decision.
- CR-003 requires active-only association and an unavailable-options message, but the OpenAPI excerpt does not itself document the active-filter semantics or empty-response shape.
- The current domain analysis omits SuperLínea; proposal/spec artifacts must cite CR-003 as the source for this new concept instead of presenting it as already implemented domain behavior.
- No automated test runner is configured; verification will rely on build, lint, type-check, and manual/contract inspection unless approved scope adds test infrastructure.

### Candidate Research Lanes
- **API contract evidence:** verify the exact response envelopes and error semantics for `/api/superlinea/select`, `POST /api/superlinea`, and Línea creation.
- **Repository interaction convention:** confirm whether “inline” consistently means nested modal, embedded panel, or another established pattern in nearby forms.

### Ready for Proposal
Yes, for a narrowly scoped proposal covering only Línea creation plus nested SuperLínea registration. The proposal should explicitly record the three unresolved contract/UI decisions above and exclude edit, delete, consultation, and broader SuperLínea lifecycle UI.
