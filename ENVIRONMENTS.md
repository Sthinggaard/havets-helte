# Environments (dev / stage / prod)

Three isolated Firebase projects with a promotion pipeline:

| Env   | `.firebaserc` alias | Firebase project     | GitHub environment | When it deploys |
|-------|---------------------|----------------------|--------------------|-----------------|
| dev   | `dev`               | `havets-helte-dev`   | `dev`              | automatically on every push to `main` |
| stage | `stage`             | `havets-helte-stage` | `stage`            | automatically after dev succeeds |
| prod  | `prod`              | `havets-helte`       | `production`       | **manual only** — Actions tab → Deploy → Run workflow → `prod` |

Prod is never deployed automatically. The manual `workflow_dispatch` trigger is
the approval step (GitHub's built-in environment approval gates require a paid
plan on private repos). Individual envs can also be deployed on demand from the
Actions tab.

## Authentication: Workload Identity Federation (no keys)

The org (`havetshelte.dk`) enforces `iam.managed.disableServiceAccountKeyCreation`,
so CI cannot use service-account JSON secrets. Instead each project has a
Workload Identity pool `github-actions-pool` with OIDC provider `github-provider`
that trusts GitHub Actions tokens from the `Sthinggaard/foraeldrehelte` repo, and
a CI service account the workflow impersonates:

| Env   | Project number | Service account |
|-------|----------------|-----------------|
| dev   | 986076619978   | `github-action@havets-helte-dev.iam.gserviceaccount.com` |
| stage | 658395766805   | `github-action@havets-helte-stage.iam.gserviceaccount.com` |
| prod  | 148727737530   | `github-action-1266570338@havets-helte.iam.gserviceaccount.com` |

Each CI service account holds: `firebasehosting.admin`, `cloudfunctions.developer`,
`firebase.admin`, `firebasestorage.admin`, `firebaseauth.admin`,
`serviceusage.serviceUsageConsumer`, `run.viewer`, plus `iam.serviceAccountUser`
on the project's compute default service account (2nd-gen functions runtime).
The compute default service account holds `cloudbuild.builds.builder` (functions
builds run under it). The caller job in `deploy.yml` must set
`permissions: {contents: read, id-token: write}` — putting the permissions block
inside the reusable workflow causes a silent `startup_failure`.

How the app picks a project: each env has an `apps/www/.env.<mode>` file with the
project's public web config. The deploy sets `FIREBASE_HOSTING_BUILD_SCRIPT` to
`build:dev|build:stage|build:prod`; the hosting predeploy runs that script
(`vite build --mode …`). **Never run a bare `firebase deploy --only hosting`
locally** — the default `build` script picks up the gitignored `apps/www/.env`
(emulator config) and ships localhost URLs to the target project. Always set
`FIREBASE_HOSTING_BUILD_SCRIPT` explicitly, or let CI deploy.

## Setup status (completed 2026-07-08)

- All three projects are on the Blaze plan (billing account `016475-CCDB70-A0F5F0`);
  free-tier allowances keep real cost ~€0 for this app.
- Firebase Storage default buckets exist in all three projects (location `EU`).
- Firestore databases in `eur3`, Auth Email/Password enabled in dev + stage.
- WIF pools/providers/service accounts and IAM roles configured in all three
  projects (see table above).
- The legacy `FIREBASE_SERVICE_ACCOUNT_*` GitHub secrets are no longer used and
  were never populated.

## Notes

- Rules (`firestore.rules`, `storage.rules`) are shared across all environments —
  the same files deploy to every project.
- Deploys pass `--force` so functions removed from source are deleted without an
  interactive prompt.
- Deploys are serialized per environment (job-level concurrency group
  `firebase-deploy-<alias>`); different environments deploy independently.
