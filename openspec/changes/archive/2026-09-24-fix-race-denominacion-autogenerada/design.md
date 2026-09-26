# Design: Fix Automatic Denomination First-Edit Race

## Technical Approach

Replace the render-independent `sugerenciaDenominacionActiva` state in `RegistrarActualizarProductoForm` with one synchronous ref. The manual-edit detector remains declared immediately before the suggestion effect: it writes the ref during the same passive-effect flush in which the suggestion effect subsequently reads it. This prevents the suggestion effect from calling `setValue("denominacion", ...)` after the user's first edit, while preserving create-mode generation, selector-driven refresh, empty/whitespace reactivation, and edit-mode guards.

The production change is limited to `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`. It does not change `FormInput`, selection/caret APIs, the automatic-denomination generator, the archived selector-preload behavior, services, DTOs, or HTTP contracts.

## Requirement-to-Change Mapping

| Modified requirement | Concrete design change |
|----------------------|------------------------|
| Ubiquitous language | Keep the existing `generarDenominacionAutomatica` composition and terminology unchanged. |
| Generation in create mode | Initialize `sugerenciaDenominacionActivaRef` with `!producto`; retain the existing selector resolution, generator call, and `setValue` path while the ref remains active. |
| Create mode only | Preserve `if (producto) return` in the detector and `if (producto || !ref.current) return` in the suggestion effect. |
| Manual editing | On the first watched value that differs from the last automatic value, synchronously set `.current = false` before the suggestion effect can write the suggestion back. |
| No overwriting | Read `.current` at the suggestion gate so both the same update cycle and later selector changes return before `setValue`. |
| Reactivation when cleared | Set `.current = true` for empty or whitespace-only values and retain `denominacionActual` in the suggestion-effect dependencies so the current suggestion is regenerated. |
| No backend default | Make no service, payload, DTO, endpoint, or backend change. |

## Architecture Decisions

### Decision: Use a ref as the only suggestion-ownership flag

**Choice**: Replace:

```tsx
const [sugerenciaDenominacionActiva, setSugerenciaDenominacionActiva] =
  useState(!producto);
```

with:

```tsx
const sugerenciaDenominacionActivaRef = useRef(!producto);
```

The ref is the single source of truth for whether the automatic suggestion still owns the field.

**Alternatives considered**:
- Keep state and add a mirror ref. This would preserve a render trigger that no consumer needs, while introducing two mutable representations that can drift.
- Move the signal to `FormInput` through a custom `onChange`. This would expand the shared component's contract and its 23-call-site blast radius for a form-local race.

**Rationale**: Repository inspection found exactly five current references to the state pair, all inside this form: declaration (line 123), clear reset (line 188), manual-edit deactivation (line 193), suggestion gate (line 199), and suggestion dependency entry (line 230). The value is not used by JSX, disabled logic, labels, validation messages, or any other render branch. A ref therefore models the non-visual ownership flag directly without losing required rendering behavior.

### Decision: Preserve effect declaration order and watched-value triggers

**Choice**: Keep the detector effect immediately before the suggestion effect. The detector writes `.current`; the suggestion effect reads `.current` and no longer lists the ref or its current value as a dependency. Keep `denominacionActual` in both effects' dependencies.

**Alternatives considered**:
- Drop `denominacionActual` from the suggestion dependencies and read through `getValues`. That avoids per-keystroke scheduling, but clearing an already inactive field would no longer itself trigger regeneration and would break `Vaciar reactiva` without another mechanism.
- Merge both effects. That could work, but broadens a targeted correction and mixes ownership detection with suggestion composition, making preserved behavior harder to review.

**Rationale**: React invokes passive effects for a committed render in declaration order. The detector's ref assignment is an immediate JavaScript mutation; unlike a state setter, it does not wait for another render. Therefore the later suggestion effect observes the updated `.current` during the same effect flush. Retaining `denominacionActual` supplies the render/effect trigger that a ref mutation intentionally does not provide.

### Decision: Prevent the overwrite rather than repair the caret

**Choice**: Return from the suggestion effect before its `setValue` call once manual editing is detected. Do not capture or restore `selectionStart`/`selectionEnd`, and do not modify `FormInput`.

**Alternatives considered**:
- Capture and restore the selection range after `setValue`. This treats the visible caret jump but still overwrites the user's character and adds timing-sensitive DOM work.
- Add selection handling to `FormInput`. This spreads feature-specific recovery into a shared controlled-input wrapper and does not remove the invalid write.

**Rationale**: `FormInput` uses `useController` and spreads `{...field}` onto the plain `Input`; the denomination call site adds only `onKeyDown`, `inputRef`, and a `producto.sistema` disabled expression. There is no denomination-specific `onChange`, trimming, or cursor manipulation. The caret moves because the suggestion effect replaces the controlled value through `setValue`. Eliminating that write preserves both the typed value and the browser-managed selection naturally.

### Decision: Keep the archived selector preload effect independent

**Choice**: Do not alter the opening/preload effect at lines 244–304, `preloadErrorAlertSentRef`, `presentacionOptionsMode`, option requests, selected-option state, or preload error behavior.

**Alternatives considered**: Coordinate the ref with preload completion or move the denomination logic into the preload effect. Both couple independent concerns and would expand the active change beyond the race.

**Rationale**: The archived `preload-presentaciones-producto` change intentionally kept the two CR-005 effects separate. Its opening effect may update option arrays in both modes and calls `setValue("denominacion", producto.denominacion)` only inside `if (producto)`. Both denomination effects already return for `producto`, so edit preload cannot compete with suggestion generation. In create mode, preload can refresh option arrays, but no suggestion is generated until the three selector IDs/selected values are available. The ref-only edit changes different statements and does not conflict with the archived behavior.

## Reference Inventory and Exact Changes

All current references to `sugerenciaDenominacionActiva` / `setSugerenciaDenominacionActiva` are accounted for below.

| Current location | Current role | Planned form |
|------------------|--------------|--------------|
| Line 123 | `useState(!producto)` declaration | `const sugerenciaDenominacionActivaRef = useRef(!producto);` |
| Line 188 | Empty/whitespace reset via `setSugerenciaDenominacionActiva(true)` | `sugerenciaDenominacionActivaRef.current = true;` |
| Line 193 | Manual-edit detection via `setSugerenciaDenominacionActiva(false)` | `sugerenciaDenominacionActivaRef.current = false;` |
| Line 199 | Suggestion early-return gate reads state | Read `!sugerenciaDenominacionActivaRef.current` |
| Line 230 | State value in suggestion dependencies | Remove this entry; refs are not reactive dependencies |

There are no other readers or writers. In particular, the denomination `FormInput` at lines 477–484 does not read the flag. Its disabled condition remains `producto && producto.sistema > 0 ? true : false`, so ref mutations do not need to trigger rendering for UI correctness.

## Effect Contracts and Dependencies

### Manual-edit detector

```tsx
useEffect(() => {
  if (producto) return;

  const valor = (denominacionActual ?? "").trim();
  if (!valor) {
    sugerenciaDenominacionActivaRef.current = true;
    return;
  }

  if (valor !== ultimaDenominacionAutomaticaRef.current.trim()) {
    sugerenciaDenominacionActivaRef.current = false;
  }
}, [denominacionActual, producto]);
```

Final dependency array: `[denominacionActual, producto]`.

### Automatic-suggestion effect

Only the gate and dependency list change; selector resolution, `generarDenominacionAutomatica`, `ultimaDenominacionAutomaticaRef`, equality check, and `setValue` remain unchanged.

```tsx
if (producto || !sugerenciaDenominacionActivaRef.current) {
  return;
}
```

Final dependency array:

```tsx
[
  producto,
  marcaIdActual,
  lineaIdActual,
  presentacionIdActual,
  marcas,
  lineas,
  presentaciones,
  selectedMarca,
  selectedLinea,
  selectedPresentacion,
  denominacionActual,
  setValue,
]
```

`denominacionActual` MUST remain present: clearing the field causes a render, the detector synchronously reactivates `.current`, and the following suggestion effect regenerates the value in that same effect flush.

## Data Flow

### First manual edit

```text
field.onChange(user value)
  -> react-hook-form updates denominacionActual
  -> committed render schedules both effects
  -> detector runs first
       value differs from ultimaDenominacionAutomaticaRef
       ref.current = false (visible immediately)
  -> suggestion effect runs second
       ref.current is false
       return before setValue
  -> controlled input retains user value and browser caret
```

### Empty/whitespace reactivation

```text
field.onChange("" or whitespace)
  -> denominacionActual dependency changes
  -> detector: trim() is empty; ref.current = true
  -> suggestion effect: active gate; resolve three selected parts
  -> update ultimaDenominacionAutomaticaRef
  -> setValue current automatic suggestion
```

### Selector change after manual editing

```text
selector dependency changes
  -> suggestion effect runs
  -> ref.current remains false
  -> return before generation/write
  -> manual denomination remains authoritative
```

## Boundary Handling

| Boundary | Expected behavior | Design mechanism |
|----------|-------------------|------------------|
| First edit inside suggested text | First character remains and caret stays immediately after the inserted character | Detector sets the ref false before the suggestion gate; no `setValue` occurs. |
| Rapid consecutive typing | Every character remains without rollback or flicker | The first committed edit deactivates ownership synchronously; later detector runs retain false for non-empty manual text. |
| Delete the whole field | Current suggestion returns when all three source selections remain | Empty `denominacionActual` sets the ref true; the watched-value dependency runs the suggestion effect. |
| Replace with whitespace only | Whitespace is treated as empty and current suggestion returns | Detector uses the existing `.trim()` check before reactivation. |
| Change Marca, Línea, or Presentación after manual edit | Manual denomination remains unchanged | Selector dependencies may rerun the suggestion effect, but the false ref gate returns before `setValue`. |
| Change a selector while suggestion is still active | Suggestion refreshes from the new three-part selection | The ref remains true and all current selector dependencies remain unchanged. |
| Existing Producto | Persisted denomination and selector preload remain unchanged | Both denomination effects preserve their `producto` early returns; preload owns edit-mode `setValue`. |
| Archived preload interaction | Option preload, error alert deduplication, and selected-option fallback continue independently | No preload statement, dependency, or related ref/state is modified. |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` | Modify during apply | Replace the state pair with one ref, update the detector's two writes and suggestion gate, and remove only the obsolete state dependency. |
| `openspec/changes/fix-race-denominacion-autogenerada/design.md` | Create | Record this implementation design, boundary behavior, and verification plan. |
| `src/componentes/herramientas/formateo-de-campos/form-input.tsx` | No change | Existing controlled-input wiring is not the cause; no cursor or event API is needed. |
| `src/componentes/gestion-producto/producto/domain/generar-denominacion-automatica.ts` | No change | Existing Marca + Línea + Presentación composition remains authoritative. |
| `openspec/specs/denominacion-automatica-producto/spec.md` | No change during apply | Canonical capability changes only through the later archive phase. |

The planned production diff is localized and expected to remain well below the 400 changed-line review budget.

## Interfaces / Contracts

No public component prop, service, DTO, payload, endpoint, schema, or backend contract changes. The internal ref contract is:

```ts
// true: the suggestion may populate/refresh the field
// false: a non-empty manual value owns the field
const sugerenciaDenominacionActivaRef = useRef(!producto);
```

Transitions:

| Current ownership | Observed denomination | Next ownership |
|-------------------|-----------------------|----------------|
| Active or inactive | Empty/whitespace-only | Active |
| Active | Equals latest automatic suggestion | Active |
| Active | Non-empty and differs from latest suggestion | Inactive |
| Inactive | Non-empty manual value | Inactive |

## Testing Strategy

No automated test runner, test files, coverage command, or test CI job is configured, and `strict_tdd` is `false`. This change does not add test infrastructure. Verification combines source/diff inspection, existing quality commands, and manual browser acceptance checks.

| Layer | What to verify | Approach |
|-------|----------------|----------|
| Static | Exactly five old state references are replaced/removed; effects remain ordered; final dependencies match this design; preload and `FormInput` are untouched | Inspect the focused diff and re-read the two effects. |
| Unit | No automated harness exists | Do not claim unit tests; the pure generator is unchanged. |
| Integration/component | React Hook Form value, effect ordering, selectors, and controlled input cooperate without overwrite | Manual create/edit flows below. |
| E2E | User-visible value and caret preservation plus retained scenarios | Manual browser checks; no E2E runner exists. |
| Quality gates | Type diagnostics, lint diagnostics, production bundle | Run `yarn tsc -b`, `yarn lint`, and `yarn build`; record commands and exit statuses. Compare type/lint failures with the documented pre-existing baseline, and require no new diagnostics in the touched source file. |

### Manual verification sequence

1. Open **Registrar Producto**, select Marca, Línea, and Presentación, and confirm the expected automatic denomination appears.
2. Click in the middle of that suggestion and type one character. Confirm the character remains, the value is not restored, and the caret remains immediately after the inserted character rather than jumping to the end.
3. Repeat with several rapid consecutive characters. Confirm every character remains with no rollback or visible flicker.
4. With a manually edited denomination, change each selector in turn. Confirm the manual value remains unchanged.
5. Clear the entire denomination while all three selectors remain selected. Confirm the current automatic suggestion returns.
6. Edit manually again, replace the value with whitespace only, and confirm whitespace is treated as empty and the suggestion returns.
7. While the field still contains an active automatic suggestion, change a selector and confirm the suggestion refreshes.
8. Open an existing Producto and confirm its persisted denomination is preloaded and never regenerated after selector option preload or selector changes; preserve the existing `sistema > 0` disabled behavior.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed.

## Migration / Rollout

No data migration, feature flag, dependency installation, API deployment, or persisted-state cleanup is required. Rollout is the localized frontend change. Rollback consists of reverting the ref gate to the prior state implementation, with the known first-edit race returning; no data rollback is needed.

## Risks

- Empty-field reactivation would regress if `denominacionActual` were removed from the suggestion dependencies; the final dependency contract explicitly retains it.
- Effect reordering would reintroduce the stale decision window; the detector must remain declared before the suggestion effect.
- Automated regression coverage is unavailable, so focused manual caret verification is required and must not be reported as an automated test.
- Existing lint and type-check baselines fail; verification must distinguish pre-existing diagnostics from any new diagnostic in the touched source file.

## Open Questions

None. The proposal, modified specification, current source, and archived preload design provide sufficient constraints for task planning.
