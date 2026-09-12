# Delta for SuperLínea Creation

## MODIFIED Requirements

### Requirement: Create SuperLínea from Línea creation or standalone management

The system MUST preserve nested creation from Línea with required `denominacion` and optional `observacion`, and MUST additionally permit standalone creation through `POST /api/superlinea` with `usuarioCreatedId`. It MUST normalize API errors without assuming undocumented response shapes.
(Previously: Creation was available only through the nested Línea flow.)

#### Scenario: Valid nested or standalone creation
- GIVEN the user submits a non-empty denomination and authenticated creator identifier
- WHEN creation is submitted from either entry point
- THEN the documented endpoint MUST be called and success feedback MUST be shown

#### Scenario: Required denomination boundary
- GIVEN the creation form is open
- WHEN the user submits without a denomination or beyond the documented 255-character maximum
- THEN submission MUST be blocked and the invalid field MUST be identified

#### Scenario: API failures
- GIVEN creation returns 400, 401, 403, or 409
- WHEN the response is received
- THEN the normalized error MUST be displayed and the form MUST remain available

#### Scenario: Cancellation preserves parent state
- GIVEN the nested form is open over a Línea form with values
- WHEN the user confirms cancellation
- THEN the nested form MUST close without submitting and Línea values MUST remain unchanged

### Requirement: Refresh options without automatic selection

After successful nested creation, the system MUST refresh active options and MUST NOT assign the new option automatically.
(Previously: This behavior applied to the nested create-only flow.)

#### Scenario: Successful refresh
- GIVEN a nested SuperLínea was created successfully
- WHEN the nested flow completes
- THEN options MUST refresh and `superLineaId` MUST remain unselected until explicit selection

## REMOVED Requirements

### Requirement: Create-only isolation
(Reason: Standalone management is now in scope.)
(Migration: Use the standalone management capability; nested creation remains supported.)
