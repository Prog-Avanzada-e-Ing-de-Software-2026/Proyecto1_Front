| Código | Descripción                                                                                                   |
|:-------|:--------------------------------------------------------------------------------------------------------------|
| CR-001 | Validación de datos: evitar valores inválidos, mostrar errores claros, no permitir guardar datos incorrectos. |
| CR-002 | Presentación del producto: agregar concepto de presentación (ej: 1L, pack).                                   |
| CR-003 | SuperLínea: una Línea pasa a pertenecer a una SuperLínea.                                                     |
| CR-004 | Búsqueda por Denominación, Línea, SuperLínea, admitiendo coincidencias parciales.                             |
| CR-005 | Denominación automática: generar Marca \+ Línea \+ Presentación, editable manualmente. Depende de CR-002.     |
| CR-006 | Actualización masiva de precios, por porcentaje o monto, por línea o global.                                  |
| CR-007 | Historial de precios: registrar precio anterior, precio nuevo, fecha y motivo. Validar precio \> 0\.          |

# 

## *CR-002: Presentación del producto: agregar concepto de presentación (ej: 1L, pack).*

Este pedido de cambio tiene impacto en el dominio ya que agrega un nuevo concepto: la presentación. Este concepto representa las formas en que se puede comercializar un cierto producto, por ejemplo una Coca Cola puede comercializarse en una botella de dos litros, en un pack de 6 botellas o en lata de 500ml, cada una de estas es una presentación posible y en el dominio es importante hacer la distinción. Deberá agregarse el término “Presentación” al lenguaje ubicuo, para evitar confusión y traducciones.  
La Presentación será una entidad, debido a que tiene una identidad y un ciclo de vida independiente de un Producto en particular, y puede estar asociado a varios productos. Debe poder crearse, modificarse, consultarse y eliminarse una Presentaciones independientemente de Producto, por lo que estará en otro agregado, donde será la raíz. Estos comportamientos (ABMC de Presentación) deben agregarse al dominio, y se modifica el comportamiento de registrar Producto, ya que ahora debe seleccionarse una Presentación.  
Esta entidad tendrá un id, denominación y una observación opcional.  
Cada producto tendrá una sola presentación, por lo cual, si tenemos dos versiones del mismo producto en la vida real, por ejemplo botellas de Coca Cola de 1L y de 2,5L, serán dos productos distintos en el sistema con su propio precio, stock y sus propios movimientos. Esto se debe a que conceptualmente y en la operación del negocio no representan los mismos,y además si en una misma entidad representamos el producto en todas su versiones el atributo stock no podría por sí solo indicar cuánto se tiene de cada una. Además, en el CR-005, donde se debe generar una denominación automática, si tenemos más de una presentación no quedaría claro cual usar.  
La presentación será una propiedad obligatoria del producto, ya que determina una característica de la versión comercial concreta que se registra.

Nuevas reglas de negocio:  
\-Cada Producto debe tener asociada una, y solo una, Presentacion. Esta regla vivirá en un servicio de dominio que valida los datos necesarios del Producto antes de registrarlo. Actualmente esto corresponde a la clase ProductoIntrinsicValidationService.  
\-No se podrá eliminar una Presentación que esté siendo utilizada por uno o más Productos.  Esta regla de negocio vivirá en un servicio de dominio, que contendrá la política de eliminación de presentaciones.  
\-No podrá haber dos presentaciones con la misma denominación. Esta regla de negocio residirá en un servicio de dominio.

Historias de usuario:  
HU-01: Registrar presentación  
Como administrador del sistema quiero registrar una nueva Presentación para que pueda ser seleccionada al momento de registrar un Producto.  
Criterios de aceptación  
CA-01.1: El sistema debe permitir registrar una Presentación indicando su denominación (obligatoriamente) y, opcionalmente, una observación.  
CA-01.2: El sistema debe generar un identificador único para la Presentación registrada.  
CA-01.3: El sistema debe informar que la Presentación fue registrada correctamente.  
CA-01.4: El sistema no debe permitir registrar una Presentación con una denominación ya usada por otra.

HU-02: Consultar presentaciones  
Como administrador del sistema quiero consultar las Presentaciones registradas, para conocer cuáles están disponibles para asociar a los Productos.  
Criterios de aceptación  
CA-02.1: El sistema debe mostrar todas las Presentaciones registradas.  
CA-02.2: El sistema debe mostrar, como mínimo, el identificador y la denominación de cada Presentación.  
CA-02.3: El sistema debe permitir consultar la observación de una Presentación cuando esta exista.  
CA-02.4: Si no existen Presentaciones registradas, el sistema debe informar dicha situación.

HU-03: Modificar presentación  
Como administrador del sistema,  
quiero modificar los datos de una Presentación existente,  
para mantener actualizada la información de las Presentaciones disponibles.  
Criterios de aceptación  
CA-03.1: El sistema debe permitir seleccionar una Presentación existente para modificarla.  
CA-03.2: El sistema debe permitir modificar la denominación y/o la observación de la Presentación.  
CA-03.3: El sistema debe validar que la denominación sea obligatoria.  
CA-03.4: El sistema debe informar que la Presentación fue modificada correctamente.

HU-04: Eliminar presentación

Como administrador del sistema,  
quiero eliminar una Presentación que ya no se utilice,  
para mantener actualizadas las Presentaciones disponibles.

Criterios de aceptación  
CA-04.1: El sistema debe permitir seleccionar una Presentación existente para eliminarla.  
CA-04.2: El sistema debe solicitar confirmación antes de eliminar la Presentación.  
CA-04.3: El sistema debe impedir la eliminación de una Presentación que esté asociada a uno o más Productos.  
CA-04.6: El sistema debe informar que la Presentación fue eliminada correctamente.

Las historias de usuario Registrar Producto y Modificar Producto ya son historias existentes e implementadas. A estas historias se le deben agregar los siguientes criterios de aceptación (no necesariamente formuladas de la misma manera):  
HU existente: Registrar producto  
Nuevos criterios por CR-002  
CA-1: Al registrar un Producto, el sistema debe permitir seleccionar una Presentación previamente registrada y activa.  
CA-2: La Presentación debe ser un dato obligatorio del Producto y se debe impedir el registro de un Producto si no se selecciona una Presentación.

## *CR-007 Historial de precios: registrar precio anterior, precio nuevo, fecha y motivo. Validar precio \> 0\.*

Se agrega al dominio la entidad CambioPrecio, que representa un cambio en el precio de una entidad producto particular, ya sea por cambios en el costo, margen o directamente en el precio (por línea o globalmente), brindando trazabilidad.  
El CambioPrecio será una entidad ya que, al igual que con Movimiento Stock, nos interesa cual es el CambioPrecio y no solo sus valores. Tendrá las propiedades precioAnterior, precioNuevo, fecha (que incluirá la hora) y motivo que podrá ser: Actualización de Costo, Actualización de Margen, Actualización de Precio Por Línea, Actualización de Precio Global.   
CambioPrecio se suma al agregado de Producto. Un producto puede tener 0 o más cambios de precio.  
La decisión de que la propiedad Motivo tome un valor predefinido se debe a que se supone que el CambioPrecio es un efecto de otra operación, no algo que el usuario cargue directamente, por lo que sería confuso pedirle que ingrese una descripción del motivo por el que se va a cambiar el precio.  
Si bien se agregará esta entidad para aportar trazabilidad, se mantendrá el atributo “precio” en Producto. Esto puede ser cuestionable desde el punto de vista del diseño, ya que es un atributo calculable y no debería persistirse, pero se decide hacerlo de todas formas pues se considera que la mejora en performance lo justifica.  
Aparece un nuevo comportamiento de la entidad producto que se encontrará en el método cambiarPrecio(). Este comportamiento implica asegurar que exista un motivo, que el nuevo precio sea positivo y consistente con el anterior y crear un CambioPrecio, además de actualizar el atributo precio.  
También tendremos una nueva invariante o regla de integridad del agregado: el precio anterior de un CambioPrecio debe coincidir con el precio vigente inmediatamente antes del cambio.  
Los términos “Cambio Precio” e “Historial de Precios” deben agregarse al lenguaje ubicuo.  
Se toma una decisión de diseño relacionada a este cambio: los cambios de precios no formarán parte del DTO que se devuelve al consultar los productos, ya que con el tiempo aumentarían significativamente el tamaño de la consulta agregando información que la mayoría de las veces no será necesario. Se obtendrán a través de un endpoint separado. En el front, en la tabla donde se muestran los productos habrá un botón “Ver historial de precios” y al seleccionar el mismo se hará la solicitud al backend y se mostrarán los cambios en un modal.  
Dado que el pedido de cambio no se especifica, el responsable del cambioPrecio no se guardará como dato en la entidad.

Nueva regla de negocio:  
\-Todo cambio realizado al costo, margen o directamente al precio (por linea o global) de un producto debe generar un registro del cambio de precio para mantener trazabilidad.  
\-Todo cambio de precio debe tener un motivo.  
Estas reglas son garantizadas por el agregado producto. La última se encontrará específicamente en cambiarPrecio().  
Y la invariante/regla de negocio implícita mencionada: el precio anterior de un CambioPrecio debe coincidir con el precio vigente inmediatamente antes del cambio.

Historias de Usuario:  
Consultar Historial de Precios:  
Como administrador financiero quiero poder consultar el historial de precios de un producto para poder analizar su evolución y mantener la trazabilidad de sus cambios de precio .  
Criterios de aceptación:  
\-Los cambios de precios deben mostrarse en orden cronológico de más reciente a más antiguo.  
\-Todos los cambios de precio deben mostrar su fecha, precio anterior, precio nuevo y motivo, obligatoriamente.  
\-El historial de precios debe poder consultarse mediante paginación, utilizando inicialmente 10 cambios por página y permitiendo modificar la cantidad de cambios mostrados por página.  
\-Si el producto no posee cambios de precio, el sistema debe informar que no existen registros de cambios de precio.

Trazabilidad:  
Esta historia de usuario se satisface en la implementación del backend mediante el endpoint /api/producto/:id/historial-precios, que permite consultar los cambios de precio de un producto mediante paginación, utilizando inicialmente 10 registros por página.  
El controller obtiene los cambios de precio mediante el método getHistorialPrecios() del service, que a su vez consulta el método findHistorialPrecios() del adaptador de persistencia. El adaptador devuelve los registros ordenados cronológicamente, desde el más reciente hasta el más antiguo. Luego, el service utiliza un mapper para convertir los registros en un DTO que incluye la fecha, el precio anterior, el precio nuevo y el motivo del cambio.  
En el frontend, producto.service expone el método obtenerHistorialPrecios(), encargado de consumir el endpoint mencionado. Este método es utilizado por HistorialPreciosModal, que muestra los cambios de precio en una tabla con paginación y permite modificar la cantidad de registros mostrados por página. En caso de que el producto no posea cambios de precio registrados, el modal muestra un mensaje informativo. El modal se abre mediante un botón de acción agregado a las filas de la tabla de productos.  
La historia de usuario se relaciona con los eventos de dominio precioActualizado y precioRecalculado, que generan los registros de cambios de precio que posteriormente pueden ser consultados mediante esta funcionalidad.

Este pedido de cambio tiene impacto en las historias de usuario “Modificar Producto” y en las actualizaciones de precio del CR-006, a las que hay agregar un  criterio de aceptación.  
Para “Modificar Producto” debemos agregar el CA “Al modificar el precio de un producto, se debe registrar un CambioPrecio”. Para las US del CR-006 agregamos “Al modificar el precio de un producto, se debe registrar un CambioPrecio”.

## *CR-004 Búsqueda por Denominación, Línea, SuperLínea, admitiendo coincidencias parciales.*

Este pedido de cambio no implica un cambio en el dominio, no aparecen nuevas reglas de negocio, entidades ni Value Objects, sino que se trata tan sólo de una consulta.   
Son necesarias ciertas decisiones de diseño sobre cómo se llevará a cabo la búsqueda de coincidencias parciales. En primer lugar, la búsqueda, ya sea esto una petición al back o un filtrado en el frontend, se realizará sólo cuando el usuario presione Enter, y no cada vez que agregue/quite una letra, pues esto evitará muchas consultas innecesarias, simplificará el diseño del frontend y no generará mucha fricción al usuario.  
En segundo lugar, se considera que hay coincidencia parcial cuando el texto ingresado esté contenido (no necesariamente al principio) en la denominación de la entidad (producto, línea o superlinea), sin ser case sensitive (no se distingue “Harina” de “harina” o “HARINA”) pero si considerando tildes.  
Además, solo se traerán entidades que estén activas (no borradas lógicamente).  
La lógica/query de coincidencia parcial, que es común para las distintas entidades, se centraliza en un componente reutilizable de infraestructura/persistencia que se ubicará en Common. Los repositories expondrán un comportamiento busquedaPorCoincidenciaParcial() y en su implementación harán uso del componente descripto.

Historias de usuario:  
Búsqueda por denominación:  
Como administrador de productos quiero poder buscar un producto por su denominación para poder encontrarlo rápidamente.  
Criterios de aceptación:  
\-Se debe poder escribir la denominación del producto que se busca.  
\-Se debe realizar la búsqueda cuando el usuario presiona Enter.  
\-Se deben listar los productos cuya denominación contiene al texto escrito por el usuario, sin ser case-sensitive pero considerando tildes.  
\-Se debe usar paginación, trayendo de a 10 productos.  
\-Solo se deben mostrar productos que se encuentren activos.

Búsqueda por línea:  
Como administrador de productos quiero poder buscar productos por su línea para poder ver rápidamente todos los productos pertenecientes a una categoría.  
Criterios de aceptación:  
\-Se debe poder escribir la denominación de la línea que se busca.  
\-Se debe realizar la búsqueda de líneas cuando el usuario presiona Enter.  
\-Se deben mostrar para selección todas las líneas cuya denominación contiene al texto escrito por el usuario, sin ser case-sensitive pero considerando tildes.  
\-Se deben traer los productos de la línea seleccionada usando paginación, trayendo de a 10 productos.  
\-Solo se deben mostrar líneas que se encuentren activas.

Búsqueda por superlínea:  
Como administrador de productos, quiero buscar productos por su SuperLínea para poder consultar rápidamente los productos pertenecientes a una categoría superior.   
Criterios de aceptación:  
\-Se debe poder escribir la denominación de la superlínea que se busca.  
\-Se debe realizar la búsqueda de superlíneas cuando el usuario presiona Enter.  
\-Se deben mostrar para selección todas las superlíneas cuya denominación contiene al texto escrito por el usuario, sin ser case-sensitive pero considerando tildes.  
\-Se deben traer los productos de las líneas pertenecientes a la superlinea seleccionada usando paginación, trayendo de a 10 productos.  
\-Solo se deben mostrar superlineas que se encuentren activas.

Trazabilidad:

Esta historia de usuario se satisface en el backend mediante los endpoints GET /api/producto/search-by-denominacion y GET /api/producto/search-by-superlinea, además de GET /api/linea/select y GET /api/superlinea/select para seleccionar líneas y superlíneas. Los controllers delegan en ProductoService, LineaService y SuperLineaService, que utilizan sus repositories y los mappers correspondientes. La persistencia centraliza la coincidencia parcial en QueryBuilderHelper.applyPartialCoincidence(), que busca el texto contenido en denominacion sin distinguir mayúsculas y minúsculas, pero conservando la distinción de tildes. Los adaptadores filtran registros activos mediante deletedAt IS NULL, y la búsqueda por superlínea verifica también que la línea y la superlínea estén activas. ProductoService y ProductoPersistenceAdapter aplican paginación mediante skip y take, con un tamaño predeterminado de 10 productos.  
En el frontend, ConsultarProducto y BusquedaProducto ofrecen los modos Denominación, Línea y SuperLínea. Las búsquedas se ejecutan únicamente al presionar Enter. La denominación consulta ProductoService.buscarPorDenominacion(), la selección de línea consulta LineaService.buscarSelect() y luego obtiene sus productos mediante ProductoService.obtener(), mientras que la selección de superlínea usa SuperLineaService.obtenerSelect() y ProductoService.buscarPorSuperlinea(). El resultado se muestra en el listado paginado de productos. Los términos vacíos no generan consultas y se informa al usuario mediante una alerta.

## *CR-005 Denominación automática: generar Marca \+ Línea \+ Presentación, editable manualmente. Depende de CR-002.*

Este pedido de cambio implica la adición del término “Denominación automática” al lenguaje ubicuo, pero no introduce nuevas entidades ni Value Objects, sino que se trata de un nuevo comportamiento de autocompletado/recomendación a la hora de registrar un producto: el sistema sugerirá automáticamente una denominación a partir de Marca, Línea y Presentación.   
La decisión de diseño que se toma es que esta denominación automática esté presente solo como sugerencia en el formulario del frontend, y que no sea un valor por defecto en el backend. Esto se debe a que las denominaciones de los productos son importantes para su identificación y no queremos que se guarden por defecto sin que el usuario esté al tanto de su generación.   
Nueva regla de negocio:  
\-Al seleccionar una Marca, una Línea y una Presentación durante la creación de un Producto, la denominación automática se genera concatenando dichos valores en ese orden: Marca \+ Línea \+ Presentación.

Historias de usuario:  
Este cambio de requerimiento no implica una nueva historia de usuario, sino criterios de aceptación adicionales en la US de Registrar Producto (no necesariamente formulados de la misma manera):  
CA-1: Al seleccionar Marca, Línea y Presentación el campo de denominación se completa automaticamente con “Marca \+ Línea \+ Presentación”.  
CA-2: La denominación automática debe poder editarse manualmente.  
CA-3: La denominación automática no debe sobrescribir una denominación ingresada manualmente por el usuario.

## *CR-006 Actualización masiva de precios, por porcentaje o monto, por línea o global.*

Este pedido de cambio no introduce una entidad o Value Object ni cambios en los agregados, pero si agrega un comportamiento de dominio importante, que representa la actualización de precio que se hace simultáneamente a varios productos, generalmente en respuesta o anticipación a la inflación.  
La responsabilidad de actualizar el precio y hacer cumplir las reglas de negocio corresponderá al mismo Producto, para colocar los comportamientos en las entidades y lograr un modelo rico, como indica DDD.  
El precio seguirá siendo un atributo persistido  
Reglas de negocio nuevas:  
\-Un precio puede actualizarse directamente mediante la aplicación de un monto fijo o de un porcentaje, ya sea para incrementarlo o disminuirlo.  
\-Cuando se realiza una actualización directa del precio mediante un monto o porcentaje, el costo deberá actualizarse de forma que se mantenga la relación precio \= costo \+ margen, conservando el margen porcentual del producto.

Historia de Usuario:  
Actualización Masiva de Precios  
Como administrador de productos, quiero actualizar simultáneamente los precios de todos los productos o de los productos pertenecientes a una Línea, mediante un monto o porcentaje, para modificar rápidamente sus precios.  
Criterios de aceptación:  
\-Se puede seleccionar una Línea de manera opcional.  
\-Se puede realizar un aumento o una disminución en los precios.  
\-Se debe ingresar un monto fijo o un porcentaje de aumento, pero no ambos.  
\-Los costos de los productos deben actualizarse para cumplir con precio=costo+margen.  
\-El monto o porcentaje debe ser mayor  a 0\.  
\-Los precios finales de todos los productos deben ser mayores a 0\.  
\-Se debe mostrar denominación, costo y precio de los productos actualizados (tras la actualización).  
\-Si no había ningún producto para actualizar con los criterios elegidos el sistema lo debe informar.  
\-Cada producto cuyo precio sea modificado debe registrar un CambioPrecio.

El último de los criterios de aceptación se desprende del CR-007 y se incluye aquí pues es necesario tenerlo presente al implementar el comportamiento.

Trazabilidad:  
La historia de usuario se satisface en el backend mediante POST /producto/actualizar-precios, que recibe ActualizacionPrecioDto y delega en ProductoService.actualizarPrecios(). El servicio actualiza productos activos globalmente o por lineaId, valida que el ajuste sea positivo, aplica aumento o disminución por monto o porcentaje y reporta cuando no hay productos alcanzados.  
La entidad Producto contiene los comportamientos de actualización de precio. Rechaza precios finales menores o iguales a cero, recalcula el costo para conservar el margen porcentual y genera un CambioPrecio por cada producto modificado. ProductoPersistenceAdapter.actualizarPrecios() persiste los cambios dentro de una transacción.  
En el frontend, la ruta /admin/cambio-precios-masivo presenta el formulario para elegir alcance global o por línea, monto o porcentaje, y aumento o disminución. useActualizarPrecios envía el ajuste al endpoint y ResultadoPrecios muestra denominación, costo y precio final de los productos actualizados.

## *CR-001 Validación de datos: evitar valores inválidos, mostrar errores claros, no permitir guardar datos incorrectos.*

### **Análisis**

Este pedido de cambio no tiene impacto en el dominio, no introduce entidades ni Value Objects, sino que es más bien un aspecto de implementación, que puede en todo caso referirse a hacer cumplir reglas de negocio existentes pero no agrega nuevas.

### **Decisiones de diseño**

La validación se reparte en dos capas con responsabilidades distintas. Las reglas de formato y de tipo de dato viven en los DTO, en el borde HTTP, donde class-validator puede rechazar la petición antes de que entre a la aplicación. Las invariantes de negocio viven en servicios de validación intrínseca de dominio, uno por módulo de catálogo (ProductoIntrinsicValidationService, LineaIntrinsicValidationService, MarcaIntrinsicValidationService, PresentacionIntrinsicValidationService, SuperLineaIntrinsicValidationService), de modo que la regla de negocio no dependa del transporte.

Las reglas numéricas —rango y escala de importes, cantidades y porcentajes, y los enteros positivos— se centralizan en numeric-rules.ts, para definir el límite de cada tipo de dato una sola vez. Sobre esas funciones se construyen los decoradores reutilizables (IsMoney, IsQuantity, IsPercentage, IsPositiveInteger) y los transforms (normalizeString, toStrictBoolean, IsOptionalWhenUndefined) de request-transforms.ts, evitando repetir decoradores equivalentes en cada DTO.

Se configura un ValidationPipe global en main.ts con transform, whitelist y forbidNonWhitelisted, de manera que las propiedades no declaradas en el DTO se descarten o rechacen, y un exceptionFactory que produce un RequestValidationException con los errores agrupados por campo.

La comunicación de errores de validación se trata como un aspecto de infraestructura, ajeno al dominio: un GlobalExceptionFilter global normaliza la respuesta (statusCode, timestamp, path, message y fieldErrors cuando aplica), de modo que el formato del error sea uniforme para toda la API.

## *CR-003 SuperLínea: una Línea pasa a pertenecer a una SuperLínea.*

### **Análisis**

Este pedido de cambio introduce un concepto nuevo, la SuperLínea, que en el dominio representa una categoría de nivel superior que agrupa líneas.  
Nos encontramos con un caso similar al de Presentación, ya que una superlínea tiene identidad y ciclo de vida propios, pudiendo existir sin una Línea o Producto particular y tener múltiples Líneas asociadas, requiriendo un ABMC propio para gestionarlo. Por estos motivos, modelamos a SuperLínea como una nueva entidad.  
En cuanto a los agregados, tanto la Línea como Producto y Superlínea poseen identidad y ciclo de vida independientes, y deben poder crearse, modificarse y consultarse independientemente, por lo tanto, las modelamos como parte de agregados separados, siendo cada uno la raíz del suyo.  
Se agregan al dominio los comportamientos correspondientes a la gestión de SuperLínea y se modifica el comportamiento de gestión de Línea, se deberá asegurar que tenga una SuperLínea.

### **Reglas de negocio**

* Una SuperLínea puede ser utilizada para agrupar múltiples Líneas. Cada Línea debe pertenecer a una única SuperLínea. Esta regla vivirá en un servicio de dominio que valida los datos necesarios de la Línea antes de registrarla.
* No se podrá eliminar una SuperLínea a la que pertenezcan una o más líneas. Esta regla de negocio vivirá en un servicio de dominio, que contendrá la política de eliminación de SuperLíneas.
* No podrá haber dos SuperLíneas con la misma denominación, por más de que estén lógicamente eliminadas. Esta regla de negocio residirá en un servicio de dominio.
* La denominación de una SuperLínea es obligatoria y debe tener como máximo 255 caracteres.

### **Historias de usuario**

### **Modificaciones a historias existentes**

Las historias de usuario “Registrar Línea” y “Modificar Línea” se verán modificadas, agregándoles los siguientes criterios de aceptación:

* **CA-1**: El sistema debe permitir seleccionar una SuperLínea previamente registrada y activa.
* **CA-2**: La SuperLínea debe ser un dato obligatorio de la Línea y se debe impedir el guardado de una Línea si no se selecciona una SuperLínea.

### **Nuevas historias de usuario**

| HU — Registrar SuperLínea                                                                                                                                                                                                                                                                                                                                                                                                                                |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Como administrador de productos, quiero registrar una SuperLínea, para poder agrupar Líneas relacionadas dentro de una categoría superior.                                                                                                                                                                                                                                                                                                               |
| **Criterios de aceptación:** Se debe poder ingresar la denominación de la SuperLínea y una observación. La denominación debe ser obligatoria, la observación no. La denominación debe tener como máximo 255 caracteres. El sistema debe generar un identificador para la SuperLínea. El sistema debe informar que la SuperLínea fue registrada correctamente. El sistema no debe permitir registrar una SuperLínea cuya denominación ya esté registrada. |

| HU — Consultar SuperLíneas                                                                                                                                                                                                                                                                                          |
|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Como administrador de productos, quiero consultar las SuperLíneas registradas, para conocer las categorías superiores disponibles.                                                                                                                                                                                  |
| **Criterios de aceptación:** Se deben mostrar todas las SuperLíneas registradas. Se debe mostrar al menos su identificador y denominación. El sistema debe permitir consultar la observación de una SuperLínea cuando ésta exista. Si no existen SuperLíneas registradas, el sistema debe informar dicha situación. |

| HU — Modificar SuperLínea                                                                                                                                                                                                                           |
|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Como administrador de productos, quiero modificar una SuperLínea, para mantener actualizada su información.                                                                                                                                         |
| **Criterios de aceptación:** Se debe poder seleccionar una SuperLínea existente. Se debe poder modificar su denominación. La denominación debe continuar siendo obligatoria. La denominación debe continuar respetando el máximo de 255 caracteres. |

| HU — Eliminar SuperLínea                                                                                                                                                                                     |
|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Como administrador de productos, quiero eliminar una SuperLínea que ya no sea necesaria, para mantener actualizadas las categorías disponibles.                                                              |
| **Criterios de aceptación:** Se debe poder seleccionar una SuperLínea existente. Se debe solicitar confirmación antes de eliminarla. No se debe permitir eliminar una SuperLínea que tenga Líneas asociadas. |

### **Trazabilidad**

Se implementó el módulo superlinea (src/modules/gestion-productos/superlinea/) con su controlador, servicio de aplicación, entidad, repositorios, DTOs y mapper. La trazabilidad de cada historia de usuario es la siguiente.

Registrar SuperLínea. POST /superlinea recibe CreateSuperLineaDto; el controller delega en SuperLineaService.create(), que valida los datos intrínsecos con SuperLineaIntrinsicValidationService.validarDatosBasicos() (denominación obligatoria y de hasta 255 caracteres) y consulta PoliticaCreacionSuperLinea.checkDenominacionExists() —que incluye las eliminadas— para rechazar denominaciones repetidas con ConflictException. El adaptador persiste con SuperLineaPersistenceAdapter.create() dentro de una transacción de Unit of Work y el service responde con el mensaje de alta correcta.

Consultar SuperLíneas. GET /superlinea/search-by (filtro por denominación con paginación) y GET /superlinea/select (búsqueda parcial para combos) delegan en findBy() y busquedaPorCoincidenciaParcial(), que consultan el adaptador y proyectan con SuperLineaMapper.toDto() y toSelectOption(). GET /superlinea/:id devuelve el detalle (findDtoById) y GET /superlinea/:id/audit la auditoría con joins (findByIdConAuditoria). Como findOne excluye las eliminadas, solo se listan SuperLíneas activas y, cuando no hay registros, la respuesta devuelve una lista vacía con total 0\.

Modificar SuperLínea. PUT /superlinea/:id recibe UpdateSuperLineaDto; el service verifica la existencia con findEntityById(), revalida los datos intrínsecos y, si cambia la denominación, vuelve a comprobar la unicidad excluyendo el propio id (checkDenominacionExists(denominacion, id)); el adaptador aplica el merge y guarda de forma transaccional.

Eliminar SuperLínea. DELETE /superlinea/:id?usuarioId= resuelve la entidad, consulta PoliticaEliminacionSuperLinea.tieneLineasActivas() (a través de ILineaRepository.existsActiveBySuperLinea) y lanza ConflictException si hay Líneas activas asociadas; en caso contrario, resuelve el usuario y marca la baja lógica (deletedAt/usuarioDeletedId) en remove(). La confirmación previa es responsabilidad del cliente.

CA-1 y CA-2 (historias de Línea). Para satisfacer los criterios de aceptación se modificó el módulo linea: POST /linea y PUT /linea/:id aceptan superLineaId (create-linea.dto.ts obligatorio, update-linea.dto.ts opcional); linea.service.ts resuelve la SuperLínea activa con findActiveSuperLinea() antes de persistir —rechazando con NotFoundException si no existe o está eliminada— y linea-intrinsic-validation.service.ts la valida con validarSuperLineaId (obligatoria en el alta). La asociación persiste en linea.entity.ts (ManyToOne obligatoria, columna super\_linea\_id) y en linea.persistence-adapter.ts (create/update reciben la SuperLínea ya resuelta). Además se agregó GET /linea/find-all-for-superlinea/select, que lista las SuperLíneas activas para el selector de Línea.

Las historias de usuario a las que, como se mencionó a lo largo de esta sección, se les deben agregar criterios de aceptación, quedan definidas de la siguiente forma.

Registrar Producto  
Como administrador de productos, quiero registrar un Producto, para poder administrar su información de catálogo e inventario.

* El costo es obligatorio y debe ser mayor o igual a 0\.
* El margen es obligatorio y debe ser mayor a 0\.
* El stockActual es obligatorio y debe ser mayor a 0\.
* El stockMinimo es obligatorio y debe ser mayor a 0\.
* La marca es obligatoria.
* La línea es obligatoria.
* La  presentación es obligatoria.
* Se deben poder seleccionar marcas, líneas y presentaciones previamente registradas.
* La denominación es obligatoria.
* La denominación debe ser única.
* La denominación debe tener como máximo 200 caracteres.
* Al seleccionar Marca, Línea y Presentación el campo de denominación se debe completar automaticamente con “Marca \+ Línea \+ Presentación”.
*  La denominación automática debe poder editarse manualmente.
* La denominación automática no debe sobrescribir una denominación ingresada manualmente por el usuario.

Trazabilidad:  
Esta historia de usuario se satisface en la implementación del backend mediante el endpoint POST /api/producto, que recibe el CreateProductoDto. El controller delega la operación en el método create() del service, que orquesta las distintas validaciones: datos intrínsecos (costo ≥ 0, margen \> 0, stock y stock mínimo \> 0), denominación obligatoria, única y con longitud máxima validada, y existencia de la marca, la línea y la presentación seleccionadas entre las previamente registradas. La presentación se trata como una entidad relacionada obligatoria: se valida mediante findActivePresentacion() y el adaptador de persistencia la asigna al producto durante su creación, dentro de la misma transacción, junto con el usuario que realiza el alta.  
En el frontend, el alta se realiza desde el modal RegistrarActualizarProductoForm, que se abre mediante el botón «Registrar Producto». El formulario permite seleccionar marcas, líneas y presentaciones previamente registradas mediante sus respectivos selectores. Al seleccionar estos tres elementos, el campo denominación se completa automáticamente con «Marca \+ Línea \+ Presentación»; sin embargo, el valor continúa siendo editable y no sobrescribe una denominación ingresada manualmente por el usuario. Los campos obligatorios se validan mediante Yup y, al confirmar el alta, producto.service utiliza el método nuevo() (POST /producto) para enviar los datos del formulario junto con el usuarioCreatedId, permitiendo registrar el nuevo producto.  
Este flujo se relaciona con el evento de dominio ProductoRegistrado, que representa la creación exitosa de un nuevo producto.

Modificar Producto  
Como administrador de productos, quiero modificar un Producto, para mantener actualizada su información.

* El costo es obligatorio y debe ser mayor o igual a 0\.
* El margen es obligatorio y debe ser mayor a 0\.
* El stockActual es obligatorio y debe ser mayor a 0\.
* El stockMinimo es obligatorio y debe ser mayor a 0\.
* La marca es obligatoria.
* La línea es obligatoria.
* La  presentación es obligatoria.
* Se deben poder seleccionar marcas, líneas y presentaciones previamente registradas.
* La denominación es obligatoria.
* La denominación debe ser única.
* La denominación debe tener como máximo 200 caracteres.
* Al modificar el precio de un producto, se debe registrar un Cambio de Precio.

Trazabilidad:  
Esta historia de usuario se satisface en la implementación del backend mediante el endpoint PUT /api/producto/:id, que recibe el UpdateProductoDto. El controller delega la operación en el método update() del service, que valida la existencia del producto y aplica las mismas reglas de integridad utilizadas en su alta, incluyendo las validaciones sobre los datos del producto, su denominación y las entidades relacionadas seleccionadas.  
El registro del cambio de precio se realiza dentro del método update() del adaptador y en la misma transacción. Cuando el precio recibido difiere del precio vigente, se invoca el método de dominio cambiarPrecio(), que genera un registro CambioPrecio con la fecha, el precio anterior, el precio nuevo y el motivo ActualizacionDePrecioDirecta. Además, este método verifica que el precioActual del último cambio de precio registrado coincida con el precioAnterior del nuevo cambio, preservando así la consistencia y trazabilidad del historial. Este comportamiento se corresponde con la regla asociada al evento de dominio PrecioActualizado, que se produce cuando el precio del producto es modificado.  
En el frontend, producto.service expone el método actualizar(), que consume el endpoint PUT /producto/:id enviando los datos del formulario y el usuarioUpdatedId. Este método es utilizado por el modal de edición RegistrarActualizarProductoForm, que se abre desde el botón «Editar producto» de cada fila de la tabla de productos, precarga la información del producto seleccionado y permite seleccionar marcas, líneas y presentaciones previamente registradas antes de confirmar la actualización.

Registrar Línea:  
Como administrador de productos, quiero registrar una Línea, para poder agrupar Productos relacionados dentro de una categoría.

* El sistema debe permitir seleccionar una Superlinea previamente registrada y activa.
* La SuperLínea es obligatoria y no se debe permitir registrar una Línea sin una SuperLínea asociada. .
* La denominación es obligatoria y debe ser única.
* La denominación debe tener como máximo 255 caracteres



Modificar Línea:  
Como administrador de productos, quiero modificar una Línea, para mantener actualizada su información.

* El sistema debe permitir seleccionar una Superlinea previamente registrada y activa.
* La SuperLínea es obligatoria y no se debe permitir registrar una Línea sin una SuperLínea asociada. .
* La denominación es obligatoria y debe ser única.
* La denominación debe tener como máximo 255 caracteres.

A partir de los cambios introducidos en el dominio por los pedidos de cambio, y considerando a Marca y Línea como entidades independientes de Producto, el modelo de dominio resultante, que contempla únicamente los conceptos y sus relaciones (sin incluir datos ni comportamientos), queda representado de la siguiente manera:

### **Cambios principales en el dominio**

**CR-002 — Presentación**

* Se agrega la entidad **Presentación**.
* Pasa a ser **raíz de un agregado independiente**.
* Tiene ABM propio.
* `Producto` pasa a tener **una Presentación obligatoria**.
* Una misma Presentación puede ser utilizada por varios Productos.
* Las distintas versiones comerciales (por ejemplo, Coca-Cola 1 L y 2,5 L) se representan como **Productos diferentes**.

**CR-003 — SuperLínea**

* Se agrega la entidad **SuperLínea**.
* Es raíz de su propio agregado.
* `Línea` sigue siendo raíz de su propio agregado.
* Cada Línea pasa a tener **una única SuperLínea obligatoria**.
* Una SuperLínea puede tener muchas Líneas.

**CR-007 — Historial de precios**

* Se agrega la entidad **CambioPrecio**.
* `CambioPrecio` pasa a formar parte del agregado `Producto`.
* Un Producto puede tener *0.. cambios de precio*\*.
* `Producto` incorpora el comportamiento `cambiarPrecio()`.
* Cada cambio registra precio anterior, precio nuevo, fecha y motivo.
* Se mantiene `precio` directamente en Producto.
* Se agrega la invariante de que el precio anterior debe corresponder al precio vigente inmediatamente antes del cambio.

**CR-005 — Denominación automática**

* No agrega entidades ni modifica agregados.
* `Registrar Producto` incorpora una sugerencia automática de denominación basada en **Marca \+ Línea \+ Presentación**.
* Es un comportamiento de interfaz/aplicación, no una nueva regla de negocio del dominio.

**CR-006 — Actualización masiva**

* No agrega entidades ni agregados.
* Se incorpora el comportamiento de actualizar masivamente precios por monto o porcentaje, globalmente o por Línea.
* Cada `Producto` sigue siendo responsable de modificar su propio precio mediante su comportamiento.
* La capa de aplicación coordina la actualización de múltiples Productos.
* Debe mantenerse la regla existente `precio = costo + margen`.

                ┌──────────────┐  
                │  SuperLínea  │  
                │   \<\<AR\>\>     │  
                └──────┬───────┘  
                       │ 1  
                       │  
                       │ 0..\*  
                ┌──────▼───────┐  
                │    Línea     │  
                │   \<\<AR\>\>     │  
                └──────┬───────┘  
                       │  
                       │ 0..\*  
                       │  
                ┌──────▼─────────────────┐  
                │        Producto        │  
                │        \<\<AR\>\>          │  
                │                        │  
                │ \- precio               │  
                │ \- costo                │  
                │ \- margen               │  
                └───┬────────┬──────┬────┘  
                    │        │      │  
                    │        │      │ 1  
                    │        │      ▼  
                    │        │  ┌───────────────┐  
                    │        │  │ Presentación  │  
                    │        │  │    \<\<AR\>\>     │  
                    │        │  └───────────────┘  
                    │        │  
                    │        │ 0..\*  
                    │        ▼  
                    │   ┌───────────────┐  
                    │   │ CambioPrecio  │  
                    │   │   \<\<Entity\>\>  │  
                    │   └───────────────┘  
                    │ 1  
                    ▼  
                 Marca  
                 \<\<AR\>\>
