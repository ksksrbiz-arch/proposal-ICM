# 03 Design: a concept, not a reskin

**Owner:** worker, then root concept review. **Gate:** `gate <project> design`. **Gate codes:** `design.*`, `batch.similar-design`.

## Load
| File | Why |
| --- | --- |
| [design standard](../../references/design-standard.md) | Rejection tests |
| [case-study lessons](../../references/case-study-lessons.md) | Historical failures |
| `research.json`, `assets.json`, asset contact sheet | Evidence the concept must rest on |
| `icm lessons design` | Adopted lessons |

## Do not load
| File | Why |
| --- | --- |
| Previous sites' source or layouts | This repo supplies process, not a visual starter theme |
| Build/QA material | Not yet produced |

## Input
Verified research, inspected assets, baseline inventory.

## Process
1. Decide one art direction derived from this business: photo composition, type hierarchy, palette, spacing rhythm, navigation, density, motion. "Modern/premium" is not a rationale.
2. Specify a business-specific opening, page sequence and primary journey. Name at least three distinguishing decisions that survive changing the company name, and how each helps a customer. Draft real hero/service/CTA wording and a representative mobile/desktop composition before coding all pages.
3. `routes.json`: every real content route with unique purpose, sections, source IDs, asset IDs, primary action, baseline coverage IDs. Meet or exceed known core-page coverage and keep useful existing journeys. Unknown baseline: researched plan, parity stated as unverified. Thin pages do not excuse count; detail galleries and provider handoffs stay out of core totals.
4. `flows.json`: meaningful flows with entry route, outcome, actual destination, and whether it is a real external handoff or local-only preparation. Every visible control needs real behavior or an honest disabled state. Booking embeds need a verified provider URL, frame behavior and direct fallback; never promise availability or bypass framing restrictions.
5. Choose only useful extras (reference-aware galleries, menu filtering, existing appointment handoffs, seasonal context). Never add the same note generator to every business.
6. Record accessibility/mobile specifics, copy samples, desired screenshot views and a comparison with the current site. Return weak differentiation here; gradients and animation do not fix it.
7. Root compares concepts across the batch and rejects repeated skeletons (`icm batch` flags exact and near-identical layout signatures).

## Output
`design.json`, `routes.json`, `flows.json`.

## Completion
- `gate <project> design` passes and root has reviewed the concept (`conceptReviewedBy`).
- Next: [04 Build](../04-build/CONTEXT.md).
