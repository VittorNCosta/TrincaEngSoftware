import { act, renderHook } from '@testing-library/react-native';
import { useAppSettings } from '../../hooks/useAppSettings';

jest.mock('../../utils/music', () => ({ setMusicEnabled: jest.fn() }));
jest.mock('../../utils/sounds', () => ({
  setSoundEnabled: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../storage/settingsStorage', () => ({
  createDefaultSettings: () => ({
    hapticsEnabled: true,
    musicEnabled: true,
    soundEnabled: true,
  }),
  getSettings: jest.fn(),
  saveSettings: jest.fn().mockResolvedValue(undefined),
  setHapticsEnabledPreference: jest.fn().mockResolvedValue(undefined),
  setMusicEnabledPreference: jest.fn().mockResolvedValue(undefined),
}));

test('modo silencioso alterna e restaura preferências personalizadas', () => {
  const { result } = renderHook(() => useAppSettings());

  act(() => result.current.handleToggleSound());
  expect(result.current.settings).toEqual({
    hapticsEnabled: true,
    musicEnabled: true,
    soundEnabled: false,
  });

  act(() => result.current.handleToggleSilentMode());
  expect(result.current.settings).toEqual({
    hapticsEnabled: false,
    musicEnabled: false,
    soundEnabled: false,
  });

  act(() => result.current.handleToggleSilentMode());
  expect(result.current.settings).toEqual({
    hapticsEnabled: true,
    musicEnabled: true,
    soundEnabled: false,
  });
});
