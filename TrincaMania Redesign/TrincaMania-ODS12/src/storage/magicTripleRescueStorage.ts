import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAGIC_TRIPLE_RESCUE_STORAGE_KEY = '@trinca-mania/magic-triple-rescue-v1';
export const MAGIC_TRIPLE_RESCUE_MAX_PROMPTS = 2;

export type MagicTripleRescueState = {
  rescueUsed: boolean;
  tutorialSeenCount: number;
};

export const createInitialMagicTripleRescueState = (): MagicTripleRescueState => ({
  rescueUsed: false,
  tutorialSeenCount: 0,
});

export const normalizeMagicTripleRescueState = (
  state: Partial<MagicTripleRescueState> | undefined,
): MagicTripleRescueState => ({
  rescueUsed: state?.rescueUsed === true,
  tutorialSeenCount:
    typeof state?.tutorialSeenCount === 'number'
      ? Math.max(0, Math.floor(state.tutorialSeenCount))
      : 0,
});

export const markMagicTripleRescueSeen = (
  state: MagicTripleRescueState,
): MagicTripleRescueState =>
  normalizeMagicTripleRescueState({
    ...state,
    tutorialSeenCount: Math.min(
      MAGIC_TRIPLE_RESCUE_MAX_PROMPTS,
      state.tutorialSeenCount + 1,
    ),
  });

export const markMagicTripleRescueUsed = (
  state: MagicTripleRescueState,
): MagicTripleRescueState =>
  normalizeMagicTripleRescueState({
    ...state,
    rescueUsed: true,
    tutorialSeenCount: Math.max(1, state.tutorialSeenCount),
  });

export const loadMagicTripleRescueState = async () => {
  const rawState = await AsyncStorage.getItem(MAGIC_TRIPLE_RESCUE_STORAGE_KEY);

  if (!rawState) {
    return createInitialMagicTripleRescueState();
  }

  try {
    return normalizeMagicTripleRescueState(
      JSON.parse(rawState) as Partial<MagicTripleRescueState>,
    );
  } catch {
    return createInitialMagicTripleRescueState();
  }
};

export const saveMagicTripleRescueState = async (state: MagicTripleRescueState) => {
  const normalizedState = normalizeMagicTripleRescueState(state);
  await AsyncStorage.setItem(
    MAGIC_TRIPLE_RESCUE_STORAGE_KEY,
    JSON.stringify(normalizedState),
  );
  return normalizedState;
};

export const resetMagicTripleRescueState = async () =>
  saveMagicTripleRescueState(createInitialMagicTripleRescueState());
