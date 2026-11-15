# Quality gates

What the kit checks automatically, where, and what it cannot prove. Codes are stable: `proposal-icm explain <code>` prints the meaning and repair. The full code list is in [gates](gates.md).

## Static checks (build gate, no browser)

Run over every allowlisted `.html` file of the public output ([lib/quality/static.mjs](../../lib/quality/static.mjs)).

| Check | Fails the gate | Warning only |
| --- | --- | --- |
| Placeholder text (`lorem ipsum`, `TODO`, `TBD`, `coming soon`, `{{token}}`, `[insert ...]`) | yes (`build.placeholder-content`) | |
| Prices (`$85`), phone numbers (text and `tel:`), emails (text and `mailto:`), rating/review figures, "since 1998" years | yes, unless the exact value appears in a `publicUse` research fact (`build.claim-unsupported`) | |
| Unverifiable superlatives: guaranteed, #1, award-winning, best in town, lowest price, licensed and insured, "official website" | yes, unless a public fact contains the phrase; negated or "independent" context is allowed | |
| `<html lang>`, non-empty `<title>`, viewport meta, `alt` on every image | yes (`build.html-structure`) | |
| Dead links (`#`, empty, `javascript:`), malformed `tel:`/`mailto:`, `target=_blank` without `rel=noopener` | yes (`build.link-unsafe`) | |
| `http://` images/stylesheets | yes (`build.mixed-content`) | |
| Meta description, long titles, images without width/height, heading-level skips, third-party scripts, marketing clichés (unlock, seamless, world-class ...) | | yes, listed in the gate result `warnings` |

Limits: regex matching over HTML text. It catches the specific trust failures above; it cannot judge whether copy is good or a fact is true. A private (`publicUse:false`) fact never authorizes public copy.

## Browser checks (browser-qa, every route at six viewports)

Implemented in [lib/browser-qa.mjs](../../lib/browser-qa.mjs) and [lib/quality/page-probes.mjs](../../lib/quality/page-probes.mjs). A case fails when it lists a problem; any failing case blocks the QA gate.

| Check | Fails | Warns |
| --- | --- | --- |
| Page integrity: HTTP 200, one H1, title, noindex meta, proposal disclosure, no overflow, no duplicate IDs, no broken images, no JS errors, main content, planned primary action, unique titles/content | yes | |
| Accessibility via axe-core 4.14 with explicit tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` | critical and serious | moderate and minor |
| Keyboard: Tab reaches every visible control; focus changes the control's appearance (WCAG 2.4.7) | unreachable control or no visible focus indicator | |
| Layout shift (CLS) | above 0.25 | above 0.1 |
| Transferred page weight | above 5 MB | above 2 MB |
| Targets under 24 CSS px | | yes |
| Internal links and `#fragment` targets | non-200 or missing fragment | |

Per-case metrics (CLS, LCP, bytes, axe count, keyboard summary) are saved in the hashed report. Limits: automated axe coverage is partial by its authors' own account, so it is a floor, not WCAG certification. Contrast on image backgrounds can be undetermined. Chromium emulation is not a physical device. Review still needs a human on the screenshots.

## Hosted verification

`verify-public` compares served bytes to the seal on both origins, requires effective noindex and real 404s for private paths, and records `warnings` when HTML responses lack `X-Content-Type-Options: nosniff` or a `Referrer-Policy`. Warnings never grant or deny release.

## Batch

`icm batch` rejects exact and near-identical layout signatures (token Jaccard similarity of 0.8 or more). It stops lazy reskins; it does not prove two sites are different enough.

## Adding a check

1. Pick the stage that owns the failure. 2. Add a code to [catalog.mjs](../../lib/gates/catalog.mjs) with meaning and repair. 3. Add the check and a fictional regression in `test/quality.test.mjs`. 4. Run `npm run docs:gates` and commit the regenerated [gates](gates.md). Never lower a threshold to pass a project.
