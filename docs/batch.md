# Batch orchestration

## Assignment and isolation

The user's explicit batch instruction authorizes delegation for that batch; it does not become standing permission to spawn workers in unrelated tasks. Root reads AGENTS.md and the live tracker, pins this repo's commit, validates the private batch manifest, then creates one exclusive folder per stable lead ID. Use at most the available concurrency minus one root slot. Queue the rest; do not pretend queued agents are running.

Root owns shared manifests, Google Sheets writes, publication and outgoing messages. A worker owns only its business folder and its local ephemeral server. No shared root CSS, image folders, manifest writes, cloud project creation, email, DNS or pricing changes by children. A reviewer must differ from the builder; root can serve as independent reviewer. Worker self-QA is necessary but insufficient.

## Dispatch packet

Use `prompts/worker.md`. Include:

- Pinned architecture commit and current stage context paths.
- Stable ID, exact business and location, current tracker snapshot and source links.
- Exact authorized scope; excluded operations and unresolved facts.
- Exclusive project path, branch/worktree when needed, expected artifact names and deadline/checkpoint cadence.
- Known company-site baseline, asset sources and existing integration destinations.
- Required first handoff: research + proposed art direction + meaningful route map, before full implementation.

The packet supplies context, not undocumented assumptions. Do not give one worker a giant dump of the entire CRM. Workers must not infer that a previous proposal or research plan is authority to send or deploy.

## Wave protocol

1. Validate scope and native tracker stable IDs; skip paused/unresolved identity leads unless user specifically overrides the applicable scope.
2. Fan out research/design per business. Root compares directions side by side before each full build. Reject reused opening structure, palette/type pairing, identical feature sequence or the same utility on every site unless genuinely required and justified.
3. Workers implement all planned pages, test all routes and flows, inspect their own screenshots and repair defects.
4. Root independently opens every page on mobile/desktop and checks the primary journeys, official-site coverage and batch differentiation. Return precise defects to the owning worker. Do not rewrite every site centrally without teaching the owning stage what failed.
5. Seal each approved build. Root publishes only if the user's grant covers publication, verifies stable/immutable artifacts and hosted QA, then updates the tracker with readback if authorized.
6. Deliver a per-lead status matrix: researched, designed, built, review failed/passed, published verified, tracker verified, needs input. Include exact outstanding work. No “all done” from worker completion alone.

## Recovery

After interruption, read STATE.json and the latest artifact fingerprint. Completed stages with changed inputs must rerun relevant gates. Prefer current live deployment markers and provider receipts over old README dates. Never restart completed work from a stale handoff or overwrite a coworker's newer files. Write a bounded HANDOFF.md at each meaningful boundary: what changed, proof, ownership, next action and launch unknowns.

## Manifest checks

`node bin/icm.mjs batch path/to/batch.json` validates unique lead IDs and project directories, scope, pinned commit and root identity. It checks existing design signatures for duplicates; the root still visually compares the wave. No command launches agents automatically. Use the platform's agent tools under the actual user grant, and preserve root capacity for review.
