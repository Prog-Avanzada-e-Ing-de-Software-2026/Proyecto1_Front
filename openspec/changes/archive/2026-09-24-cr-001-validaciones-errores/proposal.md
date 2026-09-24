# Proposal: CR-001 Validaciones y presentación de errores

## Intent

Evitar que los formularios activos de `gestion-producto` envíen valores incompatibles con el contrato HTTP y presentar errores claros, accesibles y vinculados con el campo correspondiente. El frontend mejorará la detección temprana y la experiencia de corrección, mientras el backend conservará la autoridad sobre las invariantes de negocio.

## Scope

### In Scope

- Mapear las respuestas HTTP 400 que incluyen `fieldErrors[]` a los campos de `react-hook-form`; reservar `root` para errores globales, de dominio o sin campo identificable.
- Endurecer los esquemas Yup activos de Producto, Marca, Línea, SuperLínea y Presentación según los DTO y reglas confirmadas: enteros positivos para identificadores, finitud y límites numéricos documentados, longitudes, espacios y caracteres permitidos.
- Corregir en Producto el rango accidental `%-_`, alinear `denominacion` con el máximo de 200 caracteres y validar `marcaId`/`lineaId` con `.integer().moreThan(0)`; conservar sin cambios las reglas ya correctas de `presentacionId` y `superLineaId`.
- Alinear los mensajes de denominación de Marca, Línea, SuperLínea y Presentación con sus expresiones permitidas, preservando el uso de mayúsculas y minúsculas ingresado por el usuario en lugar de transformarlo mediante `.lowercase()`.
- Alinear las validaciones numéricas de Producto con el contrato vigente: `costo` finito y mayor o igual a cero; margen, stock y stock mínimo finitos y mayores que cero; cantidad por pack como entero positivo cuando corresponda. En Línea, `stockMinimo` será finito y mayor o igual a cero.
- Incorporar un campo `stock` validado en el alta de Producto, exigir un número finito mayor que cero según `CreateProductoDto` e incluirlo en el payload de creación; en edición, el stock permanecerá visible como solo lectura y deshabilitado.
- Normalizar los campos de texto opcionales antes de construir el payload para que los valores `null`, vacíos o con solo espacios se omitan del cuerpo del request (como mínimo en Marca, Presentación y Producto), de forma consistente con el comportamiento ya existente en Línea y SuperLínea, de modo que el frontend nunca envíe `null` para un campo que el contrato declara opcional `string`.
- Exigir `stockMinimo` como obligatorio, finito y mayor que 0 en el alta y la edición de Producto, con independencia de `utilizaStockMinimo`; y omitir `cantidadPorPack` del payload cuando `utilizaPack` esté en `false`, para no enviar `0` donde el contrato espera el campo ausente.
- Evitar que la ausencia de `maximoDolar` se convierta silenciosamente en un máximo inválido igual a cero e informar la configuración faltante. La incoherencia confirmada entre `.moreThan(999)` y el mensaje “mayor que 1000” queda como decisión abierta y CR-001 no cambiará ese piso numérico sin definición de negocio.
- Agregar únicamente atributos y relaciones ARIA, identificadores estables de error y soporte de foco a los inputs y selectores compartidos indicados, sin modificar su API pública.
- Verificar manualmente los flujos afectados y ejecutar `yarn build`, `yarn lint` y `yarn tsc -b`, distinguiendo las fallas preexistentes de lint y type-check de cualquier regresión nueva.

### Out of Scope

- Cambios en API, backend, DTO, `ValidationPipe`, filtros HTTP o reglas autoritativas del servidor.
- Reactivar o modificar `RegistrarProveedorForm`, `RegistrarProductoAlternativoForm` o `RegistrarSublineaForm`, actualmente no montados.
- Cambios funcionales en `gestion-organizacion`, `gestion-usuario`, comerciales/comprobantes, CUIT/DNI, correo electrónico, cabeceras de documentos, precio especial o notas de crédito.
- Cambiar la API pública o el comportamiento funcional de consumidores externos de los componentes compartidos; su alcance se limita a conservar compilación y compatibilidad tras las adiciones ARIA internas.
- Rediseñar Producto, imponer una nueva fórmula de precio, implementar movimientos o ajustes de stock, o introducir Value Objects, eventos de dominio o CQRS.
- Validar extensión, MIME o tamaño de archivos para importaciones IVECO/NEX-PRO; esa validación se difiere a un cambio separado.
- Agregar Vitest, React Testing Library, otro runner o cobertura automatizada; `strict_tdd` permanece en `false`.

## Capabilities

### New Capabilities

- `validacion-errores-gestion-producto`: validación frontend alineada con el contrato HTTP, incluido el stock requerido al crear Producto, mapeo de `fieldErrors` y presentación accesible de errores dentro de `gestion-producto`.

### Modified Capabilities

- `superlinea-management`: precisar la asociación de errores de validación del backend con campos y la presentación accesible de errores globales.
- `superlinea-creation`: identificar de forma accesible los campos inválidos tanto en alta independiente como anidada.
- `linea-superlinea-association`: presentar de forma accesible los errores del selector y mapear errores de `superLineaId` sin alterar el comportamiento de asociación vigente.

## Approach

Conservar `react-hook-form` con `yupResolver` y endurecer los esquemas existentes in-place, extrayendo únicamente helpers de validación repetida cuando reduzcan inconsistencias sin crear una capa paralela. Extender el manejo de errores de `src/utils/errores.ts` con una representación tipada del envelope HTTP: si una respuesta 400 contiene `fieldErrors`, cada entrada se aplicará mediante `setError(field, ...)`; los mensajes sin campo, los errores de dominio y los demás estados HTTP se mostrarán en `root` con un fallback seguro.

La accesibilidad se incorporará dentro de `FormInput`, `PriceInput`, `CantidadesInput`, `PorcentajeInput` y `EntidadSelectorBase` mediante `aria-invalid`, `aria-describedby`, identificadores estables, `role="alert"`/`aria-live` y referencias de foco existentes, sin agregar ni cambiar props públicas. Los formularios de `gestion-producto` mantendrán sus límites actuales de componente, hook, servicio e interfaz. En el flujo de Producto, el esquema Yup exigirá `stock` finito y mayor que cero al crear, y el formulario lo renderizará e incluirá en el payload de alta sin habilitar su edición en el flujo de actualización.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/utils/errores.ts` | Modified | Tipar y distinguir `fieldErrors[]` de errores globales sin depender de `stack` ni `details`. |
| `src/componentes/gestion-producto/producto/interfaces/interfaces-validaciones-producto.tsx` | Modified | IDs positivos, regex normalizada, máximo de denominación, reglas numéricas finitas y regla de `stock` para creación. |
| `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` | Modified | Renderizar y enviar `stock` al crear, conservarlo deshabilitado y de solo lectura al editar, omitir `observacion`/`codigoProveedor`/`codigoReferencia` nulos o vacíos del payload, aplicar errores de servidor por campo y reservar `root` para errores globales accesibles. |
| `src/componentes/gestion-producto/marca/hooks/use-marca-form.ts` | Modified | Omitir `observacion` nula, vacía o con solo espacios del payload de edición mediante la normalización reutilizable. |
| `src/componentes/gestion-producto/presentacion/hooks/use-presentacion-form.ts` | Modified | Omitir `observacion` nula, vacía o con solo espacios del payload de edición mediante la normalización reutilizable. |
| `src/componentes/gestion-producto/{linea,superlinea}/**/*.{ts,tsx}` | Preserve existing behavior | Conservar sin cambios la omisión de `observacion` vacía ya aplicada en Línea y SuperLínea. |
| `src/componentes/gestion-producto/{marca,linea,superlinea,presentacion}/interfaces/interfaces-validaciones-*.tsx` | Modified | Alinear texto, caracteres, casing y números con los contratos confirmados. |
| `src/componentes/gestion-producto/{marca,linea,superlinea,presentacion}/**/*.{ts,tsx}` | Modified | Integrar el mapeo de errores HTTP en los formularios activos y anunciar errores globales. |
| `src/componentes/gestion-producto/precios/{iveco,nex-pro}/**/*.{ts,tsx}` | Modified | Informar la ausencia de configuración sin usar `maximoDolar ?? 0` y mejorar la presentación de errores, sin cambiar el piso de cotización pendiente. |
| `src/componentes/herramientas/formateo-de-campos/{form-input,price-input,cantidades-input,porcentaje-input}.tsx` | Modified | Agregar semántica ARIA, error estable y soporte de foco sin cambiar la API pública. |
| `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx` | Modified | Asociar accesiblemente el error al selector sin cambiar su API pública. |
| 19 archivos consumidores fuera de `src/componentes/gestion-producto/` | Verification only | Blast radius confirmado de los componentes compartidos, principalmente en `gestion-organizacion` y flujos comerciales; deben conservar compilación y comportamiento funcional. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Un nombre de `fieldErrors[].field` no coincide con un campo del formulario | Medium | Mantener una lista/mapeo tipado por formulario y degradar a `root` sin perder el mensaje. |
| Las adiciones ARIA rompen referencias o consumidores compartidos | Medium | No modificar props públicas; verificar los 19 consumidores externos mediante compilación y revisión manual representativa. |
| La validación frontend diverge de reglas autoritativas o futuras del backend | Medium | Derivar reglas solo del contrato HTTP, OpenAPI y análisis confirmados; mantener el error del servidor como autoridad final. |
| Una normalización de texto altera datos válidos | Medium | Aplicar `trim` solo donde el contrato lo permite y eliminar transformaciones `.lowercase()` que cambian el valor almacenado. |
| Regresar la omisión de `observacion` vacía ya aplicada en Línea y SuperLínea al tocar los formularios de Marca, Presentación y Producto | Medium | Centralizar la normalización en un helper reutilizable y verificar manualmente que Línea y SuperLínea sigan omitiendo la clave del payload. |
| La ausencia de configuración IVECO/NEX-PRO habilita una cotización inválida | Medium | Bloquear el envío y mostrar un estado de configuración no disponible; no usar `0` como fallback. |
| Lint y type-check ocultan regresiones entre fallas existentes | Medium | Comparar resultados con la línea base roja documentada y reportar por separado cualquier diagnóstico nuevo. |

## Rollback Plan

Revertir de forma conjunta los cambios de esquemas, el campo y payload de `stock` en el alta de Producto, el parser/mapeo de errores y los atributos ARIA. Como no hay cambios de API, persistencia ni migraciones, el rollback restaura el manejo anterior del frontend. Si una regresión se limita a los componentes compartidos, revertir primero las adiciones ARIA internas manteniendo el resto de las validaciones de `gestion-producto`.

## Dependencies

- `docs/contracts/Gestion_Productos_Errores_HTTP.md`, especialmente el envelope de validación y las notas para frontend de la sección 8.
- `docs/contracts/openapi.json` para endpoints, DTO, campos requeridos, patrones y límites publicados bajo `Gestion Productos`.
- `docs/Analisis_Cambios.md` y `docs/Analisis_de_Dominio.md` para reglas confirmadas; los elementos aspiracionales del dominio no se tratarán como comportamiento implementado.
- Resolución de las decisiones abiertas sobre el piso de cotización, los máximos de texto y la fórmula de precio antes de especificar o implementar esas partes.

## Open decisions

- Definir si la cotización IVECO/NEX-PRO admite `1000` (cambiar el mensaje a “mayor o igual a 1000”) o debe ser estrictamente mayor que `1000` (cambiar la regla). Las fuentes confirman la incoherencia, pero no la intención.
- Definir límites máximos frontend para `observacion`, `codigoProveedor`, `codigoReferencia` y `ubicacion` cuando OpenAPI solo declara `string`; no se incorporarán máximos arbitrarios.
- Resolver en un cambio separado la contradicción entre la edición directa de `precio` admitida por el flujo/DTO y la regla aspiracional `Precio = Costo + Margen`; CR-001 no modificará esa semántica.

## Success Criteria

- [ ] Una respuesta 400 con `fieldErrors[]` coloca cada mensaje en el campo correspondiente y no lo reduce al literal global `Bad Request Exception`.
- [ ] Los errores 400 sin `fieldErrors`, 401, 403, 404, 409, 500 y fallos de red se presentan como errores globales seguros y accesibles.
- [ ] Producto rechaza `marcaId`/`lineaId` iguales a `0`, denominaciones mayores a 200 caracteres, caracteres fuera del patrón contractual y valores numéricos no finitos o fuera de los límites confirmados; `presentacionId` y `superLineaId` no reciben correcciones redundantes.
- [ ] El alta de Producto muestra y valida `stock`, lo incluye en el payload de creación y satisface el contrato de `CreateProductoDto` con un número finito mayor que cero; en edición permanece deshabilitado y de solo lectura.
- [ ] Ningún cuerpo de request contiene `null` para un campo opcional `string` declarado por OpenAPI (`observacion`, `codigoProveedor`, `codigoReferencia`, etc.), y el comportamiento de omisión ya existente en Línea y SuperLínea se conserva.
- [ ] El alta y la edición de Producto exigen y envían `stockMinimo` (finito, mayor que 0) con independencia de `utilizaStockMinimo`, y no envían `cantidadPorPack` cuando `utilizaPack` está en `false`.
- [ ] Marca, Línea, SuperLínea y Presentación muestran mensajes coherentes con sus patrones contractuales y no convierten silenciosamente la denominación a minúsculas.
- [ ] Los flujos IVECO/NEX-PRO no usan `maximoDolar ?? 0` e informan cuando falta configuración, sin cambiar el piso de cotización mientras permanezca abierta la decisión de negocio.
- [ ] Los inputs y selectores afectados exponen `aria-invalid`, `aria-describedby`, identificadores de error estables y anuncios accesibles sin cambios en su API pública.
- [ ] Los 19 consumidores externos de los componentes compartidos continúan compilando y no reciben cambios funcionales deliberados.
- [ ] La verificación manual cubre alta y edición de Producto, Marca, Línea, SuperLínea y Presentación, errores de servidor por campo/globales, navegación por foco y cotización/configuración IVECO/NEX-PRO.
- [ ] `yarn build` finaliza correctamente.
- [ ] `yarn lint` y `yarn tsc -b` no introducen diagnósticos nuevos respecto de la línea base roja documentada; toda falla preexistente se reporta con evidencia exacta.
