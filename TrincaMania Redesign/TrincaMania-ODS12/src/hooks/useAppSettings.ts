import { useState } from 'react';
import {
  type AppSettings,
  createDefaultSettings,
  getSettings,
  saveSettings,
  setHapticsEnabledPreference,
  setMusicEnabledPreference,
} from '../storage/settingsStorage';
import { setMusicEnabled } from '../utils/music';
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
  const handleToggleMusic = () => {
    const enabled = !settings.musicEnabled;
    setSettings((current) => ({ ...current, musicEnabled: enabled }));
    setMusicEnabled(enabled);
    setMusicEnabledPreference(enabled).catch(() => {
      getSettings()
        .then(setSettings)
        .catch(() => undefined);
    });
  };

  const handleEnableSilentMode = () => {
    const silentSettings = {
      ...settings,
      hapticsEnabled: false,
      soundEnabled: false,
      musicEnabled: false,
    };
    setSettings(silentSettings);
    setMusicEnabled(false);
    setSoundEnabled(false)
      .then(() => saveSettings(silentSettings))
      .catch(() => {
        getSettings()
          .then(setSettings)
          .catch(() => undefined);
      });
  };

  return {
    settings,
    setSettings,
    handleToggleSound,
    handleToggleMusic,
    handleToggleHaptics,
    handleEnableSilentMode,
  };
}
