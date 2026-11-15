# 05 QA: measure every route and exercise the product

**Owner:** worker. **Gate:** `gate <project> qa`. **Gate codes:** `qa.*`. See [commands](../../references/commands.md) and [quality gates](../../references/quality-gates.md).

## Load
| File | Why |
| --- | --- |
| [commands](../../references/commands.md) | browser-qa usage |
| [quality gates](../../references/quality-gates.md) | Thresholds and limits |
| `flows.json`, `routes.json`, built output | What to test |
| `icm lessons qa` | Adopted lessons |

## Do not load
| File | Why |
| --- | --- |
| Review scores or the builder's summary | QA measures bytes, not opinions |

## Input
A fresh allowlisted build served locally. Run `icm doctor` first if the browser is unavailable.

## Process
1. Run `browser-qa <project> <localUrl> local`: all routes at 320, 390, 768, 1024, 1440 plus short landscape; page integrity, axe-core WCAG A/AA, keyboard reachability and focus visibility, layout shift, page weight, internal links, saved screenshots. Review failures and console errors; lazy-loaded broken images still count.
2. Write site-specific flow tests in `site/tests/` (Playwright or justified equivalent). Test every `flows.json` ID with assertions for a real outcome: mobile menu open/close/Escape/focus, gallery full-image and boundaries, tabs/filters, query restoration, note retention/reset/copy-denied fallback, downloads. Check tel/mailto/SMS/booking/Maps destinations without triggering calls, messages, bookings, orders or payments.
3. The scanner is not WCAG certification. Also inspect keyboard traps/return, target spacing, screen-reader names, reading order, 200% zoom, expanded text, reduced motion, loading. Use touch emulation; record physical-device gaps honestly. Chrome simulation is not an iPhone test.
4. Record defects with severity. Critical/high block release. Medium/low need a concrete disposition and independent review. Never silently drop an issue. After a fix, rerun affected checks, broadening when shared layout or logic changed.
5. A fresh hash proves which bytes were reviewed, not that assertions passed. JSON flow evidence is parsed: explicit `passed:false`, nonempty `errors`/`failures`, or failed `checks`/`results` block. Plain text evidence stays allowed; the reviewer must verify its real assertions. Never relabel a failed run by changing a hash or the pass flag.

## Output
`qa.json` (current fingerprint, technical report reference, every flow ID, defect ledger), `evidence/` screenshots and reports.

## Completion
- `gate <project> qa` passes; artifacts exist, are non-empty and match their SHA-256.
- Changed inputs invalidate evidence: fix the owning stage and regenerate.
- Next: [06 Review](../06-review/CONTEXT.md).
