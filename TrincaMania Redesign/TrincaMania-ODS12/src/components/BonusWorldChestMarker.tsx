import { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from './GameIcon';
import { RewardAssetIcon } from './RewardAssetIcon';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type BonusWorldChestState = 'available' | 'claimed' | 'locked';

type BonusWorldChestMarkerProps = {
  completedCount: number;
  selected?: boolean;
  state: BonusWorldChestState;
  totalCount: number;
  onPress: () => void;
};

// Acima disso a placa mostra só o texto: segmento por fase deixaria de ser legível.
const MAX_PROGRESS_SEGMENTS = 6;

const getStateTitle = (state: BonusWorldChestState) => {
  switch (state) {
    case 'available':
      return 'BAÚ ESPECIAL';
    case 'claimed':
      return 'COLETADO';
    case 'locked':
    default:
      return 'BAÚ BLOQUEADO';
  }
};

function BonusWorldChestMarkerBase({
  completedCount,
  selected = false,
  state,
  totalCount,
  onPress,
}: BonusWorldChestMarkerProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const isAvailable = state === 'available';
  const isClaimed = state === 'claimed';
  const isLocked = state === 'locked';
  const showSegments = totalCount > 0 && totalCount <= MAX_PROGRESS_SEGMENTS;
  const isPressable = isAvailable;

  useEffect(() => {
    if (!isAvailable) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 820,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 820,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [isAvailable, pulse]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0.82],
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.14],
  });
  const chestLift = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });
  const chestScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <Pressable
      accessibilityLabel={`${getStateTitle(state)} ${completedCount}/${totalCount}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isPressable, selected: selected || isAvailable }}
      disabled={!isPressable}
      hitSlop={10}
      onPress={isPressable ? onPress : undefined}
      style={({ pressed }) => [
        styles.marker,
        isAvailable ? styles.markerAvailable : null,
        isClaimed ? styles.markerClaimed : null,
        selected ? styles.markerSelected : null,
        pressed ? styles.markerPressed : null,
      ]}
    >
      <View pointerEvents="none" style={styles.shadowPlate} />
      {isAvailable ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.readyGlow,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.readyRing,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
        </>
      ) : null}

      <Animated.View
        style={[
          styles.chestWrap,
          isLocked ? styles.chestWrapLocked : null,
          isClaimed ? styles.chestWrapClaimed : null,
          {
            transform: isAvailable
              ? [{ translateY: chestLift }, { scale: chestScale }]
              : [{ translateY: 0 }, { scale: 1 }],
          },
        ]}
      >
        <RewardAssetIcon name="chestWorld" size={86} style={styles.chestAsset} />
      </Animated.View>

      {/* Bloqueado = cadeado sobre a tampa. Sem véu escuro e sem barras cruzadas: a arte
          do baú continua legível e o estado se lê num relance. */}
      {isLocked ? (
        <View pointerEvents="none" style={styles.lockPlate}>
          <View style={styles.lockDisc} />
          <GameIcon name="lock" size={40} tone="neutral" variant="plain" />
        </View>
      ) : isAvailable ? (
        <View style={styles.readyBadge}>
          <Text style={styles.readyText}>!</Text>
        </View>
      ) : (
        <View style={styles.claimedBadge}>
          <GameIcon name="check" size={17} tone="green" variant="plain" />
        </View>
      )}

      <View
        style={[
          styles.labelPlate,
          isClaimed ? styles.labelPlateClaimed : null,
          isLocked ? styles.labelPlateLocked : null,
        ]}
      >
        <Text numberOfLines={1} style={styles.title}>
          {getStateTitle(state)}
        </Text>
        {showSegments ? (
          <View style={styles.progressRow}>
            {Array.from({ length: totalCount }).map((_, index) => (
              <View
                key={`chest-progress-${index}`}
                style={[styles.segment, index < completedCount ? styles.segmentDone : null]}
              />
            ))}
            <Text style={[styles.progress, isLocked ? styles.progressLocked : null]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        ) : (
          <Text numberOfLines={1} style={[styles.progress, isLocked ? styles.progressLocked : null]}>
            {completedCount}/{totalCount}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export const BonusWorldChestMarker = memo(BonusWorldChestMarkerBase);

const styles = StyleSheet.create({
  chestAsset: {
    height: 86,
    width: 130,
  },
  chestWrap: {
    alignItems: 'center',
    height: 82,
    justifyContent: 'center',
    marginTop: 2,
    width: 132,
    zIndex: 3,
  },
  chestWrapClaimed: {
    opacity: 0.82,
  },
  chestWrapLocked: {
    opacity: 0.72,
  },
  claimedBadge: {
    alignItems: 'center',
    backgroundColor: '#DDFBEA',
    borderColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 27,
    justifyContent: 'center',
    position: 'absolute',
    right: 9,
    top: 13,
    width: 27,
    zIndex: 6,
    ...shadows.button,
  },
  labelPlate: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 16, 68, 0.94)',
    borderColor: 'rgba(255, 225, 120, 0.78)',
    borderRadius: 8,
    borderWidth: 2,
    gap: 2,
    minHeight: 37,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    width: 128,
    zIndex: 4,
  },
  labelPlateClaimed: {
    backgroundColor: 'rgba(38, 68, 67, 0.94)',
    borderColor: 'rgba(220, 255, 242, 0.7)',
  },
  labelPlateLocked: {
    backgroundColor: 'rgba(30, 20, 44, 0.94)',
    borderColor: 'rgba(211, 222, 225, 0.66)',
  },
  // Disco de contraste atrás do cadeado: sem ele o cadeado claro se perde no ouro do baú.
  lockDisc: {
    backgroundColor: 'rgba(10, 18, 30, 0.42)',
    borderRadius: radii.pill,
    height: 46,
    position: 'absolute',
    width: 46,
  },
  lockPlate: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    left: 47,
    position: 'absolute',
    top: 24,
    width: 48,
    zIndex: 5,
  },
  marker: {
    alignItems: 'center',
    height: 136,
    justifyContent: 'flex-start',
    overflow: 'visible',
    paddingTop: 5,
    position: 'relative',
    width: 142,
  },
  markerAvailable: {
    shadowColor: '#FFE178',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.62,
    shadowRadius: 18,
  },
  markerClaimed: {
    opacity: 0.96,
  },
  markerPressed: {
    opacity: 0.92,
    transform: [{ translateY: 2 }, { scale: 0.98 }],
  },
  markerSelected: {
    transform: [{ scale: 1.02 }],
  },
  progress: {
    color: '#FFF4B8',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  progressLocked: {
    color: '#F8FBFF',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  readyBadge: {
    alignItems: 'center',
    backgroundColor: '#42E5A7',
    borderColor: '#DFFFEF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 11,
    width: 30,
    zIndex: 6,
    ...shadows.button,
  },
  readyGlow: {
    backgroundColor: 'rgba(177, 115, 255, 0.34)',
    borderRadius: radii.pill,
    height: 104,
    position: 'absolute',
    top: 0,
    width: 132,
    zIndex: 1,
  },
  readyRing: {
    borderColor: 'rgba(255, 225, 120, 0.88)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 100,
    position: 'absolute',
    top: 2,
    width: 134,
    zIndex: 2,
  },
  readyText: {
    color: '#073524',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  segment: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: radii.pill,
    height: 5,
    width: 16,
  },
  segmentDone: {
    backgroundColor: '#22C88C',
  },
  shadowPlate: {
    backgroundColor: 'rgba(59, 28, 88, 0.42)',
    borderRadius: radii.pill,
    bottom: 30,
    height: 20,
    position: 'absolute',
    width: 112,
    zIndex: 0,
  },
  title: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    lineHeight: 13,
    textAlign: 'center',
  },
});
