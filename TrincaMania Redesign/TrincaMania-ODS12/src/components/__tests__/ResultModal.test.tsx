import { render } from '@testing-library/react-native';

import { ResultModal } from '../ResultModal';
import { LEVELS } from '../../data/levels';
import { LivesState } from '../../storage/livesStorage';
import {
  GameStatus,
  ProgressState,
  WorldChestOpenResult,
} from '../../types/game';

// ResultModal tem a maior superfície de props dos 4 componentes-alvo (baú
// comum, baú de mundo, recorde, progresso de capítulo...). Este é
// deliberadamente um smoke test mais simples que os outros três: só garante
// que a tela de vitória renderiza sem lançar exceção com o mínimo de props
// obrigatórias, sem cobrir baús/animações/interação.
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
