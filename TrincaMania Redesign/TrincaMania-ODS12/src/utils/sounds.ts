import {
  createAudioPlayer,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';

import {
  getSettings,
  setSoundEnabledPreference,
} from '../storage/settingsStorage';

type SoundKey =
  | 'blocked'
  | 'button'
  | 'chestOpen'
  | 'coin'
  | 'confetti'
  | 'lose'
  | 'match'
  | 'rewardSparkle'
  | 'shopBuy'
  | 'tap'
  | 'whoosh'
  | 'win'
  | 'worldUnlock';

type SoundConfig = {
  cooldownMs: number;
  source?: AudioSource;
  volume: number;
};
const soundSources: Record<SoundKey, AudioSource | undefined> = {
  blocked: require('../../assets/sfx/blocked.mp3') as AudioSource,
  button: require('../../assets/sfx/button.mp3') as AudioSource,
  chestOpen: require('../../assets/sfx/voice/chest_open.mp3') as AudioSource,
  coin: require('../../assets/sfx/coin.mp3') as AudioSource,
  confetti: require('../../assets/sfx/confetti.wav') as AudioSource,
  lose: require('../../assets/sfx/lose.mp3') as AudioSource,
  match: require('../../assets/sfx/match.mp3') as AudioSource,
  rewardSparkle:
    require('../../assets/sfx/voice/reward_sparkle.mp3') as AudioSource,
  shopBuy: require('../../assets/sfx/shop_buy.mp3') as AudioSource,
  tap: require('../../assets/sfx/tap.mp3') as AudioSource,
  whoosh: require('../../assets/sfx/whoosh.wav') as AudioSource,
  win: require('../../assets/sfx/win.mp3') as AudioSource,
  worldUnlock: require('../../assets/sfx/world_unlock.mp3') as AudioSource,
};

// Expected files:
// assets/sfx/tap.mp3
// assets/sfx/button.mp3
// assets/sfx/match.mp3
// assets/sfx/win.mp3
// assets/sfx/lose.mp3
// assets/sfx/coin.mp3
// assets/sfx/blocked.mp3
// assets/sfx/shop_buy.mp3
// assets/sfx/world_unlock.mp3
//
// Fontes `undefined` continuam sendo no-op em tempo de execução — é a rede de
// segurança caso algum arquivo seja removido da pasta no futuro.
const SOUND_CONFIGS: Record<SoundKey, SoundConfig> = {
  // 750ms engolia a segunda tentativa na mesma peça: 300 responde a cada toque.
  blocked: { cooldownMs: 300, source: soundSources.blocked, volume: 0.32 },
  button: { cooldownMs: 80, source: soundSources.button, volume: 0.34 },
  chestOpen: { cooldownMs: 900, source: soundSources.chestOpen, volume: 0.42 },
  // 90ms permite a cascata de 3 moedas de S5.
  coin: { cooldownMs: 90, source: soundSources.coin, volume: 0.4 },
  confetti: { cooldownMs: 900, source: soundSources.confetti, volume: 0.34 },
  lose: { cooldownMs: 700, source: soundSources.lose, volume: 0.46 },
  match: { cooldownMs: 180, source: soundSources.match, volume: 0.44 },
  // A voz de recompensa fica abaixo dos efeitos principais para não dominar a mixagem.
  rewardSparkle: {
    cooldownMs: 700,
    source: soundSources.rewardSparkle,
    volume: 0.22,
  },
  shopBuy: { cooldownMs: 450, source: soundSources.shopBuy, volume: 0.46 },
  tap: { cooldownMs: 55, source: soundSources.tap, volume: 0.3 },
  whoosh: { cooldownMs: 60, source: soundSources.whoosh, volume: 0.26 },
  win: { cooldownMs: 700, source: soundSources.win, volume: 0.52 },
  worldUnlock: {
    cooldownMs: 900,
    source: soundSources.worldUnlock,
    volume: 0.54,
  },
};

const players: Partial<Record<SoundKey, AudioPlayer>> = {};
const lastPlayedAt: Partial<Record<SoundKey, number>> = {};
// Espelho síncrono da preferência de som. `getSettings()` é assíncrono, então
// checar o mute só por ele deixava uma janela em que um som (ex.: a trinca) já
// tinha sido agendado antes da leitura resolver. Este cache é atualizado na hora
// em setSoundEnabled e serve de portão imediato em playSound.
let soundEnabledCache: boolean | undefined;

const syncAudioActive = (enabled: boolean) => {
  setIsAudioActiveAsync(enabled).catch(() => undefined);
};

const stopAllPlayers = () => {
  Object.values(players).forEach((player) => {
    if (!player) {
      return;
    }

    try {
      player.pause();
      player.seekTo(0).catch(() => undefined);
    } catch {
      // no-op: disabling sound should never interrupt gameplay
    }
  });
};

export const getSoundEnabled = async () => {
  const settings = await getSettings();
  soundEnabledCache = settings.soundEnabled;
  syncAudioActive(settings.soundEnabled);
  return settings.soundEnabled;
};

export const setSoundEnabled = async (value: boolean) => {
  // Atualiza o cache síncrono ANTES do await: o mute vale a partir de já.
  soundEnabledCache = value;

  if (!value) {
    stopAllPlayers();
  }

  await setSoundEnabledPreference(value);
  syncAudioActive(value);
};

export const toggleSoundEnabled = async () => {
  const currentValue = await getSoundEnabled();
  const nextValue = !currentValue;

  await setSoundEnabled(nextValue);

  return nextValue;
};

const getPlayer = (key: SoundKey) => {
  const config = SOUND_CONFIGS[key];

  if (!config.source) {
    return undefined;
  }

  if (!players[key]) {
    const player = createAudioPlayer(config.source, {
      keepAudioSessionActive: false,
    });
    player.volume = config.volume;
    players[key] = player;
  }

  return players[key];
};

const canPlayNow = (key: SoundKey) => {
  const now = Date.now();
  const previousPlay = lastPlayedAt[key] ?? 0;

  if (now - previousPlay < SOUND_CONFIGS[key].cooldownMs) {
    return false;
  }

  lastPlayedAt[key] = now;
  return true;
};

const playSoundAsync = async (key: SoundKey) => {
  try {
    const enabled = await getSoundEnabled();

    if (!enabled || !canPlayNow(key)) {
      return;
    }

    const player = getPlayer(key);

    if (!player) {
      return;
    }

    try {
      await player.seekTo(0);
    } catch {
      // no-op: playback can still be attempted after a failed seek
    }

    try {
      player.play();
    } catch {
      // no-op: sound should never break gameplay
    }
  } catch {
    // no-op: missing or unavailable audio must keep haptics/gameplay working
  }
};

const playSound = (key: SoundKey) => {
  // Portão síncrono: se o som já está desligado, nem agenda a reprodução.
  if (soundEnabledCache === false) {
    return;
  }

  playSoundAsync(key).catch(() => undefined);
};

export const releaseSoundPlayers = () => {
  Object.entries(players).forEach(([key, player]) => {
    if (!player) {
      return;
    }

    try {
      player.remove();
      delete players[key as SoundKey];
    } catch {
      // no-op: releasing sound resources is best-effort
    }
  });
};

export const playTapSound = () => playSound('tap');
export const playButtonSound = () => playSound('button');
export const playChestOpenSound = () => playSound('chestOpen');
export const playRewardSparkleSound = () => playSound('rewardSparkle');

/** Um único feedback curto por trinca, sem empilhar voz ou som de clarão. */
export const playTripleSounds = () => {
  if (soundEnabledCache === false) {
    return;
  }

  playSound('match');
};

export const playWhooshSound = () => playSound('whoosh');
export const playConfettiSound = () => playSound('confetti');

/** Uma moeda por vez, escalonadas: soa como moeda caindo, não como um clique só. */
export const playCoinCascade = (count = 3) => {
  if (soundEnabledCache === false) {
    return;
  }

  const total = Math.max(1, Math.min(4, count));

  for (let index = 0; index < total; index += 1) {
    setTimeout(() => playSound('coin'), index * 90);
  }
};

export const playWinSound = () => playSound('win');
export const playLoseSound = () => playSound('lose');
export const playCoinSound = () => playSound('coin');
export const playBlockedSound = () => playSound('blocked');
export const playShopBuySound = () => playSound('shopBuy');
export const playWorldUnlockSound = () => playSound('worldUnlock');

// Aquece o cache síncrono de mute no carregamento do módulo, para que uma
// preferência "desligado" salva numa sessão anterior valha já no primeiro som.
void getSoundEnabled().catch(() => undefined);
