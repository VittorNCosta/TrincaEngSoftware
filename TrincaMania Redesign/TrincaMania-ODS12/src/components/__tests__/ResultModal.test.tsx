import { fireEvent, render, within } from '@testing-library/react-native';

import { ResultModal } from '../ResultModal';
import { LEVELS } from '../../data/levels';
import { LivesState } from '../../storage/livesStorage';
import {
  GameStatus,
  ProgressState,
  WorldChestOpenResult,
} from '../../types/game';

// A geometria real em telas pequenas é verificada nas capturas Android.
// Aqui protegemos a separação entre recompensas roláveis e ações/anúncio.
const noopProgress: ProgressState = {
  bonusWorldAchievementShown: false,
  chestProgressLevelIds: [],
  claimedWorldChestIds: [],
  collectedRestCheckpointIds: [],
  completedLevelIds: [],
  coins: 0,
  itemCounts: { hint: 0, shuffle: 0, undo: 0 },
  keys: 0,
  levelStars: {},
  pendingWorldChestIds: [],
  unlockedLevelIds: [],
};

const onOpenWorldChest = async (): Promise<WorldChestOpenResult> => ({
  keyPurchased: false,
  progress: noopProgress,
  status: 'unavailable',
  worldChestId: 'stub-world-chest',
});

const livesState: LivesState = {
  currentLives: 5,
  lastLifeTimestamp: Date.now(),
  maxLives: 5,
};

describe('ResultModal', () => {
  it('mantém o anúncio e as ações fora da área de recompensas que pode rolar', () => {
    const onNextLevel = jest.fn();
    const onBackToLevels = jest.fn();
    const { getByText, getByTestId } = render(
      <ResultModal
        activeTrayCapacity={7}
        availableCoins={0}
        keys={0}
        level={LEVELS[0]}
        livesState={livesState}
        status="won"
        timeUntilNextLifeMs={0}
        unlockedLevelTitle="Trilha da coleta seletiva"
        onBackToLevels={onBackToLevels}
        onNextLevel={onNextLevel}
        onOpenWorldChest={onOpenWorldChest}
        onRetry={() => {}}
      />,
    );

    const announcement = 'Nova fase desbloqueada! Trilha da coleta seletiva';
    const rewards = getByTestId('result-rewards-scroll');
    expect(getByText(announcement)).toBeTruthy();
    expect(within(rewards).queryByText(announcement)).toBeNull();
    expect(within(rewards).queryByText('Próxima fase')).toBeNull();
    expect(rewards.props.showsVerticalScrollIndicator).toBe(true);
    fireEvent.press(getByText('Próxima fase'));
    fireEvent.press(getByText('Mapa'));
    expect(onNextLevel).toHaveBeenCalledTimes(1);
    expect(onBackToLevels).toHaveBeenCalledTimes(1);
  });

  it('renderiza a tela de vitória sem lançar exceção', () => {
    const status: GameStatus = 'won';

    const { getByText } = render(
      <ResultModal
        activeTrayCapacity={7}
        availableCoins={0}
        keys={0}
        level={LEVELS[0]}
        livesState={livesState}
        status={status}
        timeUntilNextLifeMs={0}
        onBackToLevels={() => {}}
        onNextLevel={() => {}}
        onOpenWorldChest={onOpenWorldChest}
        onRetry={() => {}}
      />,
    );

    expect(getByText('Vitória')).toBeTruthy();
  });
});
