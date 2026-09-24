# Diseño: CR-001 Validaciones y presentación de errores

## Enfoque técnico

La implementación mantendrá `react-hook-form`, `yupResolver`, los servicios Axios y la organización actual por componente, hook, servicio e interfaz. El cambio se concentrará en cuatro recorridos: interpretar el envelope HTTP sin romper a los consumidores existentes de `parseApiError`, aplicar `fieldErrors[]` mediante mapas tipados por formulario, alinear los esquemas Yup con los DTO publicados y completar la semántica accesible de los controles compartidos.

El backend seguirá siendo la autoridad de las invariantes. La validación frontend bloqueará requests evidentemente inválidos y mejorará la corrección por parte del usuario, pero cualquier rechazo del servidor se volverá a incorporar al estado de `react-hook-form`.

Trazabilidad principal:

| Requisito | Decisiones de diseño |
|---|---|
| Mapeo de errores HTTP | D1, D2 |
| Identificadores y números | D3 |
| Denominaciones | D3 |
| Stock en alta de Producto | D4 |
| Configuración de cotización | D5 |
| Presentación accesible | D6, D7 |
| Normalización de campos opcionales | D8 |
| Deltas de SuperLínea y asociación Línea–SuperLínea | D2, D6 |

## Decisiones de arquitectura

### D1. Conservar `parseApiError` y agregar un resultado estructurado

**Elección**: incorporar en `src/utils/errores.ts` tipos y guards para el envelope HTTP, junto con un parser estructurado, y reimplementar `parseApiError(error): string` como adaptador compatible que devuelve el mensaje global del nuevo parser.

```ts
export interface ApiFieldError {
  field: string;
  messages: string[];
}

export interface ParsedApiError {
  status?: number;
  message: string;
  fieldErrors: ApiFieldError[];
}

export function parseApiErrorDetails(error: unknown): ParsedApiError;
export function parseApiError(error: unknown): string;
```

El parser leerá `response.data` defensivamente, tomará el estado desde `data.statusCode` o `response.status`, aceptará únicamente entradas de `fieldErrors` con `field` string y `messages` string[], y no dependerá de `stack` ni `details`. Un body string o los formatos históricos de `message` conservarán el fallback actual. Cuando exista un 400 de validación, el literal `Bad Request Exception` no será presentado como mensaje raíz si hay mensajes de campo utilizables.

**Alternativas consideradas**: cambiar `parseApiError` para que deje de devolver string; interpretar Axios directamente en cada formulario.

**Justificación**: cambiar el retorno rompería consumidores de consultas, alertas y módulos fuera del alcance. Duplicar el parseo produciría divergencias y acoplaría componentes a Axios.

### D2. Aplicar errores mediante un helper genérico y mapas locales por formulario

**Elección**: agregar en `src/utils/errores.ts` un helper tipado sobre `FieldValues`/`FieldPath<T>` que reciba el `setError` del formulario y un mapa explícito de nombres del backend a nombres RHF.

```ts
export type ApiFieldMap<T extends FieldValues> = Readonly<
  Partial<Record<string, FieldPath<T>>>
>;

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: ApiFieldMap<T>,
): ParsedApiError;
```

Por cada entrada reconocida se concatenarán sus mensajes en orden y se ejecutará `setError(field, { type: "server", message })`. El primer campo reconocible usará el soporte de foco de RHF cuando tenga una referencia registrada. Los mensajes de campos desconocidos se acumularán sin pérdida en `root`; si no hay `fieldErrors[]`, se aplicará el mensaje seguro normalizado a `root`. El helper nunca convertirá automáticamente cualquier string recibido en un `FieldPath<T>`.

Los mapas vivirán junto al `FormValues` o al hook/formulario que posee cada submit, porque allí se conoce el contrato real del formulario:

| Formulario | Campos backend reconocidos |
|---|---|
| Producto | `denominacion`, `observacion`, `codigoProveedor`, `codigoReferencia`, `codigoBarra`, `ubicacion`, `stock`, `costo`, `precio`, `porcentaje`, `lineaId`, `marcaId`, `presentacionId`, `alicuotaIva`, `stockMinimo`, `cantidadPorPack`, `utilizaStockMinimo`, `utilizaPack` |
| Marca | `denominacion`, `observacion` |
| Línea | `denominacion`, `observacion`, `stockMinimo`, `utilizaStockMinimo`, `superLineaId` |
| SuperLínea | `denominacion`, `observacion` |
| Presentación | `denominacion`, `observacion` |
| IVECO/NEXPRO | `cotizacionDolar` cuando el endpoint lo identifica; cualquier otro nombre se degrada a `root` |

Los campos inyectados fuera del formulario (`usuarioCreatedId`, `usuarioUpdatedId`, `usuarioId`) no se mapearán a controles inexistentes y, por lo tanto, aparecerán en `root`. Los nombres actualmente idénticos se declararán igualmente en cada mapa: esta lista blanca evita que un cambio futuro del backend escriba sobre un campo RHF arbitrario.

**Alternativas consideradas**: aceptar cualquier `field` mediante cast; mantener un mapa global único.

**Justificación**: el cast elimina seguridad y el mapa global confunde bounded contexts y variantes create/update. Los mapas locales hacen visible el contrato de cada submit y garantizan el fallback requerido.

### D3. Alinear los esquemas Yup sin introducir reglas no publicadas

**Elección**: modificar los esquemas existentes in-place y usar una prueba reutilizable de finitud basada en `Number.isFinite`. La prueba se aplicará después de las transformaciones de vacío y permitirá que `.required()`/`.typeError()` emitan sus mensajes específicos.

Reglas exactas:

| Esquema | Campo | Regla resultante |
|---|---|---|
| Producto | `denominacion` | `.trim().required().max(200).matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-\/%]+$/)`; eliminar `.lowercase()` |
| Producto | `marcaId`, `lineaId`, `presentacionId` | transformar `""` a `null`; `.required().integer().moreThan(0)` |
| Producto | `costo` | requerido, finito mediante `.test(... Number.isFinite(value))` y `.min(0)` |
| Producto | `porcentaje` | requerido, finito y `.moreThan(0)`; conservar el máximo ya existente mientras no contradiga el contrato |
| Producto | `stock` | requerido y finito con `.moreThan(0)` en alta; en edición conservar validación de finitud y positividad sobre el valor cargado y no permitir edición |
| Producto | `stockMinimo` | requerido, finito y `.moreThan(0)`; `utilizaStockMinimo` expresa uso, no habilita el envío de `0` contrario al DTO |
| Producto | `cantidadPorPack` | cuando `utilizaPack` es true: requerido, finito, `.integer()` y `.moreThan(0)`; cuando es false: opcional y omitible del payload |
| Producto | campos de texto abiertos | `observacion`, `codigoProveedor`, `codigoReferencia` y `ubicacion` permanecen opcionales, sin máximo inventado; `codigoBarra` conserva su regla vigente |
| Marca | `denominacion` | `.trim().required().max(255).matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/)`; eliminar `.lowercase()` |
| Línea | `denominacion` | misma regla alfanumérica de 255 caracteres y sin `.lowercase()` |
| Línea | `superLineaId` | en alta, transformar vacío a `null` y aplicar `.required().integer().moreThan(0)`; en edición, si se informa, aplicar `.integer().moreThan(0)` y conservar su omisión cuando no cambió |
| Línea | `stockMinimo` | si se informa o resulta requerido por el formulario: finito y `.min(0)`; nunca convertir un valor inválido en válido mediante coerción |
| SuperLínea | `denominacion` | regla alfanumérica de 255 caracteres, `.trim()` y sin `.lowercase()` |
| Presentación | `denominacion` | `.trim().required().max(255).matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-\/]+$/)`; permite punto, guion y barra, sin `.lowercase()` |

Los identificadores de usuario no forman parte de estos esquemas porque se obtienen de autenticación y se agregan durante la transformación a payload. No se definirán máximos para `observacion`, `codigoProveedor`, `codigoReferencia` ni `ubicacion`.

**Alternativas consideradas**: crear una nueva capa de validación de dominio; generar esquemas desde OpenAPI.

**Justificación**: ambas alternativas exceden CR-001. Los esquemas existentes ya son el límite de validación de formulario y permiten un cambio pequeño y trazable.

### D4. Separar explícitamente alta y edición del stock de Producto

**Elección**: pasar el modo create/edit al schema de Producto y completar los `defaultValues` de alta con valores de formulario estables, incluido `stock` sin un valor positivo ficticio. El alta siempre renderizará `CantidadesInput name="stock"`, habilitado y requerido; la edición renderizará el mismo control con el valor de `transformData(producto)`, `disabled` y `readOnly` efectivo en el control subyacente.

El branch create construirá el payload desde los valores validados e incluirá `stock` explícitamente como número. El branch update conservará el stock cargado sin ofrecer edición. Se reemplazarán las escrituras de selectores `option?.id || 0` por `undefined`/`null` compatibles con RHF y Yup, de modo que limpiar Marca, Línea o Presentación no produzca un identificador aparentemente válido. `alicuotaIva` mantendrá su default `ALICUOTA_21`, pero al limpiar no se sustituirá por `0`.

La transformación seguirá separada en tres responsabilidades: `FormValues` describe el formulario, Yup valida, y el submit transforma a payload agregando el identificador autenticado. No se moverán llamadas HTTP fuera de `ProductoService` ni reglas de renderizado al servicio.

**Alternativas consideradas**: usar un único render condicional solo para edición; inicializar stock en `1`.

**Justificación**: el primer enfoque reproduce el incumplimiento actual y el segundo inventa un dato de inventario. Un default vacío obliga a una decisión explícita del usuario.

### D5. Modelar “configuración no disponible” en IVECO/NEXPRO

**Elección**: calcular `maximoDolar` como `number | undefined` y `configuracionDisponible` solo cuando el valor existe y es finito. Los factories Yup aceptarán la ausencia sin construir `.max(0)`; aplicarán `.max(maximoDolar)` únicamente cuando la configuración esté disponible.

Ambos formularios mostrarán un mensaje visible y anunciado —“La configuración de cotización no está disponible.”—, deshabilitarán el submit y mantendrán un guard al inicio de `onSubmit` que escribe el mismo error en `root`. Esta doble barrera evita requests incluso ante un submit programático. No se sustituirá la ausencia con `maximoDolar ?? 0`.

La regla actual del piso y su texto no se modificarán en CR-001: decidir si `1000` es válido o si el límite es estrictamente mayor requiere definición de negocio.

**Alternativas consideradas**: usar un máximo arbitrario; permitir submit y delegar el rechazo al backend.

**Justificación**: ambas ocultan una falla de configuración. El estado explícito es observable, seguro y no resuelve la decisión numérica pendiente.

### D6. Incorporar ARIA dentro de los componentes sin cambiar props públicas

**Elección**: cada componente compartido obtendrá el error desde la fuente que ya usa y generará un identificador estable interno con `useId()`.

| Componente | Fuente de error | Cableado interno |
|---|---|---|
| `FormInput` | `useFormContext().formState.errors` | `aria-invalid`, `aria-describedby`, `<small id=... role="alert" aria-live="polite">` |
| `PriceInput` | mismo contexto RHF | mismos atributos sobre `NumericFormat`; registro interno de ref para habilitar foco cuando sea posible |
| `CantidadesInput` | mismo contexto RHF | mismos atributos y asociación del mensaje |
| `PorcentajeInput` | mismo contexto RHF | mismos atributos y asociación del mensaje |
| `EntidadSelectorBase` | prop `error` ya existente | `inputId`, `aria-invalid` y `aria-describedby` sobre `react-select`; mensaje con id estable y `role="alert"` |

Se usará acceso por path de RHF para no limitar el componente a nombres planos. `aria-describedby` se omitirá cuando no haya error y `aria-invalid` será booleano. Los wrappers de Marca, Presentación y SuperLínea conservarán sus firmas porque ya transmiten `error`; el selector propio de Línea de Producto recibirá el mismo cableado interno usando su prop `errors` existente. Los errores raíz de los siete formularios activos se renderizarán con `role="alert"` y `aria-live="assertive"`.

Los 19 consumidores externos no recibirán props nuevas ni cambios de firma. Sin error, el DOM solo incorpora semántica neutral; con error, la fuente sigue siendo el contexto RHF o la prop ya disponible. La compilación global es el control de compatibilidad del blast radius.

**Alternativas consideradas**: agregar `errorId`, `invalid` o `aria-*` como props obligatorias; envolver todos los controles con un componente nuevo.

**Justificación**: las props nuevas ampliarían el cambio a consumidores no relacionados. La información ya está disponible internamente y permite compatibilidad binaria y de tipos.

### D7. Reparar la cadena de referencias para el foco de RHF

**Elección**: `FormInput` combinará `field.ref`, `inputRef` y, cuando corresponda, `maskRef` mediante un callback de asignación de refs. Nunca volverá a sobrescribir `field.ref` con la ref externa. Los controles numéricos combinarán de forma equivalente la ref registrada internamente por RHF con la ref pública existente, sin cambiar props.

**Alternativas consideradas**: llamar manualmente a `focus()` desde cada catch; eliminar `inputRef`.

**Justificación**: el foco pertenece al registro de RHF y debe funcionar tanto para validación Yup como para `setError(..., { shouldFocus: true })`. El foco manual duplicaría orden y conocimiento de campos; eliminar `inputRef` rompería navegación existente.

### D8. Normalizar campos opcionales antes del payload

**Elección**: agregar en `src/utils/payload.ts` un helper puro y reutilizable que reciba el objeto de payload y una lista explícita de claves opcionales, y devuelva una copia en la que se omiten las claves cuyo valor sea `null`, `undefined`, cadena vacía o cadena con solo espacios, recortando los valores no vacíos que permanecen.

```ts
export function omitEmptyOptionalStrings<T extends Record<string, unknown>>(
  payload: T,
  keys: readonly (keyof T & string)[],
): T;
```

Cada constructor de payload invoca el helper con su lista explícita de claves opcionales: Marca y Presentación con `["observacion"]`; Producto con `["observacion", "codigoProveedor", "codigoReferencia"]`. Línea y SuperLínea conservan su omisión vigente o pasan por la misma lista explícita sin cambiar el resultado observable. La transformación se aplica únicamente al objeto de payload interno antes de llamar al servicio.

**Alternativas consideradas**: repetir el spread condicional inline en cada formulario que arma el payload.

**Justificación**: el helper concentra una única definición de “campo opcional vacío”, evita divergencias entre formularios y vuelve la omisión verificable en un solo punto. No cambia la API pública porque solo transforma un objeto interno: no altera props, firmas de componentes, contratos HTTP ni el valor validado por Yup. Repetir el spread inline dejaría la regla duplicada en cinco formularios y facilitaría una regresión como la que CR-001 busca cerrar.

**Trazabilidad**: satisface el requisito `Normalización de campos opcionales` del delta de `validacion-errores-gestion-producto`.

### D9. `stockMinimo` siempre obligatorio; `cantidadPorPack` condicional

**Elección**: `stockMinimo` es obligatorio, finito y mayor que 0 en el alta y la edición de Producto; su input permanece editable sin depender de `utilizaStockMinimo` (que se conserva como dato booleano enviado al backend) y la clave se envía siempre en el payload. `cantidadPorPack` se incluye únicamente cuando `utilizaPack === true`; cuando está en `false` la clave se elimina del objeto de payload antes de llamar al servicio, sin enviar `0`. Tampoco se siembra `stockMinimo` en `0` desde la línea seleccionada.

**Alternativas consideradas**: omitir `stockMinimo` cuando `utilizaStockMinimo` está apagado; dejar el `0` y confiar en que el backend lo ignore; agregar ambos campos a la lista de `omitEmptyOptionalStrings`.

**Justificación**: `docs/Analisis_Cambios.md` (líneas 277 y 300) y el OpenAPI (`minimum: 0, exclusiveMinimum: true`) declaran `stockMinimo` obligatorio y mayor que 0, por lo que omitirlo o enviarlo en `0` produce un request inválido. El `useEffect` previo pisaba `stockMinimo` con `0` cuando la bandera estaba apagada y el spread `{...formData}` lo enviaba igual. `omitEmptyOptionalStrings` no cubre el caso porque `0` es un número presente, no un valor vacío.

**Trazabilidad**: satisface el requisito `Normalización de campos opcionales` (escenarios `Stock mínimo obligatorio con independencia de la bandera`, `Pack desmarcado`, `Pack usado`) de `validacion-errores-gestion-producto`.

## Flujo de datos

### Error HTTP

```text
Servicio Axios
    │ reject unknown
    ▼
parseApiErrorDetails ──→ { status, message, fieldErrors[] }
    │
    ▼
applyApiErrors(setError, fieldMap)
    ├── campo reconocido ──→ setError(field, { type: "server", message })
    └── campo desconocido / sin fieldErrors ──→ setError("root", ...)
                                               │
                                               ▼
                              control asociado / alerta global ARIA
```

### Alta de Producto

```text
DefaultValues (IVA 21; stock vacío)
    → controles RHF (stock visible y habilitado)
    → Yup (IDs, finitud, límites y textos)
    → transformación create ({ ...valoresValidados, stock, usuarioCreatedId })
    → ProductoService.nuevo
    → éxito o applyApiErrors
```

### Importación IVECO/NEXPRO

```text
ConfiguracionSistemaContext.maximoDolar
    ├── finito → schema con máximo → submit habilitable
    └── ausente/no finito → estado anunciado + submit bloqueado + guard onSubmit
```

## Cambios de archivos

| Archivo | Acción | Descripción |
|---|---|---|
| `src/utils/errores.ts` | Modificar | Tipos del envelope, parser estructurado, adaptador string compatible y aplicación tipada de errores RHF. |
| `src/utils/payload.ts` | Agregar | Helper `omitEmptyOptionalStrings` que omite claves de texto opcionales `null`/`undefined`/vacías/con solo espacios y recorta los valores no vacíos. |
| `src/componentes/gestion-producto/producto/interfaces/interfaces-validaciones-producto.tsx` | Modificar | Reglas exactas de Producto, modo create/edit, finitud, IDs, denominación y mapa de campos. |
| `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` | Modificar | Stock de alta, payload normalizado (`observacion`, `codigoProveedor`, `codigoReferencia`), limpieza de selectores, aplicación de errores y alerta raíz accesible. |
| `src/componentes/gestion-producto/producto/componentes/configuracion/lineas-selector.tsx` | Modificar | Asociación ARIA del error existente al selector de Línea. |
| `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` | Modificar | Denominación, `superLineaId`, finitud y límite de `stockMinimo`; mapa local. |
| `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx` | Modificar | Aplicación de errores por campo/root y alerta accesible, preservando la omisión de `observacion` vacía y de asociación sin cambios. |
| `src/componentes/gestion-producto/marca/interfaces/interfaces-validaciones-marca.tsx` | Modificar | Casing y patrón contractual; mapa local. |
| `src/componentes/gestion-producto/marca/hooks/use-marca-form.ts` | Modificar | Aplicación estructurada de errores y payload con `observacion` vacía omitida. |
| `src/componentes/gestion-producto/marca/utils/registrar-actualizar-marca.tsx` | Modificar | Anuncio accesible del error raíz. |
| `src/componentes/gestion-producto/superlinea/interfaces/interfaces-validaciones-superlinea.tsx` | Modificar | Casing y patrón contractual; mapa local. |
| `src/componentes/gestion-producto/superlinea/utils/registrar-superlinea.tsx` | Modificar | Errores de campo/root y anuncio accesible en alta independiente y anidada, preservando la omisión de `observacion` vacía. |
| `src/componentes/gestion-producto/presentacion/interfaces/interfaces-validaciones-presentacion.tsx` | Modificar | Patrón con `.`, `-`, `/`, casing y mapa local. |
| `src/componentes/gestion-producto/presentacion/hooks/use-presentacion-form.ts` | Modificar | Aplicación estructurada de errores y payload con `observacion` vacía omitida. |
| `src/componentes/gestion-producto/presentacion/utils/registrar-actualizar-presentacion.tsx` | Modificar | Anuncio accesible del error raíz. |
| `src/componentes/gestion-producto/precios/iveco/interfaces-validaciones-precio-iveco.tsx` | Modificar | Máximo opcional sin fallback a cero, sin resolver el piso. |
| `src/componentes/gestion-producto/precios/iveco/importacion-precios-iveco-form.tsx` | Modificar | Estado de configuración, bloqueo, guard y errores accesibles. |
| `src/componentes/gestion-producto/precios/nex-pro/interfaces-validaciones-precio-nex-pro.tsx` | Modificar | Máximo opcional sin fallback a cero, sin resolver el piso. |
| `src/componentes/gestion-producto/precios/nex-pro/importacion-precios-nex-pro-form.tsx` | Modificar | Estado de configuración, bloqueo, guard y errores accesibles. |
| `src/componentes/herramientas/formateo-de-campos/form-input.tsx` | Modificar | ARIA estable y combinación de refs con `field.ref`. |
| `src/componentes/herramientas/formateo-de-campos/price-input.tsx` | Modificar | ARIA estable y registro interno de ref sin cambiar props. |
| `src/componentes/herramientas/formateo-de-campos/cantidades-input.tsx` | Modificar | ARIA estable y registro interno de ref sin cambiar props. |
| `src/componentes/herramientas/formateo-de-campos/porcentaje-input.tsx` | Modificar | ARIA estable y registro interno de ref sin cambiar props. |
| `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx` | Modificar | ARIA del `react-select` y mensaje asociado usando la prop existente. |
| 19 consumidores externos de los componentes compartidos | Verificar | Sin cambios deliberados; deben conservar compilación y comportamiento. |

No se crean dependencias nuevas; el único archivo de producción nuevo es el helper `src/utils/payload.ts`.

## Interfaces y contratos

El contrato público conservado es `parseApiError(error): string`. Las nuevas interfaces de errores son internas al frontend y representan solo campos observables del envelope; no modelan `stack` ni `details`.

La aplicación de errores conserva todos los mensajes de una entrada. Si varias entradas desconocidas llegan en la misma respuesta, `root` mostrará su concatenación en orden. Si existen campos reconocidos y desconocidos simultáneamente, los primeros se aplican a sus controles y los segundos permanecen en `root`.

Los componentes compartidos conservan exactamente sus props actuales. La semántica agregada es DOM/ARIA interna. Los contratos HTTP y los servicios no cambian.

## Estrategia de verificación

No se agregará runner, dependencia, archivo de test ni cobertura automatizada. `strict_tdd` permanece en `false`.

### Checklist manual

- [ ] Producto alta: el stock aparece habilitado, vacío no envía, `NaN`/infinito/`0`/negativo no envían y un valor finito mayor que cero llega en el payload.
- [ ] Producto edición: stock visible, deshabilitado y no editable; se conserva el valor cargado.
- [ ] Producto: limpiar Marca, Línea o Presentación no escribe `0`; IDs no enteros o no positivos bloquean el submit.
- [ ] Producto: denominación de 200 caracteres válida conserva casing; 201 caracteres y caracteres fuera de `^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-/%]+$` fallan.
- [ ] Producto: `costo`, `porcentaje`, `stockMinimo` y `cantidadPorPack` rechazan valores no finitos y sus límites inválidos.
- [ ] Marca, Presentación y Producto edición con `observacion` vacía: el cuerpo del request omite la clave y nunca envía `null`.
- [ ] Marca, Presentación y Producto edición con `observacion` no vacía: se envía recortada conservando el texto ingresado.
- [ ] Línea y SuperLínea siguen omitiendo `observacion` vacía del payload, sin cambios respecto del comportamiento previo.
- [ ] Marca, Línea y SuperLínea: denominaciones válidas conservan casing; caracteres fuera del patrón muestran un mensaje coherente.
- [ ] Presentación: `.`, `-` y `/` son válidos y el casing se conserva.
- [ ] Línea alta: `superLineaId` es obligatorio, entero y positivo; catálogo vacío o carga fallida mantiene bloqueado el submit.
- [ ] Línea edición: asociación no modificada se omite; una reasignación válida se envía.
- [ ] Error 400 con varios `fieldErrors`: cada campo reconocido muestra todos sus mensajes y no aparece `Bad Request Exception` en root.
- [ ] Error con campo desconocido y 400 sin `fieldErrors`, 401, 403, 404, 409, 500 o fallo de red: se muestra un root seguro sin perder el mensaje utilizable.
- [ ] Navegación accesible: cada control inválido expone `aria-invalid`, `aria-describedby` apunta al mensaje estable y `FormInput` recibe foco en el primer error cuando RHF lo solicita.
- [ ] IVECO y NEXPRO sin `maximoDolar`: se anuncia configuración no disponible, submit queda deshabilitado y no se construye máximo cero.
- [ ] IVECO y NEXPRO con configuración: se conserva la regla de piso vigente sin decidir si 1000 debe incluirse.
- [ ] Consumidores externos representativos de `FormInput`, `PriceInput`, `CantidadesInput`, `PorcentajeInput` y `EntidadSelectorBase` mantienen render y operación.

### Gates de calidad

| Comando | Criterio |
|---|---|
| `yarn build` | Debe finalizar con exit code 0. |
| `yarn lint` | Comparar diagnóstico completo con la línea base roja; no aceptar errores nuevos en archivos modificados. |
| `yarn tsc -b` | Comparar diagnóstico completo con la línea base roja; no aceptar errores nuevos ni incompatibilidades en los 19 consumidores. |

La verificación registrará comando, exit code y salida relevante. No se afirmará que lint o type-check “pasan” si continúan fallando por la línea base; se separarán los diagnósticos preexistentes de cualquier regresión de CR-001.

## Matriz de amenazas

N/A — el cambio no introduce ni modifica routing, comandos shell, subprocesses, automatización VCS/PR, clasificación de ejecutables ni límites de integración de procesos.

## Migración y despliegue

No se requiere migración de datos, feature flag ni cambio de API. El despliegue es atómico con el bundle frontend. El rollback consiste en revertir conjuntamente schemas, mapeo estructurado, stock de alta y ARIA; no deja estado persistido adicional.

## Preguntas abiertas

- [ ] Definir si la cotización IVECO/NEXPRO admite `1000` o exige un valor estrictamente mayor que `1000`. CR-001 no alterará el piso ni reconciliará su mensaje hasta recibir esa decisión.
- [ ] Definir máximos de `observacion`, `codigoProveedor`, `codigoReferencia` y `ubicacion`. CR-001 no agregará límites arbitrarios.

Ninguna de estas decisiones bloquea la implementación del alcance ya especificado si se preservan explícitamente sus límites.
