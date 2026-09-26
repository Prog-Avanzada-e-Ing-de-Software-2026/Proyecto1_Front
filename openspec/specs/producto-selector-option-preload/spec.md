# Producto Selector Option Preload Specification

## Purpose

Define the option availability and empty-state behavior for Marca, Línea, and Presentación selectors when opening a Producto form in create or edit mode, while preserving existing Producto value preload, selector permissions, Denominación automática, and submission contracts.

## Requirements

### Requirement: Preload selector options when opening the Producto form

The Producto form MUST load active Marca, Línea, and Presentación option lists whenever it opens, regardless of whether it is in create mode or edit mode. The three loads MUST be initiated together through one `Promise.all`, using an empty `denominacion` filter. The resulting `data` collections MUST populate the corresponding option lists.

#### Scenario: Create mode preloads all selector options

- GIVEN the Producto form is opened without an existing Producto
- WHEN the opening preload runs
- THEN Marca options are requested with `denominacion` equal to `""`
- AND Línea options are requested with `denominacion` equal to `""`
- AND Presentación options are requested with `denominacion` equal to `""`
- AND all three requests are part of the same `Promise.all`
- AND each selector receives the returned `data` collection

#### Scenario: Edit mode preloads all selector options

- GIVEN the Producto form is opened with an existing Producto
- WHEN the opening preload runs
- THEN active Marca, Línea, and Presentación options are loaded through the same three-request `Promise.all`
- AND the existing `setValue` and `setSelected` calls for the Producto's Marca, Línea, and Presentación remain applied
- AND the existing Producto values are not replaced merely because the active option lists have loaded

#### Scenario: Preloaded options make an editable Producto selectable without Enter

- GIVEN an existing Producto has `sistema === 0`
- AND the preload returned at least one alternative Marca, Línea, or Presentación
- WHEN the user opens the corresponding selector and chooses an alternative option
- THEN the selected value changes without the user first pressing Enter
- AND the form's corresponding field value is updated for normal Producto submission

#### Scenario: System Producto selectors remain disabled

- GIVEN an existing Producto has `sistema > 0`
- WHEN the Producto form finishes preloading its selector options
- THEN the Marca, Línea, and Presentación selectors remain disabled
- AND preloading options MUST NOT enable reassignment for that Producto

### Requirement: Report opening preload failures through the existing alert mechanism

If any opening preload request fails, the Producto form MUST surface exactly one user-facing alert per opening preload attempt through `useAlerts()` with `TipoAlerta.ERROR`. Logging the error MAY also occur, but console logging alone MUST NOT satisfy this requirement. Partial-success semantics are not part of this capability: the form MUST NOT promise that successful responses are independently applied after a failure in the combined preload.

#### Scenario: A failed preload shows an error alert

- GIVEN the Producto form is opening in create or edit mode
- WHEN any Marca, Línea, or Presentación preload request rejects
- THEN the existing alert mechanism receives exactly one alert whose type is `TipoAlerta.ERROR`
- AND the alert is available to the user through the application's existing alert rendering
- AND the behavior does not rely only on `console.error`

#### Scenario: StrictMode double-invocation does not duplicate the alert

- GIVEN the opening effect is invoked twice for the same attempt (for example, React `StrictMode` in development)
- WHEN both invocations of the preload fail
- THEN exactly one `TipoAlerta.ERROR` alert is present in the alert list
- AND no second identical error alert is appended

#### Scenario: Preload failure does not introduce partial-success behavior

- GIVEN one preload request fails while another request resolves
- WHEN the combined opening preload completes
- THEN the capability does not require or expose a contract that partially applies the successful response
- AND the user still receives the `TipoAlerta.ERROR` alert for the failed preload

### Requirement: Show localized empty states without changing unrelated selector defaults

When a preloaded Marca, Línea, or Presentación option list is empty, its Producto selector MUST show a clear Spanish inline empty-state message. The shared `EntidadSelectorBase` MUST accept this message as an optional prop, and consumers that omit the prop MUST retain React Select's current default empty-state behavior.

#### Scenario: Empty preloaded lists show Spanish messages

- GIVEN the opening preload completes with an empty Marca list
- AND the opening preload completes with an empty Línea list
- AND the opening preload completes with an empty Presentación list
- WHEN the three Producto selectors render with no options
- THEN Marca shows the inline message `No hay Marcas disponibles.`
- AND Línea shows the inline message `No hay Líneas disponibles.`
- AND Presentación shows the inline message `No hay Presentaciones disponibles.`
- AND the messages are presented inside the selector empty state rather than as an unrelated global alert

#### Scenario: Omitted optional empty-message prop preserves existing behavior

- GIVEN a consumer uses `EntidadSelectorBase` without providing the optional empty-message prop
- WHEN its options list is empty
- THEN React Select's current default empty-state message is used
- AND that consumer's selector behavior is otherwise unchanged

### Requirement: Preserve Presentación search warning precedence

The existing Presentación explicit-Enter search behavior MUST remain unchanged. Its zero-result `WARNING` alert MUST remain the authoritative message for that search and MUST NOT be displayed simultaneously with the custom Presentación inline empty-state message. The inline message represents the opening-preload/render state; an explicit Presentación Enter search transitions the selector to search-result state.

#### Scenario: Opening with no Presentaciones uses the inline empty state

- GIVEN the opening preload returns `total === 0` for Presentación
- AND the user has not initiated an explicit Presentación search with Enter
- WHEN the Presentación selector renders
- THEN it shows `No hay Presentaciones disponibles.` inline
- AND the existing zero-result `WARNING` alert is not emitted solely because the opening preload is empty

#### Scenario: Zero-result Enter search replaces the inline empty message

- GIVEN the Presentación selector is showing the opening inline empty message
- WHEN the user presses Enter to search Presentación and that search returns `total === 0`
- THEN the existing Presentación `WARNING` alert is emitted with its current message and behavior
- AND the custom Presentación inline empty-state message is suppressed for that search-result state
- AND both messages are not shown simultaneously

#### Scenario: Enter search with results clears the empty state

- GIVEN the Presentación selector is showing either the opening inline empty message or a prior zero-result search state
- WHEN the user presses Enter to search Presentación and the search returns one or more options
- THEN the returned options are displayed
- AND the custom empty-state message is not displayed
- AND the zero-result `WARNING` is not emitted for that successful search

### Requirement: Preserve inactive current selections

The Producto selectors MUST preserve visibility of an inactive or absent current Marca, Línea, or Presentación through the existing `options.find(...) ?? selected` fallback. Preloading active options MUST NOT clear or hide the selected value solely because its identifier is absent from the active list.

#### Scenario: An inactive current selection remains visible in edit mode

- GIVEN an editable existing Producto has a current Marca, Línea, or Presentación
- AND that current selection is absent from the corresponding active preloaded option list
- WHEN the selector renders after preload
- THEN the current selection remains visible as the selected value through the `?? selected` fallback
- AND the active options remain available for reassignment

### Requirement: Preserve Denominación automática and loading boundaries

CR-005 Denominación automática MUST remain unchanged in create mode and MUST continue to return early in edit mode. This capability MUST NOT introduce an `isLoading` state, spinner, or other loading indicator. It MUST NOT change any endpoint, DTO, service, interface, or Producto submission contract.

#### Scenario: Create mode keeps Denominación automática behavior

- GIVEN the Producto form is in create mode
- AND Marca, Línea, and Presentación options are preloaded
- WHEN the existing CR-005 conditions for Denominación automática are met
- THEN the existing automatic Denominación suggestion behavior remains unchanged

#### Scenario: Edit mode keeps the Denominación automática early return

- GIVEN the Producto form is opened with an existing Producto
- WHEN selector options are preloaded or changed
- THEN the CR-005 effect continues to return early for edit mode
- AND the existing Producto Denominación is not replaced by an automatic suggestion

#### Scenario: No loading indicator or contract change is introduced

- GIVEN the Producto form opens in either create or edit mode
- WHEN the three selector preloads execute
- THEN no `isLoading` state, spinner, or other loading indicator is required or rendered by this capability
- AND no endpoint, DTO, service, interface, or Producto submission-contract behavior changes
