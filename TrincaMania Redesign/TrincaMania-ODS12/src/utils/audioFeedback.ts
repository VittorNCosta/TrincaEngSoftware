/**
 * Decisões puras do feedback de voz. O contador vem do combo real da partida;
 * este módulo não cria nem altera a mecânica de combo.
 */

export type VoiceReaction =
  'good' | 'perfect' | 'incredible' | 'greatplay' | 'brilliant';

export const VOICE_REACTION_PRIORITY: Readonly<Record<VoiceReaction, number>> =
  {
    good: 1,
    perfect: 2,
    incredible: 3,
    greatplay: 4,
    brilliant: 5,
  };

/**
 * Uma trinca isolada é silenciosa. Os degraus seguintes só aparecem quando o
 * combo já foi formado naturalmente pelo contador autoritativo da partida.
 */
export const getVoiceReactionForCombo = (
  comboCount: number,
): VoiceReaction | undefined => {
  if (comboCount < 2) return undefined;
  if (comboCount === 2) return 'good';
  if (comboCount === 3) return 'perfect';
  if (comboCount === 4) return 'incredible';
  if (comboCount === 5) return 'greatplay';
  return 'brilliant';
};

export type VoiceReactionState = {
  lastPlayedAt?: number;
  pending?: VoiceReaction;
  playing: boolean;
};

export type VoiceReactionDecision = {
  play: boolean;
  reaction?: VoiceReaction;
  state: VoiceReactionState;
};

export const createVoiceReactionState = (): VoiceReactionState => ({
  playing: false,
});

/**
 * Reserva imediatamente o melhor candidato enquanto a voz atual/cooldown
 * estiverem ativos. Isso torna a ordem determinística mesmo com vários
 * eventos chegando no mesmo frame.
 */
export const requestVoiceReaction = (
  state: VoiceReactionState,
  reaction: VoiceReaction,
  now: number,
  cooldownMs: number,
): VoiceReactionDecision => {
  const cooldownElapsed =
    state.lastPlayedAt === undefined || now - state.lastPlayedAt >= cooldownMs;

  if (!state.playing && cooldownElapsed) {
    return {
      play: true,
      reaction,
      state: { lastPlayedAt: now, pending: undefined, playing: true },
    };
  }

  const isBetterPending =
    state.pending === undefined ||
    VOICE_REACTION_PRIORITY[reaction] > VOICE_REACTION_PRIORITY[state.pending];

  return {
    play: false,
    state: isBetterPending ? { ...state, pending: reaction } : state,
  };
};

export const finishVoiceReaction = (
  state: VoiceReactionState,
): VoiceReactionState => ({
  ...state,
  playing: false,
});

/** Retira o melhor candidato quando o cooldown já terminou. */
export const takePendingVoiceReaction = (
  state: VoiceReactionState,
  now: number,
  cooldownMs: number,
): VoiceReactionDecision => {
  if (
    state.playing ||
    state.pending === undefined ||
    state.lastPlayedAt === undefined ||
    now - state.lastPlayedAt < cooldownMs
  ) {
    return { play: false, state };
  }

  const reaction = state.pending;
  const decision = requestVoiceReaction(state, reaction, now, cooldownMs);
  return { ...decision, reaction };
};
