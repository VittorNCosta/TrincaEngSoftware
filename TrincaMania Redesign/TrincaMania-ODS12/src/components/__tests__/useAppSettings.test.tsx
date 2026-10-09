import { act, renderHook } from '@testing-library/react-native';
import { useAppSettings } from '../../hooks/useAppSettings';
import {
  getSettings,
  setHapticsEnabledPreference,
} from '../../storage/settingsStorage';
import { setSoundEnabled } from '../../utils/sounds';

jest.mock('../../storage/settingsStorage', () => ({
  createDefaultSettings: () => ({ soundEnabled: true, hapticsEnabled: true }),
  getSettings: jest.fn(),
  setHapticsEnabledPreference: jest.fn(),
}));
jest.mock('../../utils/sounds', () => ({ setSoundEnabled: jest.fn() }));
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(setSoundEnabled).mockResolvedValue(undefined);
  jest
    .mocked(setHapticsEnabledPreference)
    .mockResolvedValue({ soundEnabled: true, hapticsEnabled: true });
});
test.each(['sound', 'haptics'] as const)(
  'duas alternâncias de %s antes do render se compensam',
  (field) => {
    const { result } = renderHook(useAppSettings);
    act(() => {
      const toggle =
        field === 'sound'
          ? result.current.handleToggleSound
          : result.current.handleToggleHaptics;
      toggle();
      toggle();
    });
    expect(result.current.settings).toEqual({
      soundEnabled: true,
      hapticsEnabled: true,
    });
    const setter =
      field === 'sound' ? setSoundEnabled : setHapticsEnabledPreference;
    expect(setter).toHaveBeenNthCalledWith(1, false);
    expect(setter).toHaveBeenNthCalledWith(2, true);
  },
);
test('silencioso seguido de ativar som conserva háptica desligada', () => {
  const { result } = renderHook(useAppSettings);
  act(() => {
    result.current.handleEnableSilentMode();
    result.current.handleToggleSound();
  });
  expect(result.current.settings).toEqual({
    soundEnabled: true,
    hapticsEnabled: false,
  });
  expect(setSoundEnabled).toHaveBeenNthCalledWith(1, false);
  expect(setSoundEnabled).toHaveBeenNthCalledWith(2, true);
});
test('hidratação atualiza alternâncias e mantém identidade do setter', () => {
  const { result, rerender } = renderHook(useAppSettings);
  const setter = result.current.setSettings;
  act(() => setter({ soundEnabled: false, hapticsEnabled: false }));
  act(() => result.current.handleToggleSound());
  rerender({});
  expect(result.current.setSettings).toBe(setter);
  expect(result.current.settings).toEqual({
    soundEnabled: true,
    hapticsEnabled: false,
  });
});
test('recuperação antiga não sobrescreve ação mais recente', async () => {
  let resolveRead!: (value: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  }) => void;
  jest.mocked(getSettings).mockReturnValue(
    new Promise((resolve) => {
      resolveRead = resolve;
    }),
  );
  jest.mocked(setSoundEnabled).mockRejectedValueOnce(new Error('falha'));
  const { result } = renderHook(useAppSettings);
  await act(async () => {
    result.current.handleToggleSound();
  });
  act(() => result.current.handleEnableSilentMode());
  await act(async () => {
    resolveRead({ soundEnabled: true, hapticsEnabled: true });
  });
  expect(result.current.settings).toEqual({
    soundEnabled: false,
    hapticsEnabled: false,
  });
});
