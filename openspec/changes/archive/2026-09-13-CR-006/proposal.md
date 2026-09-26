# CR-006 — Actualización masiva de precios

Estado: apply autorizado por petición explícita «comenza a implementar»; sustitución de pantalla y navegación aprobadas por el usuario. Contratos D2–D3 revisados; decisiones de compatibilidad registradas. No declara apply ni verificación funcional completados.

## Intención y alcance

Implementar el frontend de `docs/Pedidos de Cambio/CR-006/CR-006.md`: actualizar precios globalmente o por Línea, con aumento/disminución mediante porcentaje/monto fijo, confirmación y resultados reales del backend.

El usuario podrá efectuar una operación autenticada y ver denominación, costo y precio resultantes. El backend conserva el margen y valida el precio positivo; CambioPrecio se excluye por la decisión posterior del usuario. CR-006 explicita cómo se mantiene la relación precio/costo/margen del análisis de dominio; no se introduce una fórmula alternativa en el cliente.

## Evidencia y alcance pendiente

- No hay cambios activos previos para CR-006; las especificaciones vigentes tratan SuperLínea y su asociación con Línea.
- `src/App.tsx` expone `/admin/cambio-precios-masivo`.
- La funcionalidad existente usa PATCH `/cambio-precios/aplicar-cambios` y `/cambio-precios/guardar-cambios`, múltiples precios, `items`, `porcentaje` y `usuarioCreatedId`. No satisface el contrato nuevo.
- D1 aprobada por el usuario el 2026-09-13 («si, avancemos», en respuesta a sustituir la pantalla en el plan): conservar `/admin/cambio-precios-masivo`, reemplazar sus funciones anteriores por CR-006 y agregar «Actualización masiva de precios» en Gestión Productos para Root, Administrador y Empleado. Se retiran de esa pantalla Marca/SubLínea, edición de cuatro precios, exclusión de filas y pasos separados de aplicar/guardar. Lista de precios permanece fuera del cambio.

## Fuera de alcance

Backend, historial UI de CR-007, cálculos locales de precios/costos, nuevos agregados o Value Objects, filtros por Marca/SubLínea, importaciones, modificaciones de Lista de precios y reparación general del baseline.

## Dependencias y riesgos

- API descrita como implementada por el CR; no verificada contra un servidor en esta planificación.
- Consulta y permisos de Líneas confirmados por revisión de backend; ver backend-review.md.
- Precio inválido reportado como 500 y persistencia transaccional revisados estáticamente; no afirmar pruebas de integración no ejecutadas.
- Un fallo de red puede dejar resultado incierto: no reintentar automáticamente una mutación.
- `PrivateRoute` decodifica el token antes de comprobar su existencia; su corrección mínima deberá integrar el alcance de autenticación para cumplir los escenarios de acceso, con revisión de las rutas consumidoras.

## Rollback

Revertir únicamente los cambios de frontend de CR-006 recupera la navegación previa. No revierte precios ya persistidos: no simular reversión aplicando un ajuste inverso. La recuperación de datos exige un procedimiento del backend.

## Entrega

Completar y revisar proposal → specs → design → tasks; posteriormente apply → verify → archive. El usuario autorizó implementar el plan. Las tareas avanzan con evidencia y los archivos originales del CR se preservan.

## Decisiones explícitas posteriores a la revisión backend

- Aceptar 200 OK y 201 Created como éxito equivalente con el cuerpo documentado.
- Conservar el límite backend de 10.000 productos por operación, también global. Esta decisión acota el criterio original de todos los productos; no se cambiará ni eludirá el límite.
- Excluir el registro y la verificación de CambioPrecio de esta implementación: otra persona se encarga de ello. No constituye una funcionalidad ya demostrada del backend.
- D2 y D3 se sustentan en `backend-review.md`: selector de Producto con denominacion opcional, validación antes de persistencia, persistencia transaccional y precio inválido reportado como 500.
