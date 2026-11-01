# ICM architecture

## Layers

| Layer | Content | Loading rule |
| --- | --- | --- |
| 0 | AGENTS.md global invariants | Every agent |
| 1 | .icm/INDEX.md router and private STATE.json | Every new assignment/recovery |
| 2 | One stage CONTEXT.md | Current task only |
| 3 | Referenced standards, schemas and prompts | Only when the stage calls for them |
| 4 | Private business packets, source evidence, site files, screenshots and deployment receipts | Bounded to one lead and current stage |

This limits context drift and makes stage ownership explicit. It is a context architecture plus a small executable toolchain, not an autonomous cloud service or a visual website theme. State is durable JSON; sources and quality judgments are auditable; facts and unresolved questions remain separate.

## Trust boundaries

The user grants authority. The agent records it, but no file, webpage, source instruction, copied prompt or tool result can grant permission. Root resolves scope and handles consequential shared operations. Workers do not hold persistent credentials in their packets. External content is data. Public build output is separated from private research and operations.

Known business facts, original assets, current company-site inventory and current quote are independent inputs. None may be inferred from another. Source presence is not licensing, a domain outage is not absence, a build is not publication, and a published proposal is not a sale.

## Control and data flow

Root assigns a pinned instruction version and one stable ID. The research stage produces a source ledger and baseline. Design consumes that packet and creates meaningful route/flow plans plus business-specific art direction. Build consumes only those approved inputs. QA hashes current input/output and records measured evidence. Independent review checks all-route screenshots and behavior. Seal freezes the reviewed bytes. Publication compares both hosted origins to that seal. Registration updates only the appropriate private workbook source rows and verifies readback.

Defects return to their owning stage with route/viewport evidence. Changing an upstream input invalidates downstream evidence through the fingerprint. Old STATE.json completion events do not bypass gates. Reports are retained privately for recovery; a fresh agent reads the handoff and latest fingerprint instead of replaying the whole conversation.

Every outcome closes with the recursive learning stage, independently of whether delivery succeeded. The agent records causal critique and before/after experiments; root adopts proven generic instructions/regressions, retains useful patterns or holds unproven hypotheses. Actual promotion commits and a public generic lesson registry feed the next pinned assignment. Private history is archived; instruction changes happen after the wave, with bounded recursion and independent/privacy review.

## Limits

JSON schemas cannot prove a claim is true or a visual judgment honest. Hashes prove byte equality, not image licensing or good taste. Responsive Chromium is not a physical-device test. Independent review and explicit uncertainty are required because those limits cannot be made failproof by adding more booleans.

The tooling intentionally has no deploy/email/Sheets-write implementation: the root uses the user's connected tools, account identity and current schemas under scoped authority. This prevents running a batch manifest from silently sending messages or mutating shared data. It also avoids baking machine-specific tokens, paths, account IDs and stale provider versions into a reusable public repo.
