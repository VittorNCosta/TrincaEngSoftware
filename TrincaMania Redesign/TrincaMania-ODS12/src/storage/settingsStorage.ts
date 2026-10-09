import AsyncStorage from './keyValueStorage';

export type AppSettings = {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
};

const SETTINGS_STORAGE_KEY = '@trinca-mania/settings-v1';
const LEGACY_SOUND_ENABLED_STORAGE_KEY = '@trinca-mania/sound-enabled-v1';

const DEFAULT_SETTINGS: AppSettings = {
  hapticsEnabled: true,
  soundEnabled: true,
};

let settingsCache: AppSettings | undefined;
let settingsRequest: Promise<AppSettings> | undefined;
let settingsMutationQueue: Promise<void> = Promise.resolve();

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
    // A failed migration write must not discard the preference just read.
    settingsCache ??= createDefaultSettings();
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

const mutateSettings = (
  update: (current: AppSettings) => AppSettings,
): Promise<AppSettings> => {
  const request = settingsMutationQueue.then(async () => {
    // Migration exposes its cache before completing both storage writes.
    const currentSettings = await (settingsRequest ?? getSettings());
    const nextSettings = normalizeSettings(update(currentSettings));
    settingsCache = nextSettings;
    try {
      await writeSettings(nextSettings);
    } catch {
      // Keep the in-memory preference for this session if storage is unavailable.
    }
    return nextSettings;
  });
  settingsMutationQueue = request.then(
    () => undefined,
    () => undefined,
  );
  return request;
};

export const saveSettings = async (settings: AppSettings) => {
  const nextSettings = normalizeSettings(settings);
  return mutateSettings(() => nextSettings);
};

export const setSoundEnabledPreference = async (soundEnabled: boolean) =>
  mutateSettings((currentSettings) => ({ ...currentSettings, soundEnabled }));

export const setHapticsEnabledPreference = async (hapticsEnabled: boolean) =>
  mutateSettings((currentSettings) => ({ ...currentSettings, hapticsEnabled }));

export const getHapticsEnabled = async () => {
  const settings = await getSettings();
  return settings.hapticsEnabled;
};
