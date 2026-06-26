const { spawnSync } = require('node:child_process');

const allowedScripts = new Set(['build', 'build:dev', 'build:stage', 'build:prod']);
const script = process.env.FIREBASE_HOSTING_BUILD_SCRIPT || 'build';

if (!allowedScripts.has(script)) {
  console.error(`Unsupported Firebase hosting build script: ${script}`);
  console.error(`Allowed values: ${Array.from(allowedScripts).join(', ')}`);
  process.exit(1);
}

const result = spawnSync('npm', ['--prefix', 'apps/www', 'run', script], {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
