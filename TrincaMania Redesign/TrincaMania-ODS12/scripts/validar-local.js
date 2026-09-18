const { spawnSync } = require('node:child_process');
const path = require('node:path');
const comandos = [
  'format:check',
  'lint',
  'typecheck',
  'test',
  'test:ci',
  'test:ui',
  'test:playthrough',
  'guarda:ods12',
  'valida:assets',
  'auditoria',
  'cobertura',
  'orcamento:bundle',
];
for (const comando of comandos) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', comando],
    {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}

const modelos = spawnSync(
  process.execPath,
  ['scripts/gerar-modelos-codex.js', '--check'],
  {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  },
);
process.exit(modelos.status ?? 1);
