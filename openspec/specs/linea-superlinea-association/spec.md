# Línea–SuperLínea Association Specification

## Purpose

Require an active SuperLínea association when creating a Línea from Producto.

## Requirements

### Requirement: Select an active SuperLínea for Línea creation

In Línea create mode, the system MUST load options from the documented `/api/superlinea/select` contract, present the returned active options, and require the selected option's identifier as `superLineaId`. The frontend MUST NOT invent additional client-side active filtering beyond that endpoint contract.

#### Scenario: Required selection and payload

- GIVEN the selector has available active options
- WHEN the user selects one and submits a valid Línea
- THEN the system MUST submit its identifier as `superLineaId`
- AND MUST preserve the existing Línea creation fields and success flow

#### Scenario: Missing selection blocks submission

- GIVEN the Línea creation form has no selected SuperLínea
- WHEN the user attempts to submit
- THEN the system MUST block submission and identify the SuperLínea association as required
- AND MUST NOT send a Línea creation request

#### Scenario: Empty catalog

- GIVEN the select endpoint returns no available options
- WHEN the Línea creation form is displayed
- THEN the system MUST explain in established Spanish domain language that primero debe registrarse una SuperLínea
- AND MUST block Línea submission until a valid option is available

#### Scenario: Catalog loading error

- GIVEN the SuperLínea options request fails
- WHEN the Línea creation form attempts to load options
- THEN the system MUST display a normalized actionable API error
- AND MUST keep Línea submission blocked while no valid option is selected

### Requirement: Preserve nested Línea flow and parent state

The SuperLínea selector and nested `+` action MUST remain within the existing Producto → Línea creation flow.

#### Scenario: Parent state and cancellation

- GIVEN the Producto form and Línea create form contain entered values
- WHEN the user opens and cancels the nested SuperLínea flow
- THEN both parent forms MUST preserve their entered state
- AND existing confirmation behavior MUST remain available

#### Scenario: Línea success feedback and refresh

- GIVEN a Línea is created with a selected `superLineaId`
- WHEN the backend confirms creation
- THEN the existing success feedback MUST be shown
- AND the parent Línea options MUST refresh without changing Producto navigation or auto-selecting a newly created item

### Requirement: Create-only isolation

CR-003 MUST NOT modify Línea edit behavior or introduce broader SuperLínea CRUD or management entry points.

#### Scenario: Edit remains outside scope

- GIVEN a user edits an existing Línea
- WHEN the edit form is used
- THEN no CR-003 SuperLínea selection requirement MUST be introduced
