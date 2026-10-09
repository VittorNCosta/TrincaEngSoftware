import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  type AppSettings,
  createDefaultSettings,
  getSettings,
  setHapticsEnabledPreference,
} from '../storage/settingsStorage';
import { setSoundEnabled } from '../utils/sounds';

export function useAppSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(
    createDefaultSettings(),
  );
  const settingsRef = useRef(settings);
  const settingsVersionRef = useRef(0);
  const setSettings = useCallback<Dispatch<SetStateAction<AppSettings>>>(
    (update) => {
      const nextSettings =
        typeof update === 'function' ? update(settingsRef.current) : update;
      settingsRef.current = nextSettings;
      settingsVersionRef.current += 1;
      setSettingsState(nextSettings);
    },
    [],
  );
  const recoverSettings = (version: number) => () => {
    getSettings()
      .then((storedSettings) => {
        if (settingsVersionRef.current === version) setSettings(storedSettings);
      })
      .catch(() => undefined);
  };

  const handleToggleSound = () => {
    const nextSoundEnabled = !settingsRef.current.soundEnabled;

    setSettings((currentSettings) => ({
      ...currentSettings,
      soundEnabled: nextSoundEnabled,
    }));

    setSoundEnabled(nextSoundEnabled).catch(
      recoverSettings(settingsVersionRef.current),
    );
  };

  const handleToggleHaptics = () => {
    const nextHapticsEnabled = !settingsRef.current.hapticsEnabled;

    setSettings((currentSettings) => ({
      ...currentSettings,
      hapticsEnabled: nextHapticsEnabled,
    }));

    setHapticsEnabledPreference(nextHapticsEnabled).catch(
      recoverSettings(settingsVersionRef.current),
    );
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
    ]).catch(recoverSettings(settingsVersionRef.current));
  };

  return {
    settings,
    setSettings,
    handleToggleSound,
    handleToggleHaptics,
    handleEnableSilentMode,
  };
}
