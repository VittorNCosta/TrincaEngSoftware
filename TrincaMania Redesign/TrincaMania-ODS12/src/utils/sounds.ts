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
import { type WorldId } from '../types/game';

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
type AmbientKey =
  | 'beach'
  | 'celestial'
  | 'crystal'
  | 'forest'
  | 'mountain'
  | 'snow'
  | 'stars'
  | 'volcano';

type AmbientConfig = {
  expectedFile: string;
  source?: AudioSource;
  volume: number;
};

type StopAmbientOptions = {
  fadeMs?: number;
};

type InternalStopAmbientOptions = StopAmbientOptions & {
  keepTarget?: boolean;
  release?: boolean;
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

const ambientSources: Record<AmbientKey, AudioSource | undefined> = {
  beach: require('../../assets/sfx/ambient/ambient_beach.mp3') as AudioSource,
  celestial:
    require('../../assets/sfx/ambient/ambient_celestial.mp3') as AudioSource,
  crystal:
    require('../../assets/sfx/ambient/ambient_crystal.mp3') as AudioSource,
  forest: require('../../assets/sfx/ambient/ambient_forest.mp3') as AudioSource,
  mountain:
    require('../../assets/sfx/ambient/ambient_mountain.mp3') as AudioSource,
  snow: require('../../assets/sfx/ambient/ambient_snow.mp3') as AudioSource,
  stars: require('../../assets/sfx/ambient/ambient_stars.mp3') as AudioSource,
  volcano:
    require('../../assets/sfx/ambient/ambient_volcano.mp3') as AudioSource,
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

export const AMBIENT_VOLUME = 0.12;
// Volume do ambiente durante vitória/baú: o efeito grande precisa de espaço.
export const AMBIENT_DUCK_VOLUME = 0.04;
export const AMBIENT_FADE_MS = 500;

// Expected ambient files. If an asset is ever removed locally, leave its source
// as `undefined` above so the bundle keeps building and the sound becomes a no-op.
const AMBIENT_CONFIGS: Record<AmbientKey, AmbientConfig> = {
  beach: {
    expectedFile: 'assets/sfx/ambient/ambient_beach.mp3',
    source: ambientSources.beach,
    volume: AMBIENT_VOLUME,
  },
  celestial: {
    expectedFile: 'assets/sfx/ambient/ambient_celestial.mp3',
    source: ambientSources.celestial,
    volume: AMBIENT_VOLUME,
  },
  crystal: {
    expectedFile: 'assets/sfx/ambient/ambient_crystal.mp3',
    source: ambientSources.crystal,
    volume: AMBIENT_VOLUME,
  },
  forest: {
    expectedFile: 'assets/sfx/ambient/ambient_forest.mp3',
    source: ambientSources.forest,
    volume: AMBIENT_VOLUME,
  },
  mountain: {
    expectedFile: 'assets/sfx/ambient/ambient_mountain.mp3',
    source: ambientSources.mountain,
    volume: AMBIENT_VOLUME,
  },
  snow: {
    expectedFile: 'assets/sfx/ambient/ambient_snow.mp3',
    source: ambientSources.snow,
    volume: AMBIENT_VOLUME,
  },
  stars: {
    expectedFile: 'assets/sfx/ambient/ambient_stars.mp3',
    source: ambientSources.stars,
    volume: AMBIENT_VOLUME,
  },
  volcano: {
    expectedFile: 'assets/sfx/ambient/ambient_volcano.mp3',
    source: ambientSources.volcano,
    volume: AMBIENT_VOLUME,
  },
};

// Não há áudio novo gerado para os mundos 9 e 10 (mesma lacuna documentada
// para a arte de mapa em CLAUDE.md) — reaproveitam ambientes existentes que
// combinam com o tema de cada mundo (forja industrial / cúpula global).
const AMBIENT_BY_WORLD_ID: Partial<Record<WorldId, AmbientKey>> = {
  1: 'forest',
  2: 'mountain',
  3: 'crystal',
  4: 'beach',
  5: 'volcano',
  6: 'stars',
  7: 'snow',
  8: 'celestial',
  9: 'volcano',
  10: 'celestial',
};

const players: Partial<Record<SoundKey, AudioPlayer>> = {};
const lastPlayedAt: Partial<Record<SoundKey, number>> = {};
let currentAmbientKey: AmbientKey | undefined;
let currentAmbientPlayer: AudioPlayer | undefined;
let currentAmbientFade: ReturnType<typeof setInterval> | undefined;
let desiredAmbientKey: AmbientKey | undefined;

// Espelho síncrono da preferência de som. `getSettings()` é assíncrono, então
// checar o mute só por ele deixava uma janela em que um som (ex.: a trinca) já
// tinha sido agendado antes da leitura resolver. Este cache é atualizado na hora
// em setSoundEnabled e serve de portão imediato em playSound.
let soundEnabledCache: boolean | undefined;

const syncAudioActive = (enabled: boolean) => {
  setIsAudioActiveAsync(enabled).catch(() => undefined);
};

const clearAmbientFade = () => {
  if (!currentAmbientFade) {
    return;
  }

  clearInterval(currentAmbientFade);
  currentAmbientFade = undefined;
};

const fadeAmbientTo = (
  player: AudioPlayer,
  targetVolume: number,
  fadeMs: number,
  onComplete?: () => void,
) => {
  clearAmbientFade();

  if (fadeMs <= 0) {
    player.volume = targetVolume;
    onComplete?.();
    return;
  }

  const startedAt = Date.now();
  const startVolume = player.volume;

  currentAmbientFade = setInterval(() => {
    const progress = Math.min(1, (Date.now() - startedAt) / fadeMs);
    player.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress < 1) {
      return;
    }

    clearAmbientFade();
    onComplete?.();
  }, 50);
};

const stopAmbientPlayback = ({
  fadeMs = AMBIENT_FADE_MS,
  keepTarget = false,
  release = true,
}: InternalStopAmbientOptions = {}) => {
  if (!keepTarget) {
    desiredAmbientKey = undefined;
  }

  const player = currentAmbientPlayer;

  if (!player) {
    clearAmbientFade();
    currentAmbientKey = undefined;
    return;
  }

  const finishStop = () => {
    try {
      player.pause();
      player.seekTo(0).catch(() => undefined);
    } catch {
      // no-op: ambient cleanup must never interrupt gameplay
    }

    if (release) {
      try {
        player.remove();
      } catch {
        // no-op: releasing ambient audio is best-effort
      }
    }

    if (currentAmbientPlayer === player) {
      currentAmbientPlayer = undefined;
      currentAmbientKey = undefined;
    }
  };

  fadeAmbientTo(player, 0, fadeMs, finishStop);
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

export const getAmbientKeyForWorld = (worldId: WorldId) =>
  AMBIENT_BY_WORLD_ID[worldId];

export const getAmbientExpectedFiles = () =>
  Object.entries(AMBIENT_CONFIGS).map(([key, config]) => ({
    file: config.expectedFile,
    key: key as AmbientKey,
    ready: config.source !== undefined,
  }));

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
    stopAmbientPlayback({ fadeMs: 0, keepTarget: true });
  }

  await setSoundEnabledPreference(value);
  syncAudioActive(value);

  if (value && desiredAmbientKey) {
    void playAmbientForKey(desiredAmbientKey);
  }
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

const playAmbientForKey = async (key: AmbientKey) => {
  desiredAmbientKey = key;

  if (soundEnabledCache === false) {
    return;
  }

  const enabled = await getSoundEnabled();

  if (!enabled || desiredAmbientKey !== key) {
    return;
  }

  const config = AMBIENT_CONFIGS[key];

  if (!config.source) {
    stopAmbientPlayback({ fadeMs: 0, keepTarget: true });
    return;
  }

  if (currentAmbientKey === key && currentAmbientPlayer) {
    currentAmbientPlayer.loop = true;

    if (!currentAmbientPlayer.playing) {
      try {
        currentAmbientPlayer.play();
      } catch {
        return;
      }
    }

    fadeAmbientTo(currentAmbientPlayer, config.volume, AMBIENT_FADE_MS);
    return;
  }

  stopAmbientPlayback({ fadeMs: 0, keepTarget: true, release: true });

  try {
    const player = createAudioPlayer(config.source, {
      keepAudioSessionActive: false,
    });
    player.loop = true;
    player.volume = 0;
    currentAmbientKey = key;
    currentAmbientPlayer = player;
    player.play();
    fadeAmbientTo(player, config.volume, AMBIENT_FADE_MS);
  } catch {
    stopAmbientPlayback({ fadeMs: 0, keepTarget: true, release: true });
  }
};

export const playAmbientForWorld = (worldId: WorldId) => {
  const ambientKey = getAmbientKeyForWorld(worldId);

  if (!ambientKey) {
    stopAmbientPlayback();
    return;
  }

  void playAmbientForKey(ambientKey);
};

export const stopAmbientSound = (options?: StopAmbientOptions) => {
  stopAmbientPlayback(options);
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
  stopAmbientPlayback({ fadeMs: 0, release: true });

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

export const duckAmbient = (fadeMs = 300) => {
  if (!currentAmbientPlayer) {
    return;
  }

  fadeAmbientTo(currentAmbientPlayer, AMBIENT_DUCK_VOLUME, fadeMs);
};

export const unduckAmbient = (fadeMs = 400) => {
  if (!currentAmbientPlayer || !currentAmbientKey) {
    return;
  }

  fadeAmbientTo(
    currentAmbientPlayer,
    AMBIENT_CONFIGS[currentAmbientKey].volume,
    fadeMs,
  );
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
