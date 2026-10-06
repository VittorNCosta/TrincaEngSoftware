const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
};
for (const extension of ['.mp3', '.wav']) {
  require.extensions[extension] = (module, filename) => {
    module.exports = filename;
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));
async function loadSounds(enabled = true) {
  const players = [];
  const active = [];
  const mock = (name, exports) => {
    const id = require.resolve(name);
    require.cache[id] = { id, filename: id, loaded: true, exports };
  };
  mock('../src/storage/settingsStorage.ts', {
    getSettings: async () => ({ soundEnabled: enabled }),
    setSoundEnabledPreference: async (value) => {
      enabled = value;
    },
  });
  mock('expo-audio', {
    setIsAudioActiveAsync: async (value) => {
      active.push(value);
    },
    createAudioPlayer(source) {
      const player = {
        source,
        loop: false,
        volume: 1,
        plays: 0,
        pauses: 0,
        removed: false,
        async seekTo() {},
        play() {
          this.plays++;
        },
        pause() {
          this.pauses++;
        },
        remove() {
          this.removed = true;
        },
      };
      players.push(player);
      return player;
    },
  });
  delete require.cache[require.resolve('../src/utils/sounds.ts')];
  const sounds = require('../src/utils/sounds.ts');
  await flush();
  return { sounds, players, active };
}

test('carregar e alternar som não inicia reprodução automática', async () => {
  const { sounds, players, active } = await loadSounds(false);
  assert.equal(await sounds.getSoundEnabled(), false);
  assert.equal(await sounds.toggleSoundEnabled(), true);
  await sounds.setSoundEnabled(false);
  await sounds.setSoundEnabled(true);
  await flush();
  assert.equal(
    players.length,
    0,
    'a preferência não deve iniciar música ou efeitos',
  );
  assert.equal(active.at(-1), true);
});

test('ações continuam reproduzindo os 13 efeitos curtos sem loop', async () => {
  const { sounds, players } = await loadSounds();
  const actions = {
    playTapSound: 'tap.mp3',
    playButtonSound: 'button.mp3',
    playChestOpenSound: 'chest_open.mp3',
    playRewardSparkleSound: 'reward_sparkle.mp3',
    playTripleSounds: 'match.mp3',
    playWhooshSound: 'whoosh.wav',
    playConfettiSound: 'confetti.wav',
    playWinSound: 'win.mp3',
    playLoseSound: 'lose.mp3',
    playCoinSound: 'coin.mp3',
    playBlockedSound: 'blocked.mp3',
    playShopBuySound: 'shop_buy.mp3',
    playWorldUnlockSound: 'world_unlock.mp3',
  };
  for (const action of Object.keys(actions)) sounds[action]();
  await flush();
  assert.equal(players.length, 13);
  assert.deepEqual(
    players.map((player) => path.basename(player.source)).sort(),
    Object.values(actions).sort(),
  );
  for (const player of players) {
    assert.equal(player.plays, 1);
    assert.equal(player.loop, false);
    assert.ok(fs.existsSync(player.source));
  }
  sounds.releaseSoundPlayers();
});

test('mute pausa os efeitos e reativar som aguarda uma ação do jogador', async () => {
  const { sounds, players } = await loadSounds();
  sounds.playTapSound();
  await flush();
  assert.equal(players[0].plays, 1);
  await sounds.setSoundEnabled(false);
  assert.equal(players[0].pauses, 1);
  sounds.playTripleSounds();
  sounds.playButtonSound();
  await flush();
  assert.equal(players.length, 1);
  await sounds.setSoundEnabled(true);
  await flush();
  assert.equal(players[0].plays, 1);
  sounds.playButtonSound();
  await flush();
  assert.equal(players.length, 2);
  assert.equal(players[1].plays, 1);
  sounds.releaseSoundPlayers();
});

test('liberar áudio remove os players e permite um efeito futuro com novo player', async () => {
  const { sounds, players } = await loadSounds();
  sounds.playTapSound();
  await flush();
  sounds.releaseSoundPlayers();
  assert.equal(players[0].removed, true);
  sounds.playWinSound();
  await flush();
  assert.equal(players.length, 2);
  assert.equal(players[1].removed, false);
  assert.equal(players[1].plays, 1);
  sounds.releaseSoundPlayers();
});

test('toques repetidos no mesmo instante não empilham o efeito', async () => {
  const { sounds, players } = await loadSounds();
  sounds.playTapSound();
  sounds.playTapSound();
  await flush();
  assert.equal(players.length, 1);
  assert.equal(players[0].plays, 1);
  sounds.releaseSoundPlayers();
});

test('falha nativa ao reposicionar não impede tentativa de tocar nem interrompe o fluxo', async () => {
  const { sounds, players } = await loadSounds();
  sounds.playTapSound();
  await flush();
  players[0].seekTo = async () => {
    throw new Error('player nativo indisponível');
  };
  let attempts = 0;
  players[0].play = () => {
    attempts++;
    throw new Error('sessão de áudio indisponível');
  };
  // Reutiliza o player fora do intervalo de cooldown.
  await new Promise((resolve) => setTimeout(resolve, 80));
  sounds.playTapSound();
  await flush();
  assert.equal(players.length, 1);
  assert.equal(attempts, 1, 'falha de seek ainda permite tentar a reprodução');
  // Mutar/liberar continuam funcionando após as falhas da plataforma.
  await sounds.setSoundEnabled(false);
  assert.equal(players[0].pauses, 1);
  sounds.releaseSoundPlayers();
  assert.equal(players[0].removed, true);
});
