# producto-busqueda-parcial Specification

## Purpose

Enter-triggered partial-match search on `ConsultarProductos` with three mutually exclusive modes — `denominación`, selected `Línea`, selected `SuperLínea` — each listing active `Producto`s, 10 per page. Every Enter-triggered search gives visible feedback.

## Requirements

### Requirement: Partial-match semantics

Matching is containment anywhere in an entity's `denominación` (not only a prefix), case-insensitive but accent-sensitive, for `Producto`, `Línea`, and `SuperLínea`.

#### Scenario: Case-insensitive match

- GIVEN the term `"Harina"`
- WHEN the user searches
- THEN `"Harina"`, `"harina"`, and `"HARINA"` MUST all match

#### Scenario: Accent-sensitive boundary

- GIVEN the term `"cafe"`
- WHEN the user searches
- THEN `"Café"` MUST NOT match, and `"Café"` MUST NOT match `"cafe"`

#### Scenario: Containment not prefix

- GIVEN a denominación containing the term in its middle
- WHEN the user searches
- THEN it MUST match

### Requirement: Search by partial denominación

On Enter, list active `Producto`s whose `denominación` partially matches, 10 per page.

#### Scenario: Denominación results

- GIVEN a partial `denominación`
- WHEN the user presses Enter
- THEN active matching `Producto`s MUST be listed, 10 per page

### Requirement: Search by Línea selection

Search `Línea`s by partial `denominación`; on selection, list that `Línea`'s active `Producto`s, 10 per page.

#### Scenario: Select a Línea

- GIVEN a partial `Línea` `denominación`
- WHEN the user presses Enter and selects a `Línea`
- THEN its active `Producto`s MUST be listed, 10 per page

### Requirement: Search by SuperLínea selection

Search `SuperLínea`s by partial `denominación`; on selection, list the active `Producto`s of all its `Línea`s, 10 per page.

#### Scenario: Select a SuperLínea

- GIVEN a partial `SuperLínea` `denominación`
- WHEN the user presses Enter and selects a `SuperLínea`
- THEN the active `Producto`s of all its `Línea`s MUST be listed, 10 per page

### Requirement: Enter-only trigger

A search request MUST be issued only on Enter, never per keystroke.

#### Scenario: Typing does not search

- GIVEN the user types or deletes characters
- WHEN Enter is not pressed
- THEN no search request MUST be issued

#### Scenario: Enter searches once

- GIVEN a typed term
- WHEN the user presses Enter
- THEN exactly one search request MUST be issued

### Requirement: Mode exclusivity

Exactly one mode MUST drive results and pagination; switching MUST reset pagination and clear prior results.

#### Scenario: Mode switch resets

- GIVEN a mode shows results on a later page
- WHEN the user switches mode
- THEN pagination MUST reset and prior results MUST NOT remain

### Requirement: Pagination

Results MUST page 10 at a time, `total` MUST drive the page count, and a page past the last MUST be empty without error.

#### Scenario: Page count from total

- GIVEN 25 matching `Producto`s
- WHEN results are shown
- THEN page one MUST contain 10 items and the page count MUST be 3

#### Scenario: Beyond the last page

- GIVEN the last valid page is N
- WHEN a page past N is requested
- THEN an empty page MUST be shown without error

### Requirement: Active-only results

Soft-deleted `Producto`, `Línea`, or `SuperLínea` MUST NOT appear.

#### Scenario: Soft-deleted excluded

- GIVEN a soft-deleted `Producto` matches
- WHEN the user searches
- THEN it MUST NOT appear in the results

### Requirement: Empty or whitespace term

An empty or whitespace-only term MUST return an empty result set and MUST NOT trigger repeated requests.

#### Scenario: Whitespace-only term

- GIVEN an empty or whitespace-only term
- WHEN the user presses Enter
- THEN the result MUST be empty and no request storm MUST occur

### Requirement: Visible search feedback

Every Enter-triggered search MUST produce perceptible feedback via the app's standard transient auto-dismiss notification, without requiring user action to dismiss:

- A completed `denominación` search MUST report the number of matches found for the term, or an explicit no-results message naming the term.
- An Enter with an empty or whitespace-only term MUST show a hint that a term is required; no request is issued (per `Empty or whitespace term`).
- A `Línea` or `SuperLínea` option search MUST report the number of matching options found, or an explicit no-matches message.
- Failed requests MUST keep the behavior of `Search failure handling`.
- Feedback MUST NOT replace or clear the result list.

#### Scenario: Denominación matches reported

- GIVEN a term matching N active `Producto`s (N > 0)
- WHEN the `denominación` search completes
- THEN feedback MUST state the number of matches for the term and the results MUST be listed

#### Scenario: Denominación no matches reported

- GIVEN a term matching no active `Producto`
- WHEN the search completes
- THEN an explicit no-results message naming the term MUST be shown

#### Scenario: Blank term hint shown

- GIVEN an empty or whitespace-only term
- WHEN the user presses Enter
- THEN a hint that a term is required MUST be shown and no request MUST be issued

#### Scenario: Option search reported

- GIVEN a `Línea` or `SuperLínea` term
- WHEN the user presses Enter in the selector
- THEN feedback MUST state the number of matching options, or an explicit no-matches message

#### Scenario: Feedback never clears results

- GIVEN a result list is shown with its feedback
- WHEN the feedback auto-dismisses
- THEN the result list MUST remain unchanged and no dismissal action MUST have been required

### Requirement: Search failure handling

A failed request or expired authentication MUST surface an error and MUST NOT corrupt list state.

#### Scenario: Request failure

- GIVEN a request fails or the token is expired
- WHEN the response is handled
- THEN an error MUST be shown and list state MUST remain intact

### Requirement: Role-restricted search modes

Each mode MUST be offered only to the roles its own endpoint permits. The denominación endpoint permits `Root`, `Administrador`, `Empleado`, `Vendedor`, `Repositor`, `Repartidor`; the Línea and SuperLínea endpoints permit only `Root`, `Administrador`, `Empleado`. A role not permitted for a mode MUST NOT be offered it and MUST NOT issue that mode's request, so no 403 occurs. A role permitted by neither kind of endpoint MUST NOT be offered any search mode.

#### Scenario: Role permitted by both kinds

- GIVEN a user whose role is `Root`, `Administrador`, or `Empleado`
- WHEN the page is available
- THEN the denominación, Línea, and SuperLínea modes MUST all be offered

#### Scenario: Denominación-only role

- GIVEN a user whose role is `Vendedor`, `Repositor`, or `Repartidor`
- WHEN the page is available or the user searches
- THEN only the denominación mode MUST be offered and no selection request MUST be issued

#### Scenario: Role permitted by neither

- GIVEN a user whose role is `Cobrador`
- WHEN the page is available or the user searches
- THEN no search mode MUST be offered and no search request MUST be issued

#### Scenario: Offered modes work

- GIVEN a user whose role is permitted for an offered mode
- WHEN the user searches with that mode
- THEN matching active `Producto`s MUST be listed, 10 per page
