import { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from './GameIcon';
import { colors, radii, shadows } from '../styles/theme';
import { Level } from '../types/game';
import { getLevelDisplayLabel } from '../utils/levelDisplay';

type MapLevelNodeProps = {
  completed: boolean;
  current: boolean;
  level: Level;
  locked: boolean;
  selected: boolean;
  stars: number;
  onPress: (levelId: string) => void;
};

const STAR_TILT = ['starLeft', 'starCenter', 'starRight'] as const;

function MapLevelNodeBase({
  completed,
  current,
  level,
  locked,
  selected,
  stars,
  onPress,
}: MapLevelNodeProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const displayLabel = getLevelDisplayLabel(level);

  useEffect(() => {
    if (!current) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 760,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 760,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [current, pulse]);

  const baseGlowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  const baseGlowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.58],
  });

  // Bloqueada não mostra estrelas vazias — a bolha já diz que está fechada.
  // A fase atual troca as estrelas pela fita "Jogar".
  const showStars = !locked && !current;
  const earnedStars = locked ? 0 : stars;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: locked, selected }}
      hitSlop={4}
      onPress={() => onPress(level.id)}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      <View style={styles.nodeWrap}>
        <View style={styles.groundShadow} />
        {current ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.currentBaseGlow,
              {
                opacity: baseGlowOpacity,
                transform: [{ scale: baseGlowScale }],
              },
            ]}
          />
        ) : null}
        {selected ? <View style={styles.selectedAura} /> : null}
        <View
          style={[
            styles.node,
            completed ? styles.completedNode : null,
            current ? styles.currentNode : null,
            locked ? styles.lockedNode : null,
            selected ? styles.selectedNode : null,
          ]}
        >
          <View
            style={[
              styles.innerDisc,
              completed ? styles.completedInnerDisc : null,
              current ? styles.currentInnerDisc : null,
              locked ? styles.lockedInnerDisc : null,
            ]}
          >
            <View pointerEvents="none" style={styles.innerShine} />
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[
                styles.number,
                displayLabel.length > 2 ? styles.numberSmall : null,
                completed ? styles.completedNumber : null,
                current ? styles.currentNumber : null,
                locked ? styles.lockedNumber : null,
              ]}
            >
              {displayLabel}
            </Text>
          </View>
          {completed ? (
            <View style={styles.checkBadge}>
              <GameIcon name="check" size={18} tone="green" />
            </View>
          ) : null}
          {locked ? (
            <View style={styles.lockBadge}>
              <GameIcon name="lock" size={13} tone="neutral" variant="plain" />
            </View>
          ) : null}
        </View>
        {showStars ? (
          <View pointerEvents="none" style={styles.starArc}>
            {Array.from({ length: 3 }).map((_, index) => {
              const isEarned = index < earnedStars;

              return (
                <View
                  key={`star-${level.id}-${index}`}
                  style={[styles.starMark, styles[STAR_TILT[index]], !isEarned ? styles.starDimmed : null]}
                >
                  <GameIcon
                    muted={!isEarned}
                    name="star"
                    size={isEarned ? 15 : 13}
                    tone={isEarned ? 'gold' : 'neutral'}
                    variant="plain"
                  />
                </View>
              );
            })}
          </View>
        ) : null}
        {current ? (
          <View pointerEvents="none" style={styles.playRibbon}>
            <Text style={styles.playRibbonText}>Jogar</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const MapLevelNode = memo(MapLevelNodeBase);

const styles = StyleSheet.create({
  // O selo monta na borda da bolha, não fica encolhido dentro dela.
  checkBadge: {
    alignItems: 'center',
    backgroundColor: '#EFFFF8',
    borderColor: '#28C6B0',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -1,
    top: -1,
    width: 22,
  },
  completedInnerDisc: {
    backgroundColor: '#F4FFFB',
  },
  completedNode: {
    backgroundColor: '#40CF9B',
    borderBottomColor: '#0B7F58',
    borderColor: '#D7FFF0',
  },
  completedNumber: {
    color: '#0A5C43',
  },
  currentBaseGlow: {
    backgroundColor: 'rgba(255, 220, 104, 0.48)',
    borderColor: 'rgba(255, 246, 198, 0.72)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 18,
    position: 'absolute',
    top: 57,
    width: 76,
  },
  currentInnerDisc: {
    backgroundColor: '#FFF8E0',
  },
  currentNode: {
    backgroundColor: '#F8C33E',
    borderBottomColor: '#A55D00',
    borderColor: '#FFF8D0',
  },
  currentNumber: {
    color: '#7A4A0C',
  },
  groundShadow: {
    backgroundColor: 'rgba(52, 38, 22, 0.34)',
    borderRadius: radii.pill,
    height: 9,
    position: 'absolute',
    top: 64,
    width: 54,
  },
  // 50 de 70 mantém a proporção do 3b (80 de 112): o aro colorido precisa
  // desse peso para a bolha ler como verde/dourada de longe.
  innerDisc: {
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: radii.pill,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 50,
  },
  innerShine: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radii.pill,
    height: 14,
    left: 6,
    position: 'absolute',
    right: 6,
    top: 4,
  },
  lockBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 245, 242, 0.92)',
    borderColor: '#C2CECA',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 18,
  },
  lockedInnerDisc: {
    backgroundColor: '#C5D0CD',
  },
  lockedNode: {
    backgroundColor: '#8D9D98',
    borderBottomColor: '#566762',
    borderColor: '#E1EAE7',
  },
  lockedNumber: {
    color: '#334A45',
  },
  node: {
    alignItems: 'center',
    backgroundColor: '#5CD7E0',
    borderBottomColor: '#0B7590',
    borderBottomWidth: 5,
    borderColor: '#E4FBFF',
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 70,
    justifyContent: 'center',
    position: 'relative',
    width: 70,
    ...shadows.button,
  },
  nodeWrap: {
    alignItems: 'center',
    height: 98,
    justifyContent: 'flex-start',
    position: 'relative',
    width: 88,
  },
  number: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 27,
    marginTop: -2,
    textShadowColor: 'rgba(255, 255, 255, 0.72)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  },
  numberSmall: {
    fontSize: 19,
  },
  playRibbon: {
    alignItems: 'center',
    backgroundColor: '#F1497F',
    borderColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: 2,
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 2,
    position: 'absolute',
    ...shadows.button,
  },
  playRibbonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  pressable: {
    borderRadius: radii.pill,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 2 }, { scale: 0.98 }],
  },
  selectedAura: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 17,
    position: 'absolute',
    top: 58,
    width: 72,
  },
  selectedNode: {
    shadowOpacity: 0.42,
  },
  starArc: {
    alignItems: 'center',
    // As estrelas montam sobre a borda de baixo da bolha, não flutuam abaixo dela.
    bottom: 20,
    flexDirection: 'row',
    gap: 1,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  starCenter: {
    transform: [{ translateY: -3 }, { scale: 1.12 }],
  },
  starDimmed: {
    opacity: 0.62,
  },
  starMark: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  starLeft: {
    transform: [{ rotate: '-16deg' }],
  },
  starRight: {
    transform: [{ rotate: '16deg' }],
  },
});
