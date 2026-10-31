# 06 Independent review — root acceptance

The reviewer is different from the builder. Read `docs/design-standard.md` and inspect actual screenshots and the running site. Do not approve from a report summary, a composite thumbnail alone or green tests. Inspect every route on mobile and desktop, plus key interactive states and short screens. Compare with the official site when available; identify concrete improvements and preserved strengths.

Score six dimensions from 0 to 5: business specificity, art direction, copy/content, mobile usability, customer journeys, finish/accessibility. Each needs 4+, overall 26/30+. Provide observations tied to exact route, viewport and screenshot. A number without evidence is invalid. Scores cannot override missing facts, broken actions, parity gaps, private-file exposure or unreviewed pages.

Apply the substitution test: if another prospect's name and logo could be swapped in without changing most of the experience, reject it. Check authentic photo treatment, intentional density/whitespace, readable hierarchy, page diversity, current booking continuity, honest claims and useful details. Remove filler and repeated cosmetic tools. Improve the worst page, not just the homepage.

Record `review.json`: reviewer ID, current fingerprint, route-wide mobile/desktop coverage, artifact hashes, six scores, comparison, specific fixes and unresolved launch inputs. The gate requires separate reviewer identity and all routes. It cannot verify that an agent honestly looked at an image; the root is responsible for doing so.

Run `seal` after review and before any upload. It records the exact output hashes and contract fingerprint. Any source/output/contract change invalidates release evidence and requires appropriate rechecks. Exit: `gate review`. Hand root a release candidate; a child cannot publish or mutate the shared sheet merely because its own checks pass.
