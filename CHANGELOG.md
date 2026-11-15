# Changelog

## 1.1.0 (unreleased, not yet published to npm)

**Interpretable Context Methodology layout.** `CLAUDE.md` and `GEMINI.md` are now a routing-only router (80 lines max). Stage contracts moved to `context/workflows/<stage>/CONTEXT.md` with Load, Do not load, Input, Process, Output and Completion sections. Detail documents moved to `context/references/` (200 lines max each). The old `stages/`, `docs/`, `reference/` and `.icm/INDEX.md` paths remain as one-line stubs so 1.0.0 pins and links keep resolving. `npm run check` now enforces the layout limits and required sections. The expansion of ICM in AGENTS.md changed from "Indexed Context Management" to "Interpretable Context Methodology".

**Foundation.** `gates.mjs` is split into one module per stage under `lib/gates/`. Gates collect every issue of a stage and report stable codes (`[build.claim-unsupported] ...`); the thrown error is a `GateError` with `stage` and `issues`, and its message still contains each original message. New commands: `gate <project> all`, `explain <code>`, `doctor`, and `--json` for every command. `PLAYWRIGHT_EXECUTABLE_PATH` selects any Chromium (previously only `PLAYWRIGHT_CHANNEL`). Gate-code docs are generated from the catalog (`npm run docs:gates`) and checked for staleness.

**New quality gates** (see `context/references/quality-gates.md`). Build gate: unsourced prices, phone numbers, emails, rating/review figures, founding years and superlatives; placeholder text; missing lang/title/viewport/alt; dead or unsafe links; insecure subresources; warnings for clichés, heading skips and third-party scripts. Browser QA: axe-core 4.14 (WCAG 2.0 to 2.2 A/AA; critical and serious block), keyboard reachability and visible focus, layout shift above 0.25, page weight above 5 MB, per-case metrics in the hashed report. `verify-public` records security-header warnings. `batch` rejects near-identical layout signatures. 

**Automatic learning.** Every gate-class command logs its outcome (codes only) to `evidence/usage-log.jsonl`; `init` preloads adopted lessons into `lessons-loaded.json`; `status` reports learning state; `advance register` drafts a retrospective when none exists; `retrospect` fills measured rework, an `automatic-usage-capture` observation and next-run checks; `insights` pools codes across projects and flags uncovered recurrences as candidates. Lessons gain an optional `codes` list. Adoption still requires independent and privacy review and a promotion commit. Tests: 38.

**Research.** `context/references/tooling-and-skills.md` documents which existing tools and Claude skills fit each stage, which are bundled, which stay optional and why.

**Compatibility notes.** The new claims gate can fail builds that contain a phone number, price or email without a matching `publicUse` research fact; add the sourced fact or remove the claim. New axe, keyboard and layout-shift checks can fail routes that passed under 1.0.0. The dependency `axe-core@4.14.0` is new.

## 1.0.x unreleased lessons

JSON flow evidence now rejects explicit failure results even when its hash matches and the outer QA record claims a pass. Fictional browser regressions cover aggregate failure, errors/failures arrays, failed checks/results, malformed JSON, passing JSON and existing text evidence. This does not replace independent journey review or impose a universal report schema.

Public verification now accepts HTTP 200 or HTTP 404 for the existing top-level `404.html` asset while preserving sealed-byte and noindex checks. Missing/private URLs still require HTTP 404, and homepage HTTP 200 fallbacks remain rejected. Added both direct-asset status regressions and an adopted publish lesson, routed through the publish stage. The package version remains 1.0.0 pending a separate release decision.

## 1.0.0 — 2026-10-31

Initial context router, nine stage contracts, root/worker/reviewer prompts, design standard, historical case-study lessons, private artifact schemas and batch isolation protocol. Added project initialization/state commands, fail-closed cross-artifact gates, all-route/six-viewport Playwright scanner, source/output fingerprints, reviewed-build seal and stable/immutable public verification. Twenty-two regressions cover meaningful page parity, identity/facts, stale evidence, private leaks, self-approval, private-route HTML fallbacks and recursive learning. The required learning stage archives each outcome, validates before/after experiments and independent/privacy review, checks actual promotion commits, routes adopted lessons into future work and bounds recursion. CI is configured for Linux/Node24 and Windows/Node22; see validation for actual execution limits.

This release does not build or deploy real prospects, send outreach, migrate a tracker or change any site's pricing/domain. Those actions remain separately scoped for future batches. Visual quality and source correctness still require independent inspection; the toolkit does not guarantee subjective perfection.

The first npm distribution adds the `proposal-icm` executable, version/instruction-root commands, an explicit public package allowlist and runtime browser dependency. Clean production installation and real command-shim tests cover both direct and aliased entry paths. Installed instructions stay pinned; proven lesson promotion uses an explicitly verified source clone instead of modifying node_modules.
