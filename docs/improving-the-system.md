# Improve the architecture from real defects

Keep the public kit stable during an active wave: workers pin a commit, and root records any deliberate migration. Do not edit gate rules underneath running workers. The project source and private evidence can evolve normally; changed build inputs invalidate downstream proof.

When a batch reveals a recurring problem, preserve a private concrete example, identify its owning stage and write the smallest reusable correction. A deterministic failure becomes a negative regression test; a visual/copy issue becomes a specific review observation and design rejection test. Update a stage context only when that context would have prevented the failure. Do not add another generic checklist item merely to make the instructions longer.

Examples:

- Existing pages omitted → baseline inventory/coverage contract and parity regression.
- Crop hides the work → asset contact-sheet review and full-image/mobile state evidence.
- Same gallery/planner repeated everywhere → art-direction comparison and the useful-interaction test.
- Wrong email or company → identity/primary contact source match; never guessed addresses.
- Private research on public host → allowlist/private-probe negative regression.
- Green local tests but broken hosted provider → hosted route/flow checks with actual framing/fallback behavior.
- Spreadsheet notes lost → minimal patch and exact before/after preservation comparison.

Run `npm run check` and `npm test` before publishing an architecture change. CI must pass on supported platforms. Describe the concrete problem and resulting behavior in a PR or commit. Do not include the real customer's private evidence in this public repo; reduce it to a fictional fixture. Never weaken a quality gate solely to make a particular project pass.

Use the next real batch to assess first-pass quality. Track root rework findings by stage, independent review scores with examples, escaped defects and actual time spent. Do not measure success by page count or agent “done” reports. This initial kit has infrastructure regressions; it has not yet proven a future batch's design outcomes.
