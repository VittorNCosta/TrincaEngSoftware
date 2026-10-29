import { Animated, ScrollView, StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { LevelSelectScreen } from '../../screens/LevelSelectScreen';
import { createInitialProgress } from '../../storage/progressStorage';
import { createInitialLivesState } from '../../storage/livesStorage';
import { LEVELS } from '../../data/levels';

const baseProps = () => ({
  activeTrayCapacity: 7,
  livesState: createInitialLivesState(),
  progress: createInitialProgress(),
  timeUntilNextLifeMs: 0,
  onOpenChapters: jest.fn(),
  onOpenProfile: jest.fn(),
  onOpenShop: jest.fn(),
  onOpenSettings: jest.fn(),
  onResetProgress: jest.fn(),
  onSelectLevel: jest.fn(),
});

test('chapter entry follows campaign completion and temporary dev mode without manufacturing stars', () => {
  const props = baseProps();
  const original = JSON.stringify(props.progress);
  const screen = render(<LevelSelectScreen {...props} />);
  expect(screen.queryByRole('button', { name: 'Capítulos' })).toBeNull();
  screen.rerender(<LevelSelectScreen {...props} devMode />);
  fireEvent.press(screen.getByRole('button', { name: 'Capítulos' }));
  expect(props.onOpenChapters).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(props.progress)).toBe(original);
  screen.rerender(<LevelSelectScreen {...props} />);
  expect(screen.queryByRole('button', { name: 'Capítulos' })).toBeNull();
  const completed = {
    ...props.progress,
    levelStars: Object.fromEntries(
      LEVELS.filter((level) => level.worldId <= 10).map((level) => [
        level.id,
        1,
      ]),
    ),
  };
  screen.rerender(<LevelSelectScreen {...props} progress={completed} />);
  expect(screen.getByRole('button', { name: 'Capítulos' })).toBeTruthy();
});

test('dev mode lets a new save select a late-world stage without persisting unlocks', () => {
  const props = baseProps();
  const original = JSON.stringify(props.progress);
  const screen = render(
    <LevelSelectScreen {...props} devMode initialWorldId={9} />,
  );
  fireEvent.press(screen.getByTestId('map-level-w9-010'));
  fireEvent.press(screen.getByTestId('jogar-fase'));
  expect(props.onSelectLevel).toHaveBeenCalledWith('w9-010');
  expect(JSON.stringify(props.progress)).toBe(original);
});

test('o mapa bônus mantém as três fases sem oferecer o baú removido', () => {
  const screen = render(
    <LevelSelectScreen {...baseProps()} devMode initialWorldId={21} />,
  );
  for (const position of ['001', '002', '003']) {
    expect(screen.getByTestId(`map-level-bonus-w1-${position}`)).toBeTruthy();
  }
  expect(screen.queryByText(/BAÚ/)).toBeNull();
  expect(screen.queryByRole('button', { name: /baú/i })).toBeNull();
  fireEvent.press(screen.getByTestId('map-level-bonus-w1-001'));
  expect(screen.getByTestId('jogar-fase')).toBeTruthy();
});

test.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 21] as const)(
  'o mundo %s mantém suas fases sem pontos de descanso',
  (worldId) => {
    const screen = render(
      <LevelSelectScreen {...baseProps()} devMode initialWorldId={worldId} />,
    );
    fireEvent(screen.UNSAFE_getByType(ScrollView), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 600 } },
    });
    const first = LEVELS.find((level) => level.worldId === worldId)!;
    expect(screen.getByTestId(`map-level-${first.id}`)).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: /^Ponto de descanso/i }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /^Loja, /i })).toBeNull();
    expect(
      screen.queryByLabelText('Recompensa do ponto de descanso'),
    ).toBeNull();
  },
);

const controlFrames = () => {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  const request = jest
    .spyOn(global, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
  const cancel = jest
    .spyOn(global, 'cancelAnimationFrame')
    .mockImplementation((id) => {
      frames.delete(id);
    });
  return {
    flush: () =>
      act(() => {
        const pending = [...frames.values()];
        frames.clear();
        for (const callback of pending) callback(16);
      }),
    restore: () => {
      request.mockRestore();
      cancel.mockRestore();
    },
  };
};
const mapOpacity = (screen: ReturnType<typeof render>) => {
  const frame = screen
    .UNSAFE_getAllByType(Animated.View)
    .find((view) => view.props.testID === 'campaign-map-frame');
  if (!frame) throw new Error('Map frame not rendered');
  return StyleSheet.flatten(frame.props.style).opacity;
};

test('a temporary zero-sized viewport can reveal the same map after layout recovers', () => {
  const frames = controlFrames();
  const timing = jest.spyOn(Animated, 'timing');
  try {
    const screen = render(<LevelSelectScreen {...baseProps()} />);
    const opacity = mapOpacity(screen);
    const scroll = screen.UNSAFE_getByType(ScrollView);
    const layout = (width: number, height: number) =>
      fireEvent(scroll, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height } },
      });
    layout(320, 600);
    fireEvent(scroll, 'contentSizeChange', 320, 2900);
    // A browser layout can briefly invalidate a pending reveal, then return
    // the identical opening key. That canceled key must remain retryable.
    layout(0, 0);
    layout(320, 600);
    frames.flush();
    expect(
      timing.mock.calls.filter(
        ([value, config]) => value === opacity && config.toValue === 1,
      ),
    ).toHaveLength(1);
    screen.unmount();
  } finally {
    frames.restore();
    timing.mockRestore();
  }
});

test('repeated native content layout before the next frame does not cancel the map reveal', () => {
  const frames = controlFrames();
  const timing = jest.spyOn(Animated, 'timing');
  try {
    const screen = render(<LevelSelectScreen {...baseProps()} />);
    const opacity = mapOpacity(screen);
    const scroll = screen.UNSAFE_getByType(ScrollView);
    fireEvent(scroll, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 600 } },
    });
    fireEvent(scroll, 'contentSizeChange', 320, 2900);
    fireEvent(scroll, 'contentSizeChange', 320, 2900);
    // A changed measured height still resolves to the same opening target.
    fireEvent(scroll, 'contentSizeChange', 320, 2901);
    frames.flush();
    expect(
      timing.mock.calls.filter(
        ([value, config]) => value === opacity && config.toValue === 1,
      ),
    ).toHaveLength(1);
    screen.unmount();
  } finally {
    frames.restore();
    timing.mockRestore();
  }
});

test.each(['inactive', 'world'] as const)(
  'changing %s still cancels the previous reveal and opens the next map',
  (change) => {
    const frames = controlFrames();
    const timing = jest.spyOn(Animated, 'timing');
    try {
      const props = baseProps();
      const screen = render(
        <LevelSelectScreen {...props} devMode initialWorldId={1} />,
      );
      const opacity = mapOpacity(screen);
      const revealCalls = () =>
        timing.mock.calls.filter(
          ([value, config]) => value === opacity && config.toValue === 1,
        );
      const scroll = screen.UNSAFE_getByType(ScrollView);
      fireEvent(scroll, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 600 } },
      });
      fireEvent(scroll, 'contentSizeChange', 320, 2900);
      screen.rerender(
        <LevelSelectScreen
          {...props}
          devMode
          initialWorldId={change === 'world' ? 2 : 1}
          isActive={change !== 'inactive'}
        />,
      );
      frames.flush();
      expect(revealCalls()).toHaveLength(0);
      if (change === 'inactive')
        screen.rerender(
          <LevelSelectScreen {...props} devMode initialWorldId={1} isActive />,
        );
      else
        fireEvent(
          screen.UNSAFE_getByType(ScrollView),
          'contentSizeChange',
          320,
          1360,
        );
      frames.flush();
      expect(revealCalls()).toHaveLength(1);
      screen.unmount();
    } finally {
      frames.restore();
      timing.mockRestore();
    }
  },
);

test('fractional viewport changes with the same rounded key still reveal the updated target', () => {
  const frames = controlFrames();
  const timing = jest.spyOn(Animated, 'timing');
  try {
    const screen = render(<LevelSelectScreen {...baseProps()} />);
    const opacity = mapOpacity(screen);
    const scroll = screen.UNSAFE_getByType(ScrollView);
    fireEvent(scroll, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 600.6 } },
    });
    fireEvent(scroll, 'contentSizeChange', 320, 2900);
    fireEvent(scroll, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 601.2 } },
    });
    frames.flush();
    expect(
      timing.mock.calls.filter(
        ([value, config]) => value === opacity && config.toValue === 1,
      ),
    ).toHaveLength(1);
    screen.unmount();
  } finally {
    frames.restore();
    timing.mockRestore();
  }
});
