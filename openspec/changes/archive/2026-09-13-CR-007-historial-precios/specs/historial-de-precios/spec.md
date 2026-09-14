# Historial de precios

Estado: spec delta creada para CR-007; pendiente de confirmación por verificación.

## ADDED Requirements

### Requirement: R1 — Interfaz y contrato del DTO

El frontend MUST definir `CambioPrecioDto` con `fecha: string`, `precioAnterior: number`, `precioNuevo: number` y `motivo` acotado al enum de 5 valores (`ActualizacionDeCosto`, `ActualizacionDeMargen`, `ActualizacionDePrecioPorLinea`, `ActualizacionDePrecioGlobal`, `ActualizacionDePrecioDirecta`). MUST exponer cada valor del enum con una etiqueta en español distinta y un color de insignia, sin inventar valores nuevos ni fórmulas de cálculo.

#### Scenario: Payload conforme
- GIVEN la respuesta del endpoint con la forma documentada
- WHEN el frontend la consume
- THEN MUST mapear cada campo al DTO y mostrar el motivo con su etiqueta correspondiente.

### Requirement: R2 — Servicio paginado

El frontend MUST proveer un método autenticado que llame `GET /api/producto/:id/historial-precios` con `skip` y `take` (parámetros opcionales, default `0`/`10`), reutilizando la infraestructura HTTP existente (Bearer desde `localStorage.Token`).

#### Scenario: Llamada por defecto
- GIVEN un producto con identificador válido
- WHEN se abre el historial sin indicar página
- THEN MUST solicitar `skip=0&take=10` y recibir el arreglo del endpoint.

#### Scenario: Cambio de página
- GIVEN el usuario avanza a una página posterior
- WHEN se solicita la página
- THEN MUST enviar el `skip` correspondiente y el mismo `take`.

### Requirement: R3 — Modal con tabla paginada

El frontend MUST abrir un modal al accionar «Historial de precios» de un producto; el modal MUST recibir el `id` del producto, obtener sus cambios mediante el servicio y mostrarlos en una tabla con Fecha, Precio anterior, Precio nuevo y Motivo, paginada de a 10 registros usando los componentes reutilizables del proyecto.

#### Scenario: Historial con datos
- GIVEN un producto con cambios de precio
- WHEN se abre el modal
- THEN MUST mostrar cada registro con fecha, precios y motivo, y paginar correctamente cuando haya más de una página.

#### Scenario: Historial vacío en página 1
- GIVEN un producto que nunca tuvo cambios de precio
- WHEN se abre el modal en la página 1
- THEN MUST mostrar un mensaje informativo de que no hay cambios y no mostrar la tabla como vacía sin explicación.

#### Scenario: Producto inexistente o error
- GIVEN un `404` del endpoint o un error de red
- WHEN se abre el modal
- THEN MUST mostrar un mensaje de error claro y conservar la posibilidad de cerrar el modal.

### Requirement: R4 — Acción de fila y permisos

El frontend MUST agregar el botón «Historial de precios» a las acciones de fila de la tabla de productos, instalando el modal desde el conjunto de modales de producto. La posibilidad de ver el historial MUST estar limitada a Root, Administrador y Empleado, alineada con los roles del endpoint.

#### Scenario: Usuario autorizado
- GIVEN un usuario con rol Root, Administrador o Empleado
- WHEN se muestra la entrada del producto
- THEN MUST poder accionar «Historial de precios» y abrir el modal.

#### Scenario: Usuario no autorizado
- GIVEN un rol ajeno a los autorizados
- WHEN se muestra la entrada del producto
- THEN MUST NOT permitir accionar «Historial de precios»; los permisos de escritura existentes MUST permanecer inalterados.