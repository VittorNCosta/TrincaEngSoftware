import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { ActiveGameClock } from '../../utils/activeGameClock';
import { useActiveGameClock } from '../../hooks/useActiveGameClock';

describe('tempo de jogo ativo', () => {
  it('preserva frações em pausas repetidas e exclui tempo parado', () => {
    let now = 0;
    const clock = new ActiveGameClock(() => now);
    for (let index = 0; index < 10; index++) {
      clock.setRunning(true);
      now += 900;
      clock.setRunning(false);
      now += 5000;
    }
    expect(clock.readSeconds()).toBe(9);
    clock.reset();
    expect(clock.readSeconds()).toBe(0);
  });
  it('acerta mesmo quando a atualização da interface atrasou', () => {
    let now = 0;
    const clock = new ActiveGameClock(() => now);
    clock.setRunning(true);
    now = 3521;
    expect(clock.readSeconds()).toBe(3);
    clock.reset();
    now += 1999;
    expect(clock.readSeconds()).toBe(1);
  });
  it('pausa no segundo plano e retoma sem cobrar a interrupção', () => {
    jest.useFakeTimers();
    let now = 0;
    let change!: (state: AppStateStatus) => void;
    const remove = jest.fn();
    const spy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        change = callback;
        return { remove };
      });
    const clock = new ActiveGameClock(() => now);
    const tick = jest.fn();
    const { unmount } = renderHook(() => useActiveGameClock(clock, true, tick));
    act(() => {
      change('active');
      now = 1400;
      change('background');
    });
    now += 100000;
    expect(clock.readSeconds()).toBe(1);
    act(() => {
      change('active');
      now += 700;
      jest.advanceTimersByTime(250);
    });
    expect(clock.readSeconds()).toBe(2);
    expect(tick).toHaveBeenLastCalledWith(2);
    unmount();
    expect(remove).toHaveBeenCalled();
    spy.mockRestore();
    jest.useRealTimers();
  });
});
