# 09 Learn: required after every use

**Owner:** worker draft, independent root review. **Gate:** `gate <project> learn`. Works without a successful deployment.

## Load
| File | Why |
| --- | --- |
| [learning guide](../../references/learning.md) | Promotion rules |
| `.icm/learning/LESSONS.json` via `icm lessons [stage]` | Adopted lessons before the next assignment |
| Actual QA, rework, review and failure evidence | The only valid inputs |

## Do not load
| File | Why |
| --- | --- |
| Prospect names, contacts, private snapshots in public lessons | Privacy: keep out of the public registry |

## Input
A completed, blocked, failed or interrupted run. An explicit user stop always takes precedence.

## Process
1. Capture is automatic: gate-class commands log to `evidence/usage-log.jsonl`, and `advance register` drafts `learning.json`. For blocked, failed or interrupted runs, run `retrospect <project> <outcome>` (it archives the prior run). Measured rework and blocking codes are a starting point, not proof the site is good. Run `insights` across projects to find recurring uncovered codes.
2. Fill `learning.json`: evidence-bound observations, causal hypotheses, an intervention, before/after evidence, independent root review, next-run checks.
3. For a defect: name the owning stage, predict how a changed rule/test prevents it, reproduce, make the smallest correction, compare on the same case, run the relevant regression plus the whole suite when tooling changes. For a success: retain the pattern with evidence. Hold unproven hypotheses with a concrete next experiment.
4. After the wave, root promotes proven generic lessons into the owning workflow, a fictional regression fixture and `LESSONS.json`, in one reviewed commit when practical. Never mutate instructions under active workers; pin the new commit for the next batch.
5. Adoption needs independent review, privacy review, distinct before/after evidence, regression references and the actual promotion commit. `learning-candidate` writes a sanitized candidate only; it never activates policy.
6. Never weaken facts, permissions, privacy or release gates to make scores look better. One retrospective and one bounded improvement cycle per use prevents self-edit loops.

## Output
`learning.json`, archived prior runs, optional sanitized candidate.

## Completion
- `gate <project> learn` passes; the architecture version changed or the result was retained/held.
- A learning pass does not authorize outreach or continuing after a stop request.
