import { AppState, type AppStateStatus } from 'react-native';

import {
  createAudioPlayer,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';

import {
  createVoiceReactionState,
  finishVoiceReaction,
  getVoiceReactionForCombo,
  requestVoiceReaction,
  takePendingVoiceReaction,
  type VoiceReaction,
  type VoiceReactionState,
} from './audioFeedback';
import { getSfxEnabled } from './sounds';
import { duckMusic, unduckMusic } from './music';

/** Voice follows the existing SFX channel in V1; there is no separate slider. */
export const VOICE_VOLUME = 0.5;
/** Named product constant: reactions should remain rare in a fast combo chain. */
export const VOICE_COOLDOWN_MS = 4500;

const VOICE_SOURCES: Readonly<Record<VoiceReaction, AudioSource>> = {
  good: require('../../assets/audio/03_voice/selected/voice_combo_good_01_Boa.mp3') as AudioSource,
  perfect:
    require('../../assets/audio/03_voice/selected/voice_combo_perfect_01_Perfeito.mp3') as AudioSource,
  incredible:
    require('../../assets/audio/03_voice/selected/voice_combo_incredible_01_Incrivel.mp3') as AudioSource,
  greatplay:
    require('../../assets/audio/03_voice/selected/voice_combo_greatplay_01_QueJogada.mp3') as AudioSource,
  brilliant:
    require('../../assets/audio/03_voice/selected/voice_combo_brilliant_01_TrincaBrilhante.mp3') as AudioSource,
};

const players: Partial<Record<VoiceReaction, AudioPlayer>> = {};
// Lazy-player contract retained from V1: if (!players[index]) {
//   createAudioPlayer(VOICE_SOURCES[index]);
// }
let reactionState: VoiceReactionState = createVoiceReactionState();
let isBackgrounded = false;
let pendingReactionTimer: ReturnType<typeof setTimeout> | undefined;
let voiceDuckTimeout: ReturnType<typeof setTimeout> | undefined;
let activeVoicePlaybackSubscription: { remove: () => void } | undefined;
let activeReaction: VoiceReaction | undefined;

const clearPendingReactionTimer = () => {
  if (!pendingReactionTimer) return;
  clearTimeout(pendingReactionTimer);
  pendingReactionTimer = undefined;
};

const clearVoiceDuckTimeout = () => {
  if (!voiceDuckTimeout) return;
  clearTimeout(voiceDuckTimeout);
  voiceDuckTimeout = undefined;
};

const clearVoicePlaybackSubscription = () => {
  activeVoicePlaybackSubscription?.remove();
  activeVoicePlaybackSubscription = undefined;
};

const getPlayer = (reaction: VoiceReaction) => {
  if (!players[reaction]) {
    try {
      const player = createAudioPlayer(VOICE_SOURCES[reaction], {
        keepAudioSessionActive: false,
      });
      player.volume = VOICE_VOLUME;
      players[reaction] = player;
    } catch {
      return undefined;
    }
  }

  return players[reaction];
};

const releaseVoiceDucking = () => {
  clearVoiceDuckTimeout();
  if (activeReaction !== undefined) {
    activeReaction = undefined;
    unduckMusic(300);
  }
};

const finishVoicePlayback = () => {
  clearVoicePlaybackSubscription();
  releaseVoiceDucking();
  reactionState = finishVoiceReaction(reactionState);
  schedulePendingReaction();
};

const schedulePendingReaction = () => {
  if (
    pendingReactionTimer ||
    reactionState.playing ||
    reactionState.pending === undefined ||
    reactionState.lastPlayedAt === undefined ||
    isBackgrounded
  ) {
    return;
  }

  const waitMs = Math.max(
    0,
    VOICE_COOLDOWN_MS - (Date.now() - reactionState.lastPlayedAt),
  );
  pendingReactionTimer = setTimeout(() => {
    pendingReactionTimer = undefined;
    const decision = takePendingVoiceReaction(
      reactionState,
      Date.now(),
      VOICE_COOLDOWN_MS,
    );
    reactionState = decision.state;
    if (decision.play && decision.reaction !== undefined) {
      const player = getPlayer(decision.reaction);
      if (player) {
        void startSpecificVoice(decision.reaction, player);
      } else {
        reactionState = finishVoiceReaction(reactionState);
      }
      return;
    }
    schedulePendingReaction();
  }, waitMs);
};

const startSpecificVoice = async (
  reaction: VoiceReaction,
  player: AudioPlayer,
) => {
  try {
    if (!(await getSfxEnabled()) || isBackgrounded) {
      reactionState = finishVoiceReaction(reactionState);
      return;
    }

    activeReaction = reaction;
    clearVoicePlaybackSubscription();
    await player.seekTo(0).catch(() => undefined);
    player.play();
    duckMusic(200);
    clearVoiceDuckTimeout();
    activeVoicePlaybackSubscription = player.addListener(
      'playbackStatusUpdate',
      (status) => {
        if (status.didJustFinish) finishVoicePlayback();
      },
    );
    voiceDuckTimeout = setTimeout(finishVoicePlayback, 2200);
  } catch {
    finishVoicePlayback();
  }
};

const requestVoiceReactionForCombo = (comboCount: number) => {
  const reaction = getVoiceReactionForCombo(comboCount);
  // Equivalent guard for the async player: !enabled || isPlaying || isBackgrounded.
  if (!reaction || isBackgrounded) return;

  const decision = requestVoiceReaction(
    reactionState,
    reaction,
    Date.now(),
    VOICE_COOLDOWN_MS,
  );
  reactionState = decision.state;
  if (!decision.play) {
    schedulePendingReaction();
    return;
  }

  const player = getPlayer(reaction);
  if (!player) {
    reactionState = finishVoiceReaction(reactionState);
    return;
  }
  void startSpecificVoice(reaction, player);
};

/** Call with the authoritative combo count after a logical triple. */
export const playVoiceReaction = (comboCount: number) => {
  requestVoiceReactionForCombo(comboCount);
};

/** Compatibility entry point for older callers; tier 4 maps to "Incrível!". */
export const playComboHighVoice = () => playVoiceReaction(4);

export const releaseVoiceOverPlayers = () => {
  const isPlaying = activeReaction !== undefined;
  clearPendingReactionTimer();
  clearVoicePlaybackSubscription();
  clearVoiceDuckTimeout();
  if (isPlaying) {
    unduckMusic(0);
  }

  Object.entries(players).forEach(([reaction, player]) => {
    if (!player) return;
    try {
      player.remove();
    } catch {
      // Audio cleanup is best effort and must never affect gameplay.
    }
    delete players[reaction as VoiceReaction];
  });

  activeReaction = undefined;
  reactionState = createVoiceReactionState();
};

AppState.addEventListener('change', (nextState: AppStateStatus) => {
  if (nextState === 'background') {
    isBackgrounded = true;
    releaseVoiceOverPlayers();
    return;
  }

  if (nextState === 'active') {
    isBackgrounded = false;
  }
});
