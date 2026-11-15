# 04 Build: execute the authored page plan

**Owner:** worker. **Gate:** `gate <project> build`. **Gate codes:** `build.*`. See [quality gates](../../references/quality-gates.md).

## Load
| File | Why |
| --- | --- |
| `design.json`, `routes.json`, `flows.json`, `assets.json` | The approved plan |
| [quality gates](../../references/quality-gates.md) | What the static and browser checks block |
| [tooling and skills](../../references/tooling-and-skills.md) | Optional design/lint/asset helpers |
| `icm lessons build` | Adopted lessons |

## Do not load
| File | Why |
| --- | --- |
| Other workers' folders | Own only the assigned project; never overwrite or stop another worker's server |
| Raw research dumps | Use the approved packets |

## Input
Reviewed concept and approved assets. Use an ephemeral or assigned localhost port.

## Process
1. Build the real route set before polishing the opening. Implement shared navigation/footer, distinct page layouts, current-page state, direct deep links and related content.
2. Semantic HTML, labels, visible focus, reduced-motion support, keyboardable galleries/dialogs, truthful loading/empty/error states. Phone body copy 16px+; primary touch targets about 44px; test crowded controls, zoomed text, short screens.
3. Keep originals intact; use responsive derivatives with dimensions/aspect ratios and a full-image viewer when useful. Avoid tiny display text, cropped faces/garments/artwork, obstructive sticky bars, empty full-screen heroes and decorative controls. Imagegen output is proposed art, never evidence.
4. Preserve existing booking/commerce/account destinations. An embed that fails the production frame policy needs a working external path. Local notes need copy-failure feedback, reset/download if offered, safe encoding and no fake sent/success claim. No public form may silently discard data. A real backend needs explicit scope, verified delivery, privacy and abuse controls.
5. Every concrete price, phone, email, year, rating or superlative on a page must match a public research fact. No placeholder text.
6. `implementation.json`: reproducible build command, source path, exact public allowlist, build stamp. Include `deployment.json` marker, custom 404, `robots.txt` disallowing all, noindex meta and X-Robots-Tag, visible independent-proposal label. Config-only files (`_headers`, `_redirects`) are listed separately. Private artifacts stay outside outputDir.

## Output
Public output directory, `implementation.json`, flow test files under `site/tests/`.

## Completion
- `gate <project> build` passes: route coverage, allowlist equality, banned file classes, marker identity, claims/placeholder/structure/link lint.
- The gate does not prove visual quality. Do not deploy from this stage.
- Next: [05 QA](../05-qa/CONTEXT.md).
