const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
};
const { connectWebHost } = require('../src/services/webHostBridge.ts');

test('standalone/native não usa ponte web', () => {
  delete global.window;
  assert.doesNotThrow(() =>
    connectWebHost({ ready: true, sessionActive: false })(),
  );
  // React Native defines window=global without DOM/location.
  global.window = global;
  assert.doesNotThrow(() =>
    connectWebHost({ ready: true, sessionActive: false })(),
  );
  delete global.window;
});

test('ponte valida origem/token/source, confirma somente ready e remove listener', () => {
  const sent = [];
  const listeners = new Map();
  const parent = { postMessage: (data, origin) => sent.push({ data, origin }) };
  global.window = {
    parent,
    location: {
      search: '?hostSession=nonce&hostOrigin=https%3A%2F%2Fhost.test',
    },
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type) => listeners.delete(type),
  };
  global.document = {
    referrer: 'https://host.test/jogar/',
    querySelector: () => null,
  };
  let close = connectWebHost({ ready: false, sessionActive: false });
  assert.equal(sent.length, 0);
  close();
  close = connectWebHost({ ready: true, sessionActive: false });
  assert.equal(sent.length, 1);
  const valid = {
    source: parent,
    origin: 'https://host.test',
    data: { channel: 'ods12-host', version: 1, type: 'ping', session: 'nonce' },
  };
  for (const invalid of [
    { ...valid, origin: 'https://evil.test' },
    { ...valid, source: {} },
    { ...valid, data: { ...valid.data, session: 'old' } },
    { ...valid, data: { ...valid.data, version: 2 } },
  ])
    listeners.get('message')(invalid);
  assert.equal(sent.length, 1);
  listeners.get('message')(valid);
  assert.equal(sent.length, 2);
  assert.equal(sent[1].origin, 'https://host.test');
  close();
  assert.equal(listeners.size, 0);

  let focused = false;
  const recoveryButton = {
    hasAttribute: () => false,
    focus: () => {
      focused = true;
    },
  };
  document.querySelector = (selector) =>
    selector === '[role="dialog"]'
      ? { querySelector: () => recoveryButton }
      : null;
  close = connectWebHost({ ready: false, error: true, sessionActive: true });
  assert.equal(sent.at(-1).data.type, 'error');
  assert.equal(sent.at(-1).data.sessionActive, true);
  listeners.get('message')({
    ...valid,
    data: { ...valid.data, type: 'focus' },
  });
  assert.equal(focused, true);
  assert.equal(recoveryButton.tabIndex, -1);
  close();

  document.referrer = 'https://evil.test/';
  connectWebHost({ ready: true, sessionActive: false });
  assert.equal(listeners.size, 0);
  assert.equal(sent.length, 3);
  delete global.window;
  delete global.document;
});
