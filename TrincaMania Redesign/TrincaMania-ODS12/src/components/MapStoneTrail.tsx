import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { radii } from '../styles/theme';

export type TrailPoint = {
  left: number;
  top: number;
};

type MapStoneTrailProps = {
  points: TrailPoint[];
};

// Quantas pedras entram entre duas bolhas e onde a trilha começa/termina, para
// as pedras não encostarem na borda das bolhas.
const STONES_PER_GAP = 6;
const GAP_START = 0.18;
const GAP_END = 0.82;

const STONE_SIZES = [9, 7, 10, 8, 9, 7];
const STONE_DRIFT = [-5, 4, -3, 6, -4, 3];

/**
 * Trilha contínua de pedras ligando as bolhas de fase. Antes elas flutuavam
 * soltas sobre o cenário; a trilha dá a leitura de caminho percorrido.
 */
function MapStoneTrailBase({ points }: MapStoneTrailProps) {
  if (points.length < 2) {
    return null;
  }

  const stones: { key: string; left: number; size: number; top: number }[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];

    for (let step = 0; step < STONES_PER_GAP; step += 1) {
      const ratio = GAP_START + ((GAP_END - GAP_START) * step) / (STONES_PER_GAP - 1);
      const size = STONE_SIZES[step % STONE_SIZES.length];
      const drift = STONE_DRIFT[(index + step) % STONE_DRIFT.length];

      stones.push({
        key: `stone-${index}-${step}`,
        left: from.left + (to.left - from.left) * ratio + drift - size / 2,
        size,
        top: from.top + (to.top - from.top) * ratio - size / 2,
      });
    }
  }

  return (
    <View pointerEvents="none" style={styles.trail}>
      {stones.map((stone) => (
        <View
          key={stone.key}
          style={[
            styles.stone,
            {
              height: stone.size,
              left: stone.left,
              top: stone.top,
              width: stone.size,
            },
          ]}
        />
      ))}
    </View>
  );
}

export const MapStoneTrail = memo(MapStoneTrailBase);

const styles = StyleSheet.create({
  stone: {
    backgroundColor: 'rgba(255, 250, 226, 0.68)',
    borderColor: 'rgba(150, 104, 44, 0.36)',
    borderRadius: radii.pill,
    borderWidth: 1,
    position: 'absolute',
    shadowColor: 'rgba(90, 60, 20, 0.28)',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
  },
  trail: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
