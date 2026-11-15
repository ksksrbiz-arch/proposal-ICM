# 08 Register: root owns shared state

**Owner:** root. **Gate:** `gate <project> register`. **Gate codes:** `register.*`.

## Load
| File | Why |
| --- | --- |
| [tracker guide](../../references/tracker.md) | Workbook contract |
| Live workbook and its actual tool schemas | Read immediately before writing |
| `publication.json`, `public-verification.json` | What may be recorded |

## Do not load
| File | Why |
| --- | --- |
| Old workbook snapshots | Never restore a snapshot over live user changes |

## Input
Explicit tracker-update authority and a passed publish gate.

## Process
1. Read workbook metadata, target cells, formulas, validation, table/filter ranges and the existing stable ID right before writing.
2. Prepare a minimal private `tracker.json` write plan: stable lead ID, intended Build Register cells, verified preview URL/deployment time/check status, allowed research updates, current and expected values. A published draft never changes outreach stage, decision, contact date, quote or proposal-sent history. Preserve Rob/Keith notes, corrections, decisions, follow-ups, assignees, quoted prices, history and permissions.
3. Apply only within explicit authority. Upsert by stable ID, not row order or name. Never overwrite calculated preview/status fields. Extend native tables and filters coherently only when new rows are required.
4. Read back changed cells, hyperlink destinations, affected formulas and table coverage; compare protected human fields before and after.
5. If access fails, leave publication intact, save the exact pending plan and report the limitation. Never claim the link is in the sheet before readback proves it.
6. Write `HANDOFF.md`: business/preview, pages, distinguishing design, preserved integrations, deployment, QA/review proof, owner launch inputs, tracker status, next action.
7. Outreach is separate: a send needs current explicit authority, a confirmed public/owner-provided address, duplicate/paused checks, matching quote/scope/PDF, Sent Items and attachment verification and a truthful history entry. Never infer delivery or read status from sending.

## Output
`tracker.json`, before/after evidence, `HANDOFF.md`.

## Completion
- `gate <project> register` passes (applied, preservation and table coverage verified, evidence hashes match).
- Next: [09 Learn](../09-learn/CONTEXT.md).
