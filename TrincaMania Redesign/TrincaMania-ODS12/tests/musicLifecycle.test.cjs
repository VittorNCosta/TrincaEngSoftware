const assert = require('node:assert/strict');
const test = require('node:test');
const { audioHarness, flush, deferred } = require('./lib/audioHarness.cjs');

test('simultaneous requests and rapid world changes keep one audible target and release previous players', async (t) => {
  const h = audioHarness(t),
    m = h.api;
  const close = m.installMusicLifecycle();
  t.after(close);
  m.playMetaMusic();
  m.playMetaMusic();
  await flush();
  assert.equal(h.players.length, 1);
  h.tick(m.MUSIC_CROSSFADE_MS);
  assert.equal(h.players[0].volume, m.MUSIC_VOLUME);
  m.playWorldMusic(1);
  await flush();
  m.playWorldMusic(2);
  await flush();
  m.playWorldMusic(3);
  await flush();
  h.tick(m.MUSIC_CROSSFADE_MS);
  assert.equal(m.getActiveMusicKey(), 3);
  assert.deepEqual(
    h.players.map((p) => p.removes),
    [1, 1, 1, 0],
  );
  assert.equal(h.players[3].volume, m.MUSIC_VOLUME);
});

test('track ending waits for the gap, ignores duplicate finish events and restarts with a fade', async (t) => {
  const h = audioHarness(t),
    m = h.api;
  m.setMusicEnabled(true);
  m.playMetaMusic();
  await flush();
  h.tick(m.MUSIC_CROSSFADE_MS);
  const p = h.players[0];
  p.finish();
  p.finish();
  h.tick(m.MUSIC_GAP_MS - 1);
  await flush();
  assert.equal(p.plays, 1);
  h.tick(1);
  await flush();
  assert.equal(p.plays, 2);
  h.tick(m.MUSIC_CROSSFADE_MS);
  assert.equal(p.volume, m.MUSIC_VOLUME);
});

for (const action of ['mute', 'release', 'world change', 'background'])
  test(`pending restart cannot play after ${action}`, async (t) => {
    const h = audioHarness(t),
      m = h.api;
    const close = m.installMusicLifecycle();
    t.after(close);
    m.setMusicEnabled(true);
    m.playWorldMusic(1);
    await flush();
    const p = h.players[0],
      pending = deferred();
    p.seek = () => pending.promise;
    p.finish();
    h.tick(m.MUSIC_GAP_MS);
    await flush();
    if (action === 'mute') m.setMusicEnabled(false);
    if (action === 'release') m.releaseMusicPlayer();
    if (action === 'world change') m.playWorldMusic(2);
    if (action === 'background') h.appState('background');
    pending.resolve();
    await flush();
    assert.equal(p.plays, 1);
    if (action === 'world change') assert.equal(m.getActiveMusicKey(), 2);
  });

test('mute during session activation cancels the first playback and enable honors the pending target', async (t) => {
  const h = audioHarness(t),
    m = h.api,
    pending = deferred();
  h.state.activate = () => pending.promise;
  m.playWorldMusic(1);
  await flush();
  m.setMusicEnabled(false);
  pending.resolve();
  await flush();
  assert.equal(h.players.length, 0);
  m.setMusicEnabled(true);
  await flush();
  assert.equal(m.getActiveMusicKey(), 1);
});

test('nested dialogs keep ducking until all owners release and the next track inherits it', async (t) => {
  const h = audioHarness(t),
    m = h.api;
  m.duckMusic(0);
  m.duckMusic(0);
  m.playMetaMusic();
  await flush();
  h.tick(m.MUSIC_CROSSFADE_MS);
  assert.equal(h.players[0].volume, m.MUSIC_DUCK_VOLUME);
  m.unduckMusic(0);
  assert.equal(h.players[0].volume, m.MUSIC_DUCK_VOLUME);
  m.playWorldMusic(2);
  await flush();
  h.tick(m.MUSIC_CROSSFADE_MS);
  assert.equal(h.players[1].volume, m.MUSIC_DUCK_VOLUME);
  m.unduckMusic(0);
  assert.equal(h.players[1].volume, m.MUSIC_VOLUME);
  m.unduckMusic(0);
  assert.equal(h.players[1].volume, m.MUSIC_VOLUME);
});

test('inactive state pauses and foreground resumes the same position unless the preference is disabled', async (t) => {
  const h = audioHarness(t),
    m = h.api,
    close = m.installMusicLifecycle();
  t.after(close);
  m.playMetaMusic();
  await flush();
  const p = h.players[0];
  h.appState('inactive');
  assert.equal(p.playing, false);
  assert.equal(h.state.releasedSfx, 1);
  h.appState('active');
  await flush();
  assert.equal(p.plays, 2);
  h.appState('background');
  m.setMusicEnabled(false);
  h.appState('active');
  await flush();
  assert.equal(p.plays, 2);
  close();
  m.playWorldMusic(1);
  await flush();
  assert.equal(h.players.length, 1);
});

test('browser interaction retries blocked autoplay, respects mute and unregisters every listener', async (t) => {
  const h = audioHarness(t, 'music', { web: true }),
    m = h.api;
  const close = m.installMusicLifecycle();
  m.setMusicEnabled(true);
  m.playMetaMusic();
  await flush();
  const p = h.players[0];
  p.playing = false;
  h.domListeners.get('pointerdown')();
  assert.equal(p.plays, 2);
  h.windowListeners.get('pagehide')();
  assert.equal(p.playing, false);
  h.windowListeners.get('pageshow')();
  await flush();
  assert.equal(p.plays, 3);
  m.setMusicEnabled(false);
  h.domListeners.get('keydown')();
  assert.equal(p.plays, 3);
  close();
  assert.equal(h.domListeners.size, 0);
  assert.equal(h.windowListeners.size, 0);
  assert.equal(h.appListeners.length, 0);
});

test('missing native audio does not block navigation and the next request can recover', async (t) => {
  const h = audioHarness(t),
    m = h.api;
  h.state.createFailure = true;
  m.playMetaMusic();
  await flush();
  assert.equal(m.getActiveMusicKey(), undefined);
  h.state.createFailure = false;
  m.playMetaMusic();
  await flush();
  assert.equal(h.players.length, 1);
  h.players[0].seek = async () => {
    throw Error('seek failed');
  };
  h.players[0].finish();
  h.tick(m.MUSIC_GAP_MS);
  await flush();
  assert.equal(h.players[0].plays, 1);
  m.releaseMusicPlayer();
  m.releaseMusicPlayer();
  assert.equal(h.players[0].removes, 1);
});
