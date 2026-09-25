# Tasks: Fix Automatic Denomination First-Edit Race

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~10–14 (5 references replaced/removed in one file) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | single-pr |

Decision needed before apply: No — budget risk Low, single PR confirmed by parent
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Replace the denomination suggestion-ownership state with a synchronous ref so the first manual edit is not overwritten | PR 1 | `yarn tsc -b` (no test runner configured; manual browser checks in Phase 2) | Manual: open Registrar Producto, select Marca/Línea/Presentación, type into the suggested denominación, confirm the character and caret survive | Revert the isolated change in `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` to the prior `useState` gate; no data, dependency, or contract rollback |

## Phase 1: Implementation (single file, create-mode denomination gate)

- [x] 1.1 In `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`, replace the declaration at line 123 `const [sugerenciaDenominacionActiva, setSugerenciaDenominacionActiva] = useState(!producto);` with `const sugerenciaDenominacionActivaRef = useRef(!producto);`. Evidence: re-read the declaration; `useRef` is already imported on line 1. Maps to: Generation in create mode, Create mode only.
- [x] 1.2 In the manual-edit detector effect (currently lines 181–195), change the whitespace/empty reset at line 188 from `setSugerenciaDenominacionActiva(true);` to `sugerenciaDenominacionActivaRef.current = true;`. Evidence: detector still returns early on `producto`, keeps the `.trim()` empty check, and writes `.current` synchronously. Maps to: Reactivation when cleared (Clearing reactivates, Whitespace-only clearing).
- [x] 1.3 In the same detector effect, change the manual-edit deactivation at line 193 from `setSugerenciaDenominacionActiva(false);` to `sugerenciaDenominacionActivaRef.current = false;`. Evidence: the write occurs before the suggestion effect is declared and runs in the same passive-effect flush. Maps to: Manual editing (First manual edit is preserved, Rapid consecutive typing), No overwriting.
- [x] 1.4 In the automatic-suggestion effect, change the gate at line 199 from `if (producto || !sugerenciaDenominacionActiva) {` to `if (producto || !sugerenciaDenominacionActivaRef.current) {`. Evidence: gate reads `.current`; selector resolution, `generarDenominacionAutomatica`, `ultimaDenominacionAutomaticaRef`, equality check, and `setValue` are untouched. Maps to: Create mode only, No overwriting.
- [x] 1.5 In the same suggestion effect, remove the obsolete `sugerenciaDenominacionActiva,` entry (line 230) from the dependency array, leaving the following final dependency list unchanged otherwise: `producto`, `marcaIdActual`, `lineaIdActual`, `presentacionIdActual`, `marcas`, `lineas`, `presentaciones`, `selectedMarca`, `selectedLinea`, `selectedPresentacion`, `denominacionActual`, `setValue`. Evidence: `denominacionActual` MUST remain present so clearing the field still triggers regeneration; refs are not reactive dependencies. Maps to: Reactivation when cleared, Generation in create mode.
- [x] 1.6 Confirm the effect declaration order is preserved (detector immediately before the suggestion effect) and that no other statement changed: no `FormInput` (`src/componentes/herramientas/formateo-de-campos/form-input.tsx`), no generator (`src/componentes/gestion-producto/producto/domain/generar-denominacion-automatica.ts`), no preload effect (currently lines 244–304), and the `disabled={producto && producto.sistema > 0 ? true : false}` condition on the denomination input is unchanged. Evidence: focused diff shows exactly the five reference changes. Maps to: Create mode only, No backend default.

## Phase 2: Verification

- [x] 2.1 Static diff inspection: verify the focused diff against `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` contains exactly the five planned reference changes (declaration, clear reset, manual deactivate, gate, dependency removal), zero other readers/writers of the removed state pair, no leftover `sugerenciaDenominacionActiva`/`setSugerenciaDenominacionActiva` identifiers, and no changes to `FormInput`, the generator, or the preload effect. Evidence: `git diff` of the single file, plus a grep for the old identifiers returning no matches. Maps to: No backend default, Create mode only.
- [x] 2.2 Run `yarn tsc -b`; record the command and exit status, and check whether any diagnostic points to `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`. Compare against the documented pre-existing type-check baseline (config: `typecheck: failing on pre-existing errors`) and report any NEW diagnostic in the touched file as a regression. Do not claim the check passed unless it exits successfully. Maps to: quality gate (proposal success criteria).
- [x] 2.3 Run `yarn lint`; record the command and exit status, separate pre-existing baseline lint errors (config: `lint: failing on pre-existing errors`) from any new diagnostic in the touched file, and report honestly. Maps to: quality gate.
- [x] 2.4 Run `yarn build`; record the command and exit status. The baseline is `build: passing`, so a non-zero exit is a new regression unless proven otherwise. Maps to: quality gate (proposal success criteria).
- [ ] 2.5 Manual check — first-edit caret preservation: open Registrar Producto, select Marca "Coca Cola", Línea "Soft Drinks", Presentación "2L", confirm the field shows `Coca Cola Soft Drinks 2L`; place the caret mid-text, type one character, and confirm the character remains, the value is not restored, and the caret stays immediately after the inserted character. Report as user-observed manual evidence, not automated proof. Maps to: Manual editing (First manual edit is preserved), Generation in create mode.
- [ ] 2.6 Manual check — rapid consecutive typing: with an active suggestion, type several characters without pausing and confirm every character remains with no rollback or visible flicker and the caret stays after the last typed character. Maps to: Manual editing (Rapid consecutive typing).
- [ ] 2.7 Manual check — selector change after manual edit: manually edit the denomination, then change each of Marca, Línea, and Presentación in turn; confirm the manual value remains unchanged. Maps to: No overwriting (Manual editing is not overwritten, Selector change after a first manual edit).
- [ ] 2.8 Manual check — delete-whole-field reactivation: with all three selectors still selected, delete the entire denomination and confirm the current automatic suggestion returns. Maps to: Reactivation when cleared (Clearing reactivates).
- [ ] 2.9 Manual check — whitespace-only reactivation: edit manually again, replace the value with whitespace only, and confirm it is treated as empty and the suggestion returns. Maps to: Reactivation when cleared (Whitespace-only clearing).
- [ ] 2.10 Manual check — suggestion refresh while active: while the field still holds an active automatic suggestion, change a selector and confirm the suggestion refreshes from the new three-part selection. Maps to: Generation in create mode, No overwriting.
- [ ] 2.11 Manual check — existing Producto regression: open an existing Producto, confirm the persisted denomination is preloaded and never regenerated after selector option preload or selector changes, and confirm the `sistema > 0` disabled behavior is preserved. Maps to: Create mode only (Existing Producto denomination is preserved), No backend default.
- [x] 2.12 Confirm no automated tests were added or claimed, since no test runner is configured (`strict_tdd: false`); record that Phase 2.5–2.11 are manual browser observations and not automated regression proof. Maps to: proposal success criteria (manual reproduction).

## Phase 3: Cleanup / Close

- [x] 3.1 Confirm no leftover debug code, commented-out state, console noise, or unused imports were introduced in `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`. Evidence: focused diff is limited to the five planned changes. Maps to: change discipline.
- [x] 3.2 Mark tasks 1.1–2.12 complete with the exact commands run, exit statuses, and the manual check outcomes; state any pre-existing baseline failure separately from any new failure. Maps to: verify evidence requirement.
