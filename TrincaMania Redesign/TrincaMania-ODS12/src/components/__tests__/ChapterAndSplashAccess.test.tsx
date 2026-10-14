import { act, fireEvent, render } from '@testing-library/react-native';
import { ChaptersScreen } from '../../screens/ChaptersScreen';
import { SplashIntroScreen } from '../../screens/SplashIntroScreen';
import { CHAPTERS, getChapterLevelSummaries } from '../../data/chapters';
import { createInitialChapterProgress } from '../../storage/chapterProgressStorage';
import { RecyclingMarkerArt } from '../RecyclingMarkerArt';
import { BackHandler, Platform } from 'react-native';

test('chapter dev access changes availability without adding completed stars', () => {
  const chapterProgress = createInitialChapterProgress();
  const before = JSON.stringify(chapterProgress);
  const selected = jest.fn();
  const chapter = CHAPTERS[9];
  const screen = render(
    <ChaptersScreen
      chapterProgress={chapterProgress}
      onBack={jest.fn()}
      onSelectChapterLevel={selected}
      devMode
    />,
  );
  fireEvent.press(screen.getByText(chapter.name));
  const map = getChapterLevelSummaries(chapter.id)[0];
  fireEvent.press(
    screen.getByLabelText(`Mapa ${map.chapterMapNumber}: ${map.title}`),
  );
  expect(selected).toHaveBeenCalledWith(map.id);
  const nextSectionMap = getChapterLevelSummaries(chapter.id)[10];
  expect(
    screen.queryByLabelText(
      `Mapa ${nextSectionMap.chapterMapNumber}: ${nextSectionMap.title}`,
    ),
  ).toBeNull();
  fireEvent.press(screen.getByLabelText('Mapas 11 a 20'));
  fireEvent.press(
    screen.getByLabelText(
      `Mapa ${nextSectionMap.chapterMapNumber}: ${nextSectionMap.title}`,
    ),
  );
  expect(selected).toHaveBeenCalledWith(nextSectionMap.id);
  expect(JSON.stringify(chapterProgress)).toBe(before);
  expect(screen.UNSAFE_getAllByType(RecyclingMarkerArt).length).toBeGreaterThan(
    0,
  );
});

test('Android Back leaves chapter detail before returning to the campaign map', () => {
  const originalPlatform = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  let pressBack: (() => boolean | null | undefined) | undefined;
  const backSubscription = jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((_event, listener) => {
      pressBack = listener;
      return { remove: jest.fn() };
    });

  try {
    const onBack = jest.fn();
    const screen = render(
      <ChaptersScreen
        chapterProgress={createInitialChapterProgress()}
        onBack={onBack}
        onSelectChapterLevel={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText(CHAPTERS[0].name));
    expect(screen.getByText('Capítulo 01')).toBeTruthy();

    act(() => {
      expect(pressBack?.()).toBe(true);
    });
    expect(screen.getByText('Capítulos')).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();

    act(() => {
      expect(pressBack?.()).toBe(true);
    });
    expect(onBack).toHaveBeenCalledTimes(1);
    screen.unmount();
  } finally {
    backSubscription.mockRestore();
    if (originalPlatform)
      Object.defineProperty(Platform, 'OS', originalPlatform);
  }
});

test('skipping the intro twice and its auto timer finish navigation only once', () => {
  jest.useFakeTimers();
  try {
    const finish = jest.fn();
    const screen = render(<SplashIntroScreen onFinish={finish} />);
    fireEvent.press(screen.getByTestId('splash-skip'));
    fireEvent.press(screen.getByTestId('splash-skip'));
    act(() => {
      jest.advanceTimersByTime(4500);
    });
    expect(finish).toHaveBeenCalledTimes(1);
    screen.unmount();
  } finally {
    jest.useRealTimers();
  }
});
