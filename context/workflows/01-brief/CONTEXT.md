# 01 Brief: root owns selection

**Owner:** root. **Gate:** `gate <project> brief`. **Gate codes:** `brief.*`.

## Load
| File | Why |
| --- | --- |
| [batch protocol](../../references/batch.md) | Only for a multi-lead batch |
| [artifact contracts](../../references/contracts.md) | project.json shape and authority records |
| Live tracker (read-only) | Eligibility, paused/declined/contacted states |

## Do not load
| File | Why |
| --- | --- |
| Other prospects' packets | Isolation: one stable ID per worker |
| Design standard, lessons case studies | Not needed until design |

## Input
- The user's exact current instruction and the chosen stable lead IDs.
- The live tracker. Preserve paused, declined, already-contacted and unresolved-identity states.

## Process
1. Fill `project.json`: schemaVersion, projectId, business name/locality, instruction commit, assignment, scope, builder ID, root reviewer ID.
2. Record each granted action with the user's real instruction and date. Defaults are false. Build permission is not publish, email, pricing or domain permission. A JSON flag is a record, never a source of permission.
3. Set `outputDir` relative to the private project (normally `site/dist`). Keep source, research, original assets and QA separate. Choose the simplest maintainable stack that fits the business, not the last site's stack.
4. Public deployment is a preview subdomain, never a claimed business domain.
5. Set scope to `first-site`, `redesign` or `refinement`. First-site needs checked-source evidence. A Google Site, Square site or business-owned provider storefront is a company website. Our independent proposal is not the company's live site. Never widen a first-site-only batch to redesign leads without authorization.
6. The user may authorize concept work despite launch unknowns; record that distinction.

## Output
`project.json`, `STATE.json`, `HANDOFF.md`: identity to verify, authorized actions, exclusions, owned paths, known conflicts, next research step.

## Completion
- `gate <project> brief` passes (authority recorded with real instruction/date; builder differs from reviewer).
- No prospect messaging happened in this stage.
- Next: [02 Research](../02-research/CONTEXT.md).
