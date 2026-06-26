# Sankthans

This repository contains the `apps/www` Vue application for Havets Helte.

## App

- `apps/www`: Vite + Vue + TypeScript frontend
- Firebase is used for app data and Firestore access
- The admin library screen lives in `apps/www/src/components/library/LibraryWorkspace.vue`

## Local development

```bash
cd apps/www
npm install
npm run dev
```

The Vue app uses Firebase emulators by default in development. `npm run dev`
automatically seeds the local emulators with sample events, members, and
meetings (see `apps/www/scripts/seedEmulator.mjs`) before starting — it's
idempotent and skips itself if the emulator already has data. Run it manually
with `npm run seed`. The local seeded leader login is `leder@havetshelte.dk / test1234`.

To point local dev at the live `havets-helte` project instead of emulators
(e.g. to check real production data), create `apps/www/.env` with
`VITE_USE_FIREBASE_EMULATORS=false` and restart `npm run dev` — Vite only
reads `.env` files at server startup, so a browser refresh alone won't pick
up the change. This file is gitignored and only affects your local checkout.

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
