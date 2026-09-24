# Especificación de gestión de SuperLínea

## Propósito

Define la consulta y el mantenimiento autenticados e independientes de SuperLínea, alineados exclusivamente con el contrato OpenAPI.

## Requisitos

### Requirement: Gestionar SuperLíneas

El sistema DEBE proporcionar a los usuarios autorizados búsqueda paginada, detalle, alta, actualización, eliminación y consulta de auditoría mediante los endpoints documentados de SuperLínea. DEBE mostrar errores de API normalizados y NO DEBE exponer impresión ni restauración. Las respuestas 400 con `fieldErrors[]` DEBEN asociar cada mensaje al campo correspondiente; los errores sin campo identificable y los estados 400 sin detalle de campo, 401, 403, 404, 409 y 500 DEBEN mostrarse como error global accesible.
(Previously: Los errores de API se mostraban normalizados, sin exigir asociación de errores por campo ni presentación global accesible.)

#### Scenario: Buscar y paginar
- **Given** un usuario autorizado que introduce un filtro opcional de denominación
- **When** solicita una página
- **Then** el sistema MUST enviar `denominacion`, `skip`, `take` e `incluirEliminados` únicamente según el contrato y mostrar `data` y `total`

#### Scenario: Alta y actualización válidas
- **Given** una denominación válida y el identificador autenticado del usuario
- **When** el usuario guarda una SuperLínea o la actualiza con `usuarioUpdatedId`
- **Then** el sistema MUST llamar al endpoint documentado y mostrar el mensaje recibido

#### Scenario: Validación y fallo de API
- **Given** información inválida o una respuesta 400, 401, 403, 404 o 409
- **When** se envía la operación
- **Then** el sistema MUST bloquear el envío inválido o mostrar el error normalizado asociado al campo o como error global accesible, sin afirmar semántica no documentada

### Requirement: Registros protegidos y dependientes

El sistema DEBE comunicar que una SuperLínea protegida no puede modificarse ni eliminarse cuando la API devuelve 403, y que la eliminación no puede continuar cuando devuelve 409 porque existen Líneas activas asociadas. DEBE gestionar registros o usuarios inexistentes ante 404.

#### Scenario: Registro protegido
- **Given** que la eliminación o actualización devuelve 403
- **When** se recibe la respuesta
- **Then** el sistema DEBE conservar la vista del registro y mostrar el error de autorización normalizado

#### Scenario: Dependencia de Líneas activas
- **Given** que la eliminación devuelve 409
- **When** se recibe la respuesta
- **Then** el sistema DEBE mantener disponible la SuperLínea y mostrar que las Líneas activas impiden la operación

### Requirement: Navegación y permisos

El sistema DEBE exponer SuperLínea en la misma ubicación de navegación funcional y con un comportamiento equivalente de visibilidad y permisos que Línea.

#### Escenario: Navegación autorizada
- DADO un usuario que puede ver Línea
- CUANDO abre la gestión de productos
- ENTONCES SuperLínea DEBE estar visible y ser navegable junto a Línea

#### Escenario: Navegación no autorizada
- DADO un usuario que no puede ver Línea
- CUANDO se evalúan el menú y la ruta protegida
- ENTONCES SuperLínea DEBE ocultarse o denegarse de forma equivalente

### Requirement: Errores accesibles de SuperLínea

Los errores de campo y globales de los formularios de SuperLínea DEBEN estar vinculados semánticamente a sus controles y anunciarse mediante atributos ARIA sin cambiar la API pública de los componentes compartidos.

#### Scenario: Error de campo anunciado
- **Given** un campo de SuperLínea con error
- **When** se renderiza el formulario
- **Then** el control MUST exponer `aria-invalid` y `aria-describedby` hacia un mensaje con `role="alert"` o `aria-live`
## Deuda técnica (no normativa)

Queda diferido para una iteración posterior el comportamiento que deshabilita el botón independiente «Actualizar» cuando no se modifican los campos de SuperLínea. Esta decisión no modifica los requisitos de alta, actualización válida, errores de API ni asociación Línea–SuperLínea.
