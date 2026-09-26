# Exploration: fix-race-denominacion-autogenerada

## Current State

`RegistrarActualizarProductoForm`
(`src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`)
coordinates the CR-005 automatic denomination in create mode through two
`useEffect` blocks plus a piece of React state:

- `sugerenciaDenominacionActiva` — `useState(!producto)` (L123). `true` in create
  mode, `false` in edit mode. It is ONLY consumed by the suggestion effect's gate
  (grep confirms usages: L123, L188, L193, L199, L230). It exists solely as the
  "should the suggestion still own the field" flag.
- `ultimaDenominacionAutomaticaRef` — `useRef("")` (L124). Stores the last value
  written by the suggestion, used to detect a manual edit.
- `denominacionActual = watch("denominacion")` (L132).

**Edit detector effect (L181–195), deps `[denominacionActual, producto]`**

```tsx
useEffect(() => {
  if (producto) return;
  const valor = (denominacionActual ?? "").trim();
  if (!valor) { setSugerenciaDenominacionActiva(true); return; }
  if (valor !== ultimaDenominacionAutomaticaRef.current.trim()) {
    setSugerenciaDenominacionActiva(false);   // async state update
  }
}, [denominacionActual, producto]);
```

**Suggestion effect (L198–242), deps include `sugerenciaDenominacionActiva`,
`marcaIdActual`, `lineaIdActual`, `presentacionIdActual`, the option lists, the
`selected*` states, `denominacionActual`, `setValue`**

```tsx
useEffect(() => {
  if (producto || !sugerenciaDenominacionActiva) return;   // reads state from closure
  // ... compute marca/linea/presentacion from id ?? selected
  const sugerida = generarDenominacionAutomatica({ marca, linea, presentacion });
  if (!sugerida) return;
  if ((denominacionActual ?? "") === sugerida) {
    ultimaDenominacionAutomaticaRef.current = sugerida;
    return;
  }
  ultimaDenominacionAutomaticaRef.current = sugerida;
  setValue("denominacion", sugerida, { shouldValidate: true });   // rewrites field
}, [/* ... denominacionActual is a dependency ... */]);
```

**Input wiring.** The field is a generic `FormInput name="denominacion"` (L477–484).
`FormInput` uses `useController` and spreads `{...field}` onto a plain `<Input>`
(`src/componentes/herramientas/formateo-de-campos/form-input.tsx:72,104`). There is
NO `onChange`, no `trimStart`, and no `setSelectionRange`/selection logic on the
denominación field anywhere (grep of the Producto feature and `form-input.tsx`
found only an unrelated `trimStart` in `lineas-selector.tsx:73`). So the caret jump
is not caused by local input logic — it is caused by the value being overwritten
by `setValue`.

### Race confirmed (verified against current code, not the prior line numbers)

On the first value change from a user edit (create mode, field currently holding
an auto-suggested value):

1. `field.onChange` updates `denominacion` to the user-typed value. In the same
   commit, `denominacionActual` changes, so BOTH effects are scheduled.
2. React runs effects in declaration order: edit detector (L181) before suggestion
   (L198).
3. The edit detector calls `setSugerenciaDenominacionActiva(false)` — an async
   state update that does NOT land within this commit.
4. The suggestion effect runs with the STALE closure value
   `sugerenciaDenominacionActiva === true`, so its gate does not return.
   `denominacionActual` (the typed value) `!== sugerida`, so it executes
   `setValue("denominacion", sugerida, { shouldValidate: true })`.
5. That `setValue` rewrites the controlled value back to the suggestion and resets
   the caret to the end. The first character/attempt is lost.
6. On the second keystroke, `sugerenciaDenominacionActiva` is already `false`, the
   gate returns early, and typing works normally.

Root cause: the two effects communicate through asynchronous state, while the
suggestion effect also depends on `denominacionActual` — so it re-runs on every
keystroke, in the same commit as the detector, before the detector's state update
is visible.

Interplay with the just-archived preload change is harmless: the preload effect
(L244–304) only calls `setValue("denominacion", …)` when `producto` is present,
and both CR-005 effects early-return for edit mode. On mount in create mode the
option lists populate but no selectors are chosen yet, so `sugerida` is `null` and
the suggestion effect returns. The fix must not touch the preload effect.

Edit mode (`producto` present) is unaffected: both effects early-return and
`FormInput` is disabled when `producto.sistema > 0`.

## Affected Areas

- `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`
  — the `sugerenciaDenominacionActiva` state (L123), edit detector effect (L181–195)
  and suggestion effect (L198–242). The only file that must change for the fix.
- `src/componentes/gestion-producto/producto/domain/generar-denominacion-automatica.ts`
  — read-only dependency; logic remains correct and unchanged.
- `src/componentes/herramientas/formateo-de-campos/form-input.tsx` — only relevant
  if a synchronous `onChange` approach is chosen; otherwise untouched.
- `openspec/specs/denominacion-automatica-producto/spec.md` — canonical spec does
  NOT exist (see spec delta section below).

## Approaches

1. **Synchronous ref as the single source of truth for the suggestion flag** —
   Replace the `sugerenciaDenominacionActiva` `useState` with a
   `useRef(!producto)`; the edit detector writes `.current` synchronously and the
   suggestion effect reads `.current` in its gate. Keep `denominacionActual` in the
   suggestion effect's deps so clearing still triggers regeneration.
   - Pros: deterministic; removes the async race by construction; smallest
     conceptual change; refs are exempt from exhaustive-deps so no ripple; the flag
     is never used for rendering, so statefulness was never required.
   - Cons: ref mutations don't render — must confirm the clear-reactivation path
     still re-runs the effect via the `denominacionActual` dependency.
   - Effort: Low.

2. **Keep the state, add a mirror ref** — Keep `useState` for any future render use,
   but also write a `ref` synchronously in the edit detector and read the ref in the
   suggestion gate.
   - Pros: smallest diff; least risk to unrelated behavior.
   - Cons: two sources of truth for the same concept (drift risk); redundant state.
   - Effort: Low.

3. **Drop `denominacionActual` from the suggestion effect's deps and read it via
   `getValues`** — Stop the suggestion effect from re-running on keystrokes; it then
   only reacts to selector/suggestion changes.
   - Pros: also removes the per-keystroke `shouldValidate` churn.
   - Cons: REGRESSION RISK — when the flag is already `true` and the user clears the
     field, the effect no longer re-runs (no dep change), breaking the
     "Vaciar reactiva" scenario. Would need a compensating trigger.
   - Effort: Medium.

4. **Flag the manual edit synchronously from the input's `onChange`** — Extend
   `FormInput` to expose `onChange` and mark the manual edit at the event site.
   - Pros: most explicit "user typed" signal.
   - Cons: touches a shared component used across the app; more files and more
     blast radius than needed; the ref approach already achieves synchrony without it.
   - Effort: Medium.

5. **Capture/restore the selection range after `setValue`** — Restore the caret after
   the overwrite.
   - Pros: none material.
   - Cons: does NOT recover the lost character; treats the symptom, not the cause.
     Rejected.

## Recommendation

Apply **Approach 1** (with Approach 2 as an acceptable minimal-diff variant).

The bug is a stale-read race between two effects communicating through async state.
Making the gate read a synchronously-updated `ref` guarantees the edit detector's
decision is visible to the suggestion effect within the same commit, because React
runs effects in declaration order (detector L181 before suggestion L198) and ref
writes are synchronous. This preserves every CR-005 behavior:

- Generation when the three parts are selected (unchanged; gate true on mount).
- Manual editability (typed value no longer overwritten on the first keystroke).
- No overwrite after a manual edit (flag false → early return).
- Clear-reactivates (empty value sets flag true → `denominacionActual` dep still
  triggers the effect → regenerate).
- Edit-mode early return (unchanged).

## Boundary Cases

- **First vs subsequent keystrokes** — the exact regression; first keystroke must
  survive and the caret must stay where the user typed.
- **Fast typing** — after the first commit the flag is false synchronously, so
  subsequent writes are no-ops; no flicker or value rollback.
- **Deleting the whole field** — value becomes empty → flag set true → if Marca,
  Línea and Presentación are still selected, the field must be re-filled.
- **Switching Marca/Línea/Presentación after a manual edit** — must preserve the
  manual value (no overwrite).
- **Switching selectors while the field still holds the auto value** — must refresh
  the suggestion (flag still true).
- **Editing back to exactly the last suggestion** — flag remains false once set;
  conservative, no overwrite.
- **Edit mode (`producto` present)** — both effects early-return; must remain
  unchanged, including disabled input when `producto.sistema > 0`.
- **Preload change interaction** — the preload effect's edit-mode `setValue`
  sequence and its `Promise.all`/alert behavior must remain untouched.
- **Validation side effect** — today `setValue(… { shouldValidate: true })` runs on
  the suggestion write; after the fix, manual typing no longer triggers redundant
  re-validation of that field through this effect.

## Canonical Spec Delta

- This is a **MODIFIED** capability: `denominacion-automatica-producto`.
- The canonical spec **does NOT exist** under `openspec/specs/`.
  `openspec/changes/cr-005-denominacion-automatica/` was never archived (its
  `state.yaml` shows `archive: ready`, `nextRecommended: archive`), so its delta
  spec at `openspec/changes/cr-005-denominacion-automatica/specs/denominacion-automatica-producto/spec.md`
  is the only current source of the requirements.
- A MODIFIED delta needs a base to modify. Before or alongside this change, CR-005
  must be archived to materialize `openspec/specs/denominacion-automatica-producto/spec.md`,
  or the canonical spec must otherwise be created by an approved change. The
  orchestrator should resolve this ordering explicitly.
- The delta itself should add/tighten the manual-edit requirement so that the
  FIRST user edit is preserved (no overwrite and no caret reset on the first
  keystroke), and add a Given/When/Then scenario covering the first-keystroke case.

## Verification Plan (no automated test runner; `strict_tdd: false`)

- `yarn tsc -b` and `yarn lint` — compare against the documented baseline (both
  currently have pre-existing failures; report new regressions vs baseline).
- `yarn build` — must pass.
- Manual repro (create mode): select Marca + Línea + Presentación so the field is
  auto-filled; click mid-text and type ONE character → the character must appear and
  the caret must stay; clear the whole field → the suggestion must return; change a
  selector after a manual edit → the manual value must persist. Repeat in edit mode
  to confirm the persisted denominación is never regenerated.

## Risks

- Regression of the "Vaciar reactiva" and "No sobrescritura" scenarios if the fix
  drops or misplaces the `denominacionActual` dependency / flag transitions.
- Silent divergence between state and ref if both are kept (Approach 2).
- Touching the shared `FormInput` (Approach 4) risks unrelated fields.
- No automated coverage: correctness relies on manual verification, so the fix must
  stay minimal and auditable.
- Spec-base ordering: without archiving CR-005 (or creating the canonical spec),
  the MODIFIED delta has no canonical base and the change cannot be archived cleanly.

## Ready for Proposal

Yes. The race is confirmed from current source with concrete evidence (effect
ordering, stale closure, `setValue` overwrite, dependency arrays). The recommended
fix is small and localized. One decision must be resolved by the orchestrator/user
before the proposal: how to establish the canonical
`denominacion-automatica-producto` spec, since CR-005 is still un-archived.
