# Capability: validacion-errores-gestion-producto

## Purpose

Definir validaciones frontend alineadas con el contrato HTTP y una presentación segura, accesible y asociada de errores en los flujos activos de `gestion-producto`.

## Requirements

### Requirement: Mapeo de errores HTTP

Ante una respuesta HTTP 400 cuyo cuerpo contiene `fieldErrors[]`, el sistema MUST aplicar cada entrada `messages` al campo correspondiente mediante el mecanismo de error del formulario. MUST NOT reemplazar esos mensajes por el literal global `Bad Request Exception`. Los nombres de campo no reconocidos MUST degradar a un error global sin perder el mensaje. Las respuestas 400 sin `fieldErrors`, errores de dominio 400, 401, 403, 404, 409, 500 y fallos de red MUST presentarse como un error global seguro y accesible.

#### Escenario: Errores por campo
- **Given** una respuesta 400 con varias entradas `fieldErrors[]` cuyos campos pertenecen al formulario
- **When** el formulario procesa la respuesta
- **Then** cada mensaje MUST mostrarse en su campo correspondiente y MUST NOT mostrarse como `Bad Request Exception` global

#### Escenario: Campo no reconocido
- **Given** una entrada `fieldErrors[]` con un nombre que no pertenece al formulario
- **When** se procesa la respuesta
- **Then** el mensaje MUST mostrarse como error global sin perder su contenido

#### Escenario: Fallback global
- **Given** una respuesta 400 sin `fieldErrors`, un error de dominio, un estado 401, 403, 404, 409 o 500, o un fallo de red
- **When** el formulario recibe el error
- **Then** MUST mostrar un error global seguro, accesible y no dependiente de detalles internos

### Requirement: Validación de identificadores y números

Los identificadores `marcaId` y `lineaId` MUST ser enteros mayores que cero y pertenecer al catálogo. Un selector limpiado MUST NOT persistir `0` como valor válido. `presentacionId` y `superLineaId` MUST conservar sus validaciones existentes de entero positivo. Producto MUST validar `costo` finito y mayor o igual a cero, `stock` y `stockMinimo` finitos y mayores que cero, margen/porcentaje finito y `cantidadPorPack` como entero positivo cuando corresponda. Línea MUST validar `stockMinimo` finito y mayor o igual a cero. Los valores no finitos MUST rechazarse.

#### Escenario: Identificador inválido
- **Given** un formulario con `marcaId` o `lineaId` igual a cero, negativo, no entero o fuera del catálogo
- **When** el usuario intenta enviarlo
- **Then** el campo MUST identificarse como inválido y el request MUST bloquearse

#### Escenario: Selector limpiado
- **Given** un selector de Marca o Línea que el usuario limpia
- **When** se valida el formulario
- **Then** el valor vacío MUST NOT convertirse en `0` válido

#### Escenario: Número no finito o fuera de límite
- **Given** un campo numérico con `NaN`, infinito o un valor menor que su límite contractual
- **When** se valida el formulario
- **Then** el campo MUST rechazarse y el envío MUST bloquearse

### Requirement: Validación de denominaciones

Producto MUST recortar espacios, limitar `denominacion` a 200 caracteres y aplicar únicamente los caracteres declarados por su patrón contractual, corrigiendo el rango accidental `%-_`. El valor almacenado MUST conservar sus mayúsculas y minúsculas. Marca, Línea, SuperLínea y Presentación MUST mostrar mensajes coherentes con sus patrones; Presentación MUST permitir `.`, `-` y `/`. Ninguna denominación MUST transformarse silenciosamente a minúsculas.

#### Escenario: Denominación de Producto válida
- **Given** una denominación de Producto de hasta 200 caracteres con caracteres permitidos
- **When** se valida y se guarda
- **Then** se recortan sus espacios permitidos y se conserva el casing ingresado

#### Escenario: Denominación fuera de contrato
- **Given** una denominación mayor a 200 caracteres o con un carácter no permitido por su patrón
- **When** el usuario intenta enviarla
- **Then** el campo MUST mostrar un mensaje coherente y el envío MUST bloquearse

#### Escenario: Caracteres de Presentación
- **Given** una Presentación que contiene `.`, `-` o `/`
- **When** se valida
- **Then** esos caracteres MUST aceptarse y el valor MUST conservar su casing

### Requirement: Stock en alta de Producto

El alta de Producto MUST renderizar y validar `stock` como número finito mayor que cero, e incluirlo en el payload de creación. En edición, `stock` MUST permanecer visible, de solo lectura y deshabilitado.

#### Escenario: Alta con stock válido
- **Given** el formulario de creación con un `stock` finito mayor que cero
- **When** se envía un Producto válido
- **Then** el payload MUST incluir `stock` y la creación MUST continuar

#### Escenario: Alta sin stock válido
- **Given** el formulario de creación con `stock` vacío, no finito o menor o igual que cero
- **When** se intenta enviar
- **Then** el campo MUST identificarse como inválido y no MUST enviarse el request

#### Escenario: Stock en edición
- **Given** un Producto existente en modo edición
- **When** se muestra el formulario
- **Then** `stock` MUST ser visible, de solo lectura y deshabilitado

### Requirement: Configuración de cotización

Cuando falta `maximoDolar` en la configuración IVECO/NEXPRO, el sistema MUST mostrar claramente que la configuración no está disponible y MUST bloquear el envío. Este requisito no define el piso numérico de la cotización.

#### Escenario: Configuración ausente
- **Given** un flujo IVECO o NEXPRO sin `maximoDolar`
- **When** el usuario intenta enviar una cotización
- **Then** el formulario MUST mostrar el estado de configuración no disponible y MUST bloquear el envío sin convertir la ausencia en `0`

### Requirement: Presentación accesible de errores

`FormInput`, `PriceInput`, `CantidadesInput`, `PorcentajeInput` y `EntidadSelectorBase` MUST exponer `aria-invalid` y `aria-describedby` vinculados a un identificador estable del mensaje. Los mensajes MUST usar `role="alert"` o `aria-live`, permanecer asociados al campo y no requerir cambios en la API pública. Cuando sea posible, un envío fallido MUST enfocar el primer campo inválido.

#### Escenario: Error asociado al campo
- **Given** un campo con un error de validación
- **When** el componente se renderiza
- **Then** MUST exponer `aria-invalid`, `aria-describedby` y un mensaje estable anunciado por tecnología asistiva

#### Escenario: Primer campo inválido
- **Given** un envío fallido con varios campos inválidos
- **When** el formulario termina la validación
- **Then** SHOULD enfocar el primer campo inválido sin modificar la API pública de los componentes

### Requirement: Normalización de campos opcionales

Los campos de texto opcionales del contrato (`observacion`, `codigoProveedor`, `codigoReferencia`, etc.) MUST omitirse del cuerpo del request cuando su valor sea `null`, vacío o contenga únicamente espacios. El sistema MUST NOT enviar `null` para un campo que OpenAPI declare opcional de tipo `string`. La omisión ya existente en Línea y SuperLínea MUST conservarse sin regresiones. El campo `stockMinimo` MUST ser obligatorio, finito y mayor que 0 en el alta y la edición de Producto, y MUST enviarse en el request con independencia de `utilizaStockMinimo`. El campo `cantidadPorPack` MUST omitirse del cuerpo del request cuando `utilizaPack` esté en `false`, y el sistema MUST NOT enviar `0` como sustituto.

#### Escenario: Edición con observación vacía
- **Given** una edición de Marca, Presentación o Producto con `observacion` `null`, vacía o con solo espacios
- **When** el formulario construye el payload
- **Then** la clave `observacion` MUST omitirse del cuerpo del request y MUST NOT enviarse como `null`

#### Escenario: Observación no vacía recortada
- **Given** una edición con `observacion` con espacios alrededor de un texto no vacío
- **When** el formulario construye el payload
- **Then** MUST enviar `observacion` con el valor recortado (`trim`) y MUST conservar el texto ingresado

#### Escenario: Línea y SuperLínea preservan la omisión
- **Given** una edición de Línea o SuperLínea con `observacion` `null`, vacía o con solo espacios
- **When** el formulario construye el payload
- **Then** la clave `observacion` MUST seguir omitiéndose del cuerpo del request sin cambios respecto del comportamiento vigente

#### Escenario: Stock mínimo obligatorio con independencia de la bandera
- **Given** el alta o la edición de un Producto con `utilizaStockMinimo` en `false`
- **When** el formulario valida y construye el payload
- **Then** `stockMinimo` MUST ser requerido y finito mayor que 0, el campo MUST permanecer editable, y la clave MUST enviarse en el request

#### Escenario: Pack desmarcado
- **Given** el alta o la edición de un Producto con `utilizaPack` en `false`
- **When** el formulario construye el payload
- **Then** la clave `cantidadPorPack` MUST omitirse del cuerpo del request y MUST NOT enviarse como `0`

#### Escenario: Pack usado
- **Given** el alta o la edición de un Producto con `utilizaPack` en `true`
- **When** el formulario construye el payload
- **Then** `cantidadPorPack` MUST enviarse con su valor numérico correspondiente

## Decisiones abiertas y fuera de alcance

- No se define si el piso de cotización IVECO/NEXPRO admite `1000` o exige un valor estrictamente mayor.
- No se definen máximos para `observacion`, `codigoProveedor`, `codigoReferencia` ni `ubicacion`.
- La validación de archivos, la fórmula de precio y los formularios anidados fuera del flujo activo quedan fuera de este capability.
