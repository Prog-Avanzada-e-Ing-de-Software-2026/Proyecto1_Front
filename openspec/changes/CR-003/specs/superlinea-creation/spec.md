# SuperLínea Creation Specification

## Purpose

Define nested SuperLínea registration available only from Línea creation.

## Requirements

### Requirement: Create SuperLínea from Línea creation

The system MUST provide a nested creation flow with required `denominacion` and optional `observacion`, using the documented SuperLínea create contract and existing API-error parsing tolerance.

#### Scenario: Valid SuperLínea creation

- GIVEN the user is creating a Línea and opens the adjacent `+` action
- WHEN the user submits a non-empty denomination with an optional observation
- THEN the system MUST create the SuperLínea through the documented endpoint
- AND MUST show success feedback in established Spanish domain language

#### Scenario: Required denomination validation

- GIVEN the nested SuperLínea form is open
- WHEN the user submits without a denomination
- THEN the system MUST block submission and identify `denominacion` as required

#### Scenario: Duplicate denomination delegated to backend

- GIVEN the backend rejects a duplicate denomination
- WHEN the nested creation request fails
- THEN the system MUST display the normalized backend error to the user
- AND MUST NOT assume an undocumented status, error code, or response-body shape

#### Scenario: Cancellation preserves parent state

- GIVEN the Línea form contains entered values and the nested SuperLínea form is open
- WHEN the user cancels and confirms cancellation
- THEN the nested form MUST close without submitting
- AND the Línea form values MUST remain unchanged

#### Scenario: Nested API failure

- GIVEN the SuperLínea creation request fails for any other tolerated API error
- WHEN the error is received
- THEN the system MUST display the normalized error and keep both the parent form and nested flow available

### Requirement: Refresh options without automatic selection

After successful creation, the system MUST refresh the available SuperLínea options and MUST NOT automatically assign the new option to the Línea form.

#### Scenario: Successful refresh

- GIVEN a SuperLínea was created successfully
- WHEN the nested flow completes
- THEN the system MUST refresh the selector options
- AND MUST leave `superLineaId` unselected until the user explicitly selects an option

### Requirement: Create-only isolation

The system MUST NOT add or alter SuperLínea edit, delete, consultation, or standalone management behavior, and MUST NOT change Línea edit behavior.

#### Scenario: Existing edit flow is unchanged

- GIVEN the user opens Línea edit mode
- WHEN the edit form is rendered or submitted
- THEN CR-003 create-only SuperLínea behavior MUST NOT be applied
