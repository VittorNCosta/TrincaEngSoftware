import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BoardTile } from './BoardTile';
import { Tile } from '../types/game';
import { WindowTarget } from '../types/ui';
import { BoardBounds, getBoardBounds } from '../utils/boardLayout';
import { isTileBlocked, isTileRemoved } from '../utils/gameLogic';

type GameBoardProps = {
  allowedTileId?: string;
  bounds?: BoardBounds;
  disabled: boolean;
  highlightedTileId?: string;
  tiles: Tile[];
  onTileLayoutInWindow?: (tileId: string, target: WindowTarget) => void;
  onBlockedTilePress?: () => void;
  onTilePress: (tileId: string) => void;
};

function GameBoardBase({
  allowedTileId,
  bounds,
  disabled,
  highlightedTileId,
  tiles,
  onTileLayoutInWindow,
  onBlockedTilePress,
  onTilePress,
}: GameBoardProps) {
  // `tiles` conserva as pecas removidas; por isso este fallback tambem fica
  // geometricamente estavel. GameScreen pode fornecer o snapshot da rodada para
  // tornar essa garantia explicita ao recalcular o viewport.
  const resolvedBounds = useMemo(
    () => bounds ?? getBoardBounds(tiles),
    [bounds, tiles],
  );
  const orderedTiles = useMemo(
    () =>
      [...tiles].sort((firstTile, secondTile) => firstTile.z - secondTile.z),
    [tiles],
  );
  // Antes isso rodava por peça em cada render: 30 peças x varredura do tabuleiro,
  // em todo tick de 1s e em toda animação. Agora é uma vez por mudança de tabuleiro.
  const blockedTileIds = useMemo(() => {
    const blocked = new Set<string>();

    tiles.forEach((tile) => {
      if (!isTileRemoved(tile) && isTileBlocked(tile, tiles)) {
        blocked.add(tile.id);
      }
    });

    return blocked;
  }, [tiles]);

  return (
    <View
      style={[
        styles.board,
        {
          height: resolvedBounds.height,
          width: resolvedBounds.width,
        },
      ]}
    >
      {orderedTiles.map((tile) =>
        isTileRemoved(tile) ? null : (
          <BoardTile
            blocked={blockedTileIds.has(tile.id)}
            boardOriginX={resolvedBounds.left}
            boardOriginY={resolvedBounds.top}
            disabled={
              disabled ||
              (allowedTileId !== undefined && tile.id !== allowedTileId)
            }
            highlighted={tile.id === highlightedTileId}
            key={tile.id}
            onLayoutInWindow={onTileLayoutInWindow}
            onBlockedPress={onBlockedTilePress}
            onPress={onTilePress}
            tile={tile}
          />
        ),
      )}
    </View>
  );
}

export const GameBoard = memo(GameBoardBase);

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    position: 'relative',
  },
});
