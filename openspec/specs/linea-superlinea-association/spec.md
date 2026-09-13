# Línea–SuperLínea Association Specification

## Purpose

Require an active SuperLínea association when creating a Línea from Producto.

## Requirements

### Requirement: Select an active SuperLínea for Línea creation

In Línea create mode, the system MUST load active options from `/api/superlinea/select`, require `superLineaId`, and preserve the existing creation flow. In edit mode, it MUST initialize the current association and send `superLineaId` only when the user changes it; omission MUST preserve the association. The frontend MUST NOT invent active filtering.
(Previously: SuperLínea selection was required only during Línea creation and edit behavior was explicitly excluded.)

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

### Requirement: Preserve nested Línea flow and parent state

The SuperLínea selector and nested `+` action MUST remain within the existing Producto → Línea creation flow.
(Previously: The selector and nested action were confined to the creation flow.)

#### Scenario: Parent state and cancellation
- GIVEN Producto and Línea forms contain values
- WHEN the nested flow is opened and cancelled
- THEN both parent forms MUST preserve values and confirmation behavior

#### Scenario: Línea success feedback and refresh
- GIVEN a Línea is created with `superLineaId`
- WHEN the backend confirms creation
- THEN success feedback MUST appear and options MUST refresh without changing navigation or auto-selecting

### Requirement: Association errors are actionable

The system MUST display a normalized actionable API error when loading or updating the association fails.

#### Scenario: Loading failure
- GIVEN the select request fails
- WHEN edit or create attempts to load options
- THEN submission MUST remain blocked without a valid option and the error MUST be shown

