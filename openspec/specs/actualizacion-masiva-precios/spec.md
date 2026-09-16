# Especificación de actualización masiva de precios

## Propósito

Define la actualización masiva de precios de productos de forma global o por Línea, con aumento o disminución por porcentaje o monto fijo, confirmación previa y resultados autoritativos del servidor, para usuarios Root, Administrador y Empleado.

## Requisitos

### Requisito: R6 — Sustitución de pantalla y navegación

El frontend DEBE conservar `/admin/cambio-precios-masivo` para esta funcionalidad y agregar «Actualización masiva de precios» bajo Gestión Productos para Root, Administrador y Empleado. DEBE sustituir el flujo previo de esa pantalla y conservar los permisos de otras entradas y la funcionalidad de Lista de precios.

#### Escenario: Navegación de Empleado
- DADO un usuario con rol Empleado
- CUANDO abre Gestión Productos
- ENTONCES DEBE poder acceder a Actualización masiva de precios sin obtener acceso adicional a otros hijos restringidos.

#### Escenario: Sustitución en la URL existente
- DADO un usuario autorizado
- CUANDO accede a `/admin/cambio-precios-masivo`
- ENTONCES DEBE ver el formulario de actualización masiva y NO DEBE ver filtros por Marca/SubLínea, edición individual de cuatro precios, exclusión manual de filas ni pasos separados de aplicar/guardar del flujo anterior, incluidos filtros laterales heredados.

#### Escenario: Preservar Lista de precios
- DADO la integración de esta funcionalidad
- CUANDO se accede a Lista de precios
- ENTONCES su contrato y comportamiento DEBEN permanecer sin cambios por esta sustitución.

### Requisito: R1 — Alcance y ajuste válidos

El frontend DEBE permitir alcance global o por Línea, operación AUMENTO/DISMINUCION y tipo PORCENTAJE=1/MONTO_FIJO=2. DEBE usar un único valor numérico finito mayor a cero. Por Línea DEBE exigir una opción existente con identificador entero positivo.

#### Escenario: Combinaciones admitidas
- DADO cada combinación de dos alcances, dos operaciones y dos tipos de ajuste
- CUANDO se completan valores válidos
- ENTONCES el formulario DEBE permitir continuar y representar explícitamente el alcance y la unidad del valor.

#### Escenario: Valores inválidos y límite
- DADO valor vacío, no numérico, no finito, cero o negativo, o Línea ausente/inválida en alcance por Línea
- CUANDO se intenta continuar
- ENTONCES el frontend DEBE indicar el error y NO DEBE enviar la mutación; un decimal positivo DEBE superar la validación de positividad.

#### Escenario: Catálogo no disponible
- DADO carga pendiente, fallida o sin opciones de Línea
- CUANDO el alcance es por Línea
- ENTONCES el frontend DEBE explicar el estado y NO DEBE enviar sin una selección válida; NO DEBE convertirlo silenciosamente en global.

### Requisito: R2 — Confirmación y contrato

El frontend DEBE confirmar alcance, Línea si corresponde, operación, tipo y valor antes de enviar exactamente un POST `/api/producto/actualizar-precios`. DEBE enviar `{tipoAjuste, operacion, valor}` y únicamente para alcance por Línea `lineaId`. NO DEBE enviar productos, identidad del usuario, monto o porcentaje como propiedades adicionales.

#### Escenario: Confirmar y cancelar
- DADO un formulario válido
- CUANDO se cancela la confirmación
- ENTONCES DEBE conservar los valores y NO DEBE enviar; al confirmar DEBE enviar los valores resumidos y bloquear otro envío mientras la operación esté pendiente.

#### Escenario: Cambiar de Línea a global
- DADO una Línea previamente seleccionada
- CUANDO se cambia a global y se confirma
- ENTONCES el payload DEBE omitir `lineaId`, incluso si existía una selección previa.

### Requisito: R3 — Autenticación y autorización

El frontend DEBE limitar la funcionalidad a Root, Administrador y Empleado y enviar Bearer token mediante la infraestructura existente. La autoridad de permisos DEBE permanecer en el backend.

#### Escenario: Acceso permitido y denegado
- DADO cada uno de los roles autorizados, un rol ajeno, o un token ausente/malformado
- CUANDO se accede por navegación o URL directa
- ENTONCES los autorizados DEBEN poder acceder; los demás DEBEN recibir denegación o redirección a login sin excepción de decodificación ni mutación.

### Requisito: R4 — Resultado autoritativo

Ante 200 OK o 201 Created el frontend DEBE mostrar `message` y todos los elementos de `productos` con denominación, costo y precio. NO DEBE calcular costos/precios ni registrar CambioPrecio desde el cliente.

#### Escenario: Resultado exitoso
- DADO una respuesta con productos, incluso denominaciones repetidas
- CUANDO termina la operación
- ENTONCES DEBE mostrar cada elemento y sus valores recibidos, de solo lectura, sin una segunda operación de guardar.

### Requisito: R5 — Errores y fin de operación

El frontend DEBE priorizar mensajes de API, normalizar mensajes de texto o listas y ofrecer un mensaje seguro cuando falten. DEBE finalizar el estado pendiente tanto en éxito como en error y NO DEBE mostrar resultados anteriores como correspondientes a un nuevo intento fallido.

#### Escenario: Errores documentados
- DADO respuesta 400, 401, 403 o 404
- CUANDO termina el intento
- ENTONCES DEBE mostrar validación, requerir nueva autenticación, informar permisos o mostrar el mensaje de no encontrados según corresponda; un 404 por usuario inexistente NO DEBE etiquetarse como ausencia de productos.

#### Escenario: Red o error no documentado
- DADO un fallo de red, 5xx o rechazo por precio resultante inválido
- CUANDO termina el intento
- ENTONCES DEBE informar el error disponible, conservar el formulario y NO DEBE reintentar automáticamente ni afirmar reversión del lote.

#### Escenario: Ambos códigos de éxito
- DADO una respuesta con message y productos conforme al contrato
- CUANDO el POST devuelve 200 o 201
- ENTONCES el frontend DEBE mostrar el mismo resultado exitoso para ambos códigos.

### Requisito: R7 — Límite vigente y responsabilidad de CambioPrecio

El frontend DEBE conservar el límite backend de 10.000 productos por operación global o por Línea y NO DEBE intentar eludirlo mediante peticiones adicionales. DEBE presentar los productos efectivamente devueltos. El registro de CambioPrecio queda fuera de implementación y verificación de este cambio frontend, a cargo de otra persona.

#### Escenario: Alcance superior al límite
- DADO un alcance con más de 10.000 productos
- CUANDO se confirma la operación
- ENTONCES el frontend DEBE enviar una sola petición y mostrar los resultados recibidos sin afirmar que se modificaron productos ausentes de la respuesta.
