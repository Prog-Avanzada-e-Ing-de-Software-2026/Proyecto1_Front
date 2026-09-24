# Exploration: CR-001 — Validaciones y presentación de errores en `gestion-producto`

> Exploración de solo lectura. Todo hallazgo se verificó contra el código actual del repositorio (rama `CR-001`). El sketch `docs/Pedidos de Cambio/CR-001/CR-001.md` se trata como hipótesis a confirmar o refutar.

## Current State

### Validación de formularios

- Los formularios de negocio de `gestion-producto` usan `react-hook-form` + `yupResolver(schema)` y bloquean `onSubmit` cuando el esquema falla. Es la base correcta y debe conservarse.
- Formularios con esquema propio:
  - Marca: `marca/interfaces/interfaces-validaciones-marca.tsx` + `marca/hooks/use-marca-form.ts`.
  - Línea: `linea/interfaces/interfaces-validaciones-linea.tsx` + `linea/utils/registrar-actualizar-linea.tsx`.
  - Superlínea: `superlinea/interfaces/interfaces-validaciones-superlinea.tsx` + `superlinea/utils/registrar-superlinea.tsx`.
  - Presentación: `presentacion/interfaces/interfaces-validaciones-presentacion.tsx` + `presentacion/hooks/use-presentacion-form.ts`.
  - Producto: `producto/interfaces/interfaces-validaciones-producto.tsx` + `producto/utils/registrar-actualizar-producto.tsx`.
  - Ítems proveedor/alternativo: `interfaces-validaciones-item-proveedor.tsx`, `interfaces-validaciones-item-prod-alternativo.tsx`.
  - Subíndice de línea: `interfaces-validaciones-sublinea.tsx`.
  - Importaciones IVECO/NEX-PRO: `precios/iveco|nex-pro/interfaces-validaciones-precio-*.tsx`.
  - Actualización masiva de precios: `precios/actualizacion-masiva-precios/interfaces/formulario-precios.ts` (el más completo: `.positive()` + test de finitud).

### Presentación de errores

- El error general se guarda con `setError("root", …)` y se renderiza como un `<div className="text-red-600 …">` sin `role="alert"` ni `aria-live` en Marca, Línea, Superlínea, Presentación, Producto e importaciones.
- Excepción positiva: `precios/actualizacion-masiva-precios/actualizacion-masiva-precios.tsx:30` y `componentes/formulario-precios.tsx:67-99` sí usan `role="alert"`, `aria-invalid`, `aria-describedby` y `aria-live`. Es el único patrón accesible del feature.
- Los inputs compartidos (`form-input`, `price-input`, `cantidades-input`, `porcentaje-input`) muestran el mensaje en un `<small>` sin `aria-invalid`, sin `aria-describedby`, sin `id` estable y sin `role="alert"`.
- `parseApiError` (`src/utils/errores.ts:2-24`) devuelve **solo un string** y **nunca** lee `fieldErrors[]`. Ningún formulario de `gestion-producto` mapea errores de validación del backend a su campo.

## Affected Areas

- `src/utils/errores.ts` — parser sin soporte de `fieldErrors[]`; único punto de traducción de errores de API.
- `src/componentes/gestion-producto/producto/interfaces/interfaces-validaciones-producto.tsx` — esquema principal con huecos de ID, texto, numéricos y regex.
- `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` — selectores que escriben `0`, guard muerto de ítem sin agregar, `errors.root` visible.
- `src/componentes/gestion-producto/producto/utils/registrar-item-proveedor.tsx` y `registrar-item-prod-alternativo.tsx` — selectores `|| 0`, `trigger()` local, `onItemSinAgregar` por `useEffect` (componentes no montados).
- `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` y `registrar-actualizar-linea.tsx` — `stockMinimo`/`superLineaId`.
- `src/componentes/gestion-producto/{marca,linea,superlinea,presentacion}/interfaces/interfaces-validaciones-*.tsx` — regex de denominación, `observacion` sin máximo.
- `src/componentes/gestion-producto/precios/iveco|nex-pro/interfaces-validaciones-precio-*.tsx` — regla de cotización y `maximoDolar ?? 0`.
- `src/componentes/gestion-producto/precios/carga-archivo.tsx` — sin `accept`, MIME ni tamaño.
- `src/componentes/herramientas/formateo-de-campos/form-input.tsx` — no propaga `field.ref`; sin atributos ARIA.
- `src/componentes/herramientas/formateo-de-campos/{price,cantidades,porcentaje}-input.tsx` — sin atributos ARIA.
- `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx` — selector base consumido por marca/línea/presentación/superlínea; sin ARIA y con `onChange(null)`.

## Reconciliation table — hallazgos prioritarios del sketch CR-001

| # | Hallazgo del sketch | Estado | Evidencia (código actual) |
|---|---|---|---|
| 1 | Domicilio y reutilizables de documentos/importes publican por `useEffect` y el padre no valida | **out-of-scope (not gestion-producto)** | `domicilio.tsx`, `cabecera-documentos.tsx`, `montos-item-nota-credito.tsx`, `seleccion-producto-con-porcentaje-presupuesto-venta.tsx` no tienen consumidores en `gestion-producto`; solo `gestion-organizacion`/comercial. |
| 2 | Cabeceras de documentos: `prefijo`/`numero`/fecha por `onKeyDown` | **out-of-scope (not gestion-producto)** | `cabecera-documentos.tsx`, `encabezado-documentos*.tsx`, `selector-letra-gasto.tsx` se consumen desde comprobantes/ventas/compras. |
| 3 | IDs con `yup.number().required()` aceptan `0` al limpiar el selector | **confirmed (parcial)** | Producto: `marcaId`/`lineaId` solo `.required()` sin `.moreThan(0)` (`interfaces-validaciones-producto.tsx:78-89`) y los selectores escriben `linea?.id || 0`, `marca?.id || 0` (`registrar-actualizar-producto.tsx:639,658`). Ítem proveedor/alternativo: `proveedorId`/`productoAlternativoId` `.required()` sin `.moreThan(0)` (`…item-proveedor.tsx:25`, `…item-prod-alternativo.tsx:24-27`) y `selectedOption?.id || 0` (`registrar-item-proveedor.tsx:255`, `registrar-item-prod-alternativo.tsx:278`). Ya correctos: `presentacionId` (`.moreThan(0)`), `superLineaId` en Línea (`.moreThan(0)`), `lineaId`/`valor` en actualización masiva (`.integer().positive()`). Fuera de alcance: condición IVA, vendedor, provincia, localidad. |
| 4 | CUIT/DNI sin validación de 11 dígitos ni dígito verificador | **out-of-scope (not gestion-producto)** | `cuit-input.tsx` solo lo consumen `gestion-organizacion/cliente|proveedor` y `seleccion-proveedor-cliente-cabecera.tsx`. |
| 5 | Carga de archivos IVECO/NEX-PRO solo valida presencia | **confirmed** | `precios/carga-archivo.tsx:7-23,28-33`: no hay `accept`, ni chequeo de MIME/extensión/tamaño. Los forms solo verifican `if (!file)` (`importacion-precios-iveco-form.tsx:56`, `…nex-pro-form.tsx:49`) y deshabilitan el botón con `!file`. |
| 6 | Campos de texto sin `trim`/máximos | **confirmed (parcial)** | Producto: `observacion`, `codigoProveedor`, `codigoReferencia` sin `.max` ni `.trim` (`interfaces-validaciones-producto.tsx:62-64`); `codigoBarra` sí tiene `max(255)`. Marca/Línea/Superlínea/Presentación: `observacion` sin máximo. Además, `denominacion` de Producto usa `max(255)` (`:60`) pero el contrato backend exige **200** (`Gestion_Productos_Errores_HTTP.md:282`). |
| 7 | Regex de denominación inconsistentes / guion sin escapar | **confirmed** | Producto: `/^[A-Za-z0-9 %-_"'áéíóúÁÉÍÓÚñÑ./]+$/` (`:61`) — `%-_` es un rango, habilita caracteres no declarados. Marca/Línea/Superlínea/Presentación: `/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/` (`marca:14`, `linea:30`, `superlinea:16`, `presentacion:11`) rechazan `.`, `-`, `/` que el backend de Presentación **sí** permite (`…Errores_HTTP.md:364`). Todas aplican `.lowercase()` que muta el valor. |
| 8 | Valores numéricos sin reglas de dominio/finitud | **confirmed** | Producto: `costo` min 0 sin finitud (`:67`), `stock` opcional/nullable sin min (`:66`), `stockMinimo`/`cantidadPorPack` `moreThan(0)` sin finitud (`:107-116`), `porcentaje` min 0/max 999 (`:73`). Solo `actualizacion-masiva-precios` usa `Number.isFinite` (`formulario-precios.ts:22`). |
| 9 | Cotización: `moreThan(999)` con mensaje "mayor que 1000" y `maximoDolar` default 0 | **confirmed** | IVECO `interfaces-validaciones-precio-iveco.tsx:15-16` y NEX-PRO `…nex-pro.tsx:15-16`: `.moreThan(999, "La cotización debe ser mayor que 1000.")` permite `1000`; `crearSchemaValidacion(configuracion?.maximoDolar ?? 0)` (`…iveco-form.tsx:32`, `…nex-pro-form.tsx:32`) hace inválida cualquier cotización si la configuración no cargó. |
| 10 | Precio especial y montos de nota de crédito | **out-of-scope (not gestion-producto)** | `montos-item-nota-credito.tsx` y `seleccion-producto-con-porcentaje-presupuesto-venta.tsx` no tienen consumidores en `gestion-producto`. El conflicto de precio en Producto sí está en alcance (ver Riesgos). |
| 11 | E-mail: estado visual propio ≠ regla Yup | **out-of-scope (not gestion-producto)** | `email-input.tsx` solo lo consumen cliente, personal y usuarios (`gestion-organizacion`). |
| 12 | Cambio manual de precios: `errors.root` no renderizado | **outdated** | No existe `precios/cambio-precios-masivo/cambio-precios.manual.tsx`. El flujo actual `precios/actualizacion-masiva-precios` **sí** renderiza el error con `role="alert"` (`actualizacion-masiva-precios.tsx:30`). `lista_precios/util/lista-precios.tsx` muestra su error de carga (`:250-255`). |
| 13 | Formularios anidados que publican por `useEffect` (ítems proveedor/alternativo, sublíneas) | **outdated** | `RegistrarProveedorForm`, `RegistrarProductoAlternativoForm` y `RegistrarSublineaForm` **no se importan ni montan** en ningún flujo actual. El guard `itemProdAlternativoSinAgregar` (`registrar-actualizar-producto.tsx:94,270`) nunca se activa porque `setItemProdAlternativoSinAgregar` no se invoca. |

## Approachs

### 1. Endurecer esquemas Yup in-place + validadores reutilizables acotados (recomendada)

Corregir cada esquema de `gestion-producto` (IDs con `.integer().moreThan(0)`, textos con `trim`/`max`, numéricos con finitud, regex escapada) y extraer solo los helpers de formato/obligatoriedad repetidos a un módulo de validación de presentación. Extender `parseApiError` con una función que además mapee `fieldErrors[]` a `setError(field, …)`.

- Pros: menor superficie de cambio, respeta la arquitectura actual (esquema por feature), no introduce dependencias.
- Cons: hay que tocar varios esquemas; el mapeo de `fieldErrors` requiere revisar cada `catch`.
- Esfuerzo: Medio.

### 2. Unificar accesibilidad en los inputs compartidos + un `ErrorBanner` accesible

Además del punto 1, centralizar `aria-invalid`/`aria-describedby`/`role="alert"`/foco en `FormInput`, `PriceInput`, `CantidadesInput`, `PorcentajeInput` y `EntidadSelectorBase`, y reemplazar los `<div>` de `errors.root` por un componente accesible único.

- Pros: un solo lugar corrige todos los formularios del feature; elimina inconsistencias.
- Cons: los inputs compartidos también los usan otros módulos; el cambio tiene blast radius fuera de `gestion-producto` (ver Riesgos).
- Esfuerzo: Medio.

### 3. Reescribir los formularios de producto con un único `FormProvider` y validación previa al payload

Integrar los ítems hijos en el esquema padre y validar todo antes de construir el payload, alineando además costo/margen/precio con el dominio.

- Pros: resuelve de raíz el riesgo de guardar datos inválidos y las inconsistencias de dominio.
- Cons: alto esfuerzo; los componentes hijos hoy no están montados, así que primero hay que decidir si el alcance incluye reactivarlos.
- Esfuerzo: Alto.

## Recommendation

Adoptar el enfoque 1 como núcleo y el 2 de forma acotada, limitando el cambio de inputs compartidos a las props/atributos ARIA (sin alterar su API). El enfoque 3 debe quedar fuera salvo que el usuario confirme que los ítems proveedor/alternativo y sublíneas deben volver a integrarse: hoy son componentes huérfanos y no hay comportamiento que corregir en el flujo real. Antes de escribir la propuesta conviene confirmar con negocio/backend las reglas de stock mínimo, margen y longitud de denominación.

## Risks

- **Inconsistencia de dominio (precio):** el formulario de Producto permite editar `costo`, `precio` y `porcentaje` de forma independiente (`registrar-actualizar-producto.tsx:481-503`), pero el análisis de dominio define `Precio = Costo + Margen` (`docs/Analisis_de_Dominio.md` §5.1, §5.4). Validar solo rangos consolidaría la contradicción.
- **Inconsistencia de dominio (stock):** `stockActual` es de solo lectura en edición (`registrar-actualizar-producto.tsx:566-572`), pero no existe en `gestion-producto` un formulario de ajuste de stock con motivo; el análisis exige movimiento + motivo (§4.2, §5.3). La regla "stock > 0" del backend no equivale a "todo cambio es un movimiento".
- **`stockMinimo > 0` vs `>= 0`:** el frontend exige `moreThan(0)` en Producto y Línea (`interfaces-validaciones-producto.tsx:109`, `interfaces-validaciones-linea.tsx:34`); el contrato backend exige `> 0` en Producto pero solo `>= 0` en Línea (`…Errores_HTTP.md:479`). Falta una decisión de negocio.
- **`stock` en alta:** el formulario de creación no renderiza `stock` y el DTO `CreateProductoDto` lo exige (`…Errores_HTTP.md:296`). Puede producir 400 en alta; requiere confirmación antes de afirmarlo como defecto.
- **Blast radius de inputs compartidos:** `FormInput`, `PriceInput`, `CantidadesInput` y `PorcentajeInput` los usan también `gestion-organizacion` y otros módulos; tocarlos excede el alcance declarado salvo que se acepte explícitamente.
- **`alicuotaIva` al limpiar:** `selectedOption?.id || 0` (`registrar-actualizar-producto.tsx:537`) con `AlicuotaIva.ALICUOTA_0 = 0` (`interfaces-generales.tsx:97-102`) convierte "vaciar" en "IVA 0%", un valor válido del enum.
- **Sin infraestructura de pruebas:** `openspec/config.yaml` fija `strict_tdd: false` y no hay runner. Agregar tests exige una decisión explícita y nueva infraestructura, no puede asumirse.
- **Baseline en rojo:** lint y type-check ya fallan antes del cambio; cualquier verificación debe distinguir regresiones nuevas.

## Ready for Proposal

**Sí, con confirmaciones pendientes.** El alcance real de `gestion-producto` está delimitado y verificado. Antes de escribir la propuesta el usuario debe confirmar:

1. Si los inputs compartidos (`formateo-de-campos/**`, `entidad-selector-base.tsx`) pueden modificarse pese a que los consumen otros módulos.
2. Si el alcance incluye alinear Producto con el dominio (`Precio = Costo + Margen`, stock como solo lectura, `stockMinimo >= 0`).
3. Si los formularios huérfanos de ítems proveedor/alternativo y sublíneas deben reactivarse o declararse fuera de alcance.
4. Si se autoriza agregar infraestructura de pruebas (Vitest/RTL) para los validadores.

## Sketch items EXCLUDED (not `gestion-producto`)

- Clientes, proveedores, personal, localidad, condición de IVA y domicilios de organización.
- CUIT y DNI (`cuit-input.tsx`).
- Cabeceras/encabezados de documentos y comprobantes (`cabecera-documentos.tsx`, `encabezado-documentos*.tsx`, `selector-letra-gasto.tsx`).
- E-mail (`email-input.tsx`).
- Precio especial de presupuesto de venta y montos de nota de crédito.
- Selección de proveedor/cliente de cabecera (`seleccion-proveedor-cliente-cabecera.tsx`).
- Campos usados solo para búsqueda/filtrado.
