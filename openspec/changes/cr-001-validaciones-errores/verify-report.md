# Verification Report: cr-001-validaciones-errores

## Status

**Partial — the D7 numeric ref correction is statically confirmed and all prior code findings are resolved, but runtime verification remains unexecuted.** No new diagnostics or code findings were identified. The production build succeeds; lint and type-check still match the supplied red baselines. The review-size and unrelated-worktree warnings remain.

## Re-verification scope

- Read the previous verification report first and preserved all findings not refuted by current evidence.
- Compared the correction with the proposal, four delta specs, design decisions D1-D8, tasks, OpenSpec configuration, Engram apply progress, current source, `git diff`, and `git status`.
- Statically inspected the three numeric controls, the `FormInput` reference pattern, and every previously resolved correction with CodeGraph plus targeted current-source/diff reads where CodeGraph omitted a requested section.
- Re-ran `git diff --check`, `yarn build`, `yarn lint`, and `yarn tsc -b` in the current uncommitted `CR-001` worktree.
- No browser, backend, HTTP interception, or automated test harness was run. `strict_tdd` is `false`, and no test runner or test command is configured.

## D7 correction verdict

| Control | Verdict | Evidence |
|---|---|---|
| `PriceInput` | **CONFIRMED — prior WARNING resolved statically** | `useController({ name, control })` supplies `field`; `setInputRef` calls `field.ref(el)`, then preserves the internal ref, forwarded `ref`, and existing `inputRef`; `NumericFormat` uses `getInputRef={setInputRef}` (`price-input.tsx:4,76-83,120`). |
| `CantidadesInput` | **CONFIRMED — prior WARNING resolved statically** | `useController({ name, control })` supplies `field`; `setInputRef` calls `field.ref(el)`, then preserves the internal ref and existing `inputRef`; `NumericFormat` uses `getInputRef={setInputRef}` (`cantidades-input.tsx:4,63-72,89`). |
| `PorcentajeInput` | **CONFIRMED — prior WARNING resolved statically** | `useController({ name, control })` supplies `field`; `setInputRef` calls `field.ref(el)`, then preserves the internal ref and existing `inputRef`; `NumericFormat` uses `getInputRef={setInputRef}` (`porcentaje-input.tsx:4,61-70,106`). |

The three public prop interfaces retain their prior members; the correction adds no prop and removes none. Targeted diff/source inspection found only `field.ref` usage in the numeric controls: none spreads `field`, reads `field.value`, or delegates to `field.onChange`. Existing `value` and `onChange` props remain the source of numeric state. This proves registration wiring statically, not actual browser focus behavior.

## Previously resolved correction verdicts

| # | Prior finding | Current disposition |
|---:|---|---|
| 1 | IVECO/NEX-PRO collapsed field errors to root | **REMAINS RESOLVED statically.** Both forms retain `cotizacionFieldMap` and `applyApiErrors(error, setError, cotizacionFieldMap)` (IVECO `:17,90`; NEX-PRO `:17,83`). |
| 2 | Marca/Presentación create sent empty optional strings | **REMAINS RESOLVED statically.** Both create and edit branches still use `omitEmptyOptionalStrings(..., ["observacion"])` (Marca `:48,61`; Presentación `:43,54`). |
| 3 | Producto edit stock lacked effective read-only behavior | **REMAINS RESOLVED statically.** The stock control remains visible, `disabled={!!producto}`, and its `onChange` writes only when `!producto` (`registrar-actualizar-producto.tsx:587-598`). Browser behavior remains runtime-pending. |
| 4 | Producto field map omitted two active fields | **REMAINS RESOLVED statically.** `utilizaStockMinimo` and `utilizaPack` remain mapped (`registrar-actualizar-producto.tsx:55-56`). |
| 5 | Quote schemas accepted non-finite maxima for `.max()` | **REMAINS RESOLVED statically.** Both factories retain the finite-number guard before `.max()` (`interfaces-validaciones-precio-{iveco,nex-pro}.tsx:17`). |
| 6 | Numeric RHF focus refs incomplete | **RESOLVED statically by this correction.** All three numeric controls now register the concrete input through `field.ref` while preserving existing refs and controlled props. Actual focus remains runtime-pending. |

## Findings

### CRITICAL

None remaining from static inspection. Runtime-pending scenarios are not treated as passed.

### WARNING

1. **The worktree exceeds the 400-line review budget as one uncommitted unit.** The tracked diff is 24 files, 859 additions and 239 deletions (**1,098 changed lines**), before counting untracked helpers and change artifacts. Apply progress describes review slices, but no commits/branches preserve those slices in the current worktree.
2. **Scope-contaminating files remain in the worktree.** `openspec/specs/superlinea-management/spec.md` still has unrelated heading-only tracked edits, while unrelated untracked `docs/*` and `openspec/changes/hotfix-linea-superlinea-endpoint/` remain present. They must not be included accidentally in CR-001 delivery.

### SUGGESTION

Execute the Phase 7 manual matrix with the real app/backend or a controlled HTTP interception harness. Static inspection and build output do not prove focus, DOM behavior, request bodies, actual HTTP envelopes, or nested-flow state preservation.

## Requirements and design state

- **D1-D8:** implementation is statically present for the inspected scope. D7 now has equivalent RHF ref registration in `FormInput` and all three numeric controls.
- **Accessible focus:** the ref chain needed by RHF is statically wired, but actual first-invalid-field focus after Yup validation or server `setError(..., { shouldFocus: true })` was not executed.
- **HTTP error mapping:** all listed active form maps and catches remain statically present. Actual 400/global/network responses were not exercised.
- **Optional-string normalization:** Marca and Presentación create/edit plus Producto create/edit remain statically normalized; Línea and SuperLínea preserve their existing omission logic. Request bodies were not intercepted.
- **Producto stock:** create validation/payload and edit disabled/no-op behavior remain statically present. Actual creation/editing was not exercised.
- **IVECO/NEX-PRO configuration:** missing/non-finite configuration guards and finite-only schema maxima remain statically present. Runtime states were not exercised.
- **Open decisions remain unchanged:** quote floor, optional free-text maxima, file validation, and price formula are outside CR-001.

## Phase 7 observed task state

Tasks 7.1-7.7 remain unchecked and runtime-pending. Task 7.8 remains unchecked in `tasks.md`, although its commands were executed diagnostically in this re-verification. No task checkbox was rewritten.

## Commands and exact results

| Command | Exit | Actual result |
|---|---:|---|
| `git diff --check` | 0 | No whitespace errors, including the refreshed report. |
| `yarn build` | 0 | 2,452 modules transformed; build completed in 4.09s; existing chunk-size warning only. |
| `yarn lint` | 1 | **145 problems: 17 errors, 128 warnings.** This exactly matches the supplied baseline of 145/17/128. No diagnostic names any of the three corrected numeric input files. |
| `yarn tsc -b` | 2 | **120 TypeScript errors** (`error TS` count). This exactly matches the supplied baseline of 120. No diagnostic names any of the three corrected numeric input files. |

The current lint/type-check counts introduce no count regression relative to the supplied baselines. These failing commands are not reported as PASS.

## Runtime-pending items

1. Actual 400 `fieldErrors[]` mapping for every form, unknown-field fallback, 400 without fields, 401/403/404/409/500, domain errors, and network failures.
2. Browser focus after Yup validation and server `setError`, including all three corrected numeric controls.
3. Request interception for create/edit payloads, including optional-string omission/trimming and Producto stock.
4. Producto create/edit UI behavior and numeric/text/selector boundaries.
5. IVECO/NEX-PRO unavailable, non-finite, and available configuration states, including programmatic submission blocking.
6. SuperLínea/Línea nested cancellation, parent-state preservation, refresh, reassignment, protected/dependent errors, and success feedback.
7. Representative runtime behavior of external shared-component consumers.

## Recommended next work

Proceed with the Phase 7 browser/backend or controlled-interception matrix. Do not return to apply for D7: its source-level warning is resolved. Keep the change **Partial** until runtime evidence exists, and preserve the review-size/unrelated-worktree warnings in any archive record rather than synthesizing a PASS.
