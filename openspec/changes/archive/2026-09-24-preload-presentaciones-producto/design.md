# Design: Preload Producto Selector Options

## Technical Approach

Refactor the Producto form's opening effect so option loading is independent of create/edit mode. One unconditional `Promise.all` will request active Marca, Línea, and Presentación options with an empty `denominacion` filter. Only after the combined request settles will the existing `if (producto)` value-preload block run, unchanged, so edit values remain populated even when option loading fails.

The shared `EntidadSelectorBase` will gain one optional string prop for localized empty content. Producto's three selector adapters will receive their messages from one form-level constant map: Marca and Presentación will forward the prop to the shared base, while Línea will apply the equivalent callback to its existing direct React Select instance. A small Presentación message-origin state will distinguish opening-preload output from explicit-search output, making the inline empty message and the existing zero-result WARNING mutually exclusive.

This design implements all six requirements in `specs/producto-selector-option-preload/spec.md` without changing services, DTOs, endpoint contracts, submission behavior, selector disabling, or loading UI.

## Requirement-to-Change Mapping

| Requirement | Concrete design change |
|-------------|------------------------|
| Preload selector options when opening the Producto form | Replace the create-only two-request branch in `registrar-actualizar-producto.tsx` with one unconditional three-request `Promise.all`; populate `marcas`, `lineas`, and `presentaciones` only after all three resolve. |
| Report opening preload failures through the existing alert mechanism | Keep one catch around the combined option preload and invoke `addAlert` once with `TipoAlerta.ERROR`, `TituloAlerta.ERROR`, and a safe Spanish message. Continue to the edit value-preload block after handling the failure. |
| Show localized empty states without changing unrelated selector defaults | Add `mensajeSinOpciones?: string` to `EntidadSelectorBase`; conditionally supply React Select's `noOptionsMessage` only when that prop is defined. Wire the three exact Producto messages through their selector adapters. |
| Preserve Presentación search warning precedence | Add `presentacionOptionsMode` with explicit `preload`, `search-result`, and `preload-error` states. Only `preload` supplies the custom inline message; explicit Presentación search changes mode before awaiting its response and retains the existing WARNING behavior for zero results. |
| Preserve inactive current selections | Do not modify either `opciones.find(...) ?? selected` in `EntidadSelectorBase` or `lineas.find(...) ?? selectedLinea` in `LineasSelector`. |
| Preserve Denominación automática and loading boundaries | Do not modify either CR-005 effect, especially the `if (producto) return` guards. Add no `isLoading`, spinner, service, interface, endpoint, payload, or submission-contract change. |

## Architecture Decisions

### Decision: Use one unconditional all-or-nothing preload

**Choice**: In the existing opening effect, call exactly one `Promise.all` with these requests in this order:

```ts
ProductoService.obtenerTotales({ denominacion: "" }, "marcas")
ProductoService.obtenerTotales({ denominacion: "" }, "lineas")
PresentacionService.select({ denominacion: "" })
```

Apply the three returned `data` collections only after the promise resolves. Use `presentacionesResponse?.data ?? []` consistently with the existing Presentación search path.

**Alternatives considered**:
- Load only Presentación and leave Marca/Línea edit behavior unchanged. This preserves a narrower literal scope but leaves the same root defect active in two selectors.
- Issue independent requests and apply successful responses individually. This gives partial results but creates partial-success semantics explicitly excluded by the proposal and specification.
- Sequence the requests. This makes failure attribution easier but adds latency and violates the required concurrent load.

**Rationale**: All three selectors use existing compatible `{ data, total }` selection contracts and fail for the same reason: option loading currently lives only in the create branch. One combined request is the smallest coherent correction and matches the normative all-or-nothing contract.

### Decision: Isolate preload errors but always preserve edit values

**Choice**: Keep the combined request and option-state setters in one `try/catch`. The catch logs the technical error and makes exactly one `addAlert` call for the failed combined attempt:

```ts
addAlert({
  type: TipoAlerta.ERROR,
  title: TituloAlerta.ERROR,
  message: "No se pudieron cargar las opciones de Marca, Línea y Presentación.",
  autoClose: true,
});
```

The existing `if (producto) { ... }` value-preload block remains verbatim after the `try/catch`, rather than inside the success path. The effect dependency list remains `[producto]`.

**Alternatives considered**:
- Put the edit value preload inside the preload `try` after the option setters. This is visually compact but a rejected network request would also suppress all existing edit field values, violating the non-regression intent.
- Add a catch per request. This could emit up to three alerts and would imply independent partial-success handling.
- Replace the alert with form-root validation or console logging. Neither uses the required existing alert mechanism.

**Rationale**: The alert concerns option availability, not the correctness of the existing Producto values. Separating those responsibilities lets the form retain its current edit data even when alternative options cannot be fetched. One catch and one `addAlert` call also prevent per-request alert duplication. Because React `StrictMode` replays effects during development, the implementation guards the alert with a ref (`preloadErrorAlertSentRef`) so that a double invocation of the same opening effect emits exactly one `TipoAlerta.ERROR` alert. The underlying `Promise.all` still runs twice and both attempts are logged; only the user-facing alert is deduplicated per attempt. Request deduplication or sequencing remains outside this change.

### Decision: Add a string-level empty-message contract to the shared selector

**Choice**: Extend `EntidadSelectorBaseProps<T>` with:

```ts
mensajeSinOpciones?: string;
```

When defined, `EntidadSelectorBase` will pass `noOptionsMessage={() => mensajeSinOpciones}` to React Select. When undefined, it will omit `noOptionsMessage` entirely rather than recreate React Select's default. React Select 5.10.1 defines `noOptionsMessage` as `({ inputValue }) => ReactNode` and defaults it to `"No options"`.

**Alternatives considered**:
- Expose React Select's callback type directly. This is more flexible but leaks a third-party API into a shared domain-facing component when every required consumer needs only static copy.
- Set a Spanish default in `EntidadSelectorBase`. This would silently change every shared consumer and violate backward compatibility.
- Render a paragraph outside the select. This would not satisfy the required selector-inline empty state.

**Rationale**: A string prop is the smallest reusable contract for the current requirement. Conditional forwarding preserves React Select's own behavior for all consumers that omit it.

### Decision: Centralize Producto empty messages at the form composition boundary

**Choice**: Define one module-level constant map in `registrar-actualizar-producto.tsx`:

```ts
const PRODUCTO_SELECTOR_EMPTY_MESSAGES = {
  marca: "No hay Marcas disponibles.",
  linea: "No hay Líneas disponibles.",
  presentacion: "No hay Presentaciones disponibles.",
} as const;
```

Pass `mensajeSinOpciones?: string` into `LineasSelector`, `MarcasSelector`, and `PresentacionesSelector`. Marca and Presentación forward it to `EntidadSelectorBase`; Línea conditionally maps it to its direct Select's `noOptionsMessage` callback without migrating to the shared component.

**Alternatives considered**:
- Hard-code each message inside each selector. There is no duplicated literal, but message ownership becomes scattered and Presentación suppression requires an additional boolean contract.
- Create a new constants module. This centralizes copy but adds a file and abstraction for three values used by one form.
- Migrate Línea to `EntidadSelectorBase`. This reduces local duplication but changes architecture and interaction details outside the approved scope.

**Rationale**: The form owns this capability and already composes all three adapters. A local map keeps exact copy together, gives Presentación one optional-message mechanism for precedence, and avoids a new cross-feature abstraction.

### Decision: Model Presentación message precedence as option-source state

**Choice**: Add presentation-only UI state in the form:

```ts
type PresentacionOptionsMode = "preload" | "search-result" | "preload-error";

const [presentacionOptionsMode, setPresentacionOptionsMode] =
  useState<PresentacionOptionsMode>("preload");
```

The Presentación adapter receives `PRODUCTO_SELECTOR_EMPTY_MESSAGES.presentacion` only when mode is `preload`; otherwise it receives `undefined`, which suppresses the custom inline copy without changing React Select globally.

**Alternatives considered**:
- Derive precedence only from `presentaciones.length`. Both an empty preload and an empty explicit search produce the same array, so origin cannot be recovered.
- Store `showEmptyMessage: boolean`. This works but obscures why the message is enabled or disabled and makes error handling less explicit.
- Remove the existing WARNING and rely only on inline copy. This violates the preservation requirement.

**Rationale**: The required behavior depends on where the current options came from, not only on their count. A three-value state captures that distinction without introducing loading state.

## Data Flow

### Opening flow and exact statement ordering

```text
Opening effect ([producto])
  1. setPresentacionOptionsMode("preload")
  2. await one Promise.all([
       Marca request,
       Línea request,
       Presentación request
     ])
  3. on combined success, in order:
       setMarcas(marcasResponse.data)
       setLineas(lineasResponse.data)
       setPresentaciones(presentacionesResponse?.data ?? [])
  4. on combined failure:
       setPresentacionOptionsMode("preload-error")
       console.error(...)
       addAlert({ type: TipoAlerta.ERROR, ... }) exactly once from the combined catch
  5. after success or failure:
       if (producto) {
         existing setValue/setSelected statements, verbatim and in their current order
       }
```

No state setter from an individually fulfilled request runs before `Promise.all` resolves, so the UI does not claim partial success. Keeping the edit block after the catch preserves Producto values if option loading fails.

### Presentación message-state transitions

| Current state | Event | Next state | Options/UI result | Alert result |
|---------------|-------|------------|-------------------|--------------|
| Initial/any | Opening effect starts | `preload` | Custom inline message is eligible if options are empty | None solely for an empty list |
| `preload` | Combined preload resolves with zero Presentaciones | `preload` | Show `No hay Presentaciones disponibles.` inside Select | None |
| `preload` | Combined preload resolves with results | `preload` | Show returned options; no empty message is rendered | None |
| `preload` | Combined preload rejects | `preload-error` | Suppress misleading custom empty-list copy | One ERROR from the opening catch |
| Any | Explicit Presentación search starts | `search-result` | Suppress custom preload copy before awaiting search | None yet |
| `search-result` | Search resolves with zero results | `search-result` | Keep custom inline copy suppressed | Preserve existing WARNING message and behavior |
| `search-result` | Search resolves with results | `search-result` | Show returned options | No zero-result WARNING |

The mode transition to `search-result` occurs before awaiting `PresentacionService.select`. Therefore the state update and the existing `addAlert(WARNING)` cannot produce a committed render containing both the custom preload message and the WARNING. The existing search message text, `autoClose`, and response handling remain unchanged.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` | Modify | Centralize the three empty messages, add Presentación option-source state, run the unconditional three-request preload, emit one ERROR from the combined catch, preserve the edit value block and CR-005 effects, and pass selector messages. |
| `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx` | Modify | Add optional `mensajeSinOpciones?: string` and conditionally adapt it to React Select's `noOptionsMessage`; preserve `options.find(...) ?? selected`. |
| `src/componentes/gestion-producto/producto/componentes/configuracion/marcas-selector.tsx` | Modify | Accept and forward the optional localized empty message to `EntidadSelectorBase`. |
| `src/componentes/gestion-producto/producto/componentes/configuracion/presentacion-selector.tsx` | Modify | Accept and forward the mode-controlled optional localized empty message to `EntidadSelectorBase`. |
| `src/componentes/gestion-producto/producto/componentes/configuracion/lineas-selector.tsx` | Modify | Accept the optional localized message and conditionally map it to the existing direct Select's `noOptionsMessage`; preserve its selected fallback and architecture. |
| `openspec/changes/preload-presentaciones-producto/design.md` | Create | Record this technical design. |

No service, DTO, interface, schema, contract, or test-infrastructure file changes are planned.

## Interfaces / Contracts

### Shared selector

```ts
interface EntidadSelectorBaseProps<T extends EntidadBase> {
  // Existing props remain unchanged.
  mensajeSinOpciones?: string;
}
```

Contract:
- Defined string: the Select renders that string through `noOptionsMessage` when no option is available.
- `undefined`/omitted: `EntidadSelectorBase` does not provide `noOptionsMessage`; React Select retains its current `"No options"` default.
- The prop changes presentation only. It does not alter options, selected value, filtering, keyboard behavior, or disabled state.

### Producto selector adapters

Each of `LineasSelectorProps`, `MarcasSelector`'s inline props type, and `PresentacionesSelector`'s inline props type gains:

```ts
mensajeSinOpciones?: string;
```

The prop remains optional to avoid coupling these adapters to one screen state. The Producto form supplies it for Marca and Línea and conditionally supplies it for Presentación.

### Service contracts reused unchanged

```ts
ProductoService.obtenerTotales(
  { denominacion: "" },
  "marcas" | "lineas",
); // Promise<{ data: SelectMarca[] | SelectLinea[]; total: number }>

PresentacionService.select({
  denominacion: "",
}); // Promise<{ data: PresentacionDto[]; total: number }>
```

No endpoint or runtime response contract is changed. Presentación's DTO remains structurally compatible with the existing `SelectPresentacion` option shape.

### Unchanged consumers of `EntidadSelectorBase`

Repository inspection found seven call sites. Only Producto's Marca and Presentación adapters opt into the new prop. These consumers omit it and therefore retain React Select's current default empty-state behavior:

- `src/componentes/gestion-producto/linea/componentes/superlineas-selector.tsx`
- Both selector instances in `src/componentes/gestion-producto/producto/componentes/busqueda-producto.tsx`
- Both selector instances in `src/componentes/NotificacionModal/modales/NotificacionModal.tsx`

Producto's Línea selector is not a shared-base consumer; it remains a direct React Select consumer and receives equivalent behavior only through its own optional adapter prop.

## Testing Strategy

No automated test runner, test files, coverage command, or test CI job is configured, and `strict_tdd` is `false`. This change will not introduce test infrastructure. Verification must combine focused source inspection, manual acceptance checks, and the existing quality commands.

| Layer | What to verify | Approach |
|-------|----------------|----------|
| Static contract | One three-request `Promise.all`, exact empty filters, option setters after combined success, unchanged edit block after catch | Inspect the final diff against the ordering documented above and all six requirements. |
| Component behavior | Create and editable `sistema === 0` Producto show all returned alternatives without Enter; `sistema > 0` remains disabled | Manual browser checks with non-empty service responses. |
| Failure behavior | Any preload rejection produces the existing alert rendering with one ERROR call and does not prevent edit field values from being applied | Manual/mock-browser failure check; inspect that there is one combined catch and no per-request alert. |
| Empty-state behavior | Exact Marca, Línea, and Presentación Spanish messages render inside their Select menus | Manual browser check with empty preload responses. |
| Message precedence | Empty Presentación preload shows inline only; zero-result Enter search shows existing WARNING only; successful Enter search shows options and no zero-result message | Execute the three specification transitions manually. |
| Non-regression | Inactive selected values remain visible; CR-005 create suggestion and edit early return remain unchanged; no `isLoading` or spinner is added | Diff inspection plus create/edit manual checks. |
| Shared-component compatibility | SuperLíneas, Producto search Línea/SuperLínea, and Notificación Destinatario/Motivo omit the prop and still use React Select's default | Type-check and focused manual smoke inspection where practical. |
| Type/build quality | Type compatibility and production bundling | Run `yarn tsc -b`, `yarn lint`, then `yarn build`. Record each command and exit status. |

The repository baseline records `yarn build` as passing and both `yarn lint` and `yarn tsc -b` as failing on pre-existing errors. Verification must report those failures separately from diagnostics in the five touched production files and must not claim the change introduced or fixed unrelated baseline issues.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed.

## Migration / Rollout

No migration, feature flag, dependency installation, backend deployment, or persisted-state cleanup is required. The change is local to Producto form option loading and selector presentation. Rollback consists of reverting the opening-effect refactor, Presentación message-origin state, selector adapter props, and the optional shared-base prop.

The expected implementation is below the 400 changed-line review threshold; no chained PR is anticipated from this design.

## Risks

- `Promise.all` remains intentionally all-or-nothing: one rejection means no option collection is applied, although edit values still preload.
- An explicit search can race the opening preload and be overwritten by a later response. Request cancellation and sequencing remain out of scope.
- React Strict Mode replays effects during development and can duplicate network attempts. A ref guard (`preloadErrorAlertSentRef`) ensures exactly one `TipoAlerta.ERROR` alert is emitted per opening preload attempt even when the effect runs twice; the underlying `Promise.all` is still invoked for each replay and both failures are logged.
- React Select's default is preserved by omitting `noOptionsMessage`, not by hard-coding its current English text; this avoids freezing a third-party default in shared code.

## Open Questions

None. The proposal and specification resolve the implementation boundaries needed for task planning.
