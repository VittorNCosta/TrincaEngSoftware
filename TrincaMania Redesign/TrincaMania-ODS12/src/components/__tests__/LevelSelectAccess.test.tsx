import { fireEvent, render } from '@testing-library/react-native';
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
  onOpenWorldChest: jest.fn(),
  onOpenRestCheckpoint: jest.fn(),
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
