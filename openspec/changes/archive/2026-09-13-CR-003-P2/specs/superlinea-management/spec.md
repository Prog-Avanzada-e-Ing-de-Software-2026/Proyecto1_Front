# Especificación de gestión de SuperLínea

## Propósito

Define la consulta y el mantenimiento autenticados e independientes de SuperLínea, alineados exclusivamente con el contrato OpenAPI.

## Requisitos

### Requisito: Gestionar SuperLíneas

El sistema DEBE proporcionar a los usuarios autorizados búsqueda paginada, detalle, alta, actualización, eliminación y consulta de auditoría mediante los endpoints documentados de SuperLínea. DEBE mostrar errores de API normalizados y NO DEBE exponer impresión ni restauración.

#### Escenario: Buscar y paginar
- DADO un usuario autorizado que introduce un filtro opcional de denominación
- CUANDO solicita una página
- ENTONCES el sistema DEBE enviar `denominacion`, `skip`, `take` e `incluirEliminados` únicamente según el contrato y mostrar `data` y `total`

#### Escenario: Alta y actualización válidas
- DADO una denominación válida y el identificador autenticado del usuario
- CUANDO el usuario guarda una SuperLínea o la actualiza con `usuarioUpdatedId`
- ENTONCES el sistema DEBE llamar al endpoint documentado y mostrar el mensaje recibido

#### Escenario: Validación y fallo de API
- DADO información inválida o una respuesta 400, 401, 403, 404 o 409
- CUANDO se envía la operación
- ENTONCES el sistema DEBE bloquear el envío inválido o mostrar el error de API normalizado sin afirmar semántica no documentada

### Requisito: Registros protegidos y dependientes

El sistema DEBE comunicar que una SuperLínea protegida no puede modificarse ni eliminarse cuando la API devuelve 403, y que la eliminación no puede continuar cuando devuelve 409 porque existen Líneas activas asociadas. DEBE gestionar registros o usuarios inexistentes ante 404.

#### Escenario: Registro protegido
- DADO que la eliminación o actualización devuelve 403
- CUANDO se recibe la respuesta
- ENTONCES el sistema DEBE conservar la vista del registro y mostrar el error de autorización normalizado

#### Escenario: Dependencia de Líneas activas
- DADO que la eliminación devuelve 409
- CUANDO se recibe la respuesta
- ENTONCES el sistema DEBE mantener disponible la SuperLínea y mostrar que las Líneas activas impiden la operación

### Requisito: Navegación y permisos

El sistema DEBE exponer SuperLínea en la misma ubicación de navegación funcional y con un comportamiento equivalente de visibilidad y permisos que Línea.

#### Escenario: Navegación autorizada
- DADO un usuario que puede ver Línea
- CUANDO abre la gestión de productos
- ENTONCES SuperLínea DEBE estar visible y ser navegable junto a Línea

#### Escenario: Navegación no autorizada
- DADO un usuario que no puede ver Línea
- CUANDO se evalúan el menú y la ruta protegida
- ENTONCES SuperLínea DEBE ocultarse o denegarse de forma equivalente

## Deuda técnica (no normativa)

Queda diferido para una iteración posterior el comportamiento que deshabilita el botón independiente «Actualizar» cuando no se modifican los campos de SuperLínea. Esta decisión no modifica los requisitos de alta, actualización válida, errores de API ni asociación Línea–SuperLínea.
