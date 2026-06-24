# Decisions

## 2026-06-22

- The admin library screen should load Firestore data with a one-time read instead of a realtime listener. The screen is an admin content view, so lower read cost is the better default.
- Root project tracking files live in the repository root and should be created if missing.
- The active library feature contract belongs in `apps/www/src/features/library/library.types.ts`.
- The library domain model should be category-first, matching the legacy admin library, rather than being centered on event/task/shift filters.
- The library should keep `uncategorized` as the default fallback category until real Firestore category persistence is added.
- The legacy Firestore collections are the source of truth for the library: `imageLibrary` and `imageLibraryCategories`, with Storage paths under `image-library/...`.
- Library item mutations should update Firestore and Storage directly instead of maintaining a separate local-only source of truth.
- The image picker should live as a reusable component in `apps/www/src/components/library/` so it can be attached to multiple consumers without duplicating modal logic.
- Picker uploads should use the currently filtered category when available, falling back to `uncategorized` when the picker is on the full set.
- The library must remain compatible with the legacy Firestore item shape by reading both `imageUrl` and `url`, and by writing both fields on new or edited items.
- On first load, the app should mirror legacy source collections (`events`, `members`, `meetings`) into `imageLibrary` when missing, instead of relying on a manual migration step.
- `apps/www` should use Firebase emulators by default in development and only connect to the live project in production or when emulators are explicitly disabled.
- Admin routes in `apps/www` should require real Firebase authentication before attempting to read live Firestore data.
- The local seed login is `leder@havetshelte.dk / test1234` (changed from `leder@test.dk` so the emulator leader is an admin under the havetshelte.dk rule below), and the emulator seed path is the supported way to work on the library without billing.
- `LibraryPickerModal` must always receive the full unfiltered `items` list from `useLibraryPage`, never the host page's `visibleItems`, since the modal maintains its own independent category filter.

## 2026-06-23

- The admin create/edit flow for vagter/opgaver/arrangementer is built as one shared, type-parameterized form (`EventAdminWorkspace` + `useEventAdmin(section)`), mirroring the legacy `admin.html` single `viewForm`, rather than three separate forms. They all persist to the same Firestore `events` collection keyed by `type` (`timed`/`task`/`event`), keeping the new app interoperable with the legacy admin's doc shape.
- Vagter is wired first (branch `fix/ny-vagt-form-ux`); opgaver and arrangementer reuse the same component by passing a different `section` prop once vagter is verified.
- Per-type form behavior is driven by `EVENT_TYPES` flags (`timedSlots`, `showKindPicker`, `showPayment`): vagter slots are strict start–end time ranges and volunteer-only; only arrangementer expose participation kind (Frivillig/Tilmeld/Betalt) and the payment section.
- Address autocomplete/map and the inline calendar picker from the legacy form are intentionally deferred; location and date-text are plain text fields in the first pass.
- Admin/leader identity is defined as "signed in with a havetshelte.dk email address". This is enforced in two places that must stay in sync: client-side in `useAdminAuth.isAdminEmail`/`isAdmin` (gates `AdminAuthGate` and the edit affordances) and server-side in `firestore.rules` via the `isAdmin()` helper on all leader-write collections. The client check is UX only; the Firestore rule is the real enforcement and must be deployed (`firebase deploy --only firestore:rules`) for it to take effect.
- The public `/events` page reads live events from Firestore (`fetchAllAdminEvents`) and falls back to the static seed only when the collection is empty, so it never goes blank pre-seed. Admins get a per-event "Rediger" affordance that deep-links into the matching admin form via `?edit=<id>` (`/vagter`, `/opgaver`, `/admin/arrangementer`).
- `VITE_USE_FIREBASE_EMULATORS` must be able to override `DEV` in both directions: `=true` forces emulators in a production build, and `=false` forces the live project even when running `npm run dev`. The previous `DEV || flag === 'true'` logic made dev mode always use emulators with no way to opt out, which blocked verifying real production library data locally.
