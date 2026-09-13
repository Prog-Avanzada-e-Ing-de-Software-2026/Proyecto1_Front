## Exploration: CR-003-P2 — Gestión de SuperLínea y asociación en edición de Línea

### Current State
El frontend ya tiene `SuperLineaService.obtenerSelect()` para `GET /superlinea/select` y creación anidada mediante `POST /superlinea`. `RegistrarActualizarLineaForm` solo renderiza `superLineaId` al crear; al editar envía `usuarioUpdatedId` y no presenta la asociación. `consultar-linea.tsx` aporta el patrón de tabla paginada, alta, edición, auditoría, eliminación y filtros. `App.tsx` registra `/admin/linea`, pero no una ruta SuperLínea.

El contrato autoritativo es `docs/contracts/openapi.json` y documenta los siguientes contratos, todos con `security: [{ bearer: [] }]` salvo que se indique lo contrario:

| Capability | Contracto verificado |
|---|---|
| Crear | `POST /api/superlinea`, `SuperLineaController_create`; body requerido `CreateSuperLineaDto`: `denominacion` (string, max 255), `observacion` (string) y `usuarioCreatedId` (number), siendo obligatorios `denominacion` y `usuarioCreatedId`; respuesta `201 MensajeDto`. |
| Buscar/listar | `GET /api/superlinea/search-by`, `SuperLineaController_search`; query opcional `denominacion` (string), `skip` (number, default 0), `take` (number, default 10), `incluirEliminados` (boolean, default false); respuesta `200 SuperLineaListResponseDto` (`data: SuperLineaDto[]`, `total: number`). |
| Select | `GET /api/superlinea/select`, `SuperLineaController_select`; query opcional `denominacion` (string), para SuperLíneas activas; respuesta `200 SuperLineaListResponseDto`. |
| Obtener | `GET /api/superlinea/{id}`, `SuperLineaController_findOne`; path `id` requerido (number); respuesta `200 SuperLineaDto`. |
| Actualizar | `PUT /api/superlinea/{id}`, `SuperLineaController_update`; path `id` requerido y body `UpdateSuperLineaDto`, con `usuarioUpdatedId` obligatorio y `denominacion`/`observacion` opcionales; respuesta `200 MensajeDto`. |
| Eliminar | `DELETE /api/superlinea/{id}`, `SuperLineaController_remove`; path `id` y query `usuarioId` requeridos (number); respuesta `200 MensajeDto`; `409` si existen Líneas activas asociadas. El contrato no explicita aquí si la eliminación es lógica, aunque `deletedAt` nullable y `incluirEliminados` lo sugieren; no debe elevarse a requisito sin confirmación adicional. |
| Auditoría | `GET /api/superlinea/{id}/audit`, `SuperLineaController_findByIdConAuditoria`; path `id` requerido; respuesta `200 AuditoriaDto` con `id`, `detalle`, `createdAt`, `updatedAt`, `deletedAt`, `usuarioCreated`, `usuarioUpdated` y `usuarioDeleted` obligatorios. |
| Impresión | No existe path, method u `operationId` de impresión/PDF para SuperLínea en el documento. No se puede derivar un contrato de impresión de SuperLínea. |

Para asociación de Línea, el contrato verifica `GET /api/linea/{id}` (`LineaController_findOne`), cuya respuesta `LineaDto` incluye `superLinea` como `ReferenciaDto`, y `PUT /api/linea/{id}` (`LineaController_update`) con body `UpdateLineaDto`: solo `usuarioUpdatedId` es obligatorio; `superLineaId` (number) es opcional y, si se omite, conserva la asociación actual. `POST /api/linea` exige `superLineaId`. El `PUT` responde `404` si la Línea o SuperLínea asociada no existe y `403` para registros protegidos del sistema.

### Affected Areas
- `src/componentes/gestion-producto/superlinea/` — ampliar servicio, interfaces y formulario existente para los contratos CRUD/auditoría verificados.
- `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx` y validaciones — mostrar y transformar `superLineaId` en edición; el contrato permite omitirlo para conservar la asociación.
- `src/componentes/gestion-producto/linea/consultar-linea.tsx` — patrón de pantalla, incluida impresión únicamente si existe contrato aplicable.
- `src/App.tsx` y `src/componentes/menu/` — ruta y navegación de SuperLínea, aún sin autorización/ubicación funcional definida.

### Approaches
1. **Implementar SuperLínea siguiendo el patrón de Línea** — reutilizar paginación, tabla, modales, auditoría y alertas, con los paths y DTOs del OpenAPI.
   - Pros: coherencia y esfuerzo medio; evita inventar contratos.
   - Cons: impresión queda fuera; la semántica exacta de eliminación requiere tratarse con cautela.
   - Effort: Medium

2. **Crear una abstracción CRUD genérica** — parametrizar catálogos y contratos.
   - Pros: potencialmente reduce duplicación.
   - Cons: mayor blast radius y no aporta valor para las diferencias aún no decididas.
   - Effort: High

### Recommendation
Implementar la pantalla específica de SuperLínea sobre el patrón existente de Línea, usando exclusivamente los contratos verificados del OpenAPI. Incorporar en edición de Línea un selector que envíe `superLineaId` solo cuando el usuario cambie la asociación; omitirlo conserva la relación según el contrato. No implementar impresión de SuperLínea ni asumir eliminación lógica como comportamiento normativo.

### Risks
- No hay contrato de impresión/PDF para SuperLínea.
- La eliminación expone señales de borrado lógico (`deletedAt`, `incluirEliminados`), pero el OpenAPI no declara explícitamente la semántica; UI y especificación deben evitar afirmarla.
- Ruta, menú y autorización de la nueva pestaña no están definidos por el OpenAPI ni comprobados en el frontend.
- No hay runner de pruebas automatizadas; el baseline documenta build pasante y lint/type-check con fallos preexistentes.

### Ready for Proposal
Sí, para CRUD, búsqueda/select, auditoría y asociación editable de Línea. Quedan como decisiones de producto genuinamente no resueltas: (1) ubicación y roles de la pestaña SuperLínea; (2) si se solicita impresión pese a no existir contrato; (3) presentación esperada de una SuperLínea eliminada y si debe permitirse restauración, sin convertir la inferencia de borrado lógico en requisito.
