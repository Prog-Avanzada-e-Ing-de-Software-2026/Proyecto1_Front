# Delta for producto-listado-tras-mutacion

## ADDED Requirements

### Requirement: Alta refresca solo con búsqueda activa

Tras registrar un `Producto` con éxito, el sistema MUST refrescar el listado vigente manteniendo el criterio de búsqueda activo del usuario cuando la tabla esté cargada por una búsqueda con criterio (búsqueda parcial por denominación/Línea/SuperLínea, búsqueda rápida por código o filtros de la sidebar). Si no hay búsqueda activa — tabla vacía en el estado inicial o modo de búsqueda parcial activo sin criterio comprometido — el sistema MUST NOT solicitar el listado ni modificar el listado visible.

#### Scenario: Alta con búsqueda parcial activa refresca el mismo criterio

- **Given** una búsqueda parcial con resultados visibles (denominación, Línea o SuperLínea)
- **When** el usuario registra un `Producto` con éxito
- **Then** el sistema MUST repetir la búsqueda con el mismo criterio
- **And** el listado MUST mostrar los resultados actualizados de ese criterio

#### Scenario: Alta con búsqueda rápida por código refresca el código

- **Given** una búsqueda rápida por código con resultados visibles
- **When** el usuario registra un `Producto` con éxito
- **Then** el sistema MUST repetir la búsqueda rápida con el mismo código

#### Scenario: Alta con filtros de sidebar refresca los filtros

- **Given** un listado cargado por los filtros de la sidebar
- **When** el usuario registra un `Producto` con éxito
- **Then** el sistema MUST refrescar el listado con los filtros vigentes

#### Scenario: Alta en estado vacío no dispara request

- **Given** la sección Producto abierta con la tabla vacía (sin búsqueda activa)
- **When** el usuario registra un `Producto` con éxito
- **Then** el sistema MUST NOT emitir una solicitud del listado de `Producto`s
- **And** el listado visible MUST permanecer sin cambios
- **And** el `Producto` MUST aparecer solo después de que el usuario realice una búsqueda que lo incluya

### Requirement: Recarga de edición según criterio activo

Tras actualizar un `Producto` con éxito, el sistema MUST refrescar el listado vigente respetando el criterio de búsqueda activo: MUST repetir la búsqueda parcial cuando hay un criterio comprometido (denominación, Línea o SuperLínea), MUST usar el flujo heredado (sin filtro parcial) cuando no hay un modo de búsqueda parcial activo, y MUST NOT emitir ninguna solicitud cuando hay un modo de búsqueda parcial activo sin criterio comprometido.

#### Scenario: Edición conserva la búsqueda por denominación

- **Given** una búsqueda por denominación con resultados visibles
- **When** el usuario edita un `Producto` y la actualización es exitosa
- **Then** el sistema MUST repetir la búsqueda por el mismo término
- **And** el listado MUST mostrar los resultados correspondientes a ese criterio

#### Scenario: Edición conserva la búsqueda por Línea o SuperLínea

- **Given** una búsqueda por Línea o SuperLínea seleccionada con resultados visibles
- **When** el usuario edita un `Producto` y la actualización es exitosa
- **Then** el sistema MUST repetir la búsqueda de la Línea o SuperLínea seleccionada
- **And** el listado MUST mostrar los resultados correspondientes a ese criterio

#### Scenario: Edición sin modo de búsqueda parcial usa el flujo heredado

- **Given** la sección Producto sin un modo de búsqueda parcial activo
- **When** el usuario edita un `Producto` y la actualización es exitosa
- **Then** el sistema MUST refrescar el listado con el flujo heredado y la paginación vigente

#### Scenario: Edición con modo activo sin criterio no emite request

- **Given** un modo de búsqueda parcial activo sin criterio comprometido
- **When** el usuario edita un `Producto` y la actualización es exitosa
- **Then** el sistema MUST NOT emitir una solicitud del listado
- **And** el listado MUST permanecer vacío
