import {
  playMagicTriple,
  playTile,
} from '../domain/recycling/services/PlayService';
import { shuffleRemainingTiles } from '../domain/recycling/services/ShuffleService';
import { getCardById } from '../domain/recycling/value-objects/RecyclingCard';
import { BASE_TRAY_CAPACITY } from '../storage/trayBoostStorage';
import type { MoveHistoryItem, PowerUpType, Tile } from '../types/game';
import { createSeededRandom } from './deterministicRandom';

export type TutorialDemoKind = 'cycle' | 'tray' | PowerUpType;
export type TutorialPractice = {
  kind: TutorialDemoKind;
  board: Tile[];
  tray: Tile[];
  history: MoveHistoryItem[];
  step: number;
};
export type TutorialPracticeAction =
  { tileId: string } | { power: PowerUpType };

const cardIds = [
  'plastico:residuo:garrafa-pet',
  'plastico:lixeira:padrao',
  'plastico:simbolo:padrao',
  'papel:residuo:jornal',
  'papel:lixeira:padrao',
  'papel:simbolo:padrao',
];
const warningCardIds = [
  'plastico:residuo:garrafa-pet',
  'papel:residuo:jornal',
  'vidro:residuo:garrafa',
  'metal:residuo:lata-alimento',
  'organico:residuo:casca-banana',
  'papel:lixeira:padrao',
];
const makeTile = (cardId: string, index: number, prefix: string): Tile => {
  const card = getCardById(cardId);
  if (!card) throw new Error(`Carta do tutorial ausente: ${cardId}`);
  return {
    cardId: card.id,
    emoji: card.emoji,
    id: `${prefix}-${index}`,
    kind: card.material,
    role: card.role,
    x: (index % 3) * 66,
    y: Math.floor(index / 3) * 60,
    z: 0,
  };
};

// Isolated practice follows the ODS domain; it never writes progress or inventory.
export const createTutorialPractice = (
  kind: TutorialDemoKind,
): TutorialPractice => ({
  kind,
  history: [],
  step: 0,
  board:
    kind === 'tray'
      ? []
      : cardIds.map((cardId, index) => makeTile(cardId, index, 'cycle')),
  tray:
    kind === 'tray'
      ? warningCardIds.map((cardId, index) =>
          makeTile(cardId, index, 'warning'),
        )
      : [],
});

export const getTutorialPracticeAction = (
  state: TutorialPractice,
): TutorialPracticeAction | undefined => {
  if (state.kind === 'tray') return undefined;
  if (state.kind === 'shuffle')
    return state.step === 0 ? { power: 'shuffle' } : undefined;
  if (state.kind === 'hint' || state.kind === 'undo') {
    if (state.step >= 2) return undefined;
    if (state.step === 1) return { power: state.kind };
  } else if (state.step >= 3) return undefined;
  return { tileId: `cycle-${state.step}` };
};

export const advanceTutorialPractice = (
  state: TutorialPractice,
  action: TutorialPracticeAction,
): TutorialPractice => {
  const expected = getTutorialPracticeAction(state);
  if (
    !expected ||
    ('tileId' in action
      ? !('tileId' in expected) || action.tileId !== expected.tileId
      : !('power' in expected) || action.power !== expected.power)
  )
    return state;
  if ('tileId' in action) {
    const result = playTile(
      state.board,
      state.tray,
      action.tileId,
      BASE_TRAY_CAPACITY,
    );
    return {
      ...state,
      board: result.board,
      tray: result.tray,
      step: state.step + 1,
      history: [
        ...state.history,
        {
          board: state.board,
          tray: state.tray,
          formedTriple: Boolean(result.removedKind),
        },
      ],
    };
  }
  if (action.power === 'hint') {
    const result = playMagicTriple(state.board, state.tray, BASE_TRAY_CAPACITY);
    return {
      ...state,
      board: result.board,
      tray: result.tray,
      step: state.step + 1,
    };
  }
  if (action.power === 'shuffle') {
    return {
      ...state,
      board: shuffleRemainingTiles(state.board, createSeededRandom(17)),
      step: state.step + 1,
    };
  }
  const previous = state.history[state.history.length - 1];
  return previous && !previous.formedTriple
    ? {
        ...state,
        board: previous.board,
        tray: previous.tray,
        history: state.history.slice(0, -1),
        step: state.step + 1,
      }
    : state;
};
