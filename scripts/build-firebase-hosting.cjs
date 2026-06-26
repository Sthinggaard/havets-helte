const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const allowedScripts = new Set(['build', 'build:dev', 'build:stage', 'build:prod']);
const script = process.env.FIREBASE_HOSTING_BUILD_SCRIPT || 'build';
const envFilesByScript = new Map([
  ['build:dev', 'apps/www/.env.dev'],
  ['build:stage', 'apps/www/.env.stage'],
  ['build:prod', 'apps/www/.env.prod'],
]);

if (!allowedScripts.has(script)) {
  console.error(`Unsupported Firebase hosting build script: ${script}`);
  console.error(`Allowed values: ${Array.from(allowedScripts).join(', ')}`);
  process.exit(1);
}

const envFile = envFilesByScript.get(script);
if (envFile) {
  const contents = readFileSync(envFile, 'utf8');
  if (contents.includes('REPLACE_WITH_')) {
    console.error(`${envFile} still contains REPLACE_WITH_* placeholders.`);
    console.error('Fill in the Firebase web config before deploying this environment.');
    process.exit(1);
  }
}

const result = spawnSync('npm', ['--prefix', 'apps/www', 'run', script], {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
