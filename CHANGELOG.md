# Changelog

## Unreleased

JSON flow evidence now rejects explicit failure results even when its hash matches and the outer QA record claims a pass. Fictional browser regressions cover aggregate failure, errors/failures arrays, failed checks/results, malformed JSON, passing JSON and existing text evidence. This does not replace independent journey review or impose a universal report schema.

Public verification now accepts HTTP 200 or HTTP 404 for the existing top-level `404.html` asset while preserving sealed-byte and noindex checks. Missing/private URLs still require HTTP 404, and homepage HTTP 200 fallbacks remain rejected. Added both direct-asset status regressions and an adopted publish lesson, routed through the publish stage. The package version remains 1.0.0 pending a separate release decision.

## 1.0.0 — 2026-10-31

Initial context router, nine stage contracts, root/worker/reviewer prompts, design standard, historical case-study lessons, private artifact schemas and batch isolation protocol. Added project initialization/state commands, fail-closed cross-artifact gates, all-route/six-viewport Playwright scanner, source/output fingerprints, reviewed-build seal and stable/immutable public verification. Twenty-two regressions cover meaningful page parity, identity/facts, stale evidence, private leaks, self-approval, private-route HTML fallbacks and recursive learning. The required learning stage archives each outcome, validates before/after experiments and independent/privacy review, checks actual promotion commits, routes adopted lessons into future work and bounds recursion. CI is configured for Linux/Node24 and Windows/Node22; see validation for actual execution limits.

This release does not build or deploy real prospects, send outreach, migrate a tracker or change any site's pricing/domain. Those actions remain separately scoped for future batches. Visual quality and source correctness still require independent inspection; the toolkit does not guarantee subjective perfection.

The first npm distribution adds the `proposal-icm` executable, version/instruction-root commands, an explicit public package allowlist and runtime browser dependency. Clean production installation and real command-shim tests cover both direct and aliased entry paths. Installed instructions stay pinned; proven lesson promotion uses an explicitly verified source clone instead of modifying node_modules.
