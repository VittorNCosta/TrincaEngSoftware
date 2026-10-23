const test = require('node:test');
const assert = require('node:assert/strict');
const { registrarTypeScript } = require('./lib/typescript.cjs');
registrarTypeScript();
const key = '@trinca-mania/settings-v1';
const legacy = '@trinca-mania/sound-enabled-v1';
const initial = {
  hapticsEnabled: true,
  soundEnabled: true,
  musicEnabled: true,
};
const silent = {
  hapticsEnabled: false,
  soundEnabled: false,
  musicEnabled: false,
};
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
function load(seed = [[key, JSON.stringify(initial)]]) {
  const store = new Map(seed);
  const storage = {
    getItem: async (name) => store.get(name) ?? null,
    setItem: async (name, value) => {
      store.set(name, value);
    },
  };
  const id = require.resolve('../src/storage/keyValueStorage.ts');
  require.cache[id] = {
    id,
    filename: id,
    loaded: true,
    exports: { __esModule: true, default: storage },
  };
  delete require.cache[require.resolve('../src/storage/settingsStorage.ts')];
  return {
    settings: require('../src/storage/settingsStorage.ts'),
    storage,
    store,
  };
}
for (const reverse of [false, true]) {
  test(`modo silencioso conserva ambos os campos, ordem inversa=${reverse}`, async () => {
    const { settings, store } = load();
    await settings.getSettings();
    const actions = [
      () => settings.setSoundEnabledPreference(false),
      () => settings.setMusicEnabledPreference(false),
      () => settings.setHapticsEnabledPreference(false),
    ];
    if (reverse) actions.reverse();
    await Promise.all(actions.map((action) => action()));
    assert.deepEqual(await settings.getSettings(), silent);
    assert.deepEqual(JSON.parse(store.get(key)), silent);
    assert.equal(store.get(legacy), 'false');
  });
}
test('mutações aguardam escrita anterior e retornam seus próprios snapshots', async () => {
  const { settings, storage, store } = load();
  await settings.getSettings();
  const entered = deferred(),
    release = deferred();
  const write = storage.setItem;
  let writes = 0;
  storage.setItem = async (name, value) => {
    if (++writes === 1) {
      entered.resolve();
      await release.promise;
    }
    await write(name, value);
  };
  const first = settings.setSoundEnabledPreference(false);
  await entered.promise;
  const second = settings.setSoundEnabledPreference(true);
  release.resolve();
  assert.equal((await first).soundEnabled, false);
  assert.equal((await second).soundEnabled, true);
  assert.deepEqual(JSON.parse(store.get(key)), initial);
  assert.equal(store.get(legacy), 'true');
});
test('migração pendente termina antes de saveSettings', async () => {
  const { settings, storage, store } = load([[legacy, 'false']]);
  const entered = deferred(),
    release = deferred();
  const write = storage.setItem;
  let writes = 0;
  storage.setItem = async (name, value) => {
    if (++writes === 1) {
      entered.resolve();
      await release.promise;
    }
    await write(name, value);
  };
  const read = settings.getSettings();
  await entered.promise;
  const save = settings.saveSettings(silent);
  release.resolve();
  await Promise.all([read, save]);
  assert.deepEqual(JSON.parse(store.get(key)), silent);
  assert.deepEqual(await settings.getSettings(), silent);
});
test('falha ao persistir migração mantém som legado desligado', async () => {
  const { settings, storage } = load([[legacy, 'false']]);
  storage.setItem = async () => {
    throw new Error('I/O');
  };
  assert.deepEqual(await settings.getSettings(), {
    ...initial,
    soundEnabled: false,
    musicEnabled: false,
  });
});
test('falha de escrita mantém cache e não bloqueia a próxima mutação', async () => {
  const { settings, storage, store } = load();
  await settings.getSettings();
  const write = storage.setItem;
  storage.setItem = async () => {
    throw new Error('I/O');
  };
  await settings.setSoundEnabledPreference(false);
  assert.equal((await settings.getSettings()).soundEnabled, false);
  storage.setItem = write;
  await settings.setHapticsEnabledPreference(false);
  await settings.setMusicEnabledPreference(false);
  assert.deepEqual(JSON.parse(store.get(key)), silent);
  assert.equal(store.get(legacy), 'false');
});
test('leituras concorrentes compartilham carregamento e preservam cache', async () => {
  const { settings, storage } = load();
  let reads = 0;
  const read = storage.getItem;
  storage.getItem = async (name) => {
    reads++;
    return read(name);
  };
  const [first, second] = await Promise.all([
    settings.getSettings(),
    settings.getSettings(),
  ]);
  assert.strictEqual(first, second);
  assert.strictEqual(await settings.getSettings(), first);
  assert.equal(reads, 1);
});

test('configuração antiga silenciada migra com música desligada', async () => {
  const { settings } = load([
    [key, JSON.stringify({ soundEnabled: false, hapticsEnabled: true })],
  ]);
  assert.equal((await settings.getSettings()).musicEnabled, false);
});
test('música e efeitos persistem independentemente, inclusive após recarregar', async () => {
  const { settings, store } = load();
  await Promise.all([
    settings.setMusicEnabledPreference(false),
    settings.setSoundEnabledPreference(false),
  ]);
  await settings.setMusicEnabledPreference(true);
  const snapshot = JSON.parse(store.get(key));
  assert.equal(snapshot.soundEnabled, false);
  assert.equal(snapshot.musicEnabled, true);
  const reload = load([...store]);
  assert.deepEqual(await reload.settings.getSettings(), snapshot);
});
