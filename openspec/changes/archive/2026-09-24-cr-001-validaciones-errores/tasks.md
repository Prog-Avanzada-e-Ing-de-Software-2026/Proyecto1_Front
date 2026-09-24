# Tareas: CR-001 Validaciones y presentación de errores

> Capability nueva: `validacion-errores-gestion-producto`.
> Deltas: `superlinea-management`, `superlinea-creation`, `linea-superlinea-association`.
>
> **Fuera de alcance** (no crear tareas para esto): validación de extensión/MIME/tamaño de archivos de importación, piso de cotización IVECO/NEX-PRO y máximos de `observacion`/`codigoProveedor`/`codigoReferencia`/`ubicacion` (decisiones abiertas), fórmula `precio` vs `Costo + Margen`, formularios anidados no montados, y cualquier runner, framework o cobertura automatizada (`strict_tdd: false`).
>
> **Sin tareas de test automatizado.** La verificación es manual y por gates de compilación. Ninguna tarea debe agregar Vitest, React Testing Library ni un runner nuevo.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas cambiadas estimadas | ~520–620 (adiciones + eliminaciones, excluyendo archivos generados) |
| Archivos de producción | 23 (22 modificados + 1 nuevo: `src/utils/payload.ts`) |
| Riesgo de presupuesto de 400 líneas | High |
| PRs encadenados recomendados | Yes |
| Estrategia de encadenado | pending (decisión de equipo) |
| Estrategia de entrega (sesión) | ask-on-risk |
| Decisión requerida antes de apply | Yes |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

### Unidades de trabajo sugeridas

| Unidad | Objetivo | PR probable | Comando de verificación focalizado | Runtime harness | Límite de rollback |
|---|---|---|---|---|---|
| 1 | Fundación de errores y normalización de payload (utils) | PR 1 | `yarn tsc -b` sin diagnósticos nuevos | N/A — utilidades puras sin superficie de UI todavía; se ejercitan al integrarse en PR 4 y PR 5 | `src/utils/errores.ts`, `src/utils/payload.ts` |
| 2 | Semántica accesible en componentes compartidos | PR 2 | `yarn build` + `yarn tsc -b` (blast radius de consumidores externos) | `yarn dev` + render de un consumidor representativo fuera de `gestion-producto` (read-only) verificando `aria-invalid`/`aria-describedby` y ausencia de error | Los 5 archivos de componentes compartidos (`form-input`, `price-input`, `cantidades-input`, `porcentaje-input`, `entidad-selector-base`) |
| 3 | Endurecimiento de esquemas de validación | PR 3 | `yarn tsc -b` sin diagnósticos nuevos | N/A — solo validación; se ejercita en PR 4 y PR 5 | Los 5 archivos de `interfaces-validaciones-*` |
| 4 | Integración de errores y normalización en hooks/utilidades de formulario | PR 4 | `yarn tsc -b` + `yarn build` | `yarn dev` alta/edición de Marca, Presentación, Línea y SuperLínea con respuesta 400 simulada | Hooks y utils de `marca`, `presentacion`, `linea`, `superlinea` |
| 5 | Alta de Producto: stock, payload y selector de Línea | PR 5 | `yarn tsc -b` + `yarn build` | `yarn dev` alta y edición de Producto (stock, IDs, payload) | `producto/utils/registrar-actualizar-producto.tsx`, `producto/componentes/configuracion/lineas-selector.tsx` |
| 6 | Configuración de cotización IVECO/NEX-PRO + verificación final | PR 6 | `yarn build` + `yarn lint` + `yarn tsc -b` comparados con la línea base roja | `yarn dev` IVECO y NEX-PRO sin `maximoDolar` | Los 4 archivos de `precios/iveco` y `precios/nex-pro` |

**Estrategia de encadenado pendiente.** Si el equipo elige `feature-branch-chain`, la base esperada es: PR 1 → rama tracker; PR 2 → base PR 1; PR 3 → base PR 2; PR 4 → base PR 3; PR 5 → base PR 4; PR 6 → base PR 5. Si un PR hijo mostrara cambios del PR anterior, la base está mal y debe retargetearse o rebasarse antes de la revisión. Con `stacked-to-main`, cada PR se fusiona en orden a `main`.

## Fase 1: Fundación de errores y normalización de payload (utils)

- [x] 1.1 Definir en `src/utils/errores.ts` las interfaces `ApiFieldError` y `ParsedApiError` y guards defensivos que lean `response.data` sin depender de `stack` ni `details`, aceptando únicamente entradas con `field: string` y `messages: string[]`, y tomando `status` desde `data.statusCode` o `response.status`. — Traza: `validacion-errores-gestion-producto` · Req: Mapeo de errores HTTP (D1).
- [x] 1.2 Implementar `parseApiErrorDetails(error): ParsedApiError` reutilizando los fallbacks actuales (body string, `message` string/array/objeto) y garantizando que un 400 de validación con mensajes de campo utilizables no presente `Bad Request Exception` como mensaje raíz. — Traza: Req: Mapeo de errores HTTP (Escenario: Errores por campo, Escenario: Fallback global).
- [x] 1.3 Reimplementar `parseApiError(error): string` como adaptador compatible que devuelva el mensaje global del parser estructurado, sin cambiar su firma pública. — Traza: Req: Mapeo de errores HTTP; contrato público conservado (D1).
- [x] 1.4 Agregar `applyApiErrors<T extends FieldValues>(error, setError, fieldMap)` con `ApiFieldMap<T>` tipado: concatena los mensajes por campo reconocido con `setError(field, { type: "server", message })`, enfoca el primer campo reconocible cuando RHF lo permita, acumula campos desconocidos en `root` y aplica el mensaje global normalizado a `root` cuando no hay `fieldErrors[]`; nunca convierte un string arbitrario en `FieldPath<T>`. — Traza: Req: Mapeo de errores HTTP (Escenarios: Errores por campo, Campo no reconocido, Fallback global) (D2).
- [x] 1.5 Crear `src/utils/payload.ts` con `omitEmptyOptionalStrings<T>(payload, keys)` puro: omite claves con valor `null`, `undefined`, cadena vacía o solo espacios, y recorta (`trim`) los valores no vacíos que permanecen. — Traza: Req: Normalización de campos opcionales (Escenarios: Edición con observación vacía, Observación no vacía recortada) (D8).

## Fase 2: Semántica accesible en componentes compartidos

- [x] 2.1 `src/componentes/herramientas/formateo-de-campos/form-input.tsx`: generar id estable con `useId()`, exponer `aria-invalid` y `aria-describedby` (omitido sin error), renderizar el mensaje con `role="alert"`/`aria-live="polite"` y combinar `field.ref`, `inputRef` y `maskRef` mediante callback sin sobrescribir `field.ref`. Sin cambiar props públicas. — Traza: Req: Presentación accesible de errores (Escenarios: Error asociado al campo, Primer campo inválido) (D6, D7); `superlinea-creation` · Scenario: API failures.
- [x] 2.2 `src/componentes/herramientas/formateo-de-campos/price-input.tsx`: mismos atributos ARIA sobre `NumericFormat` y registro interno de ref compatible con RHF sin alterar props. — Traza: Req: Presentación accesible de errores.
- [x] 2.3 `src/componentes/herramientas/formateo-de-campos/cantidades-input.tsx`: mismos atributos ARIA y asociación del mensaje de error. — Traza: Req: Presentación accesible de errores.
- [x] 2.4 `src/componentes/herramientas/formateo-de-campos/porcentaje-input.tsx`: mismos atributos ARIA y asociación del mensaje de error. — Traza: Req: Presentación accesible de errores.
- [x] 2.5 `src/componentes/herramientas/reutilizables/entidad-selector-base.tsx`: asociar el error ya recibido por prop con `inputId`, `aria-invalid` y `aria-describedby` sobre `react-select`, con mensaje de id estable y `role="alert"`, sin agregar props. — Traza: Req: Presentación accesible de errores; `linea-superlinea-association` · Req: Association errors are actionable (Scenario: Field-specific association failure).

## Fase 3: Endurecimiento de esquemas de validación

- [x] 3.1 Definir una prueba reutilizable de finitud basada en `Number.isFinite`, aplicada después de las transformaciones de vacío, de modo que `.required()`/`.typeError()` conserven sus mensajes específicos. — Traza: Req: Validación de identificadores y números (Escenario: Número no finito o fuera de límite) (D3).
- [x] 3.2 `src/componentes/gestion-producto/producto/interfaces/interfaces-validaciones-producto.tsx`: `denominacion` con `.trim().required().max(200).matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-\/%]+$/)` y eliminar `.lowercase()`. — Traza: Req: Validación de denominaciones (Escenarios: Denominación de Producto válida, Denominación fuera de contrato).
- [x] 3.3 Producto: `marcaId`, `lineaId` y `presentacionId` transforman `""` a `null` y aplican `.required().integer().moreThan(0)`; conservar sin cambios la regla ya correcta de `superLineaId` donde aplique. — Traza: Req: Validación de identificadores y números (Escenarios: Identificador inválido, Selector limpiado).
- [x] 3.4 Producto: `costo` finito y `.min(0)`; `porcentaje` finito y `.moreThan(0)` conservando su máximo vigente; `stockMinimo` finito y `.moreThan(0)`; `cantidadPorPack` requerido/finito/`.integer()`/`.moreThan(0)` solo cuando `utilizaPack`; `stock` requerido y finito con `.moreThan(0)` en alta y validación de finitud/positividad en edición. — Traza: Req: Validación de identificadores y números; Req: Stock en alta de Producto (Escenarios: Alta con stock válido, Alta sin stock válido) (D3, D4).
- [x] 3.5 Producto `transformData`/`defaultValues`: reemplazar `option?.id || 0` por `undefined`/`null` compatibles con RHF/Yup en `marcaId`, `lineaId` y `presentacionId`, y no sustituir `alicuotaIva` limpiada por `0`. — Traza: Req: Validación de identificadores y números (Escenario: Selector limpiado) (D4). (Reabierta y completada: además de `transformData`/`defaultValues`, se corrigieron los `onChange` de `marcaId`, `lineaId`, `presentacionId` y `alicuotaIva` en `registrar-actualizar-producto.tsx` para escribir `null` al limpiar el selector, evitando que `alicuotaIva` limpiada quede como `ALICUOTA_0`.)
- [x] 3.6 `src/componentes/gestion-producto/marca/interfaces/interfaces-validaciones-marca.tsx`: `denominacion` con `.trim().required().max(255).matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/)` sin `.lowercase()`. — Traza: Req: Validación de denominaciones (Escenario: Denominación fuera de contrato).
- [x] 3.7 `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx`: `denominacion` alfanumérica de 255 sin `.lowercase()`; `superLineaId` `.required().integer().moreThan(0)` en alta y `.integer().moreThan(0)` en edición con omisión preservada; `stockMinimo` finito y `.min(0)`. — Traza: Req: Validación de identificadores y números; Req: Validación de denominaciones; `linea-superlinea-association` · Req: Select an active SuperLínea (Scenarios: Required selection and payload, Edit unchanged association).
- [x] 3.8 `src/componentes/gestion-producto/superlinea/interfaces/interfaces-validaciones-superlinea.tsx`: `denominacion` alfanumérica de 255, `.trim()`, sin `.lowercase()`. — Traza: Req: Validación de denominaciones; `superlinea-creation` · Scenario: Required denomination boundary.
- [x] 3.9 `src/componentes/gestion-producto/presentacion/interfaces/interfaces-validaciones-presentacion.tsx`: `denominacion` con `.trim().required().max(255).matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-\/]+$/)` sin `.lowercase()`. — Traza: Req: Validación de denominaciones (Escenario: Caracteres de Presentación).

## Fase 4: Integración de errores y normalización en hooks/utilidades de formulario

- [x] 4.1 `src/componentes/gestion-producto/marca/hooks/use-marca-form.ts`: mapear `denominacion` y `observacion`; aplicar `applyApiErrors` con el mapa local y construir el payload de edición con `omitEmptyOptionalStrings(payload, ["observacion"])`. — Traza: Req: Mapeo de errores HTTP; Req: Normalización de campos opcionales (Escenario: Edición con observación vacía) (D2, D8).
- [x] 4.2 `src/componentes/gestion-producto/presentacion/hooks/use-presentacion-form.ts`: idéntico tratamiento (`denominacion`, `observacion`) y payload normalizado. — Traza: Req: Mapeo de errores HTTP; Req: Normalización de campos opcionales (Escenario: Edición con observación vacía).
- [x] 4.3 `src/componentes/gestion-producto/marca/utils/registrar-actualizar-marca.tsx`: renderizar el error raíz con `role="alert"`/`aria-live="assertive"`. — Traza: Req: Presentación accesible de errores; `superlinea-management` · Req: Errores accesibles de SuperLínea (Scenario: Error de campo anunciado).
- [x] 4.4 `src/componentes/gestion-producto/presentacion/utils/registrar-actualizar-presentacion.tsx`: idéntico anuncio accesible del error raíz. — Traza: Req: Presentación accesible de errores.
- [x] 4.5 `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx`: mapa local (`denominacion`, `observacion`, `stockMinimo`, `utilizaStockMinimo`, `superLineaId`), aplicación de errores por campo/root con anuncio accesible, y preservación de la omisión vigente de `observacion` vacía y de asociación sin cambios. — Traza: Req: Mapeo de errores HTTP; Req: Normalización de campos opcionales (Escenario: Línea y SuperLínea preservan la omisión); `linea-superlinea-association` · Req: Select an active SuperLínea (Escenario: Edit unchanged association).
- [x] 4.6 `src/componentes/gestion-producto/superlinea/utils/registrar-superlinea.tsx`: mapa local (`denominacion`, `observacion`), errores por campo/root accesibles tanto en alta independiente como anidada, preservando la omisión de `observacion` vacía. — Traza: `superlinea-creation` · Req: Create SuperLínea from Línea creation (Scenarios: API failures, Valid nested or standalone creation); `superlinea-management` · Req: Errores accesibles de SuperLínea; Req: Normalización de campos opcionales (Escenario: Línea y SuperLínea preservan la omisión).

## Fase 5: Alta de Producto: stock, payload y selector de Línea

- [x] 5.1 `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx`: renderizar `CantidadesInput name="stock"` habilitado y requerido en alta (con default vacío, sin valor positivo ficticio) y, en edición, visible con `disabled`/`readOnly` efectivo conservando el valor de `transformData`. — Traza: Req: Stock en alta de Producto (Escenarios: Alta con stock válido, Alta sin stock válido, Stock en edición) (D4).
- [x] 5.2 Producto: construir el payload de creación incluyendo `stock` como número y aplicar `omitEmptyOptionalStrings(payload, ["observacion", "codigoProveedor", "codigoReferencia"])`; el branch de edición conserva el stock cargado y no habilita su edición. — Traza: Req: Stock en alta de Producto (Escenario: Alta con stock válido); Req: Normalización de campos opcionales (Escenarios: Edición con observación vacía, Observación no vacía recortada) (D4, D8).
- [x] 5.3 Producto: reemplazar el uso directo de `parseApiError` en el `catch` por `applyApiErrors(setError, mapaProducto)` con el mapa de campos de Producto de D2, reservando `root` para campos desconocidos y errores globales, y anunciar `errors.root` con `role="alert"`/`aria-live="assertive"`. — Traza: Req: Mapeo de errores HTTP (Escenarios: Errores por campo, Campo no reconocido, Fallback global); Req: Presentación accesible de errores (D2, D6).
- [x] 5.4 `src/componentes/gestion-producto/producto/componentes/configuracion/lineas-selector.tsx`: cablear `aria-invalid`/`aria-describedby` y el mensaje con id estable usando la prop `errors` existente, sin cambiar la API pública. — Traza: `linea-superlinea-association` · Req: Association errors are actionable (Scenario: Field-specific association failure); Req: Presentación accesible de errores (D6).
- [x] 5.5 Producto: `stockMinimo` obligatorio, finito y mayor que 0 siempre (input editable y clave enviada con independencia de `utilizaStockMinimo`); en el payload de alta y edición, omitir `cantidadPorPack` cuando `utilizaPack === false`, sin enviar `0`. — Traza: Req: Normalización de campos opcionales (Escenarios: Stock mínimo obligatorio con independencia de la bandera, Pack desmarcado, Pack usado) (D9).

## Fase 6: Configuración de cotización IVECO/NEX-PRO

- [x] 6.1 `src/componentes/gestion-producto/precios/iveco/interfaces-validaciones-precio-iveco.tsx`: calcular `maximoDolar` como `number | undefined` y `configuracionDisponible` solo cuando existe y es finito; aplicar `.max(maximoDolar)` únicamente si está disponible, sin `maximoDolar ?? 0` y sin resolver el piso. — Traza: Req: Configuración de cotización (Escenario: Configuración ausente) (D5).
- [x] 6.2 `src/componentes/gestion-producto/precios/iveco/importacion-precios-iveco-form.tsx`: mostrar y anunciar "La configuración de cotización no está disponible.", deshabilitar el submit y agregar un guard al inicio de `onSubmit` que escriba el mismo error en `root`, con errores accesibles. — Traza: Req: Configuración de cotización (Escenario: Configuración ausente); Req: Presentación accesible de errores (D5).
- [x] 6.3 `src/componentes/gestion-producto/precios/nex-pro/interfaces-validaciones-precio-nex-pro.tsx`: mismo tratamiento del máximo opcional sin fallback a cero. — Traza: Req: Configuración de cotización (Escenario: Configuración ausente).
- [x] 6.4 `src/componentes/gestion-producto/precios/nex-pro/importacion-precios-nex-pro-form.tsx`: mismo estado de configuración, bloqueo, guard y errores accesibles. — Traza: Req: Configuración de cotización (Escenario: Configuración ausente).

## Fase 7: Verificación manual y gates de calidad

- [x] 7.1 Verificar alta de Producto: stock habilitado; vacío/`NaN`/infinito/`0`/negativo bloquean; un valor finito mayor que cero llega en el payload; edición muestra el stock deshabilitado y de solo lectura. — Traza: Req: Stock en alta de Producto (los tres escenarios).
- [x] 7.2 Verificar Producto: limpiar Marca/Línea/Presentación no escribe `0`; denominación de 200 caracteres conserva casing, 201 y caracteres fuera del patrón fallan; `costo`/`porcentaje`/`stockMinimo`/`cantidadPorPack` rechazan no finitos y límites inválidos. — Traza: Req: Validación de identificadores y números; Req: Validación de denominaciones.
- [x] 7.3 Verificar normalización de payload en Marca, Presentación y Producto (omisión de `observacion` vacía y recorte de la no vacía) y que Línea y SuperLínea siguen omitiéndola sin cambios. — Traza: Req: Normalización de campos opcionales (los tres escenarios).
- [x] 7.4 Verificar mapeo de errores: un 400 con varios `fieldErrors` aplica cada mensaje a su campo sin `Bad Request Exception` en root; campo desconocido y 400 sin `fieldErrors`, 401/403/404/409/500 y fallo de red producen un root seguro y accesible. — Traza: Req: Mapeo de errores HTTP (los tres escenarios); deltas de `superlinea-management`, `superlinea-creation` y `linea-superlinea-association`.
- [x] 7.5 Verificar accesibilidad: cada control inválido expone `aria-invalid` y `aria-describedby` hacia el mensaje estable, el mensaje usa `role="alert"`/`aria-live`, y `FormInput` recibe foco en el primer error cuando RHF lo solicita. — Traza: Req: Presentación accesible de errores (ambos escenarios).
- [x] 7.6 Verificar IVECO y NEX-PRO sin `maximoDolar`: se anuncia la configuración no disponible, el submit queda deshabilitado y no se construye un máximo cero; con configuración se conserva el piso vigente sin decidir si `1000` se incluye. — Traza: Req: Configuración de cotización (Escenario: Configuración ausente).
- [x] 7.7 Confirmar que los consumidores externos de los componentes compartidos fuera de `src/componentes/gestion-producto/` (read-only) siguen compilando y conservan su comportamiento funcional, sin props nuevas ni cambios de firma. — Traza: Req: Presentación accesible de errores; blast radius de D6.
- [x] 7.8 Ejecutar `yarn build` (exit 0) y `yarn lint`/`yarn tsc -b`, comparando cada diagnóstico con la línea base roja documentada y reportando por separado cualquier regresión nueva con comando, exit code y salida relevante. — Traza: criterios de éxito del proposal; gates de calidad del design.
