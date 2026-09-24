import * as Haptics from 'expo-haptics';

import { getHapticsEnabled } from '../storage/settingsStorage';

const runHaptic = (callback: () => Promise<void>) => {
  getHapticsEnabled()
    .then((enabled) => {
      if (enabled) {
        callback().catch(() => undefined);
      }
    })
    .catch(() => undefined);
};

export const lightImpact = () => {
  runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};

export const mediumImpact = () => {
  runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
};

export const successImpact = () => {
  runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
};

export const warningImpact = () => {
  runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );
};
