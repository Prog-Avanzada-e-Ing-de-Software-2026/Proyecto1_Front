# Plan de implementación — CR-006

Estado: apply autorizado por el usuario («comenza a implementar»). D1–D3 resueltas; implementación en curso. Cada casilla exige evidencia antes de marcarse. No comenzar apply hasta resolver fase 1.

## 1. Cerrar especificación y diseño

- [x] 1.1 Resolver D1 con el usuario y concretar ruta/entrada y conservación o reemplazo del flujo antiguo (R3, R6). Evidencia: aprobación explícita del 2026-09-13 registrada en proposal y design; sustituir pantalla en la URL actual y agregar entrada en Gestión Productos.
- [x] 1.2 Verificar D2: endpoint, parámetros, respuesta y permisos del selector de Línea; documentar URL base (R1–R3). Evidencia: Swagger y código del backend registrados en backend-review.md; resolución de URL final a verificar en 2.2.
- [x] 1.3 Resolver D3 con contrato/backend: rechazo por precio no positivo y atomicidad; revisar escenarios según evidencia (R5). Evidencia: validación previa, decorador transaccional y filtro 500 documentados en backend-review.md.
- [x] 1.4 Revisar consistencia proposal/specs/design/tasks y registrar aprobación real para implementar (R1–R7). Evidencia: petición explícita «comenza a implementar»; decisiones de 200/201, límite y exclusión de CambioPrecio reconciliadas.

## 2. Contratos y formulario

- [x] 2.1 Capturar baseline con `yarn build`, `yarn lint`, `yarn tsc -b`, salida y exit status (R1–R5). Separar fallos preexistentes.
- [x] 2.2 Crear DTO y servicio POST autenticado (R2–R4). Evidencia: `interfaces/actualizar-precios.ts` coincide con `ActualizacionPrecioDto` del backend (tipoAjuste 1|2, operacion AUMENTO|DISMINUCION, valor positivo, lineaId opcional; usuario sale del token); `ApiService.post('/producto/actualizar-precios')` agrega Bearer y `VITE_API_URL` aporta `/api` sin duplicar; sin identidad/items/monto/porcentaje. Verificado en vivo el 2026-09-13.
- [x] 2.3 Crear valores UI, esquema Yup y transformador de payload (R1–R2). Evidencia: schema exige alcance/operación/tipo enums, valor numérico finito > 0, lineaId entero positivo solo en LINEA; `crearPayload` omite `lineaId` en global (strip + spread). Backend rechazó valor 0 con 400 en vivo.
- [x] 2.4 Implementar selección de Línea con contrato verificado (R1). Evidencia: GET exige `?denominacion=` (sin query responde 400 en vivo) — corregido enviando `{ denominacion: "" }`; respuesta `{data, total: 1}` consumiendo solo `data` (9 líneas); hook con `cargaId` descarta respuestas obsoletas; envío bloqueado sin selección válida.

## 3. Interacción y resultado

- [x] 3.1 Componer formulario con alcance, operación, tipo y único valor (R1). Evidencia: etiquetas españolas con unidad explícita (%/$), fieldset deshabilitado durante pendiente/sesión vencida, nota de límite 10.000, submit bloqueado sin Líneas en alcance por Línea. Recorrido manual en navegador pendiente (ver 5.1).
- [x] 3.2 Implementar hook de confirmación y envío único (R2). Evidencia: `resumenAjuste` muestra operación/tipo/valor/alcance/Línea; cancelar no envía y conserva valores; `ocupado`+`pendiente` bloquean desde el inicio de la confirmación y se liberan en `finally` (incluida cancelación). Doble clic en navegador pendiente (ver 5.1).
- [x] 3.3 Mostrar message y tabla de denominación/costo/precio de respuesta (R4). Evidencia: respuesta en vivo 201 con `message` y 2 productos renderizados por contrato; `key={index}` admite denominaciones repetidas; sin cálculos ni segundo guardado.
- [x] 3.4 Manejar 400/401/403/404, red y errores no documentados con finalización de carga (R5). Evidencia en vivo: 400 valor 0, 401 sin token ("Token no encontrado"), 404 línea 99999 ("No se encontraron productos para actualizar."); `resultado` se limpia tras confirmar nueva petición; 401 bloquea el formulario y ofrece login sin reenviar. 403/red verificados por lectura.

## 4. Integración y acceso

- [x] 4.1 Conectar CR-006 a `/admin/cambio-precios-masivo` y agregar «Actualización masiva de precios» bajo Gestión Productos (R3, R6). Evidencia: ruta anidada en `PrivateRoute([ROOT, ADMINISTRADOR, EMPLEADO])`; entrada con esos roles; padre ampliado con EMPLEADO y demás hijos con sus roles intactos (`SidebarMenus.canShow` filtra por nivel). Recorrido por rol en navegador pendiente (ver 5.1).
- [x] 4.2 Corregir control mínimo de token/hooks de PrivateRoute necesario para R3. Evidencia: token chequeado antes de `jwtDecode`, malformado → login, sin rol → aviso con retorno a `/admin`; sin hooks tras retornos. Lint confirma: desaparecieron `prefer-const` y `rules-of-hooks` del archivo anterior.
- [x] 4.3 Retirar de la pantalla el flujo anterior y evitar filtros laterales heredados de Marca/SubLínea (R6). Verificar aislamiento respecto de Lista de precios y consulta/edición de Producto. Decisión A (2026-09-13, usuario): eliminar el directorio muerto `src/componentes/gestion-producto/precios/cambio-precios-masivo/` porque el backend ya no expone `/cambio-precios/aplicar-cambios` ni `/guardar-cambios` (cero coincidencias en `backend/src`) y el flujo no es reutilizable con el contrato nuevo. Conservar el interface compartido `ConsultarProductosCambioPreciosMasivo`, que Lista de precios sigue usando. Evidencia: directorio eliminado el 2026-09-13 (6 archivos); `grep precios/cambio-precios-masivo src/` sin coincidencias; `yarn build` exit 0, `lint` 17 errores/124 warnings (baseline 21/131, resto preexistente ajeno), `tsc` 120 errores (baseline 123; los 3 eliminados eran del directorio muerto; cero en archivos CR-006).

## 5. Verificar y archivar

- [ ] 5.1 Ejecutar matriz manual en navegador: global/por Línea × aumento/disminución × porcentaje/monto (ocho caminos), cancelación, doble clic, permisos por rol y resultados repetidos. Evidencia parcial 2026-09-13 (contrato en vivo contra backend local, datos de prueba, sin tokens): aumento monto $10 en Línea 9 → 201 con 2 productos; disminución monto $10 → reversión exacta (Fanta 82.5/99, Yogur 121/145.2); valor 0 → 400; línea 99999 → 404; sin token → 401. Falta el recorrido UI en navegador.
- [x] 5.2 Obtener evidencia backend en entorno de prueba de precio final positivo, costo/margen conservado (R4–R5 y criterios CR-006). Evidencia 2026-09-13: tras aumento, Fanta precio 109 > 0 con costo 90.83 = 109/1.2 (margen 20% conservado); reversión exacta posterior. No se tocó Lista de precios ni datos reales.
- [x] 5.3 Ejecutar `yarn build`, `yarn lint`, `yarn tsc -b`; registrar salida exacta, exit status y comparación con 2.1. Evidencia: build exit 0 (igual que baseline); lint exit 1 con 17 errores/124 warnings vs 21/131 del baseline (sin errores en archivos CR-006; resto preexistente); tsc exit 2 con 120 vs 123 (los 3 menos eran del directorio muerto; cero en archivos CR-006). Logs: `/tmp/cr006-{build,lint,tsc}-after.log`. No se corrigieron fallos ajenos.
- [ ] 5.4 Inspeccionar diff y contrastar cada requisito, aceptación y tarea con evidencia; redactar verify-report real. Pendiente solo el recorrido UI de 5.1 antes del cierre.
- [ ] 5.5 Solo tras verificación conforme, reconciliar deltas en specs y archivar sin modificar históricos. No crear branch/commit/push/PR salvo pedido explícito. Nota: el usuario pidió commits separados por cambio (2026-09-13); deben hacerse sin push (los `.env` locales no se pushean).

CambioPrecio queda fuera de las tareas por dirección del usuario. En 5.1 verificar además R6–R7: navegación, sustitución y conservación del límite sin peticiones adicionales.

Baseline actual: build exit 0; lint exit 1 (21 errores, 131 warnings); tsc exit 2. Salidas exactas conservadas en /tmp/cr006-{build,lint,tsc}-before.log durante esta ejecución.
