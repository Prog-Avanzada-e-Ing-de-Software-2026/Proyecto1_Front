```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:b3c5eac29c911b1b89179af1856d75efc318f0fea5f88602a955a416b594bd03
verdict: fail
blockers: 1
critical_findings: 0
requirements: 11/13
scenarios: 26/28
test_command: corepack yarn tsc -b
test_exit_code: 2
test_output_hash: sha256:6418e44f1edf7fb8fc4518758a27f7747eb5cbc21adfc5d89a301137f02ef188
build_command: corepack yarn build
build_exit_code: 0
build_output_hash: sha256:3319b00d048752a7add9613194b7ab34faee4ba18072f234373680cf23558e37
```

## Verification Report

**Change**: `2026-09-13-CR-004` — Partial-match product search by denominación, Línea, SuperLínea (+ 2026-09-14 A3/A4 visible-feedback amendment; A1/A2/6.1 WITHDRAWN)
**Mode**: Standard (`strict_tdd: false`; no test runner, no coverage, no test CI — `openspec/config.yaml`). `yarn tsc -b` is the repo's focused verification command per `tasks.md` work units; it is recorded in the envelope `test_*` fields. No automated test pass is claimed anywhere in this report.
**Verified tree**: branch `CR-004`, HEAD `1b3802a` (5 work-unit commits `b2fee9b`, `7c4e545`, `af9701a`, `4ed9ba3`, `1b3802a` on `a5d6081`), worktree clean (`git status --porcelain` empty).
**Authoritative spec totals (recounted from the current spec files)**: **13 requirements / 28 scenarios** — `producto-busqueda-parcial` 12/23 (includes the amended `Visible search feedback` requirement with 5 scenarios; `Unfiltered listing on entry` is NOT present — correctly reverted), `linea-superlinea-association` delta 1/5. The prior report's 12/23 totals were the pre-amendment counts and are superseded.

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total (actionable) | 24 |
| Tasks complete | 22 |
| Tasks incomplete | 2 — **5.2** (manual verification; the toast-feedback subset attested by the maintainer 2026-09-14, the rest not) and **6.1** (struck-through, WITHDRAWN by maintainer scope reduction — must never be implemented or marked complete; not a blocker by definition) |
| Diff scope `a5d6081..HEAD` (src) | 9 files, 550+/27− — exactly the design's File Changes table |
| Must-NOT-change list | `header-producto.tsx`, `header-producto-lg.tsx`, `filtros-contesxt.tsx`, `sidebarFiltros.tsx`, `catalogos-context.tsx`, `crudFactory.ts`, `use-paginacion.ts`, `paginacion.tsx`, `entidad-selector-base.tsx`, `registrar-actualizar-linea.tsx`, `superlineas-selector.tsx`, TRAP `herramientas/reutilizables/busqueda-producto.tsx`, legacy `/producto/find-all-for-lineas/select` — all byte-unchanged in the branch diff. No new dependency. |

### Build & Tests Execution (this verify run, logs in `%TEMP%\opencode\cr004-verify-r3\`)

| Command | Exit | Result | vs baseline (`cr004-baseline`) |
|---|---|---|---|
| `corepack yarn tsc -b` | **2** | 123 errors | **123 → 123; normalized set (file+code+message, line/col stripped) `TSC_SETS_IDENTICAL` — 0 new, 0 removed.** All failures pre-existing (config baseline: typecheck failing). |
| `corepack yarn lint` | **1** | 152 problems (21 errors, 131 warnings) | **152 → 152; per-problem normalized set (file+severity+rule+message, line/col stripped) `LINT_SETS_IDENTICAL` — 0 new, 0 removed.** All pre-existing (config baseline: lint failing). |
| `corepack yarn build` | **0** | `✓ 2415 modules transformed`, `✓ built in 27.75s` | baseline 2413 → 2415 modules; the +2 are `src/utils/selectOption.ts` and `.../producto/componentes/busqueda-producto.tsx`. PASS. |

Output hashes (SHA-256): tsc `6418e44f1edf7fb8fc4518758a27f7747eb5cbc21adfc5d89a301137f02ef188` · lint `de951486159679efc3c8c4cab6760ed08d58c038b2b2c24d0e151ff4b0f3f18b` · build `3319b00d048752a7add9613194b7ab34faee4ba18072f234373680cf23558e37`.
**Coverage**: ➖ not available (no test runner; `coverage_threshold: 0`).

**Runtime evidence classes used below**: `ATTESTED` = user-reported manual runtime evidence from the maintainer ("Ya se probo los toast", 2026-09-14) covering exactly: count toast on Enter, no-results toast, blank-term hint with zero requests, mode-switch silent, ERROR-only on failure, no toast on page change/entry. `CODE` = mandatory frontend behavior proven by source inspection of the committed tree. `CONTRACT` = guarantee owned by the backend contract; the frontend obligation (forward the untouched term/params, consume `{data,total}`) is code-verified. Backend claims for CONTRACT rows cite the prior verify round + design (the backend repo is outside this worktree and was not re-read this round). `UNVERIFIED` = the scenario's core claim is an exact runtime fact with no runtime evidence of any kind.

### Spec Compliance Matrix — `producto-busqueda-parcial` (12 req / 23 scen)

| Requirement | Scenario | Evidence (file:line in committed tree) | Result |
|---|---|---|---|
| Partial-match semantics | Case-insensitive match | FE forwards raw term: `consultar-producto.tsx:606` → `:549-553` → `producto-service.tsx:21-22` (`/producto/search-by-denominacion`); no normalization anywhere; backend LOWER+binary-collation LIKE per prior round | ✅ CONTRACT |
| Partial-match semantics | Accent-sensitive boundary (`cafe`≠`Café`) | Same path; no `.normalize()`/accent-stripping on the denominación path (`consultar-producto.tsx:548-553`); backend ownership per prior round | ✅ CONTRACT (not attested — see W5) |
| Partial-match semantics | Containment not prefix | Backend `CONCAT('%',…,'%')` per prior round; FE forwards untouched | ✅ CONTRACT |
| Search by partial denominación | Denominación results | Enter `busqueda-producto.tsx:78-83` → `handleBuscarPorDenominacion` `consultar-producto.tsx:603-609` (pure setter) → single-owner effect `:689-702` → `buscarPorDenominacion` `:549-553`; `take`=10 (`config/paginacion.ts:2`, `use-paginacion.ts:9`) | ✅ CODE |
| Search by Línea selection | Select a Línea | Selector Enter `busqueda-producto.tsx:85-90` → `handleBuscarLineas` `:611-634` → `linea-service.tsx:27-35` (`/linea/select`); selection `:636-647` commits `{lineaId}` → effect → `ProductoService.obtener({lineaId,skip,take})` `:554-559` → `/producto/search-by` (`crudFactory.ts:18-20`) | ✅ CODE |
| Search by SuperLínea selection | Select a SuperLínea | `busqueda-producto.tsx:92-97` → `handleBuscarSuperlineas` `:649-672` → `superlinea-service.ts:18-26`; selection `:674-685` → `buscarPorSuperlinea` `:560-565` → `producto-service.tsx:24-25` | ✅ CODE |
| Enter-only trigger | Typing does not search | Typing only sets term state (`busqueda-producto.tsx:136,148,167`); effect `consultar-producto.tsx:689-702` keys only on committed criterion; código debounce early-return `:165-174` (L169 `modoBusquedaRef.current !== null`) | ✅ CODE |
| Enter-only trigger | Enter searches once | Single fetch owner: handlers are pure setters (`:603-609`, `:636-647`, `:674-685`); no direct `ejecutarBusquedaActiva` call remains in any handler; effect runs once per batched commit | ❌ UNVERIFIED (runtime count from page > 1; see W1) |
| Mode exclusivity | Mode switch resets | `handleCambiarModo` `:595-601` clears criterion/productos/total + `resetearPaginacion()` (`use-paginacion.ts:18-22`); effect else-branch `:697-701` clears, NO request | ❌ UNVERIFIED (clears-at-runtime not attested; "mode-switch silent" covers toasts only; see W1) |
| Pagination | Page count from total | `total` → `setEntidadesTotales` `:569`; pages = `Math.ceil(entidadesTotales/take)` `paginacion.tsx:21` | ✅ CONTRACT |
| Pagination | Beyond the last page | `Paginacion` clamps `[1,totalPaginas]` `paginacion.tsx:25-30`; out-of-range emptiness backend-owned (prior round) | ✅ CONTRACT |
| Active-only results | Soft-deleted excluded | FE consumes `data` unchanged (`:568`); `deletedAt IS NULL` filters backend-owned (prior round) | ✅ CONTRACT |
| Empty or whitespace term | Whitespace-only term | Guard `:538-544` returns BEFORE any service call; result set emptied; backend second-layer trim guard per prior round | ✅ CODE |
| Visible search feedback | Denominación matches reported | INFO count via `avisarResultados` `:574-576` using service `total`, exact strings `:49-54`; fired only when Enter armed `pendienteFeedbackRef` (`:605`, consumed `:527-528`) | ✅ ATTESTED + CODE |
| Visible search feedback | Denominación no matches reported | count 0 → WARNING `No se encontraron productos para «…».` (`:50`, `:514-515`) | ✅ ATTESTED + CODE |
| Visible search feedback | Blank term hint shown | WARNING `Escribe un término para buscar.` at blank early-return `:540` (no request, `:543`); option-handler guards `:613-618`, `:651-656` | ✅ ATTESTED (incl. zero requests) + CODE |
| Visible search feedback | Option search reported | `:623`, `:661` fire after service success with `opciones.length`, exact A3 nouns; blank guard fires hint instead | ✅ CODE (runtime unattested — W4) |
| Visible search feedback | Feedback never clears results | No toast path writes `productos`/`entidadesTotales` (grep of `addAlert` sites `:502-520`, `:574-576`, `:623`, `:661`); `autoClose: true, duration: 3000` | ✅ CODE (runtime unattested — W4) |
| Search failure handling | Request failure | `catch` → `addAlert(ERROR)` only `:577-586`; page-level `error` never touched by CR flow; option-handler catches `:624-633`, `:662-671`; expired token rejects in `apiService.ts:14-25` | ✅ ATTESTED (ERROR-only) + CODE |
| Role-restricted search modes | Role permitted by both kinds | `permisos-producto.ts:25-36` (ROOT/ADMIN/EMPLEADO/VENDEDOR/REPOSITOR/REPARTIDOR vs ROOT/ADMIN/EMPLEADO) → `consultar-producto.tsx:83-85` → 3 segments `busqueda-producto.tsx:69-76` | ✅ CODE |
| Role-restricted search modes | Denominación-only role | `puedeBuscarPorSeleccion` false → no selection segments, selector panels gated (`busqueda-producto.tsx:73-76,143,162`) → `/linea/select`, `/superlinea/select`, `/producto/search-by-superlinea` unreachable → no 403 | ✅ CODE |
| Role-restricted search modes | Role permitted by neither (`Cobrador`) | Both predicates false → mount not rendered at all (`consultar-producto.tsx:802`); `modoBusqueda` initializes `null` (`:87-89`) preserving legacy flows; `Rol.COBRADOR=7` in neither list (`interfaces-generales.tsx:120-129`); page reachable by COBRADOR confirmed (`App.tsx:36`) | ✅ CODE |
| Role-restricted search modes | Offered modes work | Each offered mode routes through the single-owner effect to its service (rows above) | ✅ CODE |

### Spec Compliance Matrix — `linea-superlinea-association` delta (1 req / 5 scen)

| Scenario | Evidence | Result |
|---|---|---|
| Required selection and payload | `registrar-actualizar-linea.tsx:128-132` (create submits `superLineaId`) — file byte-unchanged in `a5d6081..HEAD` | ✅ CODE |
| Missing selection or empty catalog | `superlineas-selector.tsx:44-46` "Primero debe registrar una SuperLínea." — unchanged | ✅ CODE |
| Edit unchanged association | `registrar-actualizar-linea.tsx:117-122` omits `superLineaId` when unchanged — unchanged | ✅ CODE |
| Edit reassignment and failures | `:122` sends id only on change; error routing pre-existing — unchanged | ✅ CODE |
| Options resolve after the shape change | `superlinea-service.ts:18-26` consumes flat `SelectOption[]` via `esSelectOptionArray`+`mapearSelectOptions` (`selectOption.ts:3-19`, `codigo→id`, `nombre→denominacion`); caller `:80` invokes `obtenerSelect()` (param optional) and still receives `{id,denominacion}`; `EntidadSelectorBase` resolves via `getOptionValue={(o)=>String(o.id)}` (`entidad-selector-base.tsx:84`) | ✅ CODE |

**Compliance summary**: 26/28 scenarios satisfied with covering evidence (4 ATTESTED, 15 CODE, 6 CONTRACT, 1 ATTESTED+CODE overlap counted once — request failure; 2 UNVERIFIED: `Enter searches once`, `Mode switch resets`). Requirements completed: 11/13 (`Enter-only trigger` and `Mode exclusivity` hold one unverified scenario each; every other scenario in them is satisfied).

### Correctness (Static Evidence, per requirement)

| Requirement | Status | Notes |
|---|---|---|
| Partial-match semantics | ✅ Implemented (contract-owned) | FE forwards raw term; no client-side normalization exists on the path |
| Search by partial denominación | ✅ Implemented | `:549-553`, take 10 |
| Search by Línea selection | ✅ Implemented | `/linea/select` + `/producto/search-by?lineaId` reuse |
| Search by SuperLínea selection | ✅ Implemented | `/producto/search-by-superlinea?superLineaId` |
| Enter-only trigger | ✅ Implemented | Single-owner effect; keystroke paths commit no criterion |
| Mode exclusivity | ✅ Implemented | Explicit clear + pagination reset on switch; legacy fenced by `modoBusqueda === null` |
| Pagination | ✅ Implemented | `total`→`entidadesTotales` 1:1; clamped navigation |
| Active-only results | ✅ Implemented (contract-owned) | No FE filtering needed |
| Empty or whitespace term | ✅ Implemented | Pre-request guard, silent on re-runs |
| Visible search feedback | ✅ Implemented | Exact A3 strings, INFO/WARNING mapping, `autoClose:3000`, one-shot ref, shared phrase builder |
| Search failure handling | ✅ Implemented | ERROR alert only; list state intact; never page-level `error` |
| Role-restricted search modes | ✅ Implemented | Two predicates, conditional mount, `Cobrador` zero-change |
| LSA: SuperLínea select shape | ✅ Implemented | `SelectOption[]` consumed at single mapping point |

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Segmented mode control in new `BusquedaProducto`, single `CardContent` mount, headers untouched | ✅ | `busqueda-producto.tsx`; mount `consultar-producto.tsx:802-824` |
| Per-endpoint role gates (two predicates, page-derived booleans, presentational component) | ✅ | `permisos-producto.ts:25-36`; no role mapping inside the component |
| Page-local state; `FiltrosContext` untouched | ✅ | context files byte-unchanged |
| Effect as SINGLE fetch owner; handlers pure setters | ✅ | `:689-702` matches the design's target form exactly (three branches); no dispatch remains in handlers |
| Withdrawn A1/A2: no-criterion CR branch keeps clear-and-no-request | ✅ | `:697-701` unchanged from bounded correction; 6.1 was NOT implemented (verified by code + branch diff) |
| A3 feedback: exact strings, TipoAlerta mapping, one-shot `pendienteFeedbackRef`, blank guards, selection/page-change silent | ✅ | `:49-54`, `:502-520`, `:527-528`, `:540`, `:574-576`, `:605`, `:613-618`, `:623`, `:651-656`, `:661` |
| A4 anti-noise: entry/page-change/mode-switch/selection never toast; ERROR never co-fires with count | ✅ | flag armed only at Enter commit, consumed at fetch start; count fires only after success |
| Service layer: explicit `ApiService.get` methods; `crudFactory` NOT extended | ✅ | `producto-service.tsx:21-25`, `linea-service.tsx:27-35`; `crudFactory.ts` unchanged |
| `SelectOption[]` mapped once in `src/utils/selectOption.ts` | ✅ | single mapping point |
| Failure via `addAlert(ERROR)`, never page-level `error` | ✅ | `:577-586` |
| Round-2 declared deviations (helper functions, `criterio.tipo` gate, raw term to service with trimmed term in toast) | ✅ accepted | behavior-identical to design; documented in `apply-progress.md` |
| Design line-number citations (L618-631, L496-500, L626-630, "Alertas at L798") | ⚠️ stale | Actual: 689-702, 538-544, 697-701, 869 — doc drift only, semantics unchanged (W3) |

### Issues Found

**CRITICAL**: None. No contradiction was found between specs, design, tasks, and the committed code; no new static regression (normalized tsc/lint sets byte-identical to baseline; build exit 0).

**WARNING**:
- **W1 — Two runtime facts remain unverified** (task 5.2, still unchecked): `Enter searches once` (exactly one request when Enter/selection starts from page > 1) and `Mode switch resets` (list clears and stays empty with no legacy repopulation at runtime). The code is correct by construction (single fetch owner + pure-setter handlers + batched commit) and the maintainer attestation does not cover these two claims. Closure requires one human DevTools-Network pass on `yarn dev` + backend.
- **W2 — Static gates exit non-zero by baseline**: `tsc -b` exit 2 / 123 errors and `lint` exit 1 / 152 problems are PRE-EXISTING (`openspec/config.yaml` baseline). Proven non-regressive by set-equality, but they remain the repo's known debt; do not read exit≠0 as a CR-004 failure.
- **W3 — Design line references are stale** after the bounded correction and round 2 (see coherence row). Docs-only drift; recommend a line-reference refresh at archive, no requirement impact.
- **W4 — Two feedback scenarios are code-verified only**: `Option search reported` and `Feedback never clears results` were not in the maintainer's attestation list. Exact strings/firing points/silence rules are proven statically; runtime perceptibility is asserted from code, not observation.
- **W5 — Accent-sensitive boundary (`cafe` ≠ `Café`) not attested** this round; owned by the backend contract and verified in the prior round only (backend repo is outside this worktree).

**SUGGESTION**:
- **S1** Re-clicking the already-active mode button clears criterion + results (`busqueda-producto.tsx:117` unconditional `onCambiarModo`); guard with `if (modoBusqueda === modo.valor) return;` in a future change if the UX is unwanted. No scenario covers it.
- **S2** For permitted roles the page starts blank-until-Enter (mode preselected, no criterion → clear branch). Spec-conformant (no scenario mandates preload; A1 withdrawn), but it is a visible behavior change vs the legacy auto-load — worth a product confirmation.
- **S3** Sidebar `buscar.cont` reclaim can re-run the idempotent legacy fetch (accepted residual from apply, design keeps that effect unchanged).

### Verdict

**FAIL — verification incomplete, not archive-ready** (envelope `verdict: fail`, `blockers: 1`). This is a canonical INCOMPLETE-EVIDENCE failure, not an implementation defect: no contradiction, regression, or spec violation was found. The single blocker is the open manual runtime pass (task 5.2): the scenarios `Enter searches once` and `Mode switch resets` have zero runtime evidence (code-correct-by-construction only), and this runner-less repository (`strict_tdd: false`) provides no passing automated test gate — `tsc -b` exits 2 and `lint` exits 1 on pre-existing baseline failures, which the schema records as failing execution evidence and which therefore forbid any passing verdict.

All 13 requirements are implemented in the committed tree with zero new static regressions and a passing build; 26/28 scenarios have covering evidence (runtime attestation where the maintainer tested, source proof elsewhere). Closure path: one human DevTools-Network pass on `yarn dev` + backend covering the two unverified scenarios (and optionally the W4/W5 items), then re-run verify. No automated test pass is claimed; `strict_tdd` remains false.

**Evidence identity**: HEAD `1b3802ac829b0c64d1247f9ca4582b83cf3c124c`; `evidence_revision` = SHA-256 over HEAD ∥ tsc ∥ lint ∥ build output hashes (values above).
