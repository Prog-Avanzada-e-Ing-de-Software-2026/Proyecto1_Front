# Archive Report — fix-race-denominacion-autogenerada

**Status**: ARCHIVED (success)

**Archived to**: `openspec/changes/archive/2026-09-24-fix-race-denominacion-autogenerada/`
**Artifact store**: hybrid (OpenSpec files + Engram topic `sdd/fix-race-denominacion-autogenerada/archive-report`)
**Date**: 2026-09-24

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `denominacion-automatica-producto` | Updated (MODIFIED merge) | 2 requirements modified (`Edición manual`, `No sobrescritura`); 4 scenarios added; 5 requirements and 5 scenarios preserved byte-for-byte |

Canonical source of truth updated: `openspec/specs/denominacion-automatica-producto/spec.md`.

### What changed in the canonical

- `### Requirement: Edición manual` — tightened to require preservation from the FIRST interaction (first click/keystroke must not move the caret or replace user text; rapid consecutive typing preserves each character and edit position).
- `### Requirement: No sobrescritura` — tightened to forbid overwrite within the same update cycle and after later selector changes, until the user clears the field.
- Added scenarios: `Primera edición manual preservada`, `Escritura rápida consecutiva preservada`, `Cambio de selector después de la primera edición manual`, `Vaciar solo con espacios reactiva`.
- Preserved unchanged: `Lenguaje ubicuo`, `Generación en alta`, `Solo creación`, `Reactivación al vaciar`, `Sin default backend`, and the scenarios `Completa al tener los tres`, `Edición de producto existente`, `Editable`, `No sobrescribe edición manual`, `Vaciar reactiva`.

## Composition Evidence (native composer)

This is the third archive attempt. The two prior attempts were blocked:

1. Delta requirement names were in English against a Spanish canonical (fixed by the earlier name correction).
2. The canonical used a flat trailing `## Scenarios` section that the composer appended instead of merging (fixed by normalizing both the canonical and the delta to the nested `#### Scenario:` convention).

Both fixes were in place before this run. The native composer was re-run:

```
$ gentle-ai sdd-archive-compose \
    --canonical "openspec/specs/denominacion-automatica-producto/spec.md" \
    --delta "openspec/changes/fix-race-denominacion-autogenerada/specs/denominacion-automatica-producto/spec.md" \
    --output "openspec/specs/denominacion-automatica-producto/spec.md.compose-tmp"
EXIT=0
```

### Pre-composition shapes

| Artifact | `## Requirements` | `## Scenarios` | `### Requirement:` | `#### Scenario:` |
|----------|-------------------|----------------|--------------------|------------------|
| Canonical before | 1 | 0 | 7 | 5 |
| Delta | 1 (`## MODIFIED Requirements`) | 0 | 7 | 9 |

### Post-composition structural verification (before install)

| Artifact | `## Requirements` | `## Scenarios` | `### Requirement:` | `#### Scenario:` | Duplicate names |
|----------|-------------------|----------------|--------------------|------------------|-----------------|
| Composed output | 1 | 0 | 7 | 9 | none |

The composed output met every required structural invariant: exactly ONE `## Requirements` section, ZERO `## Scenarios` headings, 7 `### Requirement:` blocks, 9 `#### Scenario:` blocks, no duplicate requirement or scenario names.

A `diff -u` of canonical vs composed output showed changes limited to the two MODIFIED requirements and the four added scenarios; no preserved requirement or scenario was altered or dropped. The merge is non-destructive.

### Install evidence

The `.compose-tmp` was installed atomically with `mv`:
- composed md5 `6a409ffa1c9b22e0afe565feed36ff8e` = installed md5 `6a409ffa1c9b22e0afe565feed36ff8e` (byte-identical).
- No `.compose-tmp` leftover.
- Installed canonical structure: 1 `## Requirements` / 0 `## Scenarios` / 7 requirements / 9 scenarios.

## Archive Move Evidence

`git mv` failed with `fatal: directorio de fuente está vacío` because the change folder was untracked (git saw no tracked files). The skill's guarded block then fell back to plain `mv` after confirming the source was unchanged against the pre-move recursive snapshot.

MANDATORY `diff -r` readback (pre-move snapshot vs archived tree), verbatim:

```
$ diff -r "$snapshot_root/source" "openspec/changes/archive/2026-09-24-fix-race-denominacion-autogenerada"
diff_exit=0
```

Empty output (`diff_exit=0`) — byte-identical. Active source directory no longer exists.

## Archive Contents

- `proposal.md`: present
- `exploration.md`: present (optional artifact)
- `specs/denominacion-automatica-producto/spec.md`: present (delta)
- `design.md`: present
- `tasks.md`: present — 13/20 tasks checked; 7 unchecked
- `verify-report.md`: NOT present (no sdd-verify artifact was persisted as a file for this change)

## Final State of the Change

Per the Final-State Authority hierarchy:

- **Tasks artifact (rank 1)**: 13 of 20 checkboxes are `[x]`. The 7 unchecked tasks are the manual browser checks 2.5–2.11. Their checkbox bytes were preserved as-is; archive did not repair them.
- **Launch prompt final-state facts (rank 2)**: implementation and automated verification are complete. The 7 manual browser checks were exercised by the user against the real backend and reported WORKING: first-edit caret/value preservation (the bug), rapid consecutive typing, selector change after manual edit, delete-whole-field reactivation, whitespace-only reactivation, suggestion refresh while active, and existing-Producto regression / `sistema > 0` disabled. This is user-reported manual evidence, NOT automated proof.
- **`apply-progress` (rank 3, observation #762, at apply time)**: the fix replaced the `sugerenciaDenominacionActiva` `useState` pair with one synchronous `sugerenciaDenominacionActivaRef = useRef(!producto)` in `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx` (5 references updated; `denominacionActual` kept as a dependency; the manual-edit detector effect kept immediately before the suggestion effect). No `FormInput`, generator, service, DTO, or preload change.

**Contradiction recorded, not resolved**: the tasks artifact still shows the 7 manual checks unchecked while the launch prompt reports them exercised and WORKING. The tasks bytes were not modified; both statements are reported here so a future reader sees the artifact and the user-reported evidence, and does not read the unchecked boxes as "not performed."

## Verification (highest-ranked source)

- `yarn build` — exit 0.
- `yarn tsc -b` — exit 1, pre-existing baseline only.
- `yarn lint` — exit 1 (145 problems), no new diagnostic in the touched file.

No automated test runner is configured (`strict_tdd: false`); no automated tests were added or claimed.

## Delivery State

- No branch, commit, or push was made by this archive phase.
- Production source under `src/` was NOT modified by this phase.
- The implementation change remains in the working tree on branch `CR-001`, uncommitted.

## Engram Observation IDs Read

- `sdd/fix-race-denominacion-autogenerada/archive-report` — #765 (previous blocked attempt, referenced)
- `sdd/fix-race-denominacion-autogenerada/apply-progress` — #762
- `sdd/fix-race-denominacion-autogenerada/tasks` — #761
- `sdd/fix-race-denominacion-autogenerada/proposal` — #757
- `sdd/fix-race-denominacion-autogenerada/design` — #760
- `sdd/fix-race-denominacion-autogenerada/spec` — #758
- `sdd/fix-race-denominacion-autogenerada/explore` — #755
- Discovery "sdd-archive-compose cannot merge a flat `## Scenarios` canonical spec" — #767

## SDD Cycle Complete

The change is archived. Implementation: merged and present in the working tree on branch `CR-001` (uncommitted). Verification: `yarn build` passing; `yarn lint`/`yarn tsc -b` failing on the documented pre-existing baseline only; the 7 manual browser checks are user-reported working and remain unchecked in the tasks artifact. Unfinished work: none beyond the unchecked manual-check boxes; unresolved findings: none observed.
