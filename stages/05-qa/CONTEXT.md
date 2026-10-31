# 05 QA — measure every route and exercise the product

Read `docs/commands.md`. Run the site from a fresh allowlisted build. First run `browser-qa` against localhost; it captures all planned routes at 320,390,768,1024,1440 widths plus short landscape, checks basic page integrity and saves screenshots. Review failures and console errors; don't ignore missing images because they were lazy-loaded.

Write site-specific flow tests in `site/tests/` using Playwright (or a justified equivalent). Test every `flows.json` ID with assertions for a real outcome. Include mobile menu open/close/Escape/focus, gallery full-image access and boundary controls, tabs/filters, query restoration, note retention, reset, copy-denied/manual fallback and downloaded content when those features exist. Check actual tel/mailto/SMS/booking/Maps destinations without triggering messages, calls, bookings, orders or payment.

The generic scanner is not WCAG certification or a business-flow test. Inspect keyboard focus visibility/traps/return, target spacing, contrast, screen-reader names, reading order, 200% zoom, expanded text, reduced motion and loading behavior. Use touch emulation for primary controls; record physical-device gaps honestly. Do not claim Chrome simulation is an iPhone test.

`qa.json` must reference the current contract fingerprint, test files, screenshot files, every route/viewport result, all required flow IDs and unresolved defects with severity. Critical/high failures block release. Medium/low findings need a concrete disposition and independent review; never silently drop an issue. Re-run affected checks after fixes, broadening when shared layout/logic changed.

Exit: `gate qa`. Test artifacts must exist, be non-empty and match the recorded SHA-256. Fix the owning stage and regenerate stale evidence when inputs change.
