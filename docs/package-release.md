# Install and release Proposal ICM

## Agent/operator installation

Use Node 22 or later. Pin the package version instead of silently upgrading instructions during a batch:

```sh
npm install --global proposal-icm@1.0.0
proposal-icm --version
proposal-icm root
proposal-icm help
```

The root command locates the bundled AGENTS.md, context router, stage contracts, prompts, schemas and adopted generic lessons. Read those instructions before initializing a private project. All operational commands also work as `npx --yes --package=proposal-icm@1.0.0 proposal-icm <command>`.

Browser binaries are installed explicitly, never during npm installation:

```sh
npx --package=proposal-icm@1.0.0 playwright install chromium
```

On Linux, browser OS dependencies may also need `playwright install --with-deps chromium`. An existing Chrome installation can be selected with `PLAYWRIGHT_CHANNEL=chrome`. Keep the browser version compatible with the pinned Playwright dependency. Review browser setup in your environment; installation is not a screenshot review.

The public package contains generic instructions and tooling only. It does not include private projects, tracker rows, business photos, credentials, test evidence or automatic deploy/email/Sheets access. The initial distribution is UNLICENSED; public download does not add a reuse license. Runtime dependencies retain their own licenses.

## Learning from an installed version

Record private retrospectives with the installed CLI. To promote tested lessons, clone the official repository and set `ICM_MAINTAINER_REPO` to that clone's absolute root. On PowerShell:

```powershell
$env:ICM_MAINTAINER_REPO = 'D:/path/to/proposal-ICM'
proposal-icm gate D:/private-project learn
```

The gate checks the actual promotion commit in that clone. Candidate export writes only the sanitized memo there. The installed registry remains pinned until the next intentional version upgrade. Maintainers run source regressions before shipping a new package; the npm artifact intentionally excludes test source and Git history.

## Maintainer publication

1. Start from a clean, reviewed source commit. Update version, lockfile, changelog and any pinned install examples together. Never reuse an npm version.
2. Run `npm ci`, install the matching test browser (or select installed Chrome), then `npm run check`, `npm test` and `npm run check:package`. The package check creates a real tarball, verifies its public allowlist, installs it with production dependencies in a new directory, checks the npm command shim and aliased path, and exercises private initialization plus a failing gate. It prints the exact tarball path, SHA-256 and npm integrity. Installation runs with dependency scripts disabled.
3. Inspect the exact tarball file list and validation report. Archive the selected tarball and SHA256SUMS outside the source tree. Use that same artifact for npm and GitHub; do not repack after review.
4. Authenticate with `npm login --auth-type=web` in the maintainer's account. Keep account authentication and any required 2FA in the user's browser/terminal, never in source, logs or chat. Confirm `npm whoami`. Publish the reviewed artifact using `npm publish <exact-tarball> --access public`. Source publication has prepublishOnly checks; publishing an already packed artifact relies on the recorded checks of those exact bytes.
5. Verify registry name/version, bin, repository and integrity, then do a fresh install from the registry and run `proposal-icm --version`, `root`, `lessons` and a private-project gate smoke check.
6. Create an immutable version tag at the reviewed source commit and a GitHub release. Attach the same tarball, SHA256SUMS and validation report. Include real validation results and any CI/platform gaps. Do not claim passing CI when hosted jobs did not run.

Publication requires the user's explicit authority. Registry/release errors leave that destination incomplete; they do not justify an unreviewed alternate registry or a false success report. No publishing step contacts a prospect or changes a client website.
