# Sankthans

This repository contains the `apps/www` Vue application for Havets Helte.

## App

- `apps/www`: Vite + Vue + TypeScript frontend
- Firebase is used for app data and Firestore access
- The admin library screen lives in `apps/www/src/components/library/LibraryWorkspace.vue`

## Local development

Start the local Firebase backend in one terminal:

```bash
cd apps/www
npm run emulators
```

This uses `.firebase/emulator-data` as a local import/export directory, so
Firestore, Auth, and Storage emulator data persist across emulator restarts.
The directory is gitignored.

Start the Vue dev server in another terminal:

```bash
cd apps/www
npm install
npm run dev
```

The Vue app uses Firebase emulators by default in development. `npm run dev`
automatically seeds the local emulators with sample events, members, and
meetings (see `apps/www/scripts/seedEmulator.mjs`) before starting — it's
idempotent and skips itself if the emulator already has data. Run it manually
with `npm run seed`. The local seeded leader login is
`sthinggaard@havetshelte.dk / test1234`.

To point local dev at the live `havets-helte` project instead of emulators
(e.g. to check real production data), create `apps/www/.env` with
`VITE_USE_FIREBASE_EMULATORS=false` and restart `npm run dev` — Vite only
reads `.env` files at server startup, so a browser refresh alone won't pick
up the change. This file is gitignored and only affects your local checkout.

### Local scout list

To test the spreadsheet list on `/medlemmer`, run from the repository root:

```bash
python3 apps/www/scripts/importLocalRoster.py spejdere.xlsx
```

Restart Vite after the first import. This creates a gitignored development
fixture and uses separate browser storage for members, branches, and teams,
preserving the previous demo data. Changes to this test list stay in that
browser. The workbook and generated fixture are not committed; the fixture
is excluded from production builds. No Firebase data is written.

The import reads names, branches, meeting days, and birth years. Blank names
are skipped. Junior and Ulv use Monday/Tuesday teams from the workbook;
Troppen retains the app's existing Wednesday meeting day. Full birthdays
and group start dates are not imported into the current member model.

### Attendance dashboard

`/admin/fremmoede` opens the attendance overview. Filter by period, current
branch and team; sort by attendance rate or consecutive absences. Expand a
member's name to inspect the dated registrations. Members without completed
registrations show “Ingen data”. Demo check-ins are not treated as history.

The calendar and registration form read the saved team schedules from
`/grene`: weekly meeting days, start/end times and inclusive season dates.
Only the displayed calendar range is calculated. Inactive or incomplete
schedules produce no planned meetings. Existing branch-level schedules are
used as a fallback for older team settings. These are read-only calendar
entries, not attendance writes or automatic absences. Saved registrations
remain visible with their original times after a schedule or season changes.

Use “Registrer fremmøde” to choose a date and one of its scheduled teams and check the members who
attended. “Gem foreløbigt” saves a draft that can also be opened through the
calendar for check-in. “Afslut registrering” confirms the list: unchecked
members count as absent. Completed registrations can be corrected from the
overview; the kiosk cannot change them. Future meetings cannot be finalized.

Teams and signup sections use the same selectable rows in the calendar.
Select a row and use the shared “Åbn fremmøde” button. For signup sections it
opens the same check-in screen with confirmed signups for the selected event,
section and date, rather than a branch roster. Waitlisted signups are excluded.
The event and its signup list are read once when the screen opens; reopening a
draft refreshes the list after new signups or cancellations. Group signups are
shown as one named registration with their participant count. Medlemsservice
registrations have no local participant list and cannot be checked in here.
Signup attendance uses its own IDs and appears under registrations in the
overview, where a leader can finalize or correct it. It is not matched to scout
profiles by name or included in their regular team attendance percentages.

Attendance is stored locally in the browser under a roster-specific key and
updates other tabs of the same origin. It is not shared through Firebase yet.
Each registration preserves its expected member list, so subsequent transfers
and newly added members do not rewrite historic attendance. When creating a
new registration for an old date, the initial list comes from the current
team; review that list before finalizing. Closing without saving makes no
changes. Browser-storage failures are reported without updating the totals.

## Checks

```bash
cd apps/www
npm run typecheck
npm run build
npm run check:attendance
```

## Notes

- Keep page files thin.
- Keep feature logic in `apps/www/src/features`.
- Keep UI composition in `apps/www/src/components` and page wrappers.
