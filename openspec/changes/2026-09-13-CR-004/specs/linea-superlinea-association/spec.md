# Delta for Línea–SuperLínea Association

## MODIFIED Requirements

### Requirement: Select an active SuperLínea for Línea creation

In Línea create mode, the system MUST load active options from `/api/superlinea/select`, consume that endpoint's `SelectOption[]` shape (`codigo`/`nombre`/`descripcion`), resolve the selector value from `codigo`, require `superLineaId`, and preserve the existing creation flow. In edit mode, it MUST initialize the current association and send `superLineaId` only when the user changes it; omission MUST preserve the association. The frontend MUST NOT invent active filtering.
(Previously: SuperLínea selection was required only during Línea creation and edit behavior was explicitly excluded.)
(CR-004 — Previously: the selector consumed a paginated `{ data, total }` envelope; it MUST now consume the `SelectOption[]` shape.)

#### Scenario: Required selection and payload

- GIVEN the selector has available active options
- WHEN the user selects one and submits a valid Línea
- THEN the system MUST submit its identifier as `superLineaId` and preserve existing fields and success flow

#### Scenario: Missing selection or empty catalog

- GIVEN no valid option is selected, or the select endpoint returns no options
- WHEN the user submits or views creation
- THEN the system MUST identify the required association, explain that a SuperLínea must be registered first, and MUST NOT send the request

#### Scenario: Edit unchanged association

- GIVEN edit mode displays the Línea's current SuperLínea
- WHEN the user saves without changing it
- THEN the system MUST omit `superLineaId` and the backend-preserved association MUST remain unchanged

#### Scenario: Edit reassignment and failures

- GIVEN the user selects another active SuperLínea
- WHEN the update succeeds, or returns 403 or 404
- THEN the system MUST send the new identifier only on change and show success, protected-record, or missing-association error respectively

#### Scenario: Options resolve after the shape change

- GIVEN a Línea is being created or edited
- WHEN `/api/superlinea/select` returns a `SelectOption[]`
- THEN the selector MUST resolve the options from `codigo`/`nombre` without error and a `SuperLínea` MUST still be selectable and submittable
