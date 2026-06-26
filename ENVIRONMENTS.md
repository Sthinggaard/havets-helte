# Environments (dev / stage / prod)

Three isolated Firebase projects, promoted by branch:

| Env   | Branch    | `.firebaserc` alias | Firebase project (default names) | GitHub environment | Service-account secret |
|-------|-----------|---------------------|----------------------------------|--------------------|------------------------|
| dev   | `develop` | `dev`               | `havets-helte-dev`               | `dev`              | `FIREBASE_SERVICE_ACCOUNT_DEV` |
| stage | `staging` | `stage`             | `havets-helte-stage`             | `stage`            | `FIREBASE_SERVICE_ACCOUNT_STAGE` |
| prod  | `main`    | `prod`              | `havets-helte`                   | `production`       | `FIREBASE_SERVICE_ACCOUNT_HAVETS_HELTE` |

Pushing to a branch auto-deploys that environment (`.github/workflows/deploy.yml` →
reusable `_firebase-deploy.yml`), deploying `hosting,functions,firestore:rules,storage`.
You can also deploy on demand from the Actions tab (**Deploy** → Run workflow → pick env).

How the app picks a project: each env has an `apps/www/.env.<mode>` file with the
project's public web config. CI deploys set `FIREBASE_HOSTING_BUILD_SCRIPT` to
`build:dev|build:stage|build:prod`; Firebase's hosting predeploy then runs that
matching script (`vite build --mode …`). The predeploy wrapper rejects env files
that still contain `REPLACE_WITH_*` placeholders so a branch cannot deploy a broken
client config by accident. `firebase.ts` reads `VITE_FIREBASE_*` and falls back to
the prod values when no env file is present. A local `npm run dev` is unaffected —
it still uses Vite's default `development` mode and the gitignored local `.env`
(emulators).

## One-time setup

1. **Create the two new Firebase projects.** Done 2026-06-26 via Firebase CLI:
   `havets-helte-dev` and `havets-helte-stage`.

2. **Fill in the web config** for dev + stage in `apps/www/.env.dev` and
   `apps/www/.env.stage`. Done 2026-06-26 via Firebase CLI web app registration.

3. **Enable required Firebase products in dev + stage.** Still manual. Enable the
   same products as prod on each project: Authentication (Email/Password), Firestore
   database in `eur3` (to match prod), and **Storage**. Storage + Functions deploy
   require the **Blaze** plan on each project — see note below.

4. **Create service accounts + GitHub secrets.** For each project: Console → Project
   settings → Service accounts → Generate new private key. Add the JSON as a repo
   secret named per the table above (Settings → Secrets and variables → Actions).
   Prod's secret (`FIREBASE_SERVICE_ACCOUNT_HAVETS_HELTE`) already exists.

5. **Create the long-lived branches** `develop` and `staging` (off `main`), and push
   them so the deploy workflow has something to track. `develop` exists locally as
   of 2026-06-26; `staging` still needs to be created and pushed.

6. *(Optional)* Add GitHub **Environments** named `dev`, `stage`, `production`
   (Settings → Environments) to attach protection rules — e.g. a required reviewer
   before `production` deploys.

## Notes

- **Blaze required:** deploying `storage` and `functions` needs each project on the
  Blaze (pay-as-you-go) plan; on the free Spark plan those `--only` targets fail.
  The free-tier allowances still apply under Blaze, so real cost is ~€0 for this app.
- Rules (`firestore.rules`, `storage.rules`) are shared across all environments — the
  same files deploy to every project.
