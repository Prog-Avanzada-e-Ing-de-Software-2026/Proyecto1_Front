# Tasks: Preload Producto Selector Options

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~90–140 (additions + deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Notes: five production files, no new files, no test infrastructure, no migrations, no generated artifacts.
The design estimates well under the 400 changed-line budget, so no chained/stacked split is proposed.
`Decision needed before apply: Yes` reflects the `ask-on-risk` delivery strategy (routine confirmation before
apply), not a size exception; no chain-strategy choice is required.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Shared selector empty-message contract + three adapters + Producto form preload refactor (all phases 1–3 land together; they are a single coherent behavior with no standalone value split) | PR 1 | `yarn tsc -b` (no test runner configured) | `yarn dev` — open the Producto form in create and edit mode and exercise the four manual acceptance checks (create/edit alternatives, failure alert, empty states, Presentación precedence) | Revert the five touched files under `src/` listed in Phase 1–3; no data migration or persisted state to undo |

No chaining is proposed; this work unit exists for rollback/verification clarity only.

## Requirement-to-Task Map

| # | Requirement | Tasks |
|---|-------------|-------|
| R1 | Preload selector options when opening the Producto form | 3.3, 3.4, 4.1, 4.5 |
| R2 | Report opening preload failures through the existing alert mechanism | 3.3, 4.1, 4.5 |
| R3 | Show localized empty states without changing unrelated selector defaults | 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.5, 4.1, 4.5 |
| R4 | Preserve Presentación search warning precedence | 3.2, 3.4, 3.5, 4.1, 4.5 |
| R5 | Preserve inactive current selections | 1.2, 2.3, 4.1, 4.5 |
| R6 | Preserve Denominación automática and loading boundaries | 3.3, 4.6 |

## Phase 1: Shared Selector Contract

- [x] 1.1 In `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx`, add the optional prop `mensajeSinOpciones?: string;` to the `EntidadSelectorBaseProps<T>` interface (near `ocultarAgregar`), with a short comment stating it is presentation-only. (R3)
- [x] 1.2 In the same file, destructure `mensajeSinOpciones` in the component parameter list and pass `noOptionsMessage={mensajeSinOpciones ? () => mensajeSinOpciones : undefined}` to the `<Select>`. When the prop is `undefined`, React Select's own default `"No options"` must remain in effect (do NOT hard-code the English default). Leave `value={opciones.find((o) => o.id === selectedId) ?? selected}` untouched. (R3, R5)
- [x] 1.3 Verify by inspection that no other prop, option, selected value, filtering, keyboard handler, or `isDisabled` behavior changed in `entidad-selector-base.tsx`. Evidence: `git diff src/componentes/herramientas/reutilizables/entidad-selector-base.tsx`; confirm all other lines are unchanged. (R3, R5)

## Phase 2: Selector Adapters

- [x] 2.1 In `src/componentes/gestion-producto/producto/componentes/configuracion/marcas-selector.tsx`, add `mensajeSinOpciones?: string;` to the inline props type and forward `mensajeSinOpciones={props.mensajeSinOpciones}` to `EntidadSelectorBase<SelectMarca>`. (R3)
- [x] 2.2 In `src/componentes/gestion-producto/producto/componentes/configuracion/presentacion-selector.tsx`, add `mensajeSinOpciones?: string;` to the inline props type and forward `mensajeSinOpciones={props.mensajeSinOpciones}` to `EntidadSelectorBase<SelectPresentacion>`. (R3)
- [x] 2.3 In `src/componentes/gestion-producto/producto/componentes/configuracion/lineas-selector.tsx`, add `mensajeSinOpciones?: string;` to `LineasSelectorProps`, destructure it, and pass `noOptionsMessage={mensajeSinOpciones ? () => mensajeSinOpciones : undefined}` to the file's existing direct `<Select>`. Do NOT migrate Línea to `EntidadSelectorBase`. Preserve `value={lineas.find((l) => l.id === lineaId) ?? selectedLinea}` and the existing `hasLineaError` / `errors.lineaId` rendering unchanged. (R3, R5)
- [x] 2.4 Verify by inspection that all three adapter props are optional (omitting them changes nothing) and that no selector disabling rule, Enter handler, or nested-entity form wiring changed. Evidence: `git diff src/componentes/gestion-producto/producto/componentes/configuracion/`. (R3, R5)

## Phase 3: Form Composition

- [x] 3.1 In `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`, add the module-level constant next to `productoFieldMap`: `PRODUCTO_SELECTOR_EMPTY_MESSAGES = { marca: "No hay Marcas disponibles.", linea: "No hay Líneas disponibles.", presentacion: "No hay Presentaciones disponibles." } as const;`. (R3, R4)
- [x] 3.2 In the same file, add the type `type PresentacionOptionsMode = "preload" | "search-result" | "preload-error";` and the state `const [presentacionOptionsMode, setPresentacionOptionsMode] = useState<PresentacionOptionsMode>("preload");` alongside the other `useState` declarations. (R4)
- [x] 3.3 Refactor the opening `useEffect` (currently `useEffect(() => { ... }, [producto])` around lines 235–280):
  - Replace the `if (producto) { value preload } else { Promise.all([marcas, lineas]) }` split with a single unconditional `Promise.all` of exactly three requests, in order: `ProductoService.obtenerTotales({ denominacion: "" }, "marcas")`, `ProductoService.obtenerTotales({ denominacion: "" }, "lineas")`, `PresentacionService.select({ denominacion: "" })`. (R1)
  - At the start of the effect, call `setPresentacionOptionsMode("preload")`. (R4)
  - Only after the `Promise.all` resolves, apply `setMarcas(marcasResponse.data)`, `setLineas(lineasResponse.data)`, `setPresentaciones(presentacionesResponse?.data ?? [])` — no individual setter may run before the combined resolve. (R1)
  - Wrap the combined request and the three setters in one `try/catch`. The `catch` MUST call `setPresentacionOptionsMode("preload-error")`, `console.error(...)`, and exactly one `addAlert({ type: TipoAlerta.ERROR, title: TituloAlerta.ERROR, message: "No se pudieron cargar las opciones de Marca, Línea y Presentación.", autoClose: true })`. (R2, R4)
  - Keep the existing `if (producto) { ...setValue/setSelected... }` value-preload block AFTER the `try/catch`, verbatim and in its current statement order (including `setSelectedLinea/Marca/Presentacion`). Do NOT move it inside the `try`. (R1, R2, R6)
  - Keep the dependency list as `[producto]`. (R6)
- [x] 3.4 In `handleBuscarPorDenominacion`, in the `select === "PRESENTACION"` branch, call `setPresentacionOptionsMode("search-result")` BEFORE awaiting `PresentacionService.select(...)`. Preserve the existing `setPresentaciones(response?.data ?? [])` and the existing `total === 0` `TipoAlerta.WARNING` alert with its current message and `autoClose: true`. (R4)
- [x] 3.5 At the selector call sites, pass the messages: `<MarcasSelector mensajeSinOpciones={PRODUCTO_SELECTOR_EMPTY_MESSAGES.marca} ... />`, `<LineasSelector mensajeSinOpciones={PRODUCTO_SELECTOR_EMPTY_MESSAGES.linea} ... />`, and `<PresentacionesSelector mensajeSinOpciones={presentacionOptionsMode === "preload" ? PRODUCTO_SELECTOR_EMPTY_MESSAGES.presentacion : undefined} ... />`. Presentación must receive the message ONLY in `preload` mode. (R3, R4)
- [x] 3.6 Verify by inspection against the design's opening-flow ordering: one `Promise.all`, exact empty filters, setters after combined success, one combined catch with exactly one `addAlert`, edit block after the catch, `[producto]` dependency, and no new `isLoading`/spinner state. Evidence: `git diff src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` and re-read the two CR-005 effects (lines ~171–233) to confirm they are unchanged. (R1, R2, R6)
- [x] 3.7 Add a ref guard to prevent duplicate ERROR alerts when React StrictMode replays the opening effect. Add `const preloadErrorAlertSentRef = useRef(false);` near the other refs, reset it in the preload success path, and wrap the `addAlert` call in the catch with `if (!preloadErrorAlertSentRef.current)`. Evidence: `git diff src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` shows the ref declaration, the reset after the state setters, and the guarded alert; `yarn build` exits 0. (R2)

## Phase 4: Verification

No automated test runner, test files, or coverage command is configured (`strict_tdd: false`); no test infrastructure is added by this change. Verification combines diff inspection, the existing quality commands, and manual acceptance checks. Record each command and its exit status; do not claim tests passed.

- [x] 4.1 Diff inspection against all six requirements: walk the final `git diff` and confirm each requirement/scenario is satisfied exactly as specified, with no scope expansion. Evidence: the `git diff` output mapped requirement-by-requirement in the apply report. (R1–R6)
- [x] 4.2 Run `yarn tsc -b`. Report the exit status and separate pre-existing baseline type errors from any diagnostics in the five touched files. Baseline is recorded as failing on pre-existing errors; do not attribute those to this change. (R3, R5)
- [x] 4.3 Run `yarn lint`. Report the exit status and separate pre-existing failures from new ones in the touched files. (R3, R5)
- [x] 4.4 Run `yarn build`. Report the exit status. If it fails, capture the exact error and determine whether it is pre-existing or introduced. Re-run after task 3.7; report the new exit status. (all)
- [ ] 4.5 Manual acceptance checks (user-reported manual evidence, NOT automated proof):
  - Create mode: open the Producto form; confirm Marca, Línea, and Presentación option lists load (single `Promise.all`), and CR-005 Denominación automática still suggests in create mode. (R1, R6)
  - Edit mode with `sistema === 0`: open an existing Producto; confirm alternatives are selectable without pressing Enter and the existing values remain applied. (R1)
  - Edit mode with `sistema > 0`: confirm all three selectors remain disabled after preload. (R1)
  - Failure: force a preload rejection; confirm exactly one `TipoAlerta.ERROR` alert renders and edit values still populate. (R2)
  - Empty state: return empty option lists; confirm `No hay Marcas disponibles.`, `No hay Líneas disponibles.`, `No hay Presentaciones disponibles.` render inline in each Select. (R3)
  - Precedence: confirm an empty Presentación preload shows only the inline message; a zero-result Enter search shows only the existing WARNING; a successful Enter search shows options and no zero-result message. (R4)
  - Non-regression: confirm an inactive current selection stays visible via the `?? selected` fallback and no `isLoading`/spinner appears. (R5, R6)
- [x] 4.6 Contract non-change: confirm no endpoint, DTO, service, interface (other than the additive optional selector props), payload, or Producto submission-contract change, and no new dependency. Evidence: `git status` / `git diff --stat` showing only the five intended files plus `openspec/` artifacts. (R6)

## Phase 5: Cleanup (if needed)

- [x] 5.1 Remove any temporary debugging statements introduced during apply (e.g. ad-hoc `console.log`), keeping pre-existing logs untouched. Evidence: `git diff` inspection. (all)
- [x] 5.2 Mark completed tasks in this file and record the verification evidence from Phase 4 in the apply report. (all)
