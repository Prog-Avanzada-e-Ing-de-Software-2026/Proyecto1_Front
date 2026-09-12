# Tasks: Create SuperLínea During Línea Creation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–380 authored lines across 8 files |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR with two reviewable work units |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Add explicit SuperLínea contracts, validation, service, and nested modal | PR 1 | `yarn build` | Línea create flow: open `+`, validate, cancel, submit API failure | Revert the four SuperLínea files only |
| 2 | Wire create-only selector, payload, refresh, and final verification | PR 1 | `yarn build && yarn lint && yarn tsc -b` | Producto → Línea: empty/loading/error/options, create, select, submit; edit isolation | Revert Línea selector/orchestration/payload changes |

## Phase 1: Contracts and Validation

- [ ] 1.1 Modify `src/interfaces/gestion-producto/superlinea/interfaces-superlinea.tsx` with explicit create, list-response, and read DTOs; retain `SelectSuperlinea` (R1, R3).
- [ ] 1.2 Create `src/componentes/gestion-producto/superlinea/interfaces/interfaces-validaciones-superlinea.tsx` with required `denominacion` and optional `observacion` Yup rules (R1/S1–S2).
- [ ] 1.3 Create `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` for documented select/create endpoints, `{data,total}` validation, and `parseApiError`-compatible failures (R1–R2/S3, R2/S4).

## Phase 2: Nested SuperLínea Creation

- [ ] 2.1 Create `src/componentes/gestion-producto/superlinea/utils/registrar-superlinea.tsx` as a sibling modal with Spanish success/error feedback, confirmation cancellation, and parent-state preservation (R1/S1–S5; R2/S5).
- [ ] 2.2 Create `src/componentes/gestion-producto/linea/componentes/superlineas-selector.tsx` using `EntidadSelectorBase<SelectSuperlinea>`, adjacent `+`, loading/empty feedback, and required-field error; render server-returned options without client filtering (R2/S1–S4).

## Phase 3: Create-Only Línea Integration

- [ ] 3.1 Modify `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` to conditionally require positive `superLineaId` only in create mode (R2/S1–S2; R1/S6).
- [ ] 3.2 Modify `src/componentes/gestion-producto/linea/services/linea-service.tsx` with typed create `superLineaId` payload/response while preserving update routing and fields (R2/S1; R1/S6).
- [ ] 3.3 Modify `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx` to load local options, gate all new behavior with `!linea`, preserve form state, refresh without auto-selection, and keep edit unchanged (R1/S6; R2/S1–S5).

## Phase 4: Verification

- [ ] 4.1 Manually verify required, empty-catalog, loading-error, valid-selection payload, nested success/refresh/no-auto-selection, cancellation, nested API failure, Línea success, and Producto navigation scenarios; no test runner exists and strict TDD is disabled.
- [ ] 4.2 Run `yarn build` (must pass), `yarn lint`, and `yarn tsc -b`; compare lint/type-check failures with the recorded pre-existing baseline and report any new regression separately.
- [ ] 4.3 Manually open and submit Línea edit mode to confirm no selector requirement or create-only SuperLínea behavior was introduced (R1/S6; R2/S6); review final diff for unchanged `registrar-actualizar-producto.tsx`.
