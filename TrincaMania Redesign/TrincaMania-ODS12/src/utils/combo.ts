export type ComboState = { count: number; lastTripleAt?: number };
export const COMBO_WINDOW_MS = 5000;
export const createComboState = (): ComboState => ({ count: 0 });
export const advanceNaturalCombo = (
  state: ComboState,
  now: number,
): ComboState => ({
  count:
    state.lastTripleAt !== undefined &&
    now - state.lastTripleAt <= COMBO_WINDOW_MS
      ? state.count + 1
      : 1,
  lastTripleAt: now,
});
export const comboLabel = (count: number) =>
  count < 2
    ? ''
    : count === 2
      ? 'Boa sequência!'
      : count === 3
        ? 'Combo perfeito!'
        : count === 4
          ? 'Incrível!'
          : count === 5
            ? 'Que jogada!'
            : 'Trinca brilhante!';
