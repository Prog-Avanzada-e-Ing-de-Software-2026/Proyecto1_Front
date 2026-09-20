# Diseño — CR-005 Denominación automática

## Decisiones confirmadas

- Separador: un espacio entre Marca, Línea y Presentación.
- Alcance UI: solo creación (`producto` ausente).
- Vaciar el campo reactiva la sugerencia.
- Sin default ni lógica nueva en backend; solo actualización de lenguaje ubicuo en Back si se alinea el glosario.

## Límites

- Contexto Catálogo / Inventario: comportamiento de formulario, no invariante de persistencia.
- Backend sigue exigiendo `denominacion` explícita en el request de alta.

## Diseño técnico

1. **Utilidad pura** `generarDenominacionAutomatica({ marca, linea, presentacion })`:
   - Recibe las tres denominaciones (string).
   - Hace `trim` de cada parte.
   - Si falta alguna parte no vacía, retorna `null` (no sugerir).
   - Si están las tres, retorna `parte1 + ' ' + parte2 + ' ' + parte3`.

2. **Orquestación en** `registrar-actualizar-producto.tsx` (solo create):
   - Estado/ref: `sugerenciaActiva` y `ultimaSugerencia`.
   - Resolver denominaciones desde opciones/`watch` de `marcaId`, `lineaId`, `presentacionId`.
   - Si `sugerenciaActiva` y hay sugerencia válida → `setValue('denominacion', sugerida)`.
   - Si `watch('denominacion')` queda vacío → `sugerenciaActiva = true` y regenerar.
   - Si el valor actual ≠ `ultimaSugerencia` → marcar edición manual (`sugerenciaActiva = false`).

3. **FormInput**: sin cambio obligatorio; `Controller`/`watch` detectan cambios del campo.

## Alternativas descartadas

- Default en backend: rechazado por el CR (usuario debe conocer la generación).
- Regenerar en edición: rechazado por producto (identidad ya persistida).
- Separador literal ` + `: rechazado; se usa espacio.

## Verificación

- `yarn build` (obligatorio).
- `yarn lint` y `yarn tsc -b`: reportar baseline vs nuevo sin corregir ajenos.
- Recorrido manual de CA-1..CA-3 en Registrar Producto.
