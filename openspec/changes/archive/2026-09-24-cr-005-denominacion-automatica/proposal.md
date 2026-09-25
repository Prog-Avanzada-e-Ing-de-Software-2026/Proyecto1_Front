# Proposal: CR-005 Denominación automática

## Intent

Agregar el término **Denominación automática** al lenguaje ubicuo y, al registrar un Producto, sugerir en el formulario del frontend la concatenación `Marca Línea Presentación` (separador espacio), editable y sin sobrescribir una edición manual. El backend no aplica valor por defecto.

## Scope

### In Scope

- Documentar CR-005 y el change OpenSpec.
- Actualizar el glosario de dominio (Front; Back solo lenguaje ubicuo).
- Utilidad pura de generación de denominación automática.
- Sugerencia en el formulario de **creación** de Producto cuando hay Marca, Línea y Presentación seleccionadas.
- Edición manual y no sobrescritura (CA-2, CA-3); reactivación al vaciar el campo.

### Out of Scope

- Cambios de API, DTO, entidades o defaults en backend.
- Regenerar denominación al editar un Producto existente.
- Nuevas entidades, Value Objects, eventos o CQRS.
- ABMC de Presentación (CR-002).

## Capabilities

### New Capabilities

- `denominacion-automatica-producto`: sugerencia de denominación en alta de Producto.

### Modified Capabilities

None required in `openspec/specs/` beyond this delta.

## Approach

Mantener la regla en una función de dominio de presentación reutilizable y orquestarla en el formulario de alta con un flag de edición manual. Sin tocar el contrato HTTP de Producto.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `docs/Pedidos de Cambio/CR-005/` | New | Pedido de cambio |
| `docs/Analisis_de_Dominio.md` | Modified | Lenguaje ubicuo |
| `producto/domain` o `producto/utils` | New | Generador puro |
| `registrar-actualizar-producto.tsx` | Modified | Sugerencia solo en create |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Sobrescribir edición manual | Medium | Flag de edición + comparación con última sugerencia |
| Confusión create vs edit | Low | Activar solo cuando no hay `producto` |
| Dependencia de CR-002 incompleta | Medium | Requiere Presentación seleccionable en el form |

## Rollback Plan

Revertir el change de frontend y el término de glosario; no hay migración ni contrato de API que revertir.

## Dependencies

- CR-002: asociación Producto–Presentación en UI.
- Decisiones de producto: separador espacio; solo crear; vaciar reactiva sugerencia.

## Success Criteria

- [ ] CA-1, CA-2 y CA-3 verificables en el alta de Producto.
- [ ] Backend sin default de denominación por este change.
- [ ] `yarn build` sin regresiones introducidas por CR-005.
