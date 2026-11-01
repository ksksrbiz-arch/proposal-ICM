# Commands

Run from this repo after `npm ci`. Project arguments can be absolute paths or relative to the current directory. Outputs are written only inside the private project. Run `node bin/icm.mjs help` for usage. Install Chromium once with `npx playwright install chromium`; on a machine with Chrome, set `PLAYWRIGHT_CHANNEL=chrome` instead. Do not automate browser authentication or use a user's unrelated running server.

| Command | Purpose |
| --- | --- |
| `init <dir>` | Create a new private packet set. Refuses an existing nonempty folder. No site/theme and no grants are created. |
| `status <dir>` | Print identity, state pointer and current input fingerprint when build inputs are valid. |
| `gate <dir> <stage>` | Validate schemas and cross-file evidence through that stage; fail nonzero on missing/invalid/stale evidence. |
| `advance <dir> <stage>` | Gate, then record completion/current next stage in STATE.json. |
| `fingerprint <dir>` | Print the deterministic input/build fingerprint for actual test/review evidence. |
| `browser-qa <dir> <baseUrl> local` | Scan every route at all six viewport cases, save hashed screenshots/report and update qa.json's technical reference. |
| `browser-qa <dir> <stableUrl> hosted` | Same coverage against the hosted deployment; update publication.json's hostedQa reference. |
| `seal <dir>` | Require independent review gate, then hash the reviewed public allowlist. No upload or deployment. |
| `verify-public <dir> <stableUrl> <immutableUrl>` | Check the seal, served byte hashes, marker, noindex headers/meta, real404 and private-file probes on both origins. Record public-verification.json; do not modify cloud state. |
| `batch <manifest.json>` | Validate batch identities/folder isolation and flag duplicate design signatures among existing packets. No workers are spawned by the CLI. |
| `lessons [stage]` | Load adopted generic lessons before the next assignment/stage. |
| `retrospect <dir> <outcome>` | Create a private learning draft for completed, blocked, failed or interrupted work and archive the prior run. Agent analysis/review is still required. |
| `gate <dir> learn` | Validate learning evidence/review independently of successful delivery. |
| `learning-candidate <dir> <lesson-id>` | Export a reviewed generic memo after promotion; reject obvious prospect/contact data. Does not activate policy or publish to GitHub. |

Viewport matrix: 320×800, 390×844, 768×1024, 1024×768, 1440×1000, 844×390. The last case catches short landscape screens. Screenshots are full-page PNGs. A normal-motion and reduced-motion check must also be included in project-specific flow tests when animation exists; the generic scanner uses reduced motion to make stable, readable captures.

The scanner waits for fonts/images, collects JS errors and failed same-origin resources, checks HTTP status/H1/title/noindex/independent disclosure, duplicate IDs, broken images, document overflow and internal route/fragment destinations. It checks primary-action presence and reports potential small targets/body copy for reviewer attention. It does not certify accessibility, embed availability, contrast, native phone apps or conversion correctness.

Use site-specific Playwright tests for keyboard focus, menus, tabs, galleries, query restoration, copy denial, downloads/reset, safe contact encoding and existing provider handoffs. Tests must not trigger real outbound messages, orders or reservations. Hash the actual output files with SHA-256 when writing qa.json flow evidence. The scanner records a report even when failures occur, then exits nonzero. Fix, rerun and inspect new screenshots.

Local smoke server implementations should serve public output only, reject traversal/symlinks, use correct MIME types, preserve clean-route/deep-link behavior and return genuine404. The integration-test fixture provides a tiny test-only server; production projects still own their framework/server implementation.
