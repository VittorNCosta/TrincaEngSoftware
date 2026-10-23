const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const runner = path.join(root, 'scripts/rodar-fluxos-maestro.sh');

test('jornadas que limpam dados recusam o pacote normal antes de chamar ADB', (t) => {
  if (process.platform === 'win32') {
    t.skip(
      'Requer Bash e ADB simulável; WSL não está disponível no Windows local.',
    );
    return;
  }
  const dir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trinca-maestro-isolation-'),
  );
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const trace = path.join(dir, 'adb-invocado.txt');
  const adb = path.join(dir, 'adb');
  // O substituto termina antes de qualquer espera ou comando Maestro.
  fs.writeFileSync(
    adb,
    '#!/bin/sh\nprintf "%s\\n" "$*" >> "$TRINCA_ADB_TRACE"\nexit 77\n',
    { mode: 0o700 },
  );
  const env = {
    ...process.env,
    PATH: `${dir}${path.delimiter}${process.env.PATH}`,
    TRINCA_ADB_TRACE: trace,
  };
  for (const suite of [
    'full',
    'baseline',
    'accessibility',
    'lives',
    'recovery',
  ]) {
    for (const appId of [
      'br.com.mhvtech.trincamania',
      'br.com.mhvtech.trincamania.e2e.other',
    ]) {
      const result = spawnSync('bash', [runner], {
        cwd: root,
        env: { ...env, APP_ID: appId, MAESTRO_SUITE: suite },
        encoding: 'utf8',
      });
      assert.equal(result.status, 2, `${suite}: ${result.stderr}`);
      assert.equal(
        fs.existsSync(trace),
        false,
        'Nenhum comando Android pode preceder a recusa',
      );
    }
  }
  const allowed = spawnSync('bash', [runner], {
    cwd: root,
    env: {
      ...env,
      APP_ID: 'br.com.mhvtech.trincamania.e2e',
      MAESTRO_SUITE: 'full',
    },
    encoding: 'utf8',
  });
  assert.equal(allowed.status, 77);
  assert.equal(
    fs.readFileSync(trace, 'utf8').trim(),
    'shell am force-stop br.com.mhvtech.trincamania.e2e',
  );
});

test('fluxos executáveis fixam o pacote isolado mesmo ao chamar Maestro diretamente', () => {
  const dir = path.join(root, '.maestro');
  for (const file of fs.readdirSync(dir, { recursive: true })) {
    if (!file.endsWith('.yaml') || file === 'config.yaml') continue;
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    assert.match(source, /^appId: br\.com\.mhvtech\.trincamania\.e2e$/m, file);
  }
});
