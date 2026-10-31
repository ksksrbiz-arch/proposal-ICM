# 03 Design — a concept, not a reskin

Read `docs/design-standard.md` and `reference/lessons.md`. Inspect an asset contact sheet. Decide one art direction derived from this business: photo composition, type hierarchy, palette, spacing rhythm, navigation, content density and motion behavior. Write the rationale in `design.json`; generic adjectives such as modern/premium are not a rationale.

Specify a business-specific opening, page sequence and primary customer journey. Identify at least three distinguishing decisions that survive changing the company name. Show how each decision helps a customer. Draft actual hero/service/CTA wording and a representative mobile/desktop composition before coding all pages. Root compares concepts across the batch and rejects repeated skeletons.

`routes.json` lists every real content route, unique purpose, content sections, source IDs, asset IDs, primary action and baseline coverage IDs. Meet or exceed known core-page coverage and preserve useful existing journeys. For an unknown baseline, use a researched route plan and say parity is unverified. More pages do not excuse thin content. Detail galleries and provider handoffs remain separate from core-page totals.

`flows.json` lists meaningful user flows, entry route, expected outcome, actual destination and an evidence path for its test. Mark whether it is a real external handoff or local-only preparation. Every visible control needs real behavior or an honest disabled/unsupported state. Booking embeds need a verified provider URL, frame behavior and direct fallback; do not promise availability or bypass a framing restriction.

Choose only useful nice-to-haves: reference-aware galleries for portfolio work, real menu filtering for a food truck, existing appointment handoffs for a salon, seasonal context for a farm. Never add the same note generator to every business. Keep operational caveats concise and relevant to the visitor; detailed implementation notes belong privately.

Record accessibility/mobile specifics, copy samples, desired screenshot views and a comparison against the current site. Exit: `gate design` and root concept review before full implementation. Return weak differentiation to this stage instead of hiding it with gradients or animation.
