# Astryx: responsive report workflow

The first migration replaced controls but kept separate mobile headers, a fullscreen mobile menu, and oversized report cards. This revision makes the report collection and conversation easier to scan and removes those duplicate presentations.

## Decisions and ownership

| Decision | Reason and tradeoff | Canonical owner |
| --- | --- | --- |
| One app header at every width | Identity, notifications, language and account controls stay in the same place. User details move into the account menu; case identity and status move beside the case heading. | `AppHeader`, composed inside Astryx `AppShell` |
| Visible status filters, no overview sidebar | The destinations are filtered views of one collection. A segmented control exposes them on phones and removes two navigation implementations. Desktop users retain sorting, density and pagination. | `ErrandStatusFilter` uses the existing status/filter stores |
| One overview fetch owner | Resizing changes presentation and paging mode without mounting a second shell or independent query owner. Switching between accumulated mobile results and desktop pages resets the query generation. | Overview page and `useOverviewErrands`; count comes from the same page response |
| Mobile records are list rows | Report type leads, then number, status and date. Astryx `ListItem` delegates row clicks to the real Next link, preserving native navigation and one keyboard stop. | `ErrandListItem` |
| Conversation before composer | The latest replies appear before the writing controls. A named anchor goes straight to the editor. Rich formatting and attachments are retained. | `ErrandMessages`, existing `MessageComposer` and Quill owner |
| Formatting is disclosed on demand | The initial editor occupies less height. Expanding/collapsing the toolbar never unmounts the editor or its form state. | Astryx `Collapsible` inside `RichTextEditor` |
| Skeletons belong to their views | Placeholders match rows, details and messages. There is no generic skeleton factory with layout variants to maintain. One surrounding status announces loading; decorative shapes are hidden from assistive technology. Errors take precedence over loading. Refresh/load-more retain existing results. | Three small view-specific skeleton components; table loading rows stay in the table |
| Native shell and layout slots | Astryx owns the main landmark, skip link and scroll regions. Wizard actions remain in the footer; step changes focus the new heading and reset the content scroll position. | `AppShell`, `Layout`, `MobileWizard` |
| Low-chroma surfaces, teal accent, stronger contrast | The accent identifies actions; the generated neutral ramp retains a subtle brand tint. Astryx’s high-contrast scale keeps inactive filter labels readable on dark surfaces and strengthens form boundaries. Status is a labelled Token, while Badge remains for counts. | `src/theme/katla.ts`, `StatusLabel` |

Content widths are structural budgets: 1200 for the collection, 960 for case content and 640 for the mobile wizard. Internal spacing uses Astryx props and tokens. The app adds no new CSS file for the redesign. Safe-area spacing and Quill's generated editable DOM remain justified application CSS; Astryx does not own that DOM. Rendered rich messages retain their sanitized HTML boundary.

## Preserved behavior

Report types, form schemas and validation, read-only status, language handover, attachments, send locking, error preservation, conversation pagination and read receipts remain with their existing owners. The September 7 form changes from `main` are included through a separate merge commit. WCAG has already merged independently in PR #100; this work remains in draft PR #101.

## Verification

Targeted browser contracts cover visible filters and native links at 320px in Swedish and English, loading before responses arrive, one header/main landmark, responsive paging, conversation order, unsent text during refresh and toolbar disclosure, and wizard focus/actions at constrained height. Existing registration, consent, dialog, language, messaging and accessibility tests remain part of the CI gate. Screenshot/audit artifacts are uploaded for visual inspection.

The narrow-height test checks layout reflow; it does not emulate a physical iOS/Android software keyboard. Native keyboard and screen-reader testing remains a manual check before release. Automated axe scans are supporting evidence, not a WCAG conformance claim.

Local validation is limited to the Astryx CLI, formatting, lint and a memory-capped type check. Builds and browser suites run in CI, using Webpack and a production standalone server with one Playwright worker.

Rollback: revert the UX commit(s) while retaining the separate merge of current `main`; no API, stored-data or dependency migration is required.
