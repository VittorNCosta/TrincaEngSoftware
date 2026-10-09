import { act, renderHook } from '@testing-library/react-native';
import { useRoundAction } from '../../hooks/useRoundAction';

describe('reinício assíncrono da rodada', () => {
  it('cliques repetidos fazem uma única solicitação e aplicam uma vez', async () => {
    let finish!: (value: number) => void;
    const perform = jest.fn(
      () =>
        new Promise<number>((resolve) => {
          finish = resolve;
        }),
    );
    const apply = jest.fn();
    const generation = { current: 1 };
    const mounted = { current: true };
    const { result } = renderHook(() =>
      useRoundAction(perform, apply, generation, mounted),
    );
    let first!: Promise<void>;
    act(() => {
      first = result.current();
      void result.current();
    });
    expect(perform).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish(7);
      await first;
    });
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(7);
  });
  it.each(['round', 'unmount'])(
    'ignora resultado de %s anterior',
    async (reason) => {
      let finish!: (value: number) => void;
      const perform = () =>
        new Promise<number>((resolve) => {
          finish = resolve;
        });
      const apply = jest.fn();
      const generation = { current: 1 };
      const mounted = { current: true };
      const { result } = renderHook(() =>
        useRoundAction(perform, apply, generation, mounted),
      );
      let pending!: Promise<void>;
      act(() => {
        pending = result.current();
      });
      if (reason === 'round') generation.current++;
      else mounted.current = false;
      await act(async () => {
        finish(7);
        await pending;
      });
      expect(apply).not.toHaveBeenCalled();
    },
  );
  it('erro libera a solicitação para uma nova tentativa', async () => {
    const perform = jest
      .fn()
      .mockRejectedValueOnce(new Error('storage'))
      .mockResolvedValueOnce(7);
    const apply = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useRoundAction(
        perform,
        apply,
        { current: 1 },
        { current: true },
        onError,
      ),
    );
    await act(async () => {
      await result.current();
      await result.current();
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(7);
  });
});
