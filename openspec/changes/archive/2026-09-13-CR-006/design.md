# Diseño propuesto — CR-006

Estado: diseño con D1 aprobada y D2–D3 revisadas; decisiones de compatibilidad aprobadas por el usuario.

## Decisiones y contratos pendientes

- D1 aprobada el 2026-09-13: sustituir la pantalla en `/admin/cambio-precios-masivo` por CR-006 y agregar una entrada bajo Gestión Productos. Retirar las capacidades antiguas de esa pantalla; preservar Lista de precios.
- D2 resuelta por revisión de código y Swagger: GET `/api/producto/find-all-for-lineas/select`, query `denominacion` opcional (vacía por defecto), respuesta `{data: LineaDto[], total: 1}`. Consumir data sin usar total como cantidad real. Root, Administrador y Empleado autorizados. Construir la URL relativa sobre la misma base API que Producto, evitando duplicar `/api`.
- D3 revisada: todos los ajustes se validan antes de persistir; persistencia usa `@Transactional()` con rollback ante error. Precio inválido lanza Error y el filtro global devuelve 500 con message. Es evidencia estática, no validación de concurrencia.
- Compatibilidad aprobada: aceptar 200 y 201 con idéntico cuerpo; conservar límite de 10.000 y no ejecutar lotes extra para eludirlo. CambioPrecio queda a cargo de otra persona, fuera de implementación y verificación de este frontend.

## Límites y contratos

Catálogo/Inventario: comando sobre Producto. Resultado como DTO de lectura local, separado de `ConsultarProductosCambioPreciosMasivo` y sus múltiples precios comerciales. Sin nuevos modelos de dominio.

Tipos específicos: `ActualizarPreciosRequest { lineaId?: number; tipoAjuste: 1 | 2; operacion: 'AUMENTO' | 'DISMINUCION'; valor: number }`; `ActualizarPreciosResponse { message: string; productos: { denominacion: string; costo: number; precio: number }[] }`.

Servicio de feature sobre `ApiService.post('/producto/actualizar-precios', payload)`; verificar que `VITE_API_URL` aporta `/api` sin duplicarlo. `ApiService` ya agrega Bearer desde `localStorage.Token`. No cambiar el transporte global para introducir este endpoint.

## Archivos y responsabilidades propuestas

Dentro de `src/componentes/gestion-producto/precios/actualizacion-masiva-precios/`:

| Pieza propuesta | Responsabilidad |
|---|---|
| `interfaces/actualizar-precios.ts` | DTO de request y respuesta |
| `interfaces/formulario-precios.ts` | Valores UI y esquema Yup |
| `utils/crear-payload.ts` | Conversión y omisión de lineaId global |
| `services/actualizar-precios-service.ts` | POST autenticado tipado |
| `hooks/use-actualizar-precios.ts` | Confirmación, envío, resultado, errores y bloqueo de concurrencia |
| `componentes/formulario-precios.tsx` | Alcance, Línea, operación, tipo y valor |
| `componentes/resultado-precios.tsx` | Mensaje y tabla de solo lectura |
| `actualizacion-masiva-precios.tsx` | Composición de pantalla |

Los nombres son propuestas, no archivos existentes. Conectar esta composición a la ruta existente en `src/App.tsx` según D1. Reutilizar React Hook Form, Yup, react-select, Button/Card, `useConfirmation`, alertas y formato monetario existentes. El selector de Producto está acoplado a alta de Línea y referencias de teclado: reutilizar primitivas sin incorporar el alta anidada a este cambio.

## Flujo de estado

Formulario → validación → confirmación de una instantánea de valores → POST → resultado/error → formulario disponible. Bloquear confirmaciones/envíos concurrentes desde el comienzo de la confirmación; liberar también al cancelar. Separar carga de Líneas de envío. Invalidar respuestas de búsquedas antiguas para no sobrescribir opciones recientes.

Al iniciar una nueva petición, limpiar el resultado anterior. Conservar entradas ante error; tratar 401 con aviso y navegación a login. No guardar un comando para reenviarlo después de autenticarse. Mostrar resultados de servidor sin fórmulas ni edición; la respuesta no incluye id, por lo que no usar denominación como clave única.

## Permisos y alcance compartido

Proteger ruta y entrada elegida con Root/Administrador/Empleado. La revisión de `menuItems-definicion.ts` confirma que no existe entrada para la ruta actual. `SidebarMenus` filtra cada nivel por roles: Gestión Productos excluye a Empleado. Si se agrega allí la entrada propuesta, incluir Empleado en el padre, conservando las restricciones de los hijos existentes. `PrivateRoute.tsx` contiene decodificación anterior al guard de token y hooks tras retornos condicionales; corregir únicamente el control necesario para acceso seguro y verificar rutas existentes, sin rediseñar autenticación.

## Integración aprobada (D1)

Conservar `/admin/cambio-precios-masivo`, conectar la pantalla CR-006 y agregar «Actualización masiva de precios» directamente bajo Gestión Productos para Root/Administrador/Empleado. La ruta actual no tiene una entrada de menú que pueda simplemente renombrarse.

La implementación reemplazará en esa URL la búsqueda por Marca/Línea/SubLínea, la aplicación de porcentaje sobre productos cargados, la edición individual de cuatro precios y el guardado posterior. El nuevo flujo será alcance global/por Línea → operación y tipo de ajuste → valor → confirmación → resultado. La exclusión manual de filas tampoco corresponde al contrato nuevo, que selecciona el lote en el backend.

Reutilizar infraestructura visual y HTTP; mantener DTO, servicio y hook del comando separados del flujo antiguo. No eliminar interfaces compartidas ni tocar el servicio propio de Lista de precios. Decisión A (2026-09-13, usuario): eliminar el directorio muerto `src/componentes/gestion-producto/precios/cambio-precios-masivo/` (pantalla, filtros, tabla, hook, servicio y modal de edición individual), ya que el backend no expone los endpoints del flujo anterior y sus capacidades (cuatro precios, preview, exclusión por fila) son incompatibles con el contrato CR-006. Al integrar, configurar los filtros laterales para que no queden visibles Marca/SubLínea heredados del contexto compartido.

Ver `exploration.md` para evidencia y límites de la revisión. El usuario aprobó esta sustitución en el plan el 2026-09-13; las decisiones posteriores cierran las diferencias de contrato documentadas en backend-review.md.

## Alternativas y límites

No adaptar el DTO antiguo: mezcla cuatro precios, previsualización y guardado con usuarioCreatedId, incompatibles con CR-006. No calcular vistas previas de precio o conservar margen en frontend. No introducir límites de porcentaje, redondeo de payload, paginación de API ni garantías transaccionales que el contrato no especifica.

## Verificación prevista

Sin nuevas dependencias ni runner en este plan. Matriz manual reproducible de ocho combinaciones, límites, cancelación, doble clic, permisos, resultados repetidos y errores de R1–R5, con inspección del request. Precio positivo, conservación de margen requieren evidencia del backend sobre datos de prueba; la respuesta del frontend por sí sola no los demuestra.

Capturar baseline antes de apply y comparar `yarn build`, `yarn lint`, `yarn tsc -b` después. Registrar salida y exit status; no corregir fallos ajenos. Si se decide automatizar, volver a diseño y especificar/aprobar Vitest + React Testing Library antes de instalar; `strict_tdd` permanece false.

## Concreción durante apply

- El selector carga el catálogo completo mediante el endpoint verificado, con búsqueda local de react-select. No necesita búsquedas HTTP por cada tecla; los identificadores de carga descartan respuestas anteriores al reintentar o remontar.
- Ante 401 se bloquea el formulario y se ofrece Iniciar sesión; al aceptar se borra el token y se navega a login sin reenviar el comando. Esto permite leer el error antes de abandonar la pantalla.
- La verificación de interacción utiliza un arnés temporal de navegador con React real y respuestas Axios simuladas. No agrega dependencias, runner ni scripts al proyecto, ni modifica strict_tdd. Sirve como evidencia de frontend; no demuestra persistencia del backend.
