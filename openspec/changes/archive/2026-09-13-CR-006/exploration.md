# Revisión de integración — CR-006

Fecha: 2026-09-13. Revisión estática; no se ejecutó la pantalla ni se consumió el backend.

## CodeGraph

- `git rev-parse --show-toplevel`: exit 0, `/home/vcorrea/prog-avanz/frontend`.
- `codegraph status`: exit 0, pero informa `Not initialized`.
- `codegraph_explore` con projectPath del repositorio: informa proyecto sin índice consultable.
- `.codegraph/` contiene únicamente `.gitignore`. Se utilizó lectura dirigida como fallback. No se inicializó el índice.

## Flujo verificado en código

| Archivo | Evidencia |
|---|---|
| `src/App.tsx` | Ruta `/admin/cambio-precios-masivo` conectada al componente antiguo |
| `src/componentes/menu/menuItems-definicion.ts` | Sin entrada para cambio masivo; Gestión Productos excluye a Empleado |
| `src/componentes/menu/sidebarMenus.tsx` | Filtra padres e hijos con `canShow`; navega por `handleNavigate` |
| `src/pages/administracion-page.tsx` | Compone menú, filtros laterales y Outlet |
| `src/componentes/gestion-producto/precios/cambio-precios-masivo/componentes/filtros-cambio-precios.tsx` | Marca/Línea/SubLínea, Buscar, Porcentaje, Aplicar Cambios y Guardar Cambios |
| `src/componentes/gestion-producto/precios/cambio-precios-masivo/hooks/useCambioPrecios.ts` | Buscar carga productos; aplicar envía items/porcentaje; guardar envía items/usuarioCreatedId |
| `src/componentes/gestion-producto/precios/cambio-precios-masivo/componentes/tabla-cambio-precios.tsx` | Acciones por fila para editar y quitar del conjunto local |
| `src/componentes/gestion-producto/precios/cambio-precios-masivo/util/cambio-precios-masivo.tsx` | Usa filtros y catálogos compartidos; activa Marca/Línea/SubLínea en filtros laterales |

El flujo previo presenta precios ocasional, mayorista, cliente y oferta. CR-006 usa costo/precio únicos y un POST con alcance seleccionado por backend. La compatibilidad funcional no se resuelve cambiando solo la URL del servicio.

## Decisión propuesta

Reemplazar el contenido de la URL existente y agregar entrada «Actualización masiva de precios» en Gestión Productos. Incluir Empleado en el padre y restringir la nueva entrada a los tres roles del contrato, sin ampliar permisos de otros hijos. Mantener Lista de precios independiente.

Decisión posterior a la revisión: el 2026-09-13 el usuario confirmó la sustitución con «si, avancemos». D1 quedó resuelta en proposal, design y tasks; R6 registra los escenarios de integración. No se modificó código.

## Verificación de esta entrega

Cambios documentales solamente. Inspección del diff de design y del archivo nuevo; build/lint/type-check no ejecutados porque no hubo cambios de fuente. Los fallos históricos de calidad no fueron reevaluados.
