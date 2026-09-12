# Design: Create SuperLínea During Línea Creation

## Technical Approach

Extend only the create branch of `RegistrarActualizarLineaForm`. The confirmed `/api/superlinea/select` contract returns only active SuperLíneas; the frontend MUST render returned options without active-state validation or client-side filtering. It requires explicit selection and hosts a nested create modal. HTTP stays in services, contracts in shared interfaces, validation in Yup modules, and rendering in focused components. Successful nested creation closes the child and reloads options without setting `superLineaId`; the mounted Línea and Producto forms retain their React Hook Form state.

## Architecture Decisions

| Decision | Alternative and tradeoff | Choice and rationale |
|---|---|---|
| Create-only composition | Add selector to the shared edit UI, which would satisfy the broader CR document but violate the approved proposal/specs. | Gate effects, selector, child modal, validation, and create payload with `!linea`; leave `transformData` and update submission unchanged. |
| Local option ownership | Add SuperLínea to `CatalogosContext`, increasing global state and invalidation scope. | Keep options/loading/error and child visibility in `RegistrarActualizarLineaForm`, matching Producto's local Línea catalog pattern. |
| Nested modal | Build standalone SuperLínea management or embed another `<form>` inside the Línea `<form>`. | Render a sibling modal component from Línea state, matching Marca/Línea nesting and avoiding invalid nested HTML forms. No route or management entry point is added. |
| Contract boundary | Reuse `Linea.superlinea` for writes or infer the created identifier from `POST`. | Use explicit DTOs. Write `superLineaId`; preserve the existing read relation `superlinea`. The create response is message-only, so refresh and require manual selection. |
| Envelope handling | Accept arbitrary wrapper shapes, hiding contract drift. | `ApiService` already unwraps Axios; the SuperLínea service validates the documented `{ data, total }` body and maps `data` to select options. Invalid bodies fail closed through `parseApiError`. Línea success keeps a verified `mensaje` when present and uses established success copy when the documented `LineaDto` has no message. |

## Data Flow

```text
Producto form (remains mounted)
  └─ Línea create form ──GET /superlinea/select──> { data, total }
       ├─ explicit option ──superLineaId──> POST /linea
       └─ `+` ──> SuperLínea modal ──POST /superlinea──> { mensaje }
                         success ──close + reload options; selection unchanged
```

Loading, empty, and failed catalogs leave `superLineaId` unset and block Línea submission. An empty catalog shows “Primero debe registrar una SuperLínea.” beside the selector. Catalog/create errors are normalized into visible root errors. A failed SuperLínea create keeps both modals open; cancellation confirms and closes only the child. A post-create refresh failure keeps Línea and Producto values intact and reports the refresh error.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/interfaces/gestion-producto/superlinea/interfaces-superlinea.tsx` | Modify | Add create, list-response, and API read DTOs while retaining `SelectSuperlinea`. |
| `src/componentes/gestion-producto/superlinea/interfaces/interfaces-validaciones-superlinea.tsx` | Create | Define child form values and Yup rules. |
| `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` | Create | Implement explicit select/create calls and response validation. |
| `src/componentes/gestion-producto/superlinea/utils/registrar-superlinea.tsx` | Create | Provide the create-only child modal, confirmation, feedback, and normalized errors. |
| `src/componentes/gestion-producto/linea/componentes/superlineas-selector.tsx` | Create | Wrap `EntidadSelectorBase<SelectSuperlinea>` with Spanish labels, `+`, loading/empty feedback, and field error. |
| `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` | Modify | Add optional form field and conditionally require positive `superLineaId` only in create mode. |
| `src/componentes/gestion-producto/linea/services/linea-service.tsx` | Modify | Type the create payload/response without changing update routing. |
| `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx` | Modify | Orchestrate create-only loading, selection, nested state, refresh, and payload mapping. |

`registrar-actualizar-producto.tsx` is deliberately unchanged: keeping both ancestor components mounted preserves Producto state and its existing post-Línea refresh/navigation behavior.

## Interfaces / Contracts

```ts
type CreateSuperLineaDto = { denominacion: string; observacion?: string | null; usuarioCreatedId: number };
type SuperLineaDto = { id: number; denominacion: string; observacion: string; deletedAt: unknown | null };
type SuperLineaListResponseDto = { data: SuperLineaDto[]; total: number };
type CreateLineaDto = { denominacion: string; utilizaStockMinimo: boolean; usuarioCreatedId: number; superLineaId: number; stockMinimo?: number; observacion?: string | null };
type LineaReadRelation = { superlinea: SelectSuperlinea }; // existing frontend read model
```

The local OpenAPI spells the `LineaDto` wire relation `superLinea`; CR-003 does not rename or remap existing reads. This discrepancy stays explicit rather than leaking `superLineaId` into read models.

## Testing Strategy

No test runner exists, so implementation verification will use scenario-guided manual checks for required/empty/error/cancel/success/refresh/edit-isolation flows, request inspection for exact DTOs, and final diff review. Run `yarn build`, `yarn lint`, and `yarn tsc -b`; compare lint/type-check failures with the recorded baseline instead of claiming automated tests.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration or feature flag is required. Deploy only with the documented backend endpoints. While the backend requires `superLineaId`, rollback MUST NOT remove it from Línea creation. The nested frontend capability may be reverted only when a backend-compatible path still supplies the required association; no persisted frontend state changes.

## Open Questions

None.
