# Context router

Load in this order: `AGENTS.md` → this file → private `project.json` and `STATE.json` → one stage → named inputs. Avoid dumping all research or all previous chats into a worker. The state file is a pointer; inspect artifacts and their freshness before trusting its summary.

| Task/state | Context | Inputs | Required output |
| --- | --- | --- | --- |
| New assignment | [01 Brief](../stages/01-brief/CONTEXT.md) | User scope, live stable ID | project.json |
| Verify business and existing site | [02 Research](../stages/02-research/CONTEXT.md) | project.json, current public sources | research.json, assets.json |
| Define pages and art direction | [03 Design](../stages/03-design/CONTEXT.md) | Research, asset contact sheet, baseline inventory | design.json, routes.json, flows.json |
| Implement the approved concept | [04 Build](../stages/04-build/CONTEXT.md) | Design, routes, flows, reviewed assets | public output, implementation.json |
| Test routes and behavior | [05 QA](../stages/05-qa/CONTEXT.md) | Exact built files and flow tests | qa.json, screenshots, flow evidence |
| Independent visual/journey review | [06 Review](../stages/06-review/CONTEXT.md) | Built site, screenshots, official comparison | review.json, sealed-build.json |
| Deploy reviewed build | [07 Publish](../stages/07-publish/CONTEXT.md) | Review, seal, explicit publication authority | publication.json, hosted QA, public-verification.json |
| Shared-sheet handoff | [08 Register](../stages/08-register/CONTEXT.md) | Live workbook and publication receipts | tracker.json, HANDOFF.md |

Gate names are `brief`, `research`, `design`, `build`, `qa`, `review`, `publish`, `register`. A worker hands a bounded packet to the root; the root verifies it. [Ownership and concurrency](../docs/batch.md) and [state recovery](../docs/contracts.md) apply at every stage.
