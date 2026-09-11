# Repository Agent Guide

Follow this guide for every task in `Proyecto1_Front`. Base decisions on verified repository evidence, preserve unrelated work, and keep the domain language consistent across specifications, code, UI, and tests.

## Quick path

1. Read the request, acceptance criteria, `docs/Analisis_de_Dominio.md`, and the relevant OpenSpec change.
2. Inspect architecture, call flow, dependencies, and blast radius with CodeGraph before broad filesystem searches.
3. Resolve contradictions between the request, active specifications, domain model, and current behavior before implementation.
4. Complete the strict OpenSpec SDD flow: proposal -> specs -> design -> tasks -> apply -> verify -> archive.
5. Implement only approved tasks, then report the evidence from every verification command actually run.

## Source-of-truth order

When sources disagree, do not silently choose one or broaden the scope. Stop implementation and ask one focused question.

1. Explicit user direction and approved acceptance criteria.
2. The active artifacts and operational state under `openspec/changes/<change>/`.
3. Current executable behavior and automated tests.
4. `docs/Analisis_de_Dominio.md` and other project documentation.
5. Conventions verified in nearby code.

`docs/Analisis_de_Dominio.md` defines the intended domain direction, but some concepts may still be aspirational. Do not present a proposed aggregate, event, Value Object, CQRS model, or invariant as implemented until the code and active specification prove it.

## Project baseline

- Runtime and package manager: Node.js 24 and Yarn 4. Use `yarn`; do not substitute npm or pnpm commands.
- Frontend: React 19, TypeScript 5.7, Vite 6, React Router 7, Tailwind CSS 3.
- State and data access: React Context and Jotai for client state; Axios-based services for backend communication.
- Existing organization: `pages`, feature-oriented `componentes`, `hooks`, `context`, `services`, `interfaces`, shared `ui`, and `utils`.
- Build: `yarn build`.
- Lint: `yarn lint`.
- Type-check: `yarn tsc -b`.
- Development server: `yarn dev`.
- No automated test runner, coverage command, or test CI job is currently configured. Never claim tests passed or strict TDD was followed without first adding and running the required test infrastructure through an approved change.
- The current baseline recorded in `openspec/config.yaml` says build passes while lint and type-check have pre-existing failures. Distinguish new regressions from baseline failures and provide exact command output.

## Domain-Driven Design

Use the ubiquitous language from `docs/Analisis_de_Dominio.md`, especially `Producto`, `Marca`, `Línea`, `Costo`, `Margen`, `Precio`, `Stock actual`, `Stock mínimo`, `Movimiento de stock`, `Ajuste de stock`, `Stock bajo`, and `Lista de precios`.

### Context boundaries

- **Inventario** is the core domain and the primary focus.
- **Catálogo** owns product master data and is currently closely integrated with Inventario.
- **Comercial** is outside the documented scope unless an approved specification explicitly includes it.
- Do not leak a model from one bounded context into another merely because the backend payloads look similar.

### Domain rules

- Treat `Producto` as the intended aggregate root for product invariants.
- Price is intended to derive from cost and margin; do not introduce an independently editable price or a competing formula without resolving the current contract through OpenSpec.
- Stock is low when `stockActual <= stockMinimo`.
- Stock must not become negative.
- Every manual stock adjustment requires a reason and must preserve traceability through a stock movement.
- Detecting low stock belongs to the domain; displaying or notifying it is an application/presentation concern.
- Price lists and low-stock reports are read models. Keep query concerns separate from state-changing commands.
- Introduce `Precio` or `Margen` Value Objects, domain events, or stricter CQRS only when an approved change defines their need and migration impact.

### Frontend responsibility

- The backend remains authoritative for business invariants. Frontend validation improves user feedback but never replaces server-side enforcement.
- Keep rendering and interaction in components, orchestration in hooks or feature utilities, HTTP concerns in services, contracts in interfaces, and reusable visual primitives in shared UI.
- Preserve the repository's existing separation of form values, Yup schemas, payload transformations, hooks, services, and components.
- Do not duplicate a business formula across components. Use one approved, testable domain-facing abstraction when the frontend must calculate or preview a value.
- Reuse existing components and utilities before adding abstractions or dependencies.
- Keep UI copy consistent with the application's existing Spanish language. Use domain terms exactly rather than inventing synonyms.

## Strict Spec-Driven Development with OpenSpec

OpenSpec is mandatory for every behavior, contract, architecture, dependency, or domain change. A change is not ready for implementation until its proposal, specifications, design, and tasks are complete and internally consistent.

Documentation-only typo fixes and purely mechanical formatting may omit a new change only when they do not alter requirements, behavior, architecture, or workflow. If uncertain, use OpenSpec.

### Required lifecycle

1. **Proposal**: define intent, user impact, scope, non-goals, risks, dependencies, and rollback strategy.
2. **Specs**: write normative requirements using RFC 2119 keywords and observable Given/When/Then scenarios, including failure and boundary cases.
3. **Design**: map requirements to the affected bounded context and frontend boundaries; document API contracts, state flow, alternatives, and significant tradeoffs.
4. **Tasks**: use hierarchical numbering, map tasks to requirements, and keep each task independently verifiable and completable in one session.
5. **Apply**: implement approved tasks in order without silently expanding scope. Update task status as work progresses.
6. **Verify**: prove conformance to the proposal, specs, design, tasks, acceptance criteria, and relevant quality gates. Record failures honestly.
7. **Archive**: archive only after verification succeeds and requirement deltas are reconciled. Warn before destructive or conflicting spec merges.

### OpenSpec discipline

- `openspec/config.yaml` defines repository defaults; active change artifacts may add stricter scoped rules but must not weaken requirements silently.
- Before editing source for an existing change, read its state, proposal, delta specs, design, and tasks.
- Respect operational states such as draft, blocked, or paused even when implementation appears technically possible.
- Every implementation task must trace to at least one requirement or acceptance scenario.
- Any discovered scope change returns to the appropriate earlier phase; do not patch the code first and document it afterward.
- Keep archived changes immutable as audit history.
- Do not fabricate phase completion, verification evidence, tests, approvals, or synthetic artifacts.
- Strict SDD does not mean strict TDD. `strict_tdd` is currently `false` because no test framework is configured; changing that requires an explicit, approved OpenSpec decision.

## CodeGraph-first exploration

Use CodeGraph before broad `find`, glob, grep, or manual file-by-file exploration for architecture, call flow, dependencies, symbols, references, and impact analysis.

1. Resolve the root with `git rev-parse --show-toplevel || pwd`.
2. Check `<project-root>/.codegraph/`.
3. If missing in this real project, initialize once with `gentle-ai codegraph init --cwd <project-root>`.
4. Prefer `codegraph_explore`; otherwise use upstream read-only commands such as `codegraph status`, `query`, `explore`, `node`, `files`, `callers`, `callees`, `impact`, and `affected`.
5. Use normal filesystem tools only for documentation/configuration that CodeGraph does not index or after CodeGraph fails; state the fallback briefly.
6. After edits, rely on watcher auto-sync. Run `codegraph sync` only when the watcher is disabled or reports files that remain stale.

Never copy or reuse another worktree's `.codegraph/` index. Never run or recommend `codegraph uninit`, `install`, `uninstall`, or `upgrade`; reserve `codegraph index` for explicit corruption recovery.

## Testing and verification

- Derive tests from acceptance scenarios and observable contracts.
- For new test infrastructure, prefer Vitest with React Testing Library unless the approved design documents a concrete reason to use Jest.
- Test domain calculations and validation as pure units where possible; test components through user-observable behavior rather than implementation details.
- Run the narrowest relevant checks first, then expand according to CodeGraph blast radius.
- At minimum, attempt `yarn build`, `yarn lint`, and `yarn tsc -b` for source changes. Documentation-only changes require inspection of the final diff but not a build.
- Never fix unrelated baseline failures without approval. Report the command, exit status, and whether a failure is pre-existing or introduced by the change.
- Never say a check passed unless it completed successfully in the current worktree.

## Git and delivery

- Organize work against the relevant ClickUp task, issue, or change request when one exists.
- Use feature branches and merge through a reviewed pull request into `develop`; do not commit directly to `develop` unless explicitly instructed.
- Keep commits small and atomic: one logical change with its tests and documentation.
- Use Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, or `chore`, with an optional scope.
- Write the subject as an imperative action, without a final period, and keep it at 50 characters or fewer.
- State what changed in the subject; use the body for context and rationale when necessary.
- Reference the related task or issue when applicable.
- Never add `Co-Authored-By`, AI attribution, or similar metadata.
- Do not commit broken code, secrets, logs, generated output, temporary files, dependencies, or unrelated working-tree changes.
- Do not create a branch, commit, push, or open a pull request unless the user explicitly requests it.

## Change discipline

- Preserve unrelated modified and untracked files.
- Prefer the smallest complete change that satisfies the approved specification.
- Do not invent business rules, APIs, acceptance criteria, or technical debt.
- Record genuine technical debt with impact and a concrete follow-up; never manufacture debt for reporting purposes.
- Ask one focused question only when authoritative evidence cannot resolve a business rule, scope boundary, conflict, or destructive action.
