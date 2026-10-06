import { useState } from 'react';
import {
  type AppSettings,
  createDefaultSettings,
  getSettings,
  setHapticsEnabledPreference,
} from '../storage/settingsStorage';
import { setSoundEnabled } from '../utils/sounds';

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(
    createDefaultSettings(),
  );
  const handleToggleSound = () => {
    const nextSoundEnabled = !settings.soundEnabled;

    setSettings((currentSettings) => ({
      ...currentSettings,
      soundEnabled: nextSoundEnabled,
    }));

    setSoundEnabled(nextSoundEnabled).catch(() => {
      getSettings()
        .then(setSettings)
        .catch(() => undefined);
    });
  };

  const handleToggleHaptics = () => {
    const nextHapticsEnabled = !settings.hapticsEnabled;

    setSettings((currentSettings) => ({
      ...currentSettings,
      hapticsEnabled: nextHapticsEnabled,
    }));

    setHapticsEnabledPreference(nextHapticsEnabled).catch(() => {
      getSettings()
        .then(setSettings)
        .catch(() => undefined);
    });
  };

  const handleEnableSilentMode = () => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      hapticsEnabled: false,
      soundEnabled: false,
    }));

    Promise.all([
      setSoundEnabled(false),
      setHapticsEnabledPreference(false),
    ]).catch(() => {
      getSettings()
        .then(setSettings)
        .catch(() => undefined);
    });
  };

  return {
    settings,
    setSettings,
    handleToggleSound,
    handleToggleHaptics,
    handleEnableSilentMode,
  };
}
