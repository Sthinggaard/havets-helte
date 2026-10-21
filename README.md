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

## Checks

```bash
cd apps/www
npm run typecheck
npm run build
```

## Notes

- Keep page files thin.
- Keep feature logic in `apps/www/src/features`.
- Keep UI composition in `apps/www/src/components` and page wrappers.
