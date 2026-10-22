export const INTRO_MINIMUM_DURATION_MS = 2050;

export type IntroReadiness = {
  appReady: boolean;
  minimumElapsed: boolean;
  hasFinished: boolean;
};

/**
 * The intro can leave as soon as the visual beat has landed and the real app
 * has finished hydrating. Keeping this decision pure makes the startup gate
 * easy to reason about without coupling it to React or timers.
 */
export const shouldFinishIntro = ({
  appReady,
  minimumElapsed,
  hasFinished,
}: IntroReadiness) => appReady && minimumElapsed && !hasFinished;
