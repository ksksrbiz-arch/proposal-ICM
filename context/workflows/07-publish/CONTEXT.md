# 07 Publish: root, only when authorized

**Owner:** root. **Gate:** `gate <project> publish`. **Gate codes:** `publish.*`.

## Load
| File | Why |
| --- | --- |
| [release checklist](../../references/release.md) | Provider steps |
| `icm lessons publish` | Adopted publish lessons (mandatory) |
| `sealed-build.json`, `review.json` | What may be uploaded |

## Do not load
| File | Why |
| --- | --- |
| The private workspace | Upload only the sealed outputDir |

## Input
Explicit publication authority, exact Cloudflare project, stable preview URL, production branch, a valid seal.

## Process
1. Recheck authority and account identity. Use connected Cloudflare tools; the documented CLI is a fallback. Never reuse another business's project or change official DNS. No account creation, plan purchase or terms acceptance from this repo.
2. `gate review`, verify the seal, upload only the sealed output. Do not rebuild after review or deploy generated private records.
3. Record deployment ID, project, account reference (private), timestamp, stable URL and immutable URL in `publication.json` from real provider evidence, not a naming guess.
4. `verify-public <project> <stableUrl> <immutableUrl>`: fetch every allowlisted file on both origins, compare SHA-256, check marker, noindex header and meta, real 404 and private-path probes. `_headers` is verified by behavior, never served as source. Transient errors are failed checks to retry, not proof of absence.
5. The top-level `404.html` asset may answer HTTP 200 or 404 if bytes and noindex match; every missing/private URL must be 404; a homepage 200 fallback is a blocker. Do not add artificial redirects or relax missing-path checks.
6. Run hosted route-wide `browser-qa ... hosted`, exercise key hosted flows, check framing/CSP/booking fallback, inspect screenshots, record differences. `verify-public` also records security-header warnings.

## Output
`publication.json`, `public-verification.json`, hosted QA report.

## Completion
- `gate <project> publish` passes only when live bytes match reviewed bytes.
- Missing deployment ID, parity gap, noindex gap, private HTML 200, stale QA or hash mismatch means not ready. Roll back only with recorded provider evidence and authority.
- Next: [08 Register](../08-register/CONTEXT.md).
