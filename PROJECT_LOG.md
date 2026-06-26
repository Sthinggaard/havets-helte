# Project Log

## 2026-06-24 (2)

- Confirmed TODO #5 ("move public events read to Firestore") was already implemented in the working tree: `useEventsPage` reads live events via `fetchAllAdminEvents()` against the publicly-readable `events` collection, maps `timed → shift`, and only falls back to the static seed when the collection is empty.
- Closed a gap in that path: the public `/events` page was rendering every event regardless of the `active` flag, so an admin-deactivated event would still appear publicly. Added `.filter(event => event.active)` after the fetch so inactive events are hidden, matching legacy `admin.html` behaviour.
- Verified `apps/www` typecheck passes. Browser verification still pending alongside TODO #3.

## 2026-06-22

- Restored the library feature contract by adding `apps/www/src/features/library/library.types.ts`.
- Consolidated `apps/www/src/features/library/useLibraryPage.ts` as the single active orchestration path.
- Removed the temporary duplicate files `library.data 2.ts` and `useLibraryPage 2.ts`.
- Switched the library source load from realtime `onSnapshot` to a one-time `getDocs` read.
- Verified `apps/www` typechecking passes.

## 2026-06-22

- Created root project docs: `README.md`, `PROJECT_LOG.md`, `DECISIONS.md`, and `TODO.md`.

## 2026-06-22

- Confirmed the library should be rebuilt around legacy-style categories instead of the current event/type navigation model.
- Documented the current gap before refactoring: the present Vue library is still type-based and not yet category-first.

## 2026-06-22

- Refactored the library feature to use a category-first data model with `uncategorized` as the fallback category.
- Replaced the sidebar type filters with category selection, category creation, rename, and delete flows.
- Kept the current library as an in-memory feature with Firestore source import support for `events`, `members`, and `meetings`.
- Verified `apps/www` typechecking passes after the refactor.

## 2026-06-22

- Started the legacy-collection integration pass so the library can read and write the real `imageLibrary` and `imageLibraryCategories` data.
- Documented that the in-memory/event-import path is now superseded by direct library persistence work.

## 2026-06-22

- Wired the library feature to read from `imageLibrary` and `imageLibraryCategories` in Firestore.
- Wired uploads, replaces, deletes, create-category, rename-category, and delete-category flows to Firestore and Storage.
- Added Firebase Storage access in `apps/www/src/lib/firebase.ts` for the legacy `image-library/...` file paths.

## 2026-06-22

- Added a reusable `LibraryPickerModal` in `apps/www/src/components/library/LibraryPickerModal.vue` with category filtering, keyboard close, selection stepping, and upload support.
- Wired `apps/www/src/components/library/LibraryWorkspace.vue` to open the picker as a dedicated entry point for existing library items.
- Verified `apps/www` typechecking and production build both pass after the modal wiring.

## 2026-06-22

- Fixed legacy image compatibility by teaching the library reader to accept both `imageUrl` and legacy `url` fields from Firestore.
- Updated library writes to persist both `imageUrl` and `url` so the new app stays compatible with the legacy admin data shape.

## 2026-06-22

- Added legacy source bootstrapping to `apps/www/src/features/library/useLibraryPage.ts` so `events`, `members`, and `meetings` are mirrored into `imageLibrary` when missing.
- Seeded the `uncategorized` category document before the import pass so the legacy fallback category exists in Firestore as well as in memory.

## 2026-06-22

- Switched `apps/www` to load the live Firebase web config from `https://havets-helte.web.app/__/firebase/init.json` by default.
- Kept emulator support behind `VITE_USE_FIREBASE_EMULATORS=true` so local Firebase debugging can still opt in explicitly.

## 2026-06-22

- Added a real Firebase email/password auth gate for admin routes in `apps/www` so live Firestore reads happen only after login.
- Wrapped the admin library page in `AdminAuthGate` to prevent premature Firestore reads against the live project.

## 2026-06-22

- Switched `apps/www` development to use Firebase emulators by default so the local app can run against the seeded leader login without live billing.
- Started the local Auth and Firestore emulators for `havets-helte` on `127.0.0.1:9097` and `127.0.0.1:8081`.
- Verified the admin library page can log in with the seeded `leder@test.dk / test1234` account in emulator mode.
- Confirmed the current emulator data still only yields fallback-style library items; the legacy image docs still need a real export/import if we want a 1:1 match.

## 2026-06-23

- Reviewed the pending library diff (`LibraryWorkspace.vue`, `LibraryPickerModal.vue`, `useLibraryPage.ts`, `library.data.ts`, `AdminLibraryPage.vue`) plus the flagged "unrelated" `MembersWorkspace.vue`/`members.types.ts`/`roster.types.ts` edits.
- Fixed `LibraryPickerModal` receiving the parent's category-filtered `visibleItems` instead of the full library; the picker's own category sidebar now actually browses every category instead of whatever subset the host page happened to have selected.
- Fixed newly uploaded/edited library items sorting to the bottom of the list instead of the top, by stamping a local `createdAt`/`updatedAt` on the optimistic item before the next Firestore reload.
- Relabeled the "back to all categories" sidebar button from "Ny markering" to "Alle" to match the equivalent control in the picker modal.
- Replaced duplicated `'uncategorized'` string literals with the existing `IMAGE_LIBRARY_UNCATEGORIZED_ID` constant in `LibraryWorkspace.vue` and `LibraryPickerModal.vue`.
- Fixed the new member profile detail grid (Gren/Hold/Status/Fødselsår) rendering unstyled: `MembersWorkspace.vue` was renamed to `.member-card-detail-*` classes but `styles.css` only had `.member-detail-*` (still used by `BranchesWorkspace.vue`); added the new class names to the existing rules instead of duplicating them.
- Verified `apps/www` typechecking and production build both pass after all fixes.

## 2026-06-24

- Defined admin/leader = signed in with a havetshelte.dk email. Added `isAdminEmail`/`isAdmin` to `useAdminAuth`; `AdminAuthGate` now shows an "Ingen adgang" state for logged-in non-havetshelte.dk users instead of granting access.
- Made the public `/events` page admin-editable: `useEventsPage` now loads live events from Firestore (`fetchAllAdminEvents`, refactored out of `useEventAdmin`) and maps them to the display shape, falling back to the static seed only when the collection is empty. `EventsWorkspace` shows a per-event + featured "Rediger" button for admins that deep-links to the matching admin form via `?edit=<id>`; `EventAdminWorkspace` reads `?edit`/`?new` on mount and opens the form accordingly. Type mapping: admin `timed` ↔ public `shift`.
- Updated `firestore.rules`: added an `isAdmin()` helper (email matches `(?i)^[^@]+@havetshelte[.]dk$`) and applied it to every leader-write collection (events, imageLibrary(+categories), members, groupTeams, groupBranches, meetings, attendance, signups update/delete, signupContacts). NOTE: not deployed (firebase CLI not authenticated) — until `firebase deploy --only firestore:rules` runs, enforcement is client-side only and any authenticated user can still write.
- Changed the seeded leader from `leder@test.dk` to `leder@havetshelte.dk` (same password `test1234`) across `seedEmulator.mjs`, `public/seed.html`, and the cosmetic references in `AppShell.vue`/`AdminAuthGate.vue`/`HomeWorkspace.vue`, plus README/DECISIONS — otherwise the emulator leader would lose admin under the new rule. Idempotent seed won't recreate the user on an already-seeded emulator.
- Verified `apps/www` production build (incl. typecheck) passes.

## 2026-06-23 (9)

- Added `apps/www/scripts/seedLive.mjs` + `npm run seed:live`: one-time, idempotent (skip-by-title) seed of the canonical sample events into the LIVE `events` collection so the admin forms have data to edit. Reads `SEED_EMAIL`/`SEED_PASSWORD` from env (credentials never hard-coded; user runs it). Seeds Sankt Hans (timed/vagt, 6 time-range slots), Lejrtur + Fællesspisning (task), Nathejk 2026 (event). Handed to user to run.
- Wired the remaining two admin pages to the shared form: `TasksPage.vue` (`/opgaver`) → `EventAdminWorkspace section="opgaver"`; new `AdminArrangementerPage.vue` at route `/admin/arrangementer` → `section="arrangementer"`. Moved the `admin-arrangementer.html`/`admin-arrangementer-form.html` aliases off the catch-all `/admin` route onto the new route. Left the public `/events` page (real read-only events list) untouched. All three admin event pages now behind `AdminAuthGate`.
- Verified `apps/www` production build (incl. typecheck) passes and the dev server serves `/vagter`, `/opgaver`, `/admin/arrangementer`, `/events` (all 200). Not browser-verified (no browser tool).

## 2026-06-23 (8)

- Image gap closed conceptually: user confirmed the real images were deleted and will be re-uploaded; no recovery needed. Pivoted to building the create/edit flow.
- Started the admin create/edit flow for the legacy `events` collection, ported from `public/admin.html`'s shared `viewForm`. Decisions (user-confirmed): build a shared form architected for all three types (vagter/opgaver/arrangementer) but wire only **vagter** into its page for now; persist to **live Firestore `events`** matching the legacy doc shape.
- New files: `apps/www/src/features/eventAdmin/eventAdmin.types.ts` (AdminEvent/EventSlot/EVENT_TYPES config types), `eventAdmin.data.ts` (EVENT_TYPES config + Firestore record mappers + time-range/slot helpers, `events` collection), `useEventAdmin.ts` (composable: load-by-type, list, form draft, slot add/remove, validation, addDoc/updateDoc/deleteDoc), `apps/www/src/components/admin/EventSlotEditor.vue` (one slot row: label/capacity/∞, role, time-range vs free-text detail, kind picker + price for arrangementer, 18+/group toggles), `EventAdminWorkspace.vue` (list + form, reuses `LibraryPickerModal` for image selection). Wired `ShiftsPage.vue` → `<AdminAuthGate><EventAdminWorkspace section="vagter" /></AdminAuthGate>`.
- Per-type behavior matches legacy: vagter slots use a strict start–end time picker, volunteer-only, no payment; opgaver use free-text slot detail; arrangementer add the Frivillig/Tilmeld/Betalt kind picker + payment section (MobilePay link, cancel deadline).
- Deferred from the legacy form (not in this pass): address autocomplete + Nominatim map for the location field (kept as plain text), and the inline calendar date-picker button (dateText is plain text). Public events list (`useEventsPage`) still reads static `events.data.ts`, so vagter created here won't appear on the public page until that read path is moved to Firestore — separate task.
- Verified `apps/www` typecheck and production build both pass. Not yet verified in a browser (no browser tool here) — handed to user to open `/vagter` at `127.0.0.1:5173`, log in, and create/edit a vagt.

## 2026-06-23 (7)

- User created a leader account via Console "Add user" and logged in successfully at `127.0.0.1:5173` against live `havets-helte`. (Earlier `auth/network-request-failed` was transient; `auth/invalid-credential` was a password mismatch resolved by resetting it. Added a `console.error('[admin-auth] login failed', err)` line in `useAdminAuth.ts` to surface the real Firebase error code instead of the swallowed generic message — still in the tree, can be reverted.)
- Library page showed only og-image placeholders. Investigated where real images live, per user request. Findings: live Firestore `events` collection is empty (0 docs, confirmed via public Firestore REST read — `events` has `allow read: if true`); `imageLibrary`/`meetings` are auth-gated (403 anonymously) but the app's authenticated read returned the static fallback, meaning `imageLibrary` is empty too; live `signups` has 5 real docs so the project is genuinely in production use. The displayed item titles ("Kristihimmelfartstogt", "Sankt Hans på Sluseholmen", "Lejrur — hjælp til forberedelse", "Sommermøde vagt") are all hardcoded in `apps/www/src/features/events/events.data.ts`, each with `image: '/og-sankthans.png'`. Only two image assets exist in the app: `/og-sankthans.png` and `/havets-helte-logo.svg`.
- Conclusion: there is no real `imageLibrary` data in this project and no real per-event images in the repo; every image reference resolves to the og placeholder by design. Only unverified spot is Firebase Storage `image-library/...` (auth-gated) — handed to user to check in the Console; if empty, nothing to recover and library must be populated by fresh upload.

## 2026-06-23 (6)

- User's screenshot of Firebase Console Authentication → Users for `havets-helte` showed zero users, even after enabling Authentication. Checked `public/admin.html` for a self-service leader signup path and found none (`createUserWithEmailAndPassword` doesn't appear anywhere; only Firestore CRUD). Concluded production never had a real leader account — Authentication itself was off until today, so the "log in with the real leader account" step in `TODO.md` had a false premise.
- Pointed the user at the Console's "Add user" button (same Authentication → Users screen) as the way to create a first leader login, since no in-app signup flow exists.

## 2026-06-23 (5)

- Confirmed the `CONFIGURATION_NOT_FOUND` Auth error is resolved after the user enabled Authentication/Email-Password for `havets-helte` in the Firebase Console: a direct `curl` to `identitytoolkit.googleapis.com` now returns 200 from `getProjectConfig` and `INVALID_LOGIN_CREDENTIALS` (not `CONFIGURATION_NOT_FOUND`) from `signInWithPassword` with fake test credentials.
- Handed the real-login verification of live `imageLibrary` data back to the user now that Auth is unblocked.

## 2026-06-23 (4)

- Diagnosed the live login failure (`getProjectConfig` 400, `signInWithPassword` 400, `CONFIGURATION_NOT_FOUND`) seen in the browser at `127.0.0.1:5173`. Reproduced the identical `CONFIGURATION_NOT_FOUND` error with a bare `curl` directly against `identitytoolkit.googleapis.com` using the project's apiKey, with no app code involved, which rules out a bug in `apps/www/src/lib/firebase.ts`. Confirmed this means Firebase Authentication has never been enabled for the `havets-helte` project itself.
- Checked the local Firebase CLI: installed (`firebase 15.20.0`) but not authenticated (`firebase projects:list` fails with expired credentials). Left re-authentication to the user since it's an interactive, account-tied step.
- Handed back to the user: enable Authentication + the Email/Password provider for `havets-helte` in the Firebase Console before the live-login verification in `TODO.md` item 1 can proceed.

## 2026-06-23 (3)

- Wired `LibraryPickerModal` into `MembersWorkspace.vue` so a member's `imageUrl` can be picked or cleared from the existing library, per user's choice to keep this local-state-only since `useMembersPage`/`roster.data.ts` are still static placeholder data with no Firestore backing.
- Made `rosterMembers` in `apps/www/src/features/roster/roster.data.ts` a `reactive()` array so mutating a member's `imageUrl` in place actually triggers Vue reactivity; added `setMemberImage`/`clearMemberImage` to `useMembersPage.ts`.
- Added a "Billede" card to the member profile panel with "Vælg billede"/"Skift billede" and a conditional "Fjern billede" button, wired to the same `useLibraryPage` items/categories/uploadItem used by the library page.
- Verified `apps/www` typechecking and production build both pass. Could not visually verify in a browser — no browser-automation tool is available in this environment; manual check handed back to the user (see `TODO.md`).

## 2026-06-23 (2)

- Diagnosed the "only the Facebook og:image shows in the library" symptom: it's the synthetic fallback path (`createFallbackLibraryItems`) firing because Firestore returns zero `imageLibrary` items, and every static item in `apps/www/src/features/events/events.data.ts` hardcodes `image: '/og-sankthans.png'`.
- Found that `apps/www/src/lib/firebase.ts` could never actually honor `VITE_USE_FIREBASE_EMULATORS=false` in dev, since `DEV || flag === 'true'` always evaluated to `true` in `npm run dev`. Fixed so an explicit env value now overrides `DEV` in both directions.
- Confirmed the legacy `public/admin.html` picks emulators vs. live by hostname (`localhost`/`127.0.0.1`) rather than a build-time flag, and that its `imageLibrary` write shape (`url`, `categoryId`, `name`, `storagePath`, ...) is already compatible with the new Vue reader.
- Traced "Til gren og hold" to legacy `admin.html`'s `focusMemberMoveFields()` (~line 4148): it scrolls to and focuses the `mGren` branch select in the inline member-edit form. The Vue port's `setBranchFilter(...)` call doesn't replicate this; parked per user request until the member edit form is ported.
- Stopped two stray leftover `npm run dev` processes and one `vite preview` process, and started a single clean dev server with a new gitignored `apps/www/.env` (`VITE_USE_FIREBASE_EMULATORS=false`) so it points at live `havets-helte` Firestore/Storage/Auth instead of emulators.
- Tried to confirm live `imageLibrary` data without logging in by reading the public `events` collection anonymously (`allow read: if true` in `firestore.rules`); got `permission-denied`, meaning the deployed rules likely differ from the local `firestore.rules` file or haven't been redeployed recently. Reading `imageLibrary` itself requires auth per the rules, so this needs a real login in the browser to verify — handed back to the user.
- Added `apps/www/scripts/seedEmulator.mjs`, a Node port of `public/seed.html`'s seeding logic (same events/members/meetings, same `leder@test.dk` login) that runs against the local emulators from the command line. It's idempotent — checks for an existing `events` doc first and skips entirely if the emulator already has data, so repeated runs never duplicate records.
- Wired the seed script as `predev` in `apps/www/package.json`, so `npm run dev` now seeds the local emulators automatically before Vite starts. Added `npm run seed` for a manual run. This is independent of the live/emulator `.env` override — the seed script always targets the emulators regardless of which Firebase project the Vue app itself is pointed at.
