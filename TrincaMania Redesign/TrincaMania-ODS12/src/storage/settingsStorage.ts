import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppSettings = {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
};

const SETTINGS_STORAGE_KEY = '@trinca-mania/settings-v1';
const LEGACY_SOUND_ENABLED_STORAGE_KEY = '@trinca-mania/sound-enabled-v1';

const DEFAULT_SETTINGS: AppSettings = {
  hapticsEnabled: true,
  soundEnabled: true,
  musicEnabled: true,
};

let settingsCache: AppSettings | undefined;
let settingsRequest: Promise<AppSettings> | undefined;
let settingsWriteQueue: Promise<void> = Promise.resolve();

export const createDefaultSettings = (): AppSettings => ({
  ...DEFAULT_SETTINGS,
});

const normalizeSettings = (value: unknown): AppSettings => {
  if (!value || typeof value !== 'object') {
    return createDefaultSettings();
  }

  const settings = value as Partial<AppSettings>;

  return {
    hapticsEnabled:
      typeof settings.hapticsEnabled === 'boolean'
        ? settings.hapticsEnabled
        : DEFAULT_SETTINGS.hapticsEnabled,
    soundEnabled:
      typeof settings.soundEnabled === 'boolean'
        ? settings.soundEnabled
        : DEFAULT_SETTINGS.soundEnabled,
    musicEnabled:
      typeof settings.musicEnabled === 'boolean'
        ? settings.musicEnabled
        : DEFAULT_SETTINGS.musicEnabled,
  };
};

const writeSettings = async (settings: AppSettings) => {
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  await AsyncStorage.setItem(
    LEGACY_SOUND_ENABLED_STORAGE_KEY,
    settings.soundEnabled ? 'true' : 'false',
  );
};

const readSettings = async () => {
  try {
    const storedValue = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);

    if (storedValue) {
      settingsCache = normalizeSettings(JSON.parse(storedValue));
      return settingsCache;
    }

    const legacySoundValue = await AsyncStorage.getItem(
      LEGACY_SOUND_ENABLED_STORAGE_KEY,
    );
    const migratedSettings = {
      ...DEFAULT_SETTINGS,
      soundEnabled:
        legacySoundValue === null
          ? DEFAULT_SETTINGS.soundEnabled
          : legacySoundValue !== 'false',
    };

    settingsCache = migratedSettings;
    await writeSettings(migratedSettings);

    return migratedSettings;
  } catch {
    settingsCache = createDefaultSettings();
    return settingsCache;
  }
};

export const getSettings = async () => {
  if (settingsCache) {
    return settingsCache;
  }

  if (!settingsRequest) {
    settingsRequest = readSettings().finally(() => {
      settingsRequest = undefined;
    });
  }

  return settingsRequest;
};

export const saveSettings = async (settings: AppSettings) => {
  settingsCache = normalizeSettings(settings);
  const snapshot = settingsCache;
  settingsWriteQueue = settingsWriteQueue
    .catch(() => undefined)
    .then(() => writeSettings(snapshot));

  try {
    await settingsWriteQueue;
  } catch {
    // Keep the in-memory preference for this session even if storage is unavailable.
  }

  return settingsCache;
};

export const setSoundEnabledPreference = async (soundEnabled: boolean) => {
  const currentSettings = await getSettings();
  return saveSettings({ ...currentSettings, soundEnabled });
};

export const setMusicEnabledPreference = async (musicEnabled: boolean) => {
  const currentSettings = await getSettings();
  return saveSettings({ ...currentSettings, musicEnabled });
};

export const getMusicEnabled = async () => (await getSettings()).musicEnabled;

export const setHapticsEnabledPreference = async (hapticsEnabled: boolean) => {
  const currentSettings = await getSettings();
  return saveSettings({ ...currentSettings, hapticsEnabled });
};

export const getHapticsEnabled = async () => {
  const settings = await getSettings();
  return settings.hapticsEnabled;
};
