# 07 Publish — root, only when authorized

Read `docs/release.md`. Recheck explicit publication authority, account identity, exact Cloudflare project, stable preview URL and production branch. Use connected Cloudflare tools when sufficient; use the documented CLI fallback only when required. Never reuse another business's project or change its official DNS. No automatic account creation, plan purchase or terms acceptance from this repo.

Run `gate review` and verify the current seal. Upload only the sealed outputDir, not the workspace. Do not rebuild after review or deploy generated private records. Record successful provider deployment ID, project, account reference (private only), timestamp, stable URL and immutable URL in `publication.json`. URLs and success come from actual provider evidence, not a naming guess or build success.

Run `verify-public` with both URLs. It fetches each served allowlist file, compares SHA-256, checks marker/404/noindex behavior and probes explicit private paths. Config-only files are verified through effective behavior; `_headers` itself must not be a public source dump. Check framing/CSP/booking fallback on the hosted site. A transient network error is a failed check to retry/read, not proof a site vanished.

Run hosted route-wide browser QA, not homepage-only smoke tests. Exercise important hosted flows and inspect mobile/desktop screenshots. Record deployment-specific differences. Mark `publication.json.hostedQa` with the report path/hash after actual checks.

Exit: `gate publish` only when the live deployment and reviewed bytes match. No provider deployment ID, incomplete parity, missing noindex, private route returning HTML200, stale QA or hash mismatch means release is not ready. Restore a known prior deployment only with recorded provider evidence and within authorization.
