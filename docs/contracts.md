# Artifact contracts

All JSON packets carry `schemaVersion: 1`. Templates are structural starting points and deliberately fail release gates. Never mark a task passed simply to satisfy a schema. Schemas enforce shape; stage gates enforce cross-file relationships; browser/byte checks measure the product; independent review supplies visual judgment.

| Artifact | Owner | Meaning |
| --- | --- | --- |
| project.json | Root | Identity, assignment, pinned ICM commit, owned output path and scoped authority records |
| STATE.json | Root/assigned worker | Current stage pointer and append-only command history; not release evidence |
| research.json | Worker | Exact identity match, source/fact ledger, meaningful baseline inventory, differentiators, journey, unknowns |
| assets.json | Worker | Inspected originals, hashes, source, usage basis and proposal-use decision |
| design.json | Worker + root concept review | Art direction, composition signature, actual copy, comparison and distinct choices |
| routes.json | Worker | Unique content routes, purposes, source/asset references, baseline coverage and primary actions |
| flows.json | Worker | Required customer journeys and integration destinations; tests must cover every ID |
| implementation.json | Worker | Source directory, repeatable build command/stamp, exact public allowlist, config-only files and flow test paths |
| qa.json | Worker | Current-fingerprint scanner report, per-flow test evidence and defect ledger |
| review.json | Independent reviewer | Current-fingerprint inspection of every route on phone/desktop, scores, concrete observations and launch inputs |
| sealed-build.json | Root | Hashes of the exact reviewed output and input fingerprint |
| publication.json | Root | Actual provider identity/URLs/deployment receipt and hosted QA reference |
| public-verification.json | Tool + root | Both hosted origins match the seal; noindex, custom404 and private-path probes |
| tracker.json | Root | Private minimal write plan, before/after evidence, preservation checks and actual readback |
| HANDOFF.md | Current owner | Concise next-agent entry point, proven state, limitations and next action |

The JSON Schema bundle is `schemas/artifacts.schema.json`. The CLI validates the current artifact type, not a single generic “passed” field. Artifacts referenced as evidence use `{path, sha256}` relative to the private project; files must exist, be nonempty and match. Relative paths cannot escape the project, contain traversal, or resolve through symlinks. Served files must be inside outputDir and its exact allowlist.

`fingerprint` hashes the planning packets, implementation packet, source tree (excluding outputDir, node_modules and .git), flow-test files and all allowlisted output bytes. Project permission records are excluded because a later user grant does not change the reviewed site; current grants are still checked independently at each relevant gate. QA/review/seal are excluded to avoid circular hashes. Changes to build inputs invalidate old QA/review/release. Rebuilding produces a new marker/stamp; do not rebuild after sealing.

`gate <dir> <stage>` checks that stage and all earlier stages. `advance` is a convenience that only changes STATE.json after those checks pass. Gate success means the specified evidence passed, not that an owner approved facts or that an agent actually performed an unobservable action. A root reviewer is accountable for screenshot inspection and authorization interpretation.

For rollback/rework, edit the owning artifact or source and rerun the gate; STATE.json may point later but never overrides a failed gate. For unavailable tools, save a truthful pending handoff. Missing critical QA/review/publication/tracker proof must not be converted to success.

`fixture/` content in tests is fictional infrastructure test data, not an example of a premium site and not an approved prospect. Never use it as a visual template.
