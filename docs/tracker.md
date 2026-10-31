# Shared tracker adapter contract

Keep the actual workbook URL, tab IDs, credentials and prospect records in the private batch/project, not this public repo. Discover current tools and read the destination workspace's runbook. A connector may expose native Sheets cells, validations, formulas, tables and metadata; use those structures rather than replacing the workbook through an exported file.

Stable lead ID is the key. Re-read target rows and resolve collisions using business name plus phone/location. Company facts, our draft state and outreach state are separate. A researched plan is not a built site; a folder/build is not publication; a published preview is not owner approval; a prepared email is not sent; Sent Items is not delivery/read confirmation.

Recommended fields owned by build registration: draft status, verified preview URL, provider deployment timestamp, link-check date, factual build notes, scoped source confirmations. Preserve human fields: contact corrections, notes, decisions, outreach stage/dates, follow-ups, change requests, assignee, quote overrides, history and all sharing permissions. Do not write static values over formula-backed status/preview outputs; update their source register.

Minimal write protocol:

1. Read workbook metadata, exact existing stable-ID row, intended cells, formula and validation metadata, native table/filter ranges and affected dependent views.
2. Save a private before snapshot and planned changes. Check whether another user has changed the target immediately before writing. Replan on mismatch; never replace from an old baseline.
3. Upsert only intended source cells. Leave human values byte-for-byte unchanged unless the user explicitly requested the specific outreach/contact edit. Use actual dropdown choices and date serials/types. For new rows, preserve formatting/validation/chips/formulas and expand native coverage only as needed.
4. Read back the changed cells and hyperlink targets, affected formulas and table coverage. Compare human fields and permissions. Save evidence refs in tracker.json. Mark applied only when verified.

Hourly sync is read/verify/build-register maintenance under its own user contract; it does not grant outreach, builds, deployments or price changes. A user-triggered send can create a history event after actual Outlook evidence. Missing or ambiguous email must remain unconfirmed, with a source note and next action; never guess an address from a domain/name.

No actual Google Sheet writes are performed by the kit's CLI. The root uses authorized connected tools. An access failure produces a pending write plan and a clear handoff, not a fictitious success or a second workbook.
