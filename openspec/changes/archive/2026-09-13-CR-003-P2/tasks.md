# Tareas: CR-003-P2 — Gestión de SuperLínea y asociación editable

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas cambiadas estimadas | 600–800 (8 archivos nuevos, 10 modificados, integración y verificación) |
| Riesgo de presupuesto de 400 líneas | High |
| PR encadenadas recomendadas | Yes |
| División sugerida | PR 1 gestión independiente; PR 2 asociación editable e integración |
| Estrategia de entrega | auto-chain |
| Estrategia de cadena | feature-branch-chain (tracker `CR-003`; sin PR hacia `develop`) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unidad | Objetivo | PR probable | Comando focal | Harness runtime | Límite de reversión |
|---|---|---|---|---|---|
| 1 | CRUD, búsqueda, auditoría y navegación de SuperLínea; PR 1 base = rama tracker `CR-003` | PR 1 | Revisión estática de contratos + `yarn build` | Manual: `/admin/superlinea`, búsqueda, CRUD, 403/404/409 | Revertir módulos SuperLínea, ruta y menú |
| 2 | Selector y reasignación opcional en edición de Línea, preservando alta anidada; PR 2 base = rama inmediata de unidad 1 | PR 2 | Revisión estática de payloads Línea | Manual: alta/edición sin cambio, reasignación, catálogo vacío y cancelación | Revertir selector, transformación y payload de Línea |

## Fase 1: Contratos y servicios

- [x] 1.1 [SM-R1/R2] Actualizar `src/interfaces/gestion-producto/superlinea/interfaces-superlinea.tsx` con DTO, filtros y respuestas OpenAPI; actualizar `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` con los siete contratos, sin impresión/restauración.
- [x] 1.2 [LA-R1] Actualizar `src/interfaces/gestion-producto/linea/interfaces-linea.tsx` y `src/componentes/gestion-producto/linea/services/linea-service.tsx` para tipar `superLinea` y `UpdateLineaDto` con `superLineaId` opcional.

## Fase 2: Gestión independiente

- [x] 2.1 [SC-R1/R2] Ajustar `src/componentes/gestion-producto/superlinea/interfaces/interfaces-validaciones-superlinea.tsx` y `src/componentes/gestion-producto/superlinea/utils/registrar-superlinea.tsx` para validación 255, alta independiente/anidada, actualización y errores con estado conservado.
- [x] 2.2 [SM-R1/R2] Crear `src/componentes/gestion-producto/superlinea/utils/consultar-superlinea.tsx` y `src/componentes/gestion-producto/superlinea/hooks/use-superlinea-modal.ts` para consulta paginada, filtros, CRUD, auditoría y modales.
- [x] 2.3 [SM-R1/R3] Crear `src/componentes/gestion-producto/superlinea/componentes/filtros-superlinea.tsx`, `src/componentes/gestion-producto/superlinea/componentes/datos-tabla.tsx`, `src/componentes/gestion-producto/superlinea/componentes/datos-card.tsx`, `src/componentes/gestion-producto/superlinea/componentes/header.tsx` y `src/componentes/gestion-producto/superlinea/componentes/header-lg.tsx`, sin acciones de impresión/restauración.
- [x] 2.4 [SM-R1] Crear `src/componentes/gestion-producto/superlinea/modales/superlinea-modal.tsx` componiendo formulario y auditoría.

## Fase 3: Asociación e integración

- [x] 3.1 [LA-R1/R2] En `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` y `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx`, cargar el endpoint de selección, inicializar la asociación actual y enviar `superLineaId` solo al reasignar.
- [x] 3.2 [LA-R2/SC-R2] En `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx`, preservar `+`, cancelación, refresco sin auto-selección y estado padre del flujo anidado.
- [x] 3.3 [SM-R3] Modificar `src/App.tsx` y `src/componentes/menu/menuItems-definicion.ts` con ruta hermana y permisos equivalentes a Línea.

## Fase 4: Verificación

- [x] 4.1 Verificar manualmente escenarios SM-R1–R3 y SC-R1–R2: búsqueda/paginación, CRUD/auditoría, validación, errores 403/404/409 y ausencia de impresión/restauración.
- [x] 4.2 Verificar manualmente LA-R1/R2: alta, catálogo vacío, edición sin cambio/reasignación, fallos y cancelación; ejecutar `yarn build`, `yarn lint`, `yarn tsc -b`, reportando el baseline preexistente.

## Fuera de alcance

La deshabilitación del botón independiente «Actualizar» cuando no hay cambios queda como deuda técnica no normativa; no se crea una tarea completada ni se condiciona esta implementación.
