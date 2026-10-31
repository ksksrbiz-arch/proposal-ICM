# Proposal ICM

A repeatable operating system for distinctive local-business website proposals. It turns research, art direction, implementation, visual review, publication and tracker handoff into bounded stages with evidence. It is designed to catch the failures that previously required repeated polish passes. No process can guarantee taste or a perfect first draft; this one fails closed when required evidence is missing.

**Start with [AGENTS.md](AGENTS.md) and the [context router](.icm/INDEX.md).** Read [the architecture](docs/architecture.md) for its trust/context layers. For a batch, use [the orchestrator prompt](prompts/orchestrator.md). Do not ask workers to read the entire repo.

## What this system delivers

- Business-specific research and a real existing-site inventory, including unknowns and conflicts.
- A deliberate visual concept, authentic asset inventory, plain copy, page-by-page content and customer journeys.
- A builder/reviewer separation, route-wide responsive checks, meaningful interaction tests and screenshot review.
- Reviewed-build hashing, public-file allowlists and stable/immutable deployment verification.
- Stable-ID tracker write plans that preserve outreach history and human corrections.
- Batch isolation, pinned instructions, durable state and explicit handoffs so a fresh agent can continue.

There is no reusable homepage template, universal color palette, forced framework or default animation package. Reuse tested infrastructure; author each site's experience.

## Quick start

Node 22+ is required. From a clone of this repo:

```sh
npm ci
npm run check
npm test
node bin/icm.mjs init ../private-proposals/CC-EXAMPLE
node bin/icm.mjs status ../private-proposals/CC-EXAMPLE
```

`init` creates unapproved, empty evidence packets, not a business website. Fill `project.json` with the verified identity, exact assignment, instruction commit and scoped authority. Read the relevant stage context. Validate a stage before advancing:

```sh
node bin/icm.mjs gate ../private-proposals/CC-EXAMPLE research
node bin/icm.mjs advance ../private-proposals/CC-EXAMPLE research
```

The gate checks that stage and its prerequisites; it returns nonzero on failure. `advance` writes a new state event only after the gate passes. `status` is observational and does not authorize any action. See [artifact contracts](docs/contracts.md) and [commands](docs/commands.md).

## The delivery path

```mermaid
flowchart LR
  B[Brief and scope] --> R[Identity and research]
  R --> D[Art direction and page plan]
  D --> C[Business-specific build]
  C --> Q[All-route technical QA]
  Q --> V[Independent visual and journey review]
  V --> P[Authorized publication and byte verification]
  P --> T[Tracker readback and handoff]
  V -->|Defect with evidence| D
```

The agent may iterate internally before returning a site. A score is a review aid, not proof of beauty. Public launch and outreach remain separate actions with separate authority.

## Use with batch agents

Follow [the first-run guide](docs/first-run.md) when starting the next wave. A structural batch manifest is in [templates/batch.json](templates/batch.json), and the private handoff outline is in [templates/HANDOFF.md](templates/HANDOFF.md).

Give the root agent a private batch manifest matching `schemas/batch.schema.json`, the allowed lead IDs, the selected scope and the exact user authorization. The root reads the live tracker, assigns one business per worker, compares concepts across the wave, reviews every page, publishes approved bytes if authorized, and owns shared-sheet writes. Workers own only their assigned folders. See [batch protocol](docs/batch.md).

Suggested invocation:

> Use proposal-ICM at commit `<SHA>`. Build the following lead IDs from the shared tracker using a separate worker per business. Follow AGENTS.md and .icm/INDEX.md. Create private evidence packets, audit existing sites, exceed their useful core-page coverage, and pass independent mobile/desktop review. Publish to Cloudflare and update the tracker only if authorized below. Do not send outreach. Scope: `<lead IDs, first-site/redesign/refine, authority>`.

## Quality bar

See [design standard](docs/design-standard.md), [case-study lessons](reference/lessons.md) and [release checklist](docs/release.md). Examples reference prior public proposals as study material, not current fact sources or promises that an owner approved them. Never reuse another company's identity or photos.

## Tooling boundaries

`browser-qa` captures route-wide evidence; project-specific flow tests remain required. `seal` hashes only allowlisted public files and records the reviewed contract fingerprint. `verify-public` compares those bytes on both deployment URLs. A release still requires a reviewer to inspect screenshots and the actual customer journeys.

The kit never reads credentials, contacts prospects, mutates the shared sheet, creates cloud resources or deploys on its own. It produces reviewed evidence and write plans for an authorized operator to apply with the connected tools. Real project data is ignored by Git and is not part of this public repository.
