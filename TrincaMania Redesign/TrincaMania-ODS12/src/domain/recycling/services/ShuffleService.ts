import { Tile } from '../../../types/game';
import { isMysteryTileHidden, isTileRemoved } from './BoardService';

/**
 * Identidade de carta que o embaralhar move de uma peça para outra. Material,
 * papel e arte andam juntos — separar isso geraria uma "lixeira azul de
 * plástico", que é exatamente o erro que o jogo quer ensinar a evitar.
 */
type CardIdentity = Pick<Tile, 'cardId' | 'emoji' | 'kind' | 'role'>;

const toCardIdentity = (tile: Tile): CardIdentity => ({
  cardId: tile.cardId,
  emoji: tile.emoji,
  kind: tile.kind,
  role: tile.role,
});

const identityKey = (identity: CardIdentity) => `${identity.cardId}`;

const shuffleList = <T,>(items: T[], random: () => number = Math.random) => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [shuffledItems[index], shuffledItems[targetIndex]] = [
      shuffledItems[targetIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
};

/**
 * Redistribui as cartas entre as peças que ainda estão no tabuleiro. O conjunto
 * de cartas é preservado (mesma contagem por material e papel), então o nível
 * continua tendo exatamente as trincas que tinha antes.
 *
 * Cartas distintas são empurradas para peças visíveis primeiro, para que o
 * jogador enxergue a variedade em vez de olhar para uma parede de repetidos.
 */
export const shuffleRemainingTiles = (board: Tile[], random: () => number = Math.random) => {
  const remainingTiles = board.filter((tile) => !isTileRemoved(tile));
  const shuffledIdentities = shuffleList(remainingTiles.map(toCardIdentity), random);
  const visibleTargets = shuffleList(
    remainingTiles.filter((tile) => !isMysteryTileHidden(tile)),
    random,
  );

  // Uma amostra de cada carta distinta vai para as peças visíveis; o resto
  // preenche o que sobrar. As duas listas juntas contêm exatamente o conjunto
  // original de cartas, então nenhuma trinca é criada nem destruída.
  const distinctSample: CardIdentity[] = [];
  const leftoverIdentities: CardIdentity[] = [];
  const seenKeys = new Set<string>();

  shuffledIdentities.forEach((identity) => {
    const key = identityKey(identity);

    if (seenKeys.has(key)) {
      leftoverIdentities.push(identity);

      return;
    }

    seenKeys.add(key);
    distinctSample.push(identity);
  });

  const identityByTileId = new Map<string, CardIdentity>();
  const pendingTargets = [...visibleTargets];

  distinctSample.forEach((identity) => {
    const targetTile = pendingTargets.shift();

    if (targetTile) {
      identityByTileId.set(targetTile.id, identity);

      return;
    }

    leftoverIdentities.push(identity);
  });

  const unassignedTiles = shuffleList(
    remainingTiles.filter((tile) => !identityByTileId.has(tile.id)),
    random,
  );
  const remainingIdentities = shuffleList(leftoverIdentities, random);

  unassignedTiles.forEach((tile) => {
    const identity = remainingIdentities.shift();

    if (identity) {
      identityByTileId.set(tile.id, identity);
    }
  });

  return board.map((tile) => {
    if (isTileRemoved(tile)) {
      return tile;
    }

    const identity = identityByTileId.get(tile.id);

    return identity ? { ...tile, ...identity } : tile;
  });
};
