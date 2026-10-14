import { AppState, type AppStateStatus } from 'react-native';

import {
  createAudioPlayer,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';

import { releaseSoundPlayers } from './sounds';
import { getMusicEnabled } from '../storage/settingsStorage';
import { type MusicKey, resolveMusicKeyForWorld } from './musicRouting';
import { type WorldId } from '../types/game';

/**
 * A faixa de cada mundo acompanha o mapa e a partida. Mantém dois players
 * durante a troca de mundo para o crossfade e repete a faixa sem silêncio.
 */

export { type MusicKey, resolveMusicKeyForWorld } from './musicRouting';

const WORLD_MUSIC_SOURCES: Partial<Record<WorldId, AudioSource>> = {
  1: require('../../assets/audio/music/world_01.mp3') as AudioSource,
  2: require('../../assets/audio/music/world_02.mp3') as AudioSource,
  3: require('../../assets/audio/music/world_03.mp3') as AudioSource,
  4: require('../../assets/audio/music/world_04.mp3') as AudioSource,
  21: require('../../assets/audio/music/world_21.mp3') as AudioSource,
};

const META_MUSIC_SOURCE =
  require('../../assets/audio/music/menu.mp3') as AudioSource;

export const MUSIC_VOLUME = 0.38;
// Aproximadamente -3 dB em relação ao volume normal: importante o bastante
// para abrir espaço a voz/SFX, sem fazer a música desaparecer.
export const MUSIC_DUCK_VOLUME = 0.27;
export const MUSIC_CROSSFADE_MS = 700;
export const MAP_MUSIC_CHANGE_DELAY_MS = 7000;

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
let musicDuckRequestCount = 0;
let pendingMapMusic: ReturnType<typeof setTimeout> | undefined;

export const cancelPendingMapMusic = () => {
  if (pendingMapMusic) {
    clearTimeout(pendingMapMusic);
    pendingMapMusic = undefined;
  }
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

const startKey = (key: MusicKey) => {
  const source = sourceForKey(key);
  const previousPlayer = activePlayer;
  const previousVolume = previousPlayer?.volume ?? 0;

  removeOutgoing();

  let nextPlayer: AudioPlayer;
  try {
    nextPlayer = createAudioPlayer(source, { keepAudioSessionActive: false });
  } catch {
    return;
  }

  nextPlayer.loop = true;
  nextPlayer.volume = 0;

  try {
    nextPlayer.play();
  } catch {
    // no-op: áudio nunca deve travar o jogo
  }

  activePlayer = nextPlayer;
  activeKey = key;

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
    MUSIC_VOLUME,
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

  musicEnabledCache = await getMusicEnabled();
  return musicEnabledCache;
};

const applyDesiredKey = async (key: MusicKey) => {
  desiredKey = key;

  const enabled = await readMusicEnabled();

  if (!enabled || desiredKey !== key || isBackgrounded) {
    return;
  }

  if (activeKey === key && activePlayer) {
    if (!activePlayer.playing) {
      try {
        activePlayer.play();
      } catch {
        // no-op
      }
    }

    return;
  }

  startKey(key);
};

/** Música das telas gerais: recompensas, poderes, perfil e loja. */
export const playMetaMusic = () => {
  cancelPendingMapMusic();
  void applyDesiredKey('meta');
};

/** Música compartilhada pelo mapa de um mundo e suas partidas. */
export const playWorldMusic = (worldId: WorldId) => {
  cancelPendingMapMusic();
  void applyDesiredKey(resolveMusicKeyForWorld(worldId));
};

/** Aguarda a escolha estabilizar antes de trocar a faixa ao navegar no mapa. */
export const playMapMusic = (worldId: WorldId) => {
  cancelPendingMapMusic();
  const key = resolveMusicKeyForWorld(worldId);

  if (!activePlayer || activeKey === 'meta' || activeKey === key) {
    void applyDesiredKey(key);
    return;
  }

  pendingMapMusic = setTimeout(() => {
    pendingMapMusic = undefined;
    void applyDesiredKey(key);
  }, MAP_MUSIC_CHANGE_DELAY_MS);
};

export const getActiveMusicKey = () => activeKey;

/** Reduz o volume sem parar — para vitória/derrota/recompensa/"pausa" de fase. */
export const duckMusic = (fadeMs = 300) => {
  if (!activePlayer) {
    return false;
  }

  musicDuckRequestCount += 1;

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
  // Atualiza o cache antes de qualquer trabalho assÃ­ncrono para que o toggle
  // seja imediato mesmo enquanto a preferÃªncia persistida ainda estÃ¡ gravando.
  musicEnabledCache = enabled;

  if (!enabled) {
    musicDuckRequestCount = 0;
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
    void applyDesiredKey(desiredKey);
  }
};

export const releaseMusicPlayer = () => {
  cancelPendingMapMusic();
  musicDuckRequestCount = 0;
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
// Inactive (interrupção transitória, ex. notificação) não dispara nada.
const handleAppStateChange = (nextState: AppStateStatus) => {
  if (nextState === 'background') {
    isBackgrounded = true;
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
      void applyDesiredKey(desiredKey);
    }
  }
};

AppState.addEventListener('change', handleAppStateChange);
