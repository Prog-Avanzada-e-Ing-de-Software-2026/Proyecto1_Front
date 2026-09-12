# SuperLínea Management Specification

## Purpose

Define standalone authenticated SuperLínea consultation and maintenance, aligned exclusively with the OpenAPI contract.

## Requirements

### Requirement: Manage SuperLíneas

The system MUST provide permitted users with paginated search, detail, creation, update, deletion, and audit consultation through the documented SuperLínea endpoints. It MUST show normalized API errors and MUST NOT expose printing or restoration.

#### Scenario: Search and paginate
- GIVEN an authorized user enters an optional denomination filter
- WHEN the user requests a page
- THEN the system MUST send `denominacion`, `skip`, `take`, and `incluirEliminados` only as supported by the contract and show `data` and `total`

#### Scenario: Valid create and update
- GIVEN a valid denomination and authenticated user identifier
- WHEN the user saves a SuperLínea, or updates it with `usuarioUpdatedId`
- THEN the system MUST call the documented endpoint and show the returned message

#### Scenario: Validation and API failure
- GIVEN invalid data or a 400, 401, 403, 404, or 409 response
- WHEN the operation is submitted
- THEN the system MUST block invalid submission or display the normalized API error without claiming undocumented semantics

### Requirement: Protected and dependent records

The system MUST communicate that a protected SuperLínea cannot be modified or deleted when the API returns 403, and that deletion cannot proceed when the API returns 409 because active Líneas are associated. It MUST handle missing records or users on 404.

#### Scenario: Protected record
- GIVEN deletion or update returns 403
- WHEN the response is received
- THEN the system MUST preserve the record view and display the normalized authorization error

#### Scenario: Active Línea dependency
- GIVEN deletion returns 409
- WHEN the response is received
- THEN the system MUST keep the SuperLínea available and display that active Líneas prevent the operation

### Requirement: Navigation and permissions

The system MUST expose SuperLínea in the same functional navigation location and with equivalent visibility and permission behavior as Línea.

#### Scenario: Authorized navigation
- GIVEN a user who can see Línea
- WHEN the user opens product management
- THEN SuperLínea MUST be visible and navigable beside Línea

#### Scenario: Unauthorized navigation
- GIVEN a user who cannot see Línea
- WHEN the menu and protected route are evaluated
- THEN SuperLínea MUST be hidden or denied equivalently
