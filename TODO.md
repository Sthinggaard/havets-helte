# TODO

## Next steps

- **DONE — split the home feed into two tabs.** Parent volunteer tasks/shifts and scout signup events are separated, cards are labeled by type, and the redundant “Arrangementer, opgaver og vagter” heading is removed. Implemented 2026-09-29.

1. **RESOLVED — there is no real image data in the live `havets-helte` project.** Logged in successfully (2026-06-23, user `sthinggaard@havetshelte.dk`, created manually via Console "Add user" since Auth had never been enabled and had zero users). The Library page shows only og-image placeholders. Verified the cause end-to-end: the live `events` collection is **empty** (0 docs, confirmed via public Firestore REST read), `imageLibrary` is empty (auth-gated, but the app's authenticated read returned the fallback), so the Vue app falls back to static `apps/www/src/features/events/events.data.ts` where all four events hardcode `image: '/og-sankthans.png'`. The app ships only two image files: `/og-sankthans.png` and `/havets-helte-logo.svg`. The project is real (5 live `signups` docs exist) but its content collections were never populated. The only unchecked spot is Firebase Storage `image-library/...` (auth-gated) — if that's also empty in the Console, there is nothing to recover and the library must be populated by fresh upload. **Next decision for the user: confirm Storage is empty, then either upload fresh images or stop showing the og placeholder fallback (see new item below).**
2. ~~Wire `LibraryPickerModal` into the members screen so `MemberProfile.imageUrl`/`Member.imageUrl` can be assigned a library image.~~ Done 2026-06-23 — local in-memory only, see decisions/log. Needs a manual browser check (no browser tool available in this environment): open Medlemmer, select a member, use the new "Billede" card to pick/clear an image.
3. **Verify the new vagt/create/edit flow in the browser.** Shared form polish is done 2026-06-26: calendar date assist, address suggestions/map, first-invalid-field focus, and direct admin hub links are in Vue. Still needs a browser check: open `/vagter`, `/opgaver`, and `/admin/arrangementer`, log in, create/edit/delete one item in each section, and confirm Firestore persistence.
4. ~~Wire opgaver + arrangementer pages to the same shared form.~~ Done 2026-06-23: `TasksPage.vue` (`/opgaver`) → `section="opgaver"`; new `AdminArrangementerPage.vue` at `/admin/arrangementer` → `section="arrangementer"` (public `/events` left untouched since it's the real read-only events list). Both behind `AdminAuthGate`. Still needs a browser check + a seed run to have data. Note: `/admin/arrangementer` is reachable by URL only — not yet in the main nav (consistent with `/admin/billedbibliotek`); add a nav/admin-hub link if desired.
5. ~~Move the public events read path to Firestore.~~ Done — `useEventsPage` loads live events via `fetchAllAdminEvents()` (publicly-readable `events` collection), maps `timed → shift`, and falls back to the static seed only when the collection is empty. Inactive events (`active: false`) are now filtered out so admin-deactivated events don't show publicly. Typecheck passes; still wants a browser check alongside item #3.

## Completed from the legacy form polish

- Address autocomplete (Nominatim) + location map for the `Sted` field — ported to the shared Vue admin form 2026-06-26.
- Inline calendar date-picker button that fills the `Dato-tekst` field — ported to the shared Vue admin form 2026-06-26.

## Parked

- "Til gren og hold" in `MembersWorkspace.vue`: in the legacy `admin.html` (`focusMemberMoveFields()`, line ~4148) this just scrolls to and focuses the `mGren` branch select inside the inline member-edit form — it's a same-page UI shortcut, not navigation or filtering. The Vue port's current `setBranchFilter(...)` call doesn't replicate this and was likely a placeholder. Parked until the member edit form itself is ported.
