const assert = require('node:assert/strict');
const test = require('node:test');
const { audioHarness, flush, deferred } = require('./lib/audioHarness.cjs');
for (const action of ['release', 'background', 'inactive', 'mute'])
  test(`a voice waiting for seek cannot play after ${action}`, async (t) => {
    const h = audioHarness(t, 'voiceOver'),
      v = h.api,
      pending = deferred();
    v.playVoiceReaction(2);
    const p = h.players[0];
    p.seek = () => pending.promise;
    await flush();
    if (action === 'release') v.releaseVoiceOverPlayers();
    if (action === 'background' || action === 'inactive') h.appState(action);
    if (action === 'mute') h.state.sfxEnabled = false;
    pending.resolve();
    await flush();
    assert.equal(p.plays, 0);
    assert.equal(h.state.ducks, 0);
    assert.equal(h.state.unducks, 0);
  });

test('queued voices keep the most important reaction and observe cooldown before starting', async (t) => {
  const h = audioHarness(t, 'voiceOver'),
    v = h.api;
  v.playVoiceReaction(1);
  v.playVoiceReaction(3);
  assert.equal(h.players.length, 0);
  v.playVoiceReaction(2);
  await flush();
  assert.equal(h.players[0].plays, 1);
  v.playVoiceReaction(4);
  v.playVoiceReaction(5);
  v.playVoiceReaction(7);
  h.players[0].finish();
  h.tick(v.VOICE_COOLDOWN_MS - 1);
  await flush();
  assert.equal(h.players.length, 1);
  h.tick(1);
  await flush();
  assert.equal(h.players.length, 2);
  assert.match(h.players[1].source, /Brilhante/);
  assert.equal(h.players[1].plays, 1);
  h.players[1].finish();
  assert.equal(h.state.ducks, h.state.unducks);
});

test('background cancels queued speech; returning does not replay the discarded request', async (t) => {
  const h = audioHarness(t, 'voiceOver'),
    v = h.api;
  v.playComboHighVoice();
  await flush();
  v.playVoiceReaction(6);
  h.players[0].finish();
  h.appState('background');
  h.tick(10000);
  h.appState('active');
  await flush();
  assert.equal(h.players.length, 1);
  assert.equal(h.players[0].removes, 1);
  v.playVoiceReaction(2);
  await flush();
  assert.equal(h.players.length, 2);
  assert.equal(h.players[1].plays, 1);
});

test('timeout releases music ducking and a cached voice can be reused after cooldown', async (t) => {
  const h = audioHarness(t, 'voiceOver'),
    v = h.api;
  v.playVoiceReaction(2);
  await flush();
  assert.equal(h.state.ducks, 1);
  h.tick(2200);
  await flush();
  assert.equal(h.state.unducks, 1);
  h.tick(v.VOICE_COOLDOWN_MS);
  v.playVoiceReaction(2);
  await flush();
  assert.equal(h.players.length, 1);
  assert.equal(h.players[0].plays, 2);
  v.releaseVoiceOverPlayers();
  assert.equal(h.players[0].removes, 1);
  assert.equal(h.state.ducks, h.state.unducks);
});

test('native creation or playback failure keeps speech recoverable and gameplay running', async (t) => {
  const h = audioHarness(t, 'voiceOver'),
    v = h.api;
  h.state.createFailure = true;
  assert.doesNotThrow(() => v.playVoiceReaction(2));
  h.state.createFailure = false;
  v.playVoiceReaction(2);
  h.tick(v.VOICE_COOLDOWN_MS);
  await flush();
  assert.equal(h.players[0].plays, 1);
  h.players[0].finish();
  h.tick(v.VOICE_COOLDOWN_MS);
  v.playVoiceReaction(4);
  h.players[1].playFailure = true;
  await flush();
  h.tick(v.VOICE_COOLDOWN_MS);
  v.playVoiceReaction(5);
  await flush();
  assert.equal(h.players[2].plays, 1);
});

test('a finish event already queued by a released player cannot end its replacement', async (t) => {
  const h = audioHarness(t, 'voiceOver');
  h.api.playVoiceReaction(2);
  await flush();
  const staleFinish = h.players[0].queuedFinish();
  h.api.releaseVoiceOverPlayers();
  h.api.playVoiceReaction(4);
  await flush();
  staleFinish();
  assert.equal(h.players[1].plays, 1);
  assert.equal(h.state.ducks, 2);
  assert.equal(h.state.unducks, 1);
  h.players[1].finish();
  assert.equal(h.state.ducks, h.state.unducks);
});
