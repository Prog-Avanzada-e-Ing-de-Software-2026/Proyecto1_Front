# SuperLínea Creation Specification

## Purpose

Define nested SuperLínea registration available only from Línea creation.

## Requirements

### Requirement: Create SuperLínea from Línea creation

The system MUST preserve nested creation from Línea with required `denominacion` and optional `observacion`, and MUST additionally permit standalone creation through `POST /api/superlinea` with `usuarioCreatedId`. It MUST normalize API errors without assuming undocumented response shapes. A 400 response containing `fieldErrors[]` MUST be mapped to the corresponding form fields; unmapped and global errors MUST be shown as safe accessible root errors.
(Previously: Creation normalized API errors without requiring field-level mapping or an accessible global fallback.)

#### Scenario: Valid nested or standalone creation
- **GIVEN** the user submits a non-empty denomination and authenticated creator identifier
- **WHEN** creation is submitted from either entry point
- **THEN** the documented endpoint MUST be called and success feedback MUST be shown

#### Scenario: Required denomination boundary
- **GIVEN** the creation form is open
- **WHEN** the user submits without a denomination or beyond the documented 255-character maximum
- **THEN** submission MUST be blocked and the invalid field MUST be identified

#### Scenario: API failures
- **GIVEN** creation returns 400, 401, 403, or 409
- **WHEN** the response is received
- **THEN** field messages MUST be associated with their recognized fields, and unmapped or global errors MUST be displayed as an accessible root error while the form remains available

#### Scenario: Cancellation preserves parent state
- **GIVEN** the nested form is open over a Línea form with values
- **WHEN** the user confirms cancellation
- **THEN** the nested form MUST close without submitting and Línea values MUST remain unchanged

### Requirement: Refresh options without automatic selection

After successful nested creation, the system MUST refresh active options and MUST NOT assign the new option automatically.
(Previously: This behavior applied to the nested create-only flow.)

#### Scenario: Successful refresh
- **GIVEN** a nested SuperLínea was created successfully
- **WHEN** the nested flow completes
- **THEN** options MUST refresh and `superLineaId` MUST remain unselected until explicit selection
