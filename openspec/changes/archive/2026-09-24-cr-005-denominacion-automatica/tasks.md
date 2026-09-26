# Tasks — CR-005 Denominación automática

## 1. Documentación y especificación

- [x] 1.1 Guardar pedido en `docs/Pedidos de Cambio/CR-005/CR-005.md`
- [x] 1.2 Completar proposal, specs, design y tasks del change
- [x] 1.3 Actualizar lenguaje ubicuo en Front y Back (`Denominación automática`)

## 2. Implementación

- [x] 2.1 Crear utilidad pura `generarDenominacionAutomatica`
- [x] 2.2 Integrar sugerencia solo en creación en `registrar-actualizar-producto.tsx` (CA-1..CA-3 + vaciar reactiva)

## 3. Verificación

- [x] 3.1 `yarn build` y reportar exit status — exit 0 (2026-09-17)
- [x] 3.2 `yarn lint` / `yarn tsc -b` vs baseline; no corregir ajenos — lint exit 1 (17/128), tsc exit 2; sin hits en archivos CR-005
- [x] 3.3 Contrastar requisitos y redactar evidencia — `verify-report.md`
