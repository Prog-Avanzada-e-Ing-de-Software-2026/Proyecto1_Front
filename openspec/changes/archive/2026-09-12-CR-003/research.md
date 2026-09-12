# CR-003 Research: API Contract and Nested UX

**Schema**: `gentle-ai.sdd-research/v1`  
**Revision**: 2  
**Research state**: `done`  
**Accessed at**: 2026-09-12

## Outcome

Both selected lanes were completed with the authorized local-documentation and read-only repository-CodeGraph grants. No open-web source was used. Contract silence is recorded as an unknown rather than inferred backend behavior.

## Admission

| Evidence class | Declared grant | Admission | Use |
| --- | --- | --- | --- |
| Documentation | Allowed for local repository documentation | Admitted | CR, OpenAPI reference, domain analysis, OpenSpec artifacts |
| Repository CodeGraph | Allowed for read-only inspection and targeted local readback | Admitted | Frontend flow, services, interfaces, and error handling |
| Open web | Not allowed | Not used | None |

## Sources

| ID | Class | Title | Publisher | URL | Accessed at | Excerpt / relevant evidence |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Documentation | CR-003 change request | Repository | `docs/Pedidos de Cambio/CR-003/CR-003.md` | 2026-09-12 | Requires one active SuperLínea per Línea; requires a mandatory association; forbids duplicate SuperLínea denominations. |
| S2 | Documentation | CR-003 exploration input | Repository | `openspec/changes/CR-003/exploration.md` | 2026-09-12 | Records `/api/superlinea/select`, `POST /api/superlinea`, and required `CreateLineaDto.superLineaId`; also records unresolved response envelopes and active-filter semantics. |
| S3 | Documentation | OpenAPI contract | Repository | `docs/contracts/openapi.json` | 2026-09-12 | Local contract is the API authority. The available SuperLínea operation references do not provide an admitted response-envelope schema or documented duplicate-validation response shape. |
| S4 | Repository CodeGraph | Línea form and validation | Repository source | `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx`; `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` | 2026-09-12 | Current form creates through `LineaService.nuevo({ ...formData, usuarioCreatedId })`, closes on success, displays `parseApiError` in `errors.root`, and confirms closing with unsaved changes. Its form model does not include `superLineaId`. |
| S5 | Repository CodeGraph | Producto-to-Línea nested flow | Repository source | `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`; `src/componentes/gestion-producto/producto/componentes/configuracion/lineas-selector.tsx` | 2026-09-12 | `LineasSelector` has an adjacent `+`; the Producto form conditionally renders `RegistrarActualizarLineaForm`; its success callback closes and refreshes Línea options by the current denomination. |
| S6 | Repository CodeGraph | Read models and CRUD routing | Repository source | `src/interfaces/gestion-producto/linea/interfaces-linea.tsx`; `src/interfaces/gestion-producto/superlinea/interfaces-superlinea.tsx`; `src/utils/crudFactory.ts`; `src/componentes/gestion-producto/linea/services/linea-service.tsx` | 2026-09-12 | `Linea.superlinea` is the read relation; `SelectSuperlinea` is `{ id, denominacion }`; generic creation posts to `/{baseEndpoint}` and Línea uses base endpoint `linea`. |
| S7 | Repository CodeGraph | Error normalization | Repository source | `src/utils/errores.ts` | 2026-09-12 | `parseApiError` accepts string payloads, string or array `message`, and nested `message.message`; otherwise it uses a generic message. |
| S8 | Documentation | Domain analysis | Repository | `docs/Analisis_de_Dominio.md` | 2026-09-12 | Defines Catálogo as containing Producto, Marca, and Línea; it does not define SuperLínea. |

## Lane 1 — API Contract

### Validated claims

| ID | Claim | Evidence |
| --- | --- | --- |
| AC1 | The documented SuperLínea operations relevant to CR-003 are `/api/superlinea/select` and `POST /api/superlinea`. | S2, S3 |
| AC2 | Línea creation requires the write field `superLineaId`; the current Línea frontend form and `FormValues` do not yet supply it. | S2, S4 |
| AC3 | The established frontend read model uses `Linea.superlinea: SelectSuperlinea`, while the write contract uses `superLineaId`. These names represent different read and write shapes and must not be conflated. | S2, S6 |
| AC4 | The existing generic CRUD factory sends a create payload to `POST /api/linea` through `LineaService.nuevo`; it does not transform field names. | S4, S6 |
| AC5 | CR-003 requires selection from active SuperLíneas and disallows duplicate SuperLínea denominations. These are change-request requirements, not proven response semantics. | S1 |

### Contract unknowns

| Question | Result | Evidence |
| --- | --- | --- |
| SuperLínea select response envelope | Unknown. Do not assume `SelectSuperlinea[]`, `{ data: SelectSuperlinea[] }`, pagination, or any other wrapper. | S2, S3 |
| SuperLínea create response envelope | Unknown. Do not assume that `POST /api/superlinea` returns the created identifier or entity; the current nested selection flow cannot safely depend on it. | S2, S3 |
| Exact CreateSuperLineaDto fields | Unknown from the admitted contract evidence. The CR requests denomination and optional observation, but that is a product requirement, not a verified wire envelope. | S1, S3 |
| Complete CreateLineaDto envelope beyond `superLineaId` | Unknown from the admitted contract evidence. Existing frontend form fields are not proof of backend DTO completeness. | S2, S4 |
| Active filtering mechanism | Unknown. No admitted evidence proves whether `/api/superlinea/select` filters active records server-side, requires a query parameter, or exposes an active flag. | S2, S3 |
| Duplicate-denomination HTTP status and body | Unknown. No admitted evidence specifies status, error code, field key, or payload shape. | S1, S3 |
| Validation-error HTTP status and body | Unknown. The frontend can render several message shapes, but this is client tolerance rather than an API guarantee. | S3, S7 |

## Lane 2 — Nested UX

### Current Producto → Línea pattern

| Concern | Observed behavior | Evidence |
| --- | --- | --- |
| Entry point | `LineasSelector` renders the Línea select and an adjacent circular `+` button labeled `Agregar Línea`. | S5 |
| Composition | The Producto form owns `mostrarFormularioLinea`; when true, it renders `RegistrarActualizarLineaForm` inside the Producto form's overlay. The Línea form itself renders its own fixed overlay and `Card` with `EncabezadoFormularios`. | S4, S5 |
| Refresh | After Línea creation, the parent closes the nested form and calls `handleBuscarPorDenominacion("LINEA")`, which requests options using the current typed denomination and assigns `response.data` to local `lineas`. | S5 |
| Post-create selection | Not implemented. The success callback refreshes options but does not set `lineaId` or `selectedLinea` to the newly created Línea. | S5 |
| Cancellation | The Línea form asks for confirmation before calling its `onClose`; the parent callback then only clears nested-form visibility. | S4, S5 |
| Submission errors | The Línea form catches errors, normalizes them with `parseApiError`, and displays the result in `errors.root`; it does not close on failure. | S4, S7 |
| Existing required validation | Línea denomination is trimmed, lowercased, required, limited to 255 characters, and restricted to letters, numbers, and spaces. The current schema contains no SuperLínea field. | S4 |
| Catalog state | The product path uses component-local `lineas`, not `CatalogosContext`; that context contains Línea but no SuperLínea collection. | S5, S6 |

### Fit for the SuperLínea form

The closest established fit is a SuperLínea selector plus adjacent `+` within `RegistrarActualizarLineaForm`, following the existing `LineasSelector` affordance and the existing child-form modal, confirmation, React Hook Form, Yup, and root-error conventions. This is a design implication, not evidence of an existing SuperLínea UI.

The child SuperLínea form should not claim immediate selection from the create response unless the response envelope is confirmed. A safe design decision is needed between a documented post-create refresh that can identify the new option and a backend contract that returns an identifier/select item.

## Contradictions and Scope Boundaries

| Topic | Finding | Implication |
| --- | --- | --- |
| CR scope versus domain analysis | CR-003 introduces SuperLínea; the domain analysis does not. | Treat CR-003 as the authority for this change. Do not present SuperLínea as an already documented baseline domain concept. |
| Creation-only nested UX versus CR acceptance | CR-003 modifies both Register and Modify Línea stories, while the observed nested Producto flow concerns creation. | Proposal discovery must decide whether the first change includes SuperLínea selection in Línea edit. Do not silently omit the modified-Línea acceptance criteria. |
| Active-only selection | The CR requires active records, but the contract does not expose the filter mechanism. | The frontend must not invent client-side activity rules; backend contract clarification or an explicit confirmed behavior is required. |

## Non-Authoritative Proposal Implications

- Keep the scope at the Producto → Línea creation flow unless product discovery explicitly resolves the modified-Línea criterion.
- Preserve existing feature boundaries: form values and Yup schema, service HTTP calls, local modal orchestration, interfaces, and reusable UI primitives.
- Require `superLineaId` in the Línea form before creation, but do not derive a SuperLínea create payload or response mapping beyond confirmed contract fields.
- Specify empty-catalog messaging, refresh behavior, and post-create selection only after the unresolved API behavior is confirmed.
- Do not introduce a standalone SuperLínea lifecycle screen as an incidental response to this nested-flow change.

## Pre-Proposal Handoff

| Field | Value |
| --- | --- |
| Selected research | API contract; Nested UX |
| Research outcome | `done` |
| Product decisions | `pending` |
| Proposal ready | `false` — research is complete, but product decisions and unresolved contract behavior remain pending. |
| OpenSpec evidence reference | `openspec/changes/CR-003/research.md` |
| Engram evidence reference | `sdd/CR-003/research` |
