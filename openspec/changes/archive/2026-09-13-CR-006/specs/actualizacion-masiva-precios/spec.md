# Actualización masiva de precios

Estado: delta aprobada para implementación por instrucción explícita del usuario; contratos y decisiones revisados.

## ADDED Requirements

### Requirement: R6 — Sustitución de pantalla y navegación

El frontend MUST conservar `/admin/cambio-precios-masivo` para CR-006 y agregar «Actualización masiva de precios» bajo Gestión Productos para Root, Administrador y Empleado. MUST sustituir el flujo previo de esa pantalla y conservar los permisos de otras entradas y la funcionalidad de Lista de precios.

#### Scenario: Navegación de Empleado

- GIVEN un usuario con rol Empleado
- WHEN abre Gestión Productos
- THEN MUST poder acceder a Actualización masiva de precios sin obtener acceso adicional a otros hijos restringidos.

#### Scenario: Sustitución en la URL existente

- GIVEN un usuario autorizado
- WHEN accede a `/admin/cambio-precios-masivo`
- THEN MUST ver el formulario CR-006 y MUST NOT ver filtros por Marca/SubLínea, edición individual de cuatro precios, exclusión manual de filas ni pasos separados de aplicar/guardar del flujo anterior, incluidos filtros laterales heredados.

#### Scenario: Preservar Lista de precios

- GIVEN la integración de CR-006
- WHEN se accede a Lista de precios
- THEN su contrato y comportamiento MUST permanecer sin cambios por esta sustitución.

### Requirement: R1 — Alcance y ajuste válidos

El frontend MUST permitir alcance global o por Línea, operación AUMENTO/DISMINUCION y tipo PORCENTAJE=1/MONTO_FIJO=2. MUST usar un único valor numérico finito mayor a cero. Por Línea MUST exigir una opción existente con identificador entero positivo.

#### Scenario: Combinaciones admitidas
- GIVEN cada combinación de dos alcances, dos operaciones y dos tipos de ajuste
- WHEN se completan valores válidos
- THEN el formulario MUST permitir continuar y representar explícitamente el alcance y la unidad del valor.

#### Scenario: Valores inválidos y límite
- GIVEN valor vacío, no numérico, no finito, cero o negativo, o Línea ausente/inválida en alcance por Línea
- WHEN se intenta continuar
- THEN el frontend MUST indicar el error y MUST NOT enviar la mutación; un decimal positivo MUST superar la validación de positividad.

#### Scenario: Catálogo no disponible
- GIVEN carga pendiente, fallida o sin opciones de Línea
- WHEN el alcance es por Línea
- THEN el frontend MUST explicar el estado y MUST NOT enviar sin una selección válida; MUST NOT convertirlo silenciosamente en global.

### Requirement: R2 — Confirmación y contrato

El frontend MUST confirmar alcance, Línea si corresponde, operación, tipo y valor antes de enviar exactamente un POST `/api/producto/actualizar-precios`. MUST enviar `{tipoAjuste, operacion, valor}` y únicamente para alcance por Línea `lineaId`. MUST NOT enviar productos, identidad del usuario, monto o porcentaje como propiedades adicionales.

#### Scenario: Confirmar y cancelar
- GIVEN un formulario válido
- WHEN se cancela la confirmación
- THEN MUST conservar los valores y MUST NOT enviar; al confirmar MUST enviar los valores resumidos y bloquear otro envío mientras la operación esté pendiente.

#### Scenario: Cambiar de Línea a global
- GIVEN una Línea previamente seleccionada
- WHEN se cambia a global y se confirma
- THEN el payload MUST omitir `lineaId`, incluso si existía una selección previa.

### Requirement: R3 — Autenticación y autorización

El frontend MUST limitar la funcionalidad a Root, Administrador y Empleado y enviar Bearer token mediante la infraestructura existente. La autoridad de permisos MUST permanecer en el backend.

#### Scenario: Acceso permitido y denegado
- GIVEN cada uno de los roles autorizados, un rol ajeno, o un token ausente/malformado
- WHEN se accede por navegación o URL directa
- THEN los autorizados MUST poder acceder; los demás MUST recibir denegación o redirección a login sin excepción de decodificación ni mutación.

### Requirement: R4 — Resultado autoritativo

Ante 200 OK o 201 Created el frontend MUST mostrar `message` y todos los elementos de `productos` con denominación, costo y precio. MUST NOT calcular costos/precios ni registrar CambioPrecio desde el cliente.

#### Scenario: Resultado exitoso
- GIVEN una respuesta con productos, incluso denominaciones repetidas
- WHEN termina la operación
- THEN MUST mostrar cada elemento y sus valores recibidos, de solo lectura, sin una segunda operación de guardar.

### Requirement: R5 — Errores y fin de operación

El frontend MUST priorizar mensajes de API, normalizar mensajes de texto o listas y ofrecer un mensaje seguro cuando falten. MUST finalizar el estado pendiente tanto en éxito como en error y MUST NOT mostrar resultados anteriores como correspondientes a un nuevo intento fallido.

#### Scenario: Errores documentados
- GIVEN respuesta 400, 401, 403 o 404
- WHEN termina el intento
- THEN MUST mostrar validación, requerir nueva autenticación, informar permisos o mostrar el mensaje de no encontrados según corresponda; un 404 por usuario inexistente MUST NOT etiquetarse como ausencia de productos.

#### Scenario: Red o error no documentado
- GIVEN un fallo de red, 5xx o rechazo por precio resultante inválido
- WHEN termina el intento
- THEN MUST informar el error disponible, conservar el formulario y MUST NOT reintentar automáticamente ni afirmar reversión del lote.

#### Scenario: Ambos códigos de éxito

- GIVEN una respuesta con message y productos conforme al contrato
- WHEN el POST devuelve 200 o 201
- THEN el frontend MUST mostrar el mismo resultado exitoso para ambos códigos.

### Requirement: R7 — Límite vigente y responsabilidad de CambioPrecio

Por decisión explícita del usuario, el frontend MUST conservar el límite backend de 10.000 productos por operación global o por Línea y MUST NOT intentar eludirlo mediante peticiones adicionales. MUST presentar los productos efectivamente devueltos. El registro de CambioPrecio queda fuera de implementación y verificación de este cambio frontend, a cargo de otra persona.

#### Scenario: Alcance superior al límite

- GIVEN un alcance con más de 10.000 productos
- WHEN se confirma la operación
- THEN el frontend MUST enviar una sola petición y mostrar los resultados recibidos sin afirmar que se modificaron productos ausentes de la respuesta.
