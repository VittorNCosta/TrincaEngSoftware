import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { RewardAssetIcon } from './RewardAssetIcon';

type CoinPileProps = {
  // Só serve de gatilho para remontar a animação; quem chama pode usar número ou id.
  animationKey?: number | string;
  size?: number;
  visible?: boolean;
};

// Duas fileiras: a de trás maior e mais alta, a da frente menor e girada. Os
// atrasos fazem o montinho "montar" em vez de aparecer inteiro.
const COINS = [
  { delay: 20, left: 38, rotate: '0deg', scale: 0.78, top: 8 },
  { delay: 60, left: 4, rotate: '-14deg', scale: 0.62, top: 24 },
  { delay: 100, left: 82, rotate: '13deg', scale: 0.62, top: 28 },
  { delay: 140, left: 16, rotate: '9deg', scale: 0.56, top: 54 },
  { delay: 170, left: 72, rotate: '-9deg', scale: 0.56, top: 56 },
];
const PILE_HEIGHT = 100;
const PILE_WIDTH = 132;
const POP_MS = 420;

export function CoinPile({ animationKey = 0, size = 74, visible = true }: CoinPileProps) {
  const pops = useMemo(() => COINS.map(() => new Animated.Value(0)), []);
  const popsRef = useRef(pops);

  useEffect(() => {
    popsRef.current = pops;
  }, [pops]);

  useEffect(() => {
    if (!visible) {
      pops.forEach((pop) => {
        pop.stopAnimation();
        pop.setValue(0);
      });

      return undefined;
    }

    pops.forEach((pop) => pop.setValue(0));

    const animations = pops.map((pop, index) =>
      Animated.sequence([
        Animated.delay(COINS[index].delay),
        Animated.timing(pop, {
          duration: POP_MS,
          easing: Easing.out(Easing.back(2.2)),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );

    animations.forEach((animation) => animation.start());

    return () => animations.forEach((animation) => animation.stop());
  }, [animationKey, pops, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.pile}>
      {COINS.map((coin, index) => {
        const pop = pops[index];
        const opacity = pop.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1, 1],
        });
        const scale = pop.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 1],
        });

        return (
          <Animated.View
            key={`coin-pile-${index}`}
            style={[
              styles.coin,
              {
                left: coin.left,
                opacity,
                top: coin.top,
                transform: [{ scale }, { rotate: coin.rotate }],
              },
            ]}
          >
            <RewardAssetIcon name="coin" size={Math.round(size * coin.scale)} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
  },
  pile: {
    height: PILE_HEIGHT,
    position: 'relative',
    width: PILE_WIDTH,
  },
});
