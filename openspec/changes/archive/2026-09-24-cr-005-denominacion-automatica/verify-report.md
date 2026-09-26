# Verify report — CR-005 Denominación automática

Fecha: 2026-09-17

## Conformance

| Req / CA | Evidencia | Resultado |
|---|---|---|
| CA-1 sugerencia Marca Línea Presentación | `generarDenominacionAutomatica` + efecto en create de `registrar-actualizar-producto.tsx` | Implementado |
| CA-2 editable | Campo `denominacion` sigue siendo `FormInput` editable | Implementado |
| CA-3 no sobrescribe manual | Flag `sugerenciaDenominacionActiva` + comparación con `ultimaDenominacionAutomaticaRef` | Implementado |
| Vaciar reactiva | Trim vacío → reactiva sugerencia | Implementado |
| Solo crear | Guards `if (producto)` | Implementado |
| Sin default backend | Sin cambios de API/DTO/entity | Conforme |
| Lenguaje ubicuo | Front/Back `Analisis_de_Dominio.md` + `docs/Pedidos de Cambio/CR-005/` | Conforme |

## Quality gates

| Command | Exit | Notes |
|---|---|---|
| `yarn build` | 0 | OK |
| `yarn lint` | 1 | 17 errors, 128 warnings; sin hits en archivos CR-005 (baseline preexistente) |
| `yarn tsc -b` | 2 | Errores preexistentes ajenos; sin hits en archivos CR-005 |

## Manual pending

Recorrido UI de CA-1..CA-3 en Registrar Producto (usuario).
