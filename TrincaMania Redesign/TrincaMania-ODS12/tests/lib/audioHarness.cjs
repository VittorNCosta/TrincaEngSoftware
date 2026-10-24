const { registrarTypeScript } = require('./typescript.cjs');
registrarTypeScript();
for (const extension of ['.mp3', '.wav'])
  require.extensions[extension] = (module, filename) => {
    module.exports = filename;
  };
const stub = (name, exports) => {
  const id = require.resolve(name);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
function audioHarness(t, kind = 'music', options = {}) {
  t.mock.timers.enable({
    apis: ['setTimeout', 'setInterval', 'Date'],
    now: 10000,
  });
  const players = [],
    appListeners = [],
    domListeners = new Map(),
    windowListeners = new Map();
  const state = {
    musicEnabled: true,
    sfxEnabled: true,
    ducks: 0,
    unducks: 0,
    releasedSfx: 0,
    activate: async () => {},
    createFailure: false,
  };
  const events = (map) => ({
    addEventListener: (name, fn) => map.set(name, fn),
    removeEventListener: (name) => map.delete(name),
  });
  if (options.web) {
    global.document = events(domListeners);
    global.window = events(windowListeners);
  }
  stub('react-native', {
    Platform: { OS: options.web ? 'web' : 'android' },
    AppState: {
      currentState: options.background ? 'background' : 'active',
      addEventListener: (_name, fn) => {
        appListeners.push(fn);
        return {
          remove: () => {
            appListeners.splice(appListeners.indexOf(fn), 1);
          },
        };
      },
    },
  });
  stub('expo-audio', {
    setIsAudioActiveAsync: () => state.activate(),
    createAudioPlayer(source) {
      if (state.createFailure) throw Error('native unavailable');
      const listeners = new Set();
      const p = {
        source,
        volume: 0,
        loop: false,
        playing: false,
        plays: 0,
        pauses: 0,
        removes: 0,
        seek: async () => {},
        play() {
          if (p.playFailure) throw Error('play failed');
          p.plays++;
          p.playing = true;
        },
        pause() {
          p.pauses++;
          p.playing = false;
        },
        remove() {
          p.removes++;
        },
        seekTo: () => p.seek(),
        addListener: (_name, fn) => {
          listeners.add(fn);
          return { remove: () => listeners.delete(fn) };
        },
        queuedFinish() {
          const queued = [...listeners];
          return () => queued.forEach((fn) => fn({ didJustFinish: true }));
        },
        finish() {
          p.playing = false;
          for (const fn of [...listeners]) fn({ didJustFinish: true });
        },
      };
      players.push(p);
      return p;
    },
  });
  stub('../../src/storage/settingsStorage.ts', {
    getMusicEnabled: async () => state.musicEnabled,
  });
  stub('../../src/utils/sounds.ts', {
    getSfxEnabled: async () => state.sfxEnabled,
    releaseSoundPlayers: () => state.releasedSfx++,
  });
  if (kind === 'voiceOver')
    stub('../../src/utils/music.ts', {
      duckMusic: () => state.ducks++,
      unduckMusic: () => state.unducks++,
    });
  const id = require.resolve('../../src/utils/' + kind + '.ts');
  delete require.cache[id];
  const api = require(id);
  t.after(() => {
    if (kind === 'music') api.releaseMusicPlayer();
    else api.releaseVoiceOverPlayers();
    t.mock.timers.reset();
    if (options.web) {
      delete global.document;
      delete global.window;
    }
  });
  return {
    api,
    players,
    state,
    appListeners,
    domListeners,
    windowListeners,
    appState: (value) => [...appListeners].forEach((fn) => fn(value)),
    tick: (ms) => t.mock.timers.tick(ms),
  };
}
module.exports = { audioHarness, flush, deferred };
