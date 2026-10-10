import {
  createAudioPlayer,
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
  | 'combo2'
  | 'combo3'
  | 'comboHigh'
  | 'confetti'
  | 'lose'
  | 'portalOpen'
  | 'powerCollect'
  | 'powerExtraSlot'
  | 'powerPurchase'
  | 'powerShuffle'
  | 'powerUndo'
  | 'rewardCollect'
  | 'rewardSparkle'
  | 'rewardCoin'
  | 'shopBuy'
  | 'starReveal1'
  | 'starReveal2'
  | 'starReveal3'
  | 'win'
  | 'worldUnlock';

type SoundConfig = {
  cooldownMs: number;
  source?: AudioSource;
  volume: number;
};

/** Mixagem central: efeitos sobem juntos, sem permitir volume de player acima de 0.8. */
export const SFX_MASTER_GAIN = 1.1;
export const SFX_MAX_VOLUME = 0.8;

const getMixedSfxVolume = (volume: number) =>
  Math.min(SFX_MAX_VOLUME, volume * SFX_MASTER_GAIN);

// Migração para assets/audio/sfx/: win/lose/chestOpen/worldUnlock passam a
// tocar os arquivos novos (mesma chave, mesmo call site — troca só a fonte).
// tap.mp3/whoosh.wav/match.mp3 (assets/sfx/) saem de uso: os eventos que eles
// serviam (tile_arrive, tile_fly, match) migram para VARIANT_SOUND_CONFIGS
// abaixo, com variantes reais. Os arquivos antigos continuam no disco.
const soundSources: Record<SoundKey, AudioSource | undefined> = {
  blocked: require('../../assets/sfx/blocked.mp3') as AudioSource,
  button: require('../../assets/sfx/button.mp3') as AudioSource,
  chestOpen: require('../../assets/audio/sfx/chest_open.mp3') as AudioSource,
  coin: require('../../assets/sfx/coin.mp3') as AudioSource,
  combo2: require('../../assets/audio/sfx/combo_02.mp3') as AudioSource,
  combo3: require('../../assets/audio/sfx/combo_03.mp3') as AudioSource,
  comboHigh: require('../../assets/audio/sfx/combo_high.mp3') as AudioSource,
  confetti: require('../../assets/sfx/confetti.wav') as AudioSource,
  lose: require('../../assets/audio/sfx/defeat_jingle.mp3') as AudioSource,
  portalOpen: require('../../assets/audio/sfx/portal_open.mp3') as AudioSource,
  powerCollect:
    require('../../assets/audio/sfx/power_collect.mp3') as AudioSource,
  powerExtraSlot:
    require('../../assets/audio/sfx/power_extra_slot.mp3') as AudioSource,
  powerPurchase:
    require('../../assets/audio/sfx/power_purchase.mp3') as AudioSource,
  powerShuffle:
    require('../../assets/audio/sfx/power_shuffle.mp3') as AudioSource,
  powerUndo: require('../../assets/audio/sfx/power_undo.mp3') as AudioSource,
  rewardCollect:
    require('../../assets/audio/sfx/reward_collect.mp3') as AudioSource,
  rewardSparkle:
    require('../../assets/sfx/voice/reward_sparkle.mp3') as AudioSource,
  rewardCoin: require('../../assets/audio/sfx/coin_reward.mp3') as AudioSource,
  shopBuy: require('../../assets/sfx/shop_buy.mp3') as AudioSource,
  starReveal1:
    require('../../assets/audio/sfx/star_reveal1.mp3') as AudioSource,
  starReveal2:
    require('../../assets/audio/sfx/star_reveal2.mp3') as AudioSource,
  starReveal3:
    require('../../assets/audio/sfx/star_reveal3.mp3') as AudioSource,
  win: require('../../assets/audio/sfx/victory_jingle.mp3') as AudioSource,
  worldUnlock:
    require('../../assets/audio/sfx/world_unlock.mp3') as AudioSource,
};

// Arquivos originais preservados como alternativa se o player de um jingle novo falhar.
const legacyResultSources: Partial<Record<SoundKey, AudioSource>> = {
  lose: require('../../assets/sfx/lose.mp3') as AudioSource,
  win: require('../../assets/sfx/win.mp3') as AudioSource,
};

// Fontes `undefined` continuam sendo no-op em tempo de execução — é a rede de
// segurança caso algum arquivo seja removido da pasta no futuro.
const SOUND_CONFIGS: Record<SoundKey, SoundConfig> = {
  // 750ms engolia a segunda tentativa na mesma peça: 300 responde a cada toque.
  blocked: { cooldownMs: 300, source: soundSources.blocked, volume: 0.32 },
  button: { cooldownMs: 80, source: soundSources.button, volume: 0.34 },
  chestOpen: { cooldownMs: 900, source: soundSources.chestOpen, volume: 0.42 },
  // 90ms permite a cascata de 3 moedas de S5.
  coin: { cooldownMs: 90, source: soundSources.coin, volume: 0.4 },
  combo2: { cooldownMs: 200, source: soundSources.combo2, volume: 0.5 },
  combo3: { cooldownMs: 200, source: soundSources.combo3, volume: 0.56 },
  comboHigh: { cooldownMs: 200, source: soundSources.comboHigh, volume: 0.62 },
  confetti: { cooldownMs: 900, source: soundSources.confetti, volume: 0.34 },
  lose: { cooldownMs: 700, source: soundSources.lose, volume: 0.5 },
  portalOpen: { cooldownMs: 900, source: soundSources.portalOpen, volume: 0.5 },
  powerCollect: {
    cooldownMs: 450,
    source: soundSources.powerCollect,
    volume: 0.46,
  },
  powerExtraSlot: {
    cooldownMs: 500,
    source: soundSources.powerExtraSlot,
    volume: 0.46,
  },
  powerPurchase: {
    cooldownMs: 500,
    source: soundSources.powerPurchase,
    volume: 0.46,
  },
  powerShuffle: {
    cooldownMs: 300,
    source: soundSources.powerShuffle,
    volume: 0.4,
  },
  powerUndo: { cooldownMs: 300, source: soundSources.powerUndo, volume: 0.4 },
  rewardCollect: {
    cooldownMs: 700,
    source: soundSources.rewardCollect,
    volume: 0.46,
  },
  // A voz de recompensa fica abaixo dos efeitos principais para não dominar a mixagem.
  rewardSparkle: {
    cooldownMs: 700,
    source: soundSources.rewardSparkle,
    volume: 0.22,
  },
  rewardCoin: {
    cooldownMs: 600,
    source: soundSources.rewardCoin,
    volume: 0.42,
  },
  shopBuy: { cooldownMs: 450, source: soundSources.shopBuy, volume: 0.46 },
  starReveal1: {
    cooldownMs: 100,
    source: soundSources.starReveal1,
    volume: 0.4,
  },
  starReveal2: {
    cooldownMs: 100,
    source: soundSources.starReveal2,
    volume: 0.44,
  },
  starReveal3: {
    cooldownMs: 100,
    source: soundSources.starReveal3,
    volume: 0.48,
  },
  win: { cooldownMs: 700, source: soundSources.win, volume: 0.56 },
  worldUnlock: {
    cooldownMs: 900,
    source: soundSources.worldUnlock,
    volume: 0.54,
  },
};

type VariantSoundKey = 'match' | 'tileArrive' | 'tileFly' | 'tileSelect';

type VariantSoundConfig = {
  cooldownMs: number;
  sources: AudioSource[];
  volume: number;
};

// tile_arrive_02.mp3 está confirmadamente ausente do pacote — só 2 variantes
// para esse evento até o arquivo existir (ver docs/design-spec.md).
const VARIANT_SOUND_CONFIGS: Record<VariantSoundKey, VariantSoundConfig> = {
  match: {
    cooldownMs: 180,
    // match_03 é o asset curto e definido escolhido para a trinca normal.
    // Os combos têm sua própria hierarquia e não tocam junto com este evento.
    sources: [require('../../assets/audio/sfx/match_03.mp3') as AudioSource],
    volume: 0.52,
  },
  tileArrive: {
    cooldownMs: 90,
    sources: [
      require('../../assets/audio/sfx/tile_arrive_01.mp3') as AudioSource,
      require('../../assets/audio/sfx/tile_arrive_03.mp3') as AudioSource,
    ],
    volume: 0.26,
  },
  tileFly: {
    cooldownMs: 60,
    sources: [
      require('../../assets/audio/sfx/tile_fly_01.mp3') as AudioSource,
      require('../../assets/audio/sfx/tile_fly_02.mp3') as AudioSource,
    ],
    volume: 0.16,
  },
  tileSelect: {
    cooldownMs: 55,
    sources: [
      require('../../assets/audio/sfx/tile_select_01.mp3') as AudioSource,
      require('../../assets/audio/sfx/tile_select_02.mp3') as AudioSource,
      require('../../assets/audio/sfx/tile_select_03.mp3') as AudioSource,
    ],
    volume: 0.2,
  },
};

const players: Partial<Record<SoundKey, AudioPlayer>> = {};
const lastPlayedAt: Partial<Record<SoundKey, number>> = {};
// Um player por variante (não por evento): a mesma faixa fica em cache depois
// da primeira vez que sorteia aquele índice, sem precisar de N players ociosos
// criados de antemão.
const variantPlayers: Partial<Record<string, AudioPlayer>> = {};
const lastVariantPlayedAt: Partial<Record<VariantSoundKey, number>> = {};

// Espelho síncrono da preferência de som. `getSettings()` é assíncrono, então
// checar o mute só por ele deixava uma janela em que um som (ex.: a trinca) já
// tinha sido agendado antes da leitura resolver. Este cache é atualizado na hora
// em setSoundEnabled e serve de portão imediato em playSound.
let sfxEnabledCache: boolean | undefined;
const pendingCoinCascadeTimers = new Set<ReturnType<typeof setTimeout>>();

const clearCoinCascadeTimers = () => {
  pendingCoinCascadeTimers.forEach((timer) => clearTimeout(timer));
  pendingCoinCascadeTimers.clear();
};

const stopAllPlayers = () => {
  [...Object.values(players), ...Object.values(variantPlayers)].forEach(
    (player) => {
      if (!player) {
        return;
      }

      try {
        player.pause();
        player.seekTo(0).catch(() => undefined);
      } catch {
        // no-op: disabling sound should never interrupt gameplay
      }
    },
  );
};

export const getSfxEnabled = async () => {
  if (sfxEnabledCache !== undefined) {
    return sfxEnabledCache;
  }

  const settings = await getSettings();
  sfxEnabledCache = settings.soundEnabled;
  return settings.soundEnabled;
};

export const setSfxEnabled = async (value: boolean) => {
  // Atualiza o cache síncrono ANTES do await: o mute vale a partir de já.
  sfxEnabledCache = value;

  if (!value) {
    clearCoinCascadeTimers();
    stopAllPlayers();
  }

  await setSoundEnabledPreference(value);
};

export const toggleSfxEnabled = async () => {
  const currentValue = await getSfxEnabled();
  const nextValue = !currentValue;

  await setSfxEnabled(nextValue);

  return nextValue;
};

const getPlayer = (key: SoundKey) => {
  const config = SOUND_CONFIGS[key];

  if (!config.source) {
    return undefined;
  }

  if (!players[key]) {
    try {
      const player = createAudioPlayer(config.source, {
        keepAudioSessionActive: false,
      });
      player.volume = getMixedSfxVolume(config.volume);
      players[key] = player;
    } catch {
      const fallback = legacyResultSources[key];
      if (!fallback) return undefined;
      try {
        const player = createAudioPlayer(fallback, {
          keepAudioSessionActive: false,
        });
        player.volume = getMixedSfxVolume(config.volume);
        players[key] = player;
      } catch {
        return undefined;
      }
    }
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

const getVariantPlayer = (key: VariantSoundKey, index: number) => {
  const source = VARIANT_SOUND_CONFIGS[key].sources[index];

  if (!source) {
    return undefined;
  }

  const cacheKey = `${key}:${index}`;

  if (!variantPlayers[cacheKey]) {
    try {
      const player = createAudioPlayer(source, {
        keepAudioSessionActive: false,
      });
      player.volume = getMixedSfxVolume(VARIANT_SOUND_CONFIGS[key].volume);
      variantPlayers[cacheKey] = player;
    } catch {
      return undefined;
    }
  }

  return variantPlayers[cacheKey];
};

const canPlayVariantNow = (key: VariantSoundKey) => {
  const now = Date.now();
  const previousPlay = lastVariantPlayedAt[key] ?? 0;

  if (now - previousPlay < VARIANT_SOUND_CONFIGS[key].cooldownMs) {
    return false;
  }

  lastVariantPlayedAt[key] = now;
  return true;
};

const playVariantSoundAsync = async (key: VariantSoundKey) => {
  try {
    const enabled = await getSfxEnabled();

    if (!enabled || !canPlayVariantNow(key)) {
      return;
    }

    const sources = VARIANT_SOUND_CONFIGS[key].sources;

    if (sources.length === 0) {
      return;
    }

    const index = Math.floor(Math.random() * sources.length);
    const player = getVariantPlayer(key, index);

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

const playVariantSound = (key: VariantSoundKey) => {
  if (sfxEnabledCache === false) {
    return;
  }

  playVariantSoundAsync(key).catch(() => undefined);
};

const playSoundAsync = async (key: SoundKey) => {
  try {
    const enabled = await getSfxEnabled();

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
  if (sfxEnabledCache === false) {
    return;
  }

  playSoundAsync(key).catch(() => undefined);
};

export const releaseSoundPlayers = () => {
  clearCoinCascadeTimers();

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

  Object.entries(variantPlayers).forEach(([cacheKey, player]) => {
    if (!player) {
      return;
    }

    try {
      player.remove();
      delete variantPlayers[cacheKey];
    } catch {
      // no-op: releasing sound resources is best-effort
    }
  });
};

export const playButtonSound = () => playSound('button');
export const playChestOpenSound = () => playSound('chestOpen');
export const playRewardSparkleSound = () => playSound('rewardSparkle');
export const playPowerUndoSound = () => playSound('powerUndo');
export const playPowerShuffleSound = () => playSound('powerShuffle');
export const playPowerCollectSound = () => playSound('powerCollect');
export const playPowerExtraSlotSound = () => playSound('powerExtraSlot');
export const playPowerPurchaseSound = () => playSound('powerPurchase');

/** Toque aceito de peça — antes de qualquer voo/animação. */
export const playTileSelectSound = () => playVariantSound('tileSelect');
/** Peça começou a voar até a bandeja. */
export const playTileFlySound = () => playVariantSound('tileFly');
/** Peça chegou na bandeja sem formar trinca. */
export const playTileArriveSound = () => playVariantSound('tileArrive');
export const playTapSound = playTileArriveSound;
export const playWhooshSound = () => playVariantSound('tileFly');

/** Um único feedback curto por trinca, sem empilhar voz ou som de clarão. */
export const playTripleSounds = () => {
  if (sfxEnabledCache === false) {
    return;
  }

  playVariantSound('match');
};

export const playConfettiSound = () => playSound('confetti');

/** Uma moeda por vez, escalonadas: soa como moeda caindo, não como um clique só. */
export const playCoinCascade = (count = 3) => {
  if (sfxEnabledCache === false) {
    return;
  }

  const total = Math.max(1, Math.min(4, count));

  for (let index = 0; index < total; index += 1) {
    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(() => {
      pendingCoinCascadeTimers.delete(timer);
      playSound('coin');
    }, index * 90);
    pendingCoinCascadeTimers.add(timer);
  }
};

export const playWinSound = () => playSound('win');
export const playLoseSound = () => playSound('lose');
export const playCoinSound = () => playSound('coin');
export const playRewardCoinSound = () => playSound('rewardCoin');
export const playBlockedSound = () => playSound('blocked');
export const playShopBuySound = () => playSound('shopBuy');
export const playWorldUnlockSound = () => playSound('worldUnlock');
export const playPortalOpenSound = () => playSound('portalOpen');
export const playRewardCollectSound = () => playSound('rewardCollect');

/** `starIndex` é 1/2/3 — a ordem em que a estrela aparece no ResultModal. */
export const playStarRevealSound = (starIndex: 1 | 2 | 3) => {
  if (starIndex === 1) {
    playSound('starReveal1');
    return;
  }

  if (starIndex === 2) {
    playSound('starReveal2');
    return;
  }

  playSound('starReveal3');
};

// Reservado para o sistema de combo (ver docs/design-spec.md, seção Combo) —
// substituem playTripleSounds() por tier, nunca tocam junto com ele.
export const playCombo2Sound = () => playSound('combo2');
export const playCombo3Sound = () => playSound('combo3');
export const playComboHighSound = () => playSound('comboHigh');

// Aquece o cache síncrono de mute no carregamento do módulo, para que uma
// preferência "desligado" salva numa sessão anterior valha já no primeiro som.
void getSfxEnabled().catch(() => undefined);

/** Compatibility bridge for the old combined sound API. */
export const getSoundEnabled = getSfxEnabled;
export const setSoundEnabled = setSfxEnabled;
export const toggleSoundEnabled = toggleSfxEnabled;
