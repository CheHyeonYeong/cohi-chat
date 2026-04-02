const { spawnSync } = require('node:child_process');

function resolvePrismaCli() {
  try {
    return require.resolve('prisma/build/index.js');
  } catch {
    return null;
  }
}

const prismaCli = resolvePrismaCli();

if (!prismaCli) {
  console.log('Skipping Prisma client generation because the Prisma CLI is not installed.');
  process.exit(0);
}

const result = spawnSync(process.execPath, [prismaCli, 'generate'], {
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
