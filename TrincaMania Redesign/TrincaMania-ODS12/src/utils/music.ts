import { AppState, Platform, type AppStateStatus } from 'react-native';

import {
  createAudioPlayer,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';

import { releaseSoundPlayers } from './sounds';
import { getMusicEnabled } from '../storage/settingsStorage';
import { type MusicKey, resolveMusicKeyForWorld } from './musicRouting';
import { type WorldId } from '../types/game';

/**
 * Música de metajogo (fora de partida) + música temática por mundo, com
 * crossfade entre as duas camadas. Espelha o padrão já usado para o ambiente
 * de fundo em sounds.ts (fade por interval), mas mantém dois players vivos
 * durante a transição para um crossfade real (sobreposto). Cada faixa termina
 * de verdade e o próximo ciclo entra depois de um pequeno respiro.
 */

export { type MusicKey, resolveMusicKeyForWorld } from './musicRouting';

const WORLD_MUSIC_SOURCES: Partial<Record<WorldId, AudioSource>> = {
  1: require('../../assets/audio/music/world_01.mp3') as AudioSource,
  2: require('../../assets/audio/music/world_02.mp3') as AudioSource,
  3: require('../../assets/audio/music/world_03.mp3') as AudioSource,
  21: require('../../assets/audio/music/world_21.mp3') as AudioSource,
};

const META_MUSIC_SOURCE =
  require('../../assets/audio/music/menu.mp3') as AudioSource;

export const MUSIC_VOLUME = 0.38;
// Aproximadamente -3 dB em relação ao volume normal: importante o bastante
// para abrir espaço a voz/SFX, sem fazer a música desaparecer.
export const MUSIC_DUCK_VOLUME = 0.27;
export const MUSIC_CROSSFADE_MS = 700;
// Respiro moderado entre faixas: preserva ambiente/SFX sem deixar o mapa
// parecer silencioso por tempo excessivo.
export const MUSIC_GAP_MS = 4200;

const sourceForKey = (key: MusicKey): AudioSource =>
  key === 'meta'
    ? META_MUSIC_SOURCE
    : (WORLD_MUSIC_SOURCES[key] ?? META_MUSIC_SOURCE);

type FadeHandle = ReturnType<typeof setInterval>;

let activePlayer: AudioPlayer | undefined;
let activeKey: MusicKey | undefined;
let outgoingPlayer: AudioPlayer | undefined;
let outgoingFade: FadeHandle | undefined;
let incomingFade: FadeHandle | undefined;
let desiredKey: MusicKey | undefined;
let musicEnabledCache: boolean | undefined;
let isBackgrounded = false;
let requestGeneration = 0;
let lifecycleDisposed = false;
let musicRestartTimer: ReturnType<typeof setTimeout> | undefined;
let musicRestartGeneration = 0;
let musicRestartInFlightGeneration: number | undefined;
let activePlaybackSubscription: { remove: () => void } | undefined;
let musicDuckRequestCount = 0;

const clearMusicRestartTimer = () => {
  if (!musicRestartTimer) {
    return;
  }

  clearTimeout(musicRestartTimer);
  musicRestartTimer = undefined;
};

const invalidateMusicRestart = () => {
  musicRestartGeneration += 1;
  musicRestartInFlightGeneration = undefined;
  clearMusicRestartTimer();
};

const clearActivePlaybackSubscription = () => {
  activePlaybackSubscription?.remove();
  activePlaybackSubscription = undefined;
};

const clearOutgoingFade = () => {
  if (!outgoingFade) {
    return;
  }

  clearInterval(outgoingFade);
  outgoingFade = undefined;
};

const clearIncomingFade = () => {
  if (!incomingFade) {
    return;
  }

  clearInterval(incomingFade);
  incomingFade = undefined;
};

const fadeVolume = (
  player: AudioPlayer,
  from: number,
  to: number,
  durationMs: number,
  registerHandle: (handle: FadeHandle) => void,
  onDone: () => void,
) => {
  if (durationMs <= 0) {
    try {
      player.volume = to;
    } catch {
      // no-op: player pode já ter sido removido
    }

    onDone();
    return;
  }

  const startedAt = Date.now();
  const handle: FadeHandle = setInterval(() => {
    const progress = Math.min(1, (Date.now() - startedAt) / durationMs);

    try {
      player.volume = from + (to - from) * progress;
    } catch {
      // no-op: player pode já ter sido removido
    }

    if (progress < 1) {
      return;
    }

    clearInterval(handle);
    onDone();
  }, 50);

  registerHandle(handle);
};

const removeOutgoing = () => {
  clearOutgoingFade();

  if (!outgoingPlayer) {
    return;
  }

  const player = outgoingPlayer;
  outgoingPlayer = undefined;

  try {
    player.pause();
    player.remove();
  } catch {
    // no-op: cleanup best-effort, nunca deve interromper o jogo
  }
};

const isMusicRestartCurrent = (
  player: AudioPlayer,
  key: MusicKey,
  generation: number,
) =>
  generation === musicRestartGeneration &&
  musicEnabledCache !== false &&
  !isBackgrounded &&
  desiredKey === key &&
  activePlayer === player &&
  activeKey === key;

const scheduleMusicRestart = (player: AudioPlayer, key: MusicKey) => {
  const generation = musicRestartGeneration;
  if (
    musicRestartTimer ||
    musicRestartInFlightGeneration === generation ||
    musicEnabledCache === false ||
    isBackgrounded ||
    desiredKey !== key ||
    activePlayer !== player ||
    activeKey !== key
  ) {
    return;
  }

  const timer = setTimeout(async () => {
    if (musicRestartTimer === timer) {
      musicRestartTimer = undefined;
    }

    if (!isMusicRestartCurrent(player, key, generation)) {
      return;
    }

    musicRestartInFlightGeneration = generation;
    try {
      await player.seekTo(0);

      if (!isMusicRestartCurrent(player, key, generation)) {
        return;
      }

      player.volume = 0;
      player.play();
    } catch {
      return;
    } finally {
      if (musicRestartInFlightGeneration === generation) {
        musicRestartInFlightGeneration = undefined;
      }
    }

    clearIncomingFade();
    fadeVolume(
      player,
      0,
      musicDuckRequestCount > 0 ? MUSIC_DUCK_VOLUME : MUSIC_VOLUME,
      MUSIC_CROSSFADE_MS,
      (handle) => {
        incomingFade = handle;
      },
      () => undefined,
    );
  }, MUSIC_GAP_MS);
  musicRestartTimer = timer;
};

const startKey = (key: MusicKey) => {
  const source = sourceForKey(key);
  const previousPlayer = activePlayer;
  const previousVolume = previousPlayer?.volume ?? 0;

  invalidateMusicRestart();
  clearActivePlaybackSubscription();
  removeOutgoing();

  let nextPlayer: AudioPlayer;
  try {
    nextPlayer = createAudioPlayer(source, { keepAudioSessionActive: false });
  } catch {
    return;
  }

  // A faixa termina de verdade; o listener abaixo agenda o próximo ciclo com
  // respiro, em vez de deixar o player reiniciar imediatamente em loop.
  nextPlayer.loop = false;
  nextPlayer.volume = 0;

  try {
    nextPlayer.play();
  } catch {
    // no-op: áudio nunca deve travar o jogo
  }

  activePlayer = nextPlayer;
  activeKey = key;
  activePlaybackSubscription = nextPlayer.addListener(
    'playbackStatusUpdate',
    (status) => {
      if (status.didJustFinish) {
        scheduleMusicRestart(nextPlayer, key);
      }
    },
  );

  if (previousPlayer) {
    outgoingPlayer = previousPlayer;
    fadeVolume(
      previousPlayer,
      previousVolume,
      0,
      MUSIC_CROSSFADE_MS,
      (handle) => {
        outgoingFade = handle;
      },
      () => {
        if (outgoingPlayer === previousPlayer) {
          removeOutgoing();
        }
      },
    );
  }

  clearIncomingFade();
  fadeVolume(
    nextPlayer,
    0,
    musicDuckRequestCount > 0 ? MUSIC_DUCK_VOLUME : MUSIC_VOLUME,
    MUSIC_CROSSFADE_MS,
    (handle) => {
      incomingFade = handle;
    },
    () => undefined,
  );
};

const readMusicEnabled = async () => {
  if (musicEnabledCache !== undefined) {
    return musicEnabledCache;
  }

  const persistedEnabled = await getMusicEnabled();
  if (musicEnabledCache === undefined) musicEnabledCache = persistedEnabled;
  return musicEnabledCache;
};

const applyDesiredKey = async (key: MusicKey) => {
  if (lifecycleDisposed) return;
  if (desiredKey !== key) requestGeneration += 1;
  desiredKey = key;

  if (activeKey !== key) {
    invalidateMusicRestart();
  }

  const generation = requestGeneration;
  const enabled = await readMusicEnabled();

  if (
    !enabled ||
    musicEnabledCache === false ||
    desiredKey !== key ||
    isBackgrounded ||
    generation !== requestGeneration
  ) {
    return;
  }

  if (musicRestartTimer) {
    return;
  }

  if (activeKey === key && activePlayer) {
    if (!activePlayer.playing) {
      try {
        activePlayer.play();
        clearIncomingFade();
        fadeVolume(
          activePlayer,
          activePlayer.volume,
          musicDuckRequestCount > 0 ? MUSIC_DUCK_VOLUME : MUSIC_VOLUME,
          MUSIC_CROSSFADE_MS,
          (handle) => {
            incomingFade = handle;
          },
          () => undefined,
        );
      } catch {
        // no-op
      }
    }

    return;
  }

  await setIsAudioActiveAsync(true).catch(() => undefined);
  if (generation !== requestGeneration || isBackgrounded || desiredKey !== key)
    return;
  if (activeKey !== key || !activePlayer) startKey(key);
};

/** Música de metajogo: mapa, recompensas, poderes, perfil, loja, modais. */
export const playMetaMusic = () => {
  void applyDesiredKey('meta').catch(() => undefined);
};

/** Música de partida: trilha do mundo, ou MusicaPadrao se o mundo não tiver uma. */
export const playWorldMusic = (worldId: WorldId) => {
  void applyDesiredKey(resolveMusicKeyForWorld(worldId)).catch(() => undefined);
};

export const getActiveMusicKey = () => activeKey;

/** Reduz o volume sem parar — para vitória/derrota/recompensa/"pausa" de fase. */
export const duckMusic = (fadeMs = 300) => {
  musicDuckRequestCount += 1;
  if (!activePlayer) return true;

  clearIncomingFade();
  fadeVolume(
    activePlayer,
    activePlayer.volume,
    MUSIC_DUCK_VOLUME,
    fadeMs,
    (handle) => {
      incomingFade = handle;
    },
    () => undefined,
  );
  return true;
};

/** Restaura o volume normal depois de um duckMusic. */
export const unduckMusic = (fadeMs = 400) => {
  musicDuckRequestCount = Math.max(0, musicDuckRequestCount - 1);
  if (musicDuckRequestCount > 0) {
    return;
  }

  if (!activePlayer) {
    return;
  }

  clearIncomingFade();
  fadeVolume(
    activePlayer,
    activePlayer.volume,
    MUSIC_VOLUME,
    fadeMs,
    (handle) => {
      incomingFade = handle;
    },
    () => undefined,
  );
};

/** Chamar depois de alternar a preferência de som (App.tsx) para acompanhar o toggle. */
export const setMusicEnabled = (enabled: boolean) => {
  // Atualiza o cache antes de qualquer trabalho assíncrono para que o toggle
  // seja imediato mesmo enquanto a preferência persistida ainda está gravando.
  musicEnabledCache = enabled;
  requestGeneration += 1;

  if (!enabled) {
    invalidateMusicRestart();
    clearIncomingFade();
    if (activePlayer) {
      try {
        activePlayer.pause();
      } catch {
        // no-op
      }
    }

    removeOutgoing();
    return;
  }

  if (desiredKey) {
    void applyDesiredKey(desiredKey).catch(() => undefined);
  }
};

export const releaseMusicPlayer = () => {
  requestGeneration += 1;
  desiredKey = undefined;
  musicDuckRequestCount = 0;
  invalidateMusicRestart();
  clearActivePlaybackSubscription();
  clearIncomingFade();
  removeOutgoing();

  if (!activePlayer) {
    return;
  }

  const player = activePlayer;
  activePlayer = undefined;
  activeKey = undefined;

  try {
    player.pause();
    player.remove();
  } catch {
    // no-op: liberar áudio é best-effort
  }
};

// Background: pausa (mantém posição, não reinicia) e libera os players de SFX
// (sounds.ts) — são leves e recriar no próximo foreground é barato; é o ponto
// de vida real sugerido no design-spec para conectar releaseSoundPlayers.
// Interrupções e segundo plano pausam a trilha sem alterar a preferência.
const handleAppStateChange = (nextState: AppStateStatus) => {
  if (nextState === 'background' || nextState === 'inactive') {
    requestGeneration += 1;
    isBackgrounded = true;
    invalidateMusicRestart();
    clearIncomingFade();

    if (activePlayer) {
      try {
        activePlayer.pause();
      } catch {
        // no-op
      }
    }

    removeOutgoing();
    releaseSoundPlayers();
    return;
  }

  if (nextState === 'active' && isBackgrounded) {
    isBackgrounded = false;

    if (desiredKey) {
      void applyDesiredKey(desiredKey).catch(() => undefined);
    }
  }
};

/** Registra os listeners no ciclo do App e libera áudio ao encerrar. */
export const installMusicLifecycle = () => {
  lifecycleDisposed = false;
  isBackgrounded =
    AppState.currentState === 'background' ||
    AppState.currentState === 'inactive';
  const subscription = AppState.addEventListener(
    'change',
    handleAppStateChange,
  );
  // O navegador pode bloquear autoplay. O primeiro toque/tecla retoma a
  // faixa dentro do gesto do usuário, sem painel extra ou reiniciar a música.
  const resumeOnInteraction = () => {
    if (
      isBackgrounded ||
      musicEnabledCache !== true ||
      !desiredKey ||
      musicRestartTimer
    )
      return;
    if (activePlayer && activeKey === desiredKey) {
      if (!activePlayer.playing) {
        try {
          activePlayer.play();
        } catch {
          /* O áudio não bloqueia o jogo. */
        }
      }
    } else {
      void applyDesiredKey(desiredKey).catch(() => undefined);
    }
  };
  const onPageHide = () => handleAppStateChange('background');
  const onPageShow = () => handleAppStateChange('active');
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.addEventListener('pointerdown', resumeOnInteraction);
    document.addEventListener('keydown', resumeOnInteraction);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
  }
  return () => {
    lifecycleDisposed = true;
    subscription.remove();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', resumeOnInteraction);
      document.removeEventListener('keydown', resumeOnInteraction);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    }
    releaseMusicPlayer();
    releaseSoundPlayers();
  };
};
