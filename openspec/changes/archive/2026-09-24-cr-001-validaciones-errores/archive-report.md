# Archive Report: cr-001-validaciones-errores

**Change**: cr-001-validaciones-errores
**Archived to**: `openspec/changes/archive/2026-09-24-cr-001-validaciones-errores/`
**Archive date**: 2026-09-24
**Artifact store**: hybrid (OpenSpec files + Engram mirror)
**Branch**: `CR-001` (commits `2d2d8e9..9b65253`, 8 atomic commits)

---

## Final state at close

This archive report is the terminal record of the cycle. It states the state of the change
AT CLOSE, ranked per the Final-State Authority rules.

| Dimension | Final state | Source rank |
|---|---|---|
| Implementation | Complete; all 42 tasks checked | Persisted `tasks.md` (highest) |
| Task progress | 42/42 complete, 0 pending | Native `sdd-status` (persisted tasks artifact) |
| Runtime verification | Manually observed by user against the real backend (Phase 7.1-7.7) | Orchestrator final-state facts (user-reported manual evidence) |
| `yarn build` | exit 0, 2,452 modules transformed | Launch-prompt final-state facts; re-run in current worktree |
| `yarn lint` | exit 1 (failing) — 145 problems (17 errors, 128 warnings) | Launch-prompt final-state facts; matches baseline exactly |
| `yarn tsc -b` | exit 2 (failing) — 120 `error TS` diagnostics | Launch-prompt final-state facts; matches baseline exactly |
| Review scope | Above the 400-line budget (~2,191 changed lines) | Preserved warning |
| Unrelated worktree files | Present, not delivered | Preserved warning |

**This is NOT a clean PASS.** Lint and type-check still fail at their documented baselines,
and runtime evidence is user-reported manual execution, not automated proof.

---

## Specs synced

All four delta specs were reconciled into the canonical specs under `openspec/specs/` using
the native `gentle-ai sdd-archive-compose` command (existing specs) or a mechanical shell
copy (new capability). No manual Read/Edit merge was performed.

| Domain | Action | Method | Details |
|---|---|---|---|
| `superlinea-management` | Updated | `sdd-archive-compose` (exit 0) | MODIFIED "Gestionar SuperLíneas" and "Registros protegidos y dependientes"; ADDED "Errores accesibles de SuperLínea"; preserved unrelated "Navegación y permisos" and "Deuda técnica" |
| `superlinea-creation` | Updated | `sdd-archive-compose` (exit 0) | MODIFIED "Create SuperLínea from Línea creation" and "Refresh options without automatic selection" |
| `linea-superlinea-association` | Updated | `sdd-archive-compose` (exit 0) | MODIFIED "Select an active SuperLínea for Línea creation", "Preserve nested Línea flow and parent state", and "Association errors are actionable" (incl. new scenario "Field-specific association failure") |
| `validacion-errores-gestion-producto` | Created | mechanical `cp` + `diff -r` (byte-identical) | New canonical spec copied verbatim from the full delta spec (no prior main spec existed) |

### Composition commands (exit 0 = composition evidence)

```bash
gentle-ai sdd-archive-compose \
  --canonical "openspec/specs/{domain}/spec.md" \
  --delta "openspec/changes/cr-001-validaciones-errores/specs/{domain}/spec.md" \
  --output "openspec/specs/{domain}/spec.md.compose-tmp" \
&& mv "openspec/specs/{domain}/spec.md.compose-tmp" "openspec/specs/{domain}/spec.md"
```

Applied for `superlinea-management`, `superlinea-creation`, and `linea-superlinea-association`.
All three returned exit 0 and produced a complete composition.

### Destructive-merge check

Not destructive. The composition preserved every requirement not named by the deltas
(`Navegación y permisos`, `Deuda técnica (no normativa)` in `superlinea-management`; the
second scenario set in `linea-superlinea-association`). No requirement was removed.

### Mechanical readback evidence

New capability copy (`validacion-errores-gestion-producto`):

```text
$ diff -r openspec/changes/cr-001-validaciones-errores/specs/validacion-errores-gestion-producto/spec.md <temp copy>
diff_exit=0   # empty output = byte-identical
```

Archive move (`diff -r` snapshot vs destination, mandatory readback):

```text
=== diff -r snapshot vs destination (MANDATORY readback) ===
DIFF_EXIT=0 (empty diff = byte-identical)
```

Both readbacks are empty; no truncation or alteration was detected.

---

## Native delta-spec validation findings (recorded, not worked around)

`openspec validate cr-001-validaciones-errores --type change --strict` reported, before merge:

1. **ERROR** — `validacion-errores-gestion-producto/spec.md: No delta sections found.`
   Expected: this spec is a **full spec** for a brand-new capability (it uses `## Requisitos`
   and `### Requisito:` headings, not `ADDED/MODIFIED` delta sections). Because no canonical
   main spec existed, the archive skill's "main spec does not exist" path applies and the
   full spec was copied verbatim. The native OpenSpec change validator still classifies any
   file under `changes/{change}/specs/` as a delta, so it flags this expected shape.
2. **INFO** — `Archive would refuse this delta: superlinea-management: target spec is
   structurally invalid...` The canonical `superlinea-management/spec.md` uses Spanish section
   headers (`## Propósito` / `## Requisitos`) instead of `## Purpose` / `## Requirements`, so
   OpenSpec's spec parser treats its `### Requirement:` blocks as being outside the main
   requirements section. This is a **pre-existing structural condition**, not introduced by
   CR-001. The mandated native `sdd-archive-compose` did NOT refuse: it matches requirements
   by `### Requirement:` name and returned exit 0 for all three existing specs.
3. **WARNING** — RFC 2119 keyword best practice for English specs on the `superlinea-management`
   delta requirements, which are written in Spanish (`DEBE`/`DEBEN`). Informational only.

`openspec validate --specs` after archiving:

- ✓ `linea-superlinea-association`, ✓ `superlinea-creation` — pass.
- ✗ `superlinea-management`, ✗ `validacion-errores-gestion-producto`, ✗ `actualizacion-masiva-precios`
  — `Spec must have a Purpose section` (Spanish `## Propósito`/`## Requisitos` headings).
  The pre-existing `actualizacion-masiva-precios` main spec fails identically, confirming this
  is a repository-wide heading-language convention issue that predates and is broader than CR-001.

**No blocking error was raised by the mandated `gentle-ai sdd-archive-compose` command.** Every
canonical spec it processed contained the required `### Requirement:` headings; it exited 0 for
all three. The structural validator findings concern section-header language, not missing
requirement headings, and are recorded here rather than silently worked around.

---

## Archive contents

- `proposal.md`: present
- `specs/`: present (4/4 delta specs preserved: `linea-superlinea-association`, `superlinea-creation`, `superlinea-management`, `validacion-errores-gestion-producto`)
- `design.md`: present
- `exploration.md`: present
- `tasks.md`: present, **42/42 tasks complete, 0 unfinished** (bytes preserved from the pre-move snapshot)
- `verify-report.md`: present (bytes preserved; see contradiction note below)
- `archive-report.md`: this file (additive; created at archive time)

The active `openspec/changes/` directory no longer contains `cr-001-validaciones-errores`.

---

## Verification evidence carried into the record

Source: orchestrator final-state facts plus the user's manual execution of the complete
Phase 7.1-7.7 matrix against the real backend (reported 2026-09-24).

| Command | Exit | Final result | Baseline |
|---|---:|---|---|
| `yarn build` | 0 | 2,452 modules transformed | Passing baseline; matches |
| `yarn lint` | 1 | 145 problems (17 errors, 128 warnings) | Failing baseline; exact count match, no regression — **not reported as passing** |
| `yarn tsc -b` | 2 | 120 `error TS` diagnostics | Failing baseline; exact count match, no regression — **not reported as passing** |

Runtime evidence for Phase 7.1-7.7 is **user-reported manual observation**, not automated proof.
No test runner, test file, coverage command, or CI job exists (`strict_tdd: false`).

---

## Preserved warnings

1. **Review scope exceeds the 400-line budget.** Across commits `2d2d8e9^..9b65253` the branch
   changes 35 files with 1,937 additions and 254 deletions (~2,191 changed lines). Individual
   production commits are below 400 lines, but the aggregate branch is too large for one review
   unit; commit boundaries alone do not provide chained-PR review isolation.
2. **Unrelated worktree files remain.** Untracked/tracked files that are NOT part of CR-001 were
   deliberately excluded from the archive and from the spec sync: `docs/Analisis_Cambios.md`,
   `docs/Guia_CR-004_Busqueda_parcial_Front.md`, `docs/PR_CR-003.md`, and
   `openspec/changes/hotfix-linea-superlinea-endpoint/`. The worktree is therefore not fully clean.

---

## Contradiction and stale-snapshot note

The archived `verify-report.md` states (line 43): *"Tasks 7.1-7.8 remain unchecked in `tasks.md`."*
That statement was true when the verify report was written. It is **superseded**: the persisted
`tasks.md` moved into this archive contains **42 checked, 0 unchecked** tasks, and native
`sdd-status` reports `42/42, allComplete: true`. The `verify-report.md` bytes were preserved
unchanged as required (the archive never rewrites historical reports); the authoritative final
state is the persisted tasks artifact. A future reader should treat the `verify-report.md`
checkbox statement as a snapshot of an earlier point in the cycle, not as the close state.

No other contradictory facts were found. The `verify-report.md` status "Verified with warnings"
and the launch-prompt final-state facts agree on every command result and on the two preserved
warnings.

---

## Exclusions confirmed

- The denominación auto-generation cursor-jump race in
  `registrar-actualizar-producto.tsx` is a **separate follow-up** (from CR-005) and is NOT a
  CR-001 delta. It is not included in this archive record.
- Open business decisions (quote floor `1000`, free-text maxima, price formula, file validation)
  remain outside CR-001 and are unchanged.

---

## SDD cycle complete

The change is archived. Implementation: complete (42/42 tasks). Verification: user-reported
manual runtime observation of Phase 7.1-7.7, `yarn build` passing, `yarn lint` and `yarn tsc -b`
still failing at their documented baselines with no count regression. Unfinished tasks: none.
Unresolved findings: the two preserved warnings above (review size, unrelated worktree files)
and the pre-existing Spanish-heading structural condition in canonical specs.
