# 06 Independent review: root acceptance

**Owner:** reviewer (never the builder). **Gate:** `gate <project> review`. **Gate codes:** `review.*`.

## Load
| File | Why |
| --- | --- |
| [design standard](../../references/design-standard.md) | Rejection tests and scoring |
| [reviewer prompt](../../../prompts/reviewer.md) | Review procedure |
| Actual screenshots and the running site | The evidence under review |
| Official site (if accessible) | Comparison |

## Do not load
| File | Why |
| --- | --- |
| Builder's rationale as proof | Never approve from a summary, a composite thumbnail or green tests |

## Input
Current-fingerprint QA evidence and the built site.

## Process
1. Inspect every route on mobile and desktop plus key interactive states and short screens. Compare with the official site; name preserved strengths and concrete improvements.
2. Score six dimensions 0-5: business specificity, art direction, copy/content, mobile usability, customer journeys, finish/accessibility. Each 4+, total 26/30+. Tie observations to exact route, viewport and screenshot. A number without evidence is invalid. Scores never override missing facts, broken actions, parity gaps, private-file exposure or unreviewed pages.
3. Substitution test: if another prospect's name and logo could be swapped in without changing most of the experience, reject. Check photo treatment, density/whitespace, hierarchy, page diversity, booking continuity, honest claims. Improve the worst page, not only the homepage. Remove filler and repeated cosmetic tools.
4. Run `seal` after acceptance and before any upload.

## Output
`review.json` (reviewer, fingerprint, route-wide coverage with screenshot hashes, scores, comparison, fixes, owner inputs) and `sealed-build.json`.

## Completion
- `gate <project> review` passes. The gate cannot verify an honest look at an image; root is accountable.
- Any source/output/contract change invalidates review and seal.
- Hand root a release candidate; a child cannot publish or mutate the sheet. Next: [07 Publish](../07-publish/CONTEXT.md).
