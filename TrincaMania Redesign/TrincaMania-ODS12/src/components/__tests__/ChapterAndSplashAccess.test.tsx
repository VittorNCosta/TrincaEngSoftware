import { act, fireEvent, render } from '@testing-library/react-native';
import { ChaptersScreen } from '../../screens/ChaptersScreen';
import { SplashIntroScreen } from '../../screens/SplashIntroScreen';
import { CHAPTERS, getChapterLevelSummaries } from '../../data/chapters';
import { createInitialChapterProgress } from '../../storage/chapterProgressStorage';
import { RecyclingMarkerArt } from '../RecyclingMarkerArt';

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
  expect(JSON.stringify(chapterProgress)).toBe(before);
  expect(screen.UNSAFE_getAllByType(RecyclingMarkerArt).length).toBeGreaterThan(
    0,
  );
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
