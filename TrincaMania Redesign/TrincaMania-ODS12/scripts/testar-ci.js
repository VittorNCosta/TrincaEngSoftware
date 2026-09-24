const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../../../.github/scripts/tests');
const tests = fs
  .readdirSync(dir)
  .filter((file) => file.endsWith('.test.cjs'))
  .sort()
  .map((file) => path.join(dir, file));
const result = spawnSync(process.execPath, ['--test', ...tests], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
