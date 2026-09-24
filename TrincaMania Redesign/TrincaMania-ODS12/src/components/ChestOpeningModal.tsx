import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChestArt, ChestGlow, ChestVariant, RewardBurst } from './ChestArt';
import { GameIcon, GameIconName, GameIconTone } from './GameIcon';
import { PrimaryButton } from './PrimaryButton';
import { RewardCollectOverlay } from './RewardCollectOverlay';
import { RewardAssetIcon, RewardAssetName } from './RewardAssetIcon';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { ChestRewardType } from '../types/game';
import { WindowTarget } from '../types/ui';
import { lightImpact } from '../utils/haptics';

export type ChestRewardItem = {
  iconName: GameIconName;
  label: string;
  tone: GameIconTone;
};

type ChestOpeningModalProps = {
  animationKey?: string;
  kicker?: string;
  rewardItems?: ChestRewardItem[];
  rewardText?: string;
  rewardType?: ChestRewardType;
  title?: string;
  variant?: ChestVariant;
  visible: boolean;
  coinCollectTarget?: WindowTarget;
  onClose: () => void;
  onOpenMoment?: () => void;
  onRewardMoment?: () => void;
};

const getRewardAssetForIcon = (
  iconName: GameIconName,
): RewardAssetName | undefined => {
  switch (iconName) {
    case 'coin':
      return 'coin';
    case 'heart':
      return 'life';
    case 'key':
      return 'key';
    default:
      return undefined;
  }
};

const getCoinAmountFromLabel = (label: string) => {
  const match = label.match(/\+?\s*(\d+)/);

  return match ? Number(match[1]) : 0;
};

const getCoinCollectAmount = (
  rewardItems: ChestRewardItem[],
  rewardText: string,
  rewardType: ChestRewardType,
) => {
  const coinRewardItem = rewardItems.find((item) => item.iconName === 'coin');

  if (coinRewardItem) {
    return getCoinAmountFromLabel(coinRewardItem.label);
  }

  return rewardType === 'coins' ? getCoinAmountFromLabel(rewardText) : 0;
};

export function ChestOpeningModal({
  animationKey = 'common-chest-opening',
  kicker,
  rewardItems,
  rewardText = '',
  rewardType = 'coins',
  title,
  variant = 'common',
  visible,
  coinCollectTarget,
  onClose,
  onOpenMoment,
  onRewardMoment,
}: ChestOpeningModalProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [canContinue, setCanContinue] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const onOpenMomentRef = useRef(onOpenMoment);
  const onRewardMomentRef = useRef(onRewardMoment);
  const isWorld = variant === 'world';
  const fallbackRewardItem: ChestRewardItem = {
    iconName: rewardType === 'life' ? 'heart' : 'coin',
    label: rewardText,
    tone: rewardType === 'life' ? 'pink' : 'gold',
  };
  const visibleRewards = rewardItems?.length
    ? rewardItems
    : [fallbackRewardItem];
  const mainReward = visibleRewards[0] ?? fallbackRewardItem;
  const mainRewardAsset = getRewardAssetForIcon(mainReward.iconName);
  const kickerText = kicker ?? (isWorld ? 'Baú de Mundo' : 'Baú Comum');
  const titleText =
    title ?? (isWorld ? 'Recompensa Especial' : 'Baú desbloqueado!');
  const coinCollectAmount = getCoinCollectAmount(
    visibleRewards,
    rewardText,
    rewardType,
  );

  useEffect(() => {
    onOpenMomentRef.current = onOpenMoment;
  }, [onOpenMoment]);

  useEffect(() => {
    onRewardMomentRef.current = onRewardMoment;
  }, [onRewardMoment]);

  useEffect(() => {
    if (!visible) {
      progress.stopAnimation();
      progress.setValue(0);
      setCanContinue(false);
      setIsCollecting(false);
      return undefined;
    }

    setCanContinue(false);
    setIsCollecting(false);
    progress.stopAnimation();
    progress.setValue(0);

    const openTimer = setTimeout(
      () => {
        onOpenMomentRef.current?.();
      },
      isWorld ? 560 : 650,
    );
    const rewardTimer = setTimeout(
      () => {
        onRewardMomentRef.current?.();
      },
      isWorld ? 1020 : 1080,
    );
    const continueTimer = setTimeout(
      () => {
        setCanContinue(true);
      },
      isWorld ? 1840 : 1720,
    );

    const animation = Animated.timing(progress, {
      duration: isWorld ? 1900 : 1760,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      clearTimeout(openTimer);
      clearTimeout(rewardTimer);
      clearTimeout(continueTimer);
      animation.stop();
    };
  }, [animationKey, isWorld, progress, visible]);

  const handleCollect = () => {
    if (isCollecting) {
      return;
    }

    lightImpact();
    onRewardMomentRef.current?.();

    if (coinCollectAmount > 0) {
      setIsCollecting(true);
      return;
    }

    onClose();
  };

  const handleCollectAnimationComplete = () => {
    setIsCollecting(false);
    onClose();
  };

  const modalOpacity = progress.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 1, 1],
  });
  const stageScale = progress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.96, 1, 1],
  });
  const chestLift = progress.interpolate({
    inputRange: [0, 0.22, 0.52, 0.62, 0.78, 1],
    outputRange: [42, 0, 0, isWorld ? 13 : 10, isWorld ? -5 : -3, 0],
  });
  const chestScale = progress.interpolate({
    inputRange: [0, 0.16, 0.28, 0.54, 0.66, 1],
    outputRange: [0.85, isWorld ? 1.12 : 1.08, 1, 1, isWorld ? 1.07 : 1.05, 1],
  });
  const chestSquash = progress.interpolate({
    inputRange: [0, 0.52, 0.62, 0.74, 1],
    outputRange: [1, 1, 0.92, 1.04, 1],
  });
  const chestRotate = progress.interpolate({
    inputRange: [0, 0.28, 0.36, 0.44, 0.52, 0.6, 0.7, 1],
    outputRange: [
      '0deg',
      '0deg',
      isWorld ? '-5deg' : '-4deg',
      isWorld ? '5deg' : '4deg',
      '-3deg',
      '2deg',
      '-1deg',
      '0deg',
    ],
  });
  const glowOpacity = progress.interpolate({
    inputRange: [0, 0.2, 0.54, 0.78, 1],
    outputRange: [
      0,
      0.18,
      isWorld ? 1 : 0.9,
      isWorld ? 0.78 : 0.68,
      isWorld ? 0.72 : 0.6,
    ],
  });
  const glowScale = progress.interpolate({
    inputRange: [0, 0.54, 1],
    outputRange: [0.78, isWorld ? 1.58 : 1.42, isWorld ? 1.36 : 1.28],
  });
  const flashOpacity = progress.interpolate({
    inputRange: [0, 0.56, 0.66, 0.82, 1],
    outputRange: [0, 0, isWorld ? 0.88 : 0.78, 0, 0],
  });
  const ringOpacity = progress.interpolate({
    inputRange: [0, 0.54, 0.66, 0.86, 1],
    outputRange: [0, 0, isWorld ? 0.72 : 0.62, 0, 0],
  });
  const ringScale = progress.interpolate({
    inputRange: [0, 0.54, 0.66, 0.86, 1],
    outputRange: [0.54, 0.54, 1, isWorld ? 1.72 : 1.56, isWorld ? 1.72 : 1.56],
  });
  const rewardBeamOpacity = progress.interpolate({
    inputRange: [0, 0.56, 0.72, 0.9, 1],
    outputRange: [0, 0, isWorld ? 0.78 : 0.68, 0.2, 0],
  });
  const rewardBeamLift = progress.interpolate({
    inputRange: [0, 0.56, 0.9, 1],
    outputRange: [18, 18, -24, -24],
  });
  const rewardBeamScale = progress.interpolate({
    inputRange: [0, 0.56, 0.76, 1],
    outputRange: [0.72, 0.72, isWorld ? 1.18 : 1.05, 0.88],
  });
  const rewardOpacity = progress.interpolate({
    inputRange: [0, 0.72, 0.9, 1],
    outputRange: [0, 0, 1, 1],
  });
  const rewardScale = progress.interpolate({
    inputRange: [0, 0.72, 0.88, 1],
    outputRange: [0.82, 0.82, isWorld ? 1.18 : 1.15, 1],
  });
  const rewardLift = progress.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [22, 22, 0],
  });
  const buttonOpacity = progress.interpolate({
    inputRange: [0, 0.84, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={[styles.overlay, isWorld ? styles.overlayWorld : null]}
        >
          <Animated.View
            style={[
              styles.card,
              isWorld ? styles.cardWorld : null,
              { opacity: modalOpacity, transform: [{ scale: stageScale }] },
            ]}
          >
            <View
              pointerEvents="none"
              style={[styles.cardWash, isWorld ? styles.cardWashWorld : null]}
            />
            <Text style={[styles.kicker, isWorld ? styles.kickerWorld : null]}>
              {kickerText}
            </Text>
            <Text style={styles.title}>{titleText}</Text>

            <View style={[styles.stage, isWorld ? styles.stageWorld : null]}>
              <ChestGlow
                opacity={glowOpacity}
                scale={glowScale}
                variant={variant}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.flash,
                  isWorld ? styles.flashWorld : null,
                  { opacity: flashOpacity },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.openRing,
                  isWorld ? styles.openRingWorld : null,
                  {
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.rewardBeam,
                  isWorld ? styles.rewardBeamWorld : null,
                  {
                    opacity: rewardBeamOpacity,
                    transform: [
                      { translateY: rewardBeamLift },
                      { scale: rewardBeamScale },
                    ],
                  },
                ]}
              />
              <RewardBurst progress={progress} variant={variant} />
              <Animated.View
                style={[
                  styles.chestHolder,
                  {
                    transform: [
                      { translateY: chestLift },
                      { rotate: chestRotate },
                      { scale: chestScale },
                      { scaleY: chestSquash },
                    ],
                  },
                ]}
              >
                <ChestArt
                  openProgress={progress}
                  size={isWorld ? 198 : 176}
                  variant={variant}
                />
              </Animated.View>
            </View>

            <Animated.View
              style={[
                styles.rewardPanel,
                isWorld ? styles.rewardPanelWorld : null,
                {
                  opacity: rewardOpacity,
                  transform: [
                    { translateY: rewardLift },
                    { scale: rewardScale },
                  ],
                },
              ]}
            >
              {isWorld ? (
                <>
                  <View style={styles.rewardHeroRow}>
                    {mainRewardAsset ? (
                      <RewardAssetIcon name={mainRewardAsset} size={64} />
                    ) : (
                      <GameIcon
                        name={mainReward.iconName}
                        size={52}
                        tone={mainReward.tone}
                      />
                    )}
                    <View style={styles.rewardHeroCopy}>
                      <Text numberOfLines={1} style={styles.rewardKicker}>
                        Recompensa Especial
                      </Text>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                        style={styles.rewardText}
                      >
                        {mainReward.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rewardGrid}>
                    {visibleRewards.map((item) => (
                      <View
                        key={`${item.iconName}-${item.label}`}
                        style={styles.rewardChip}
                      >
                        <GameIcon
                          name={item.iconName}
                          size={24}
                          tone={item.tone}
                        />
                        <Text numberOfLines={1} style={styles.rewardChipText}>
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.rewardHeroRow}>
                  {mainRewardAsset ? (
                    <RewardAssetIcon name={mainRewardAsset} size={68} />
                  ) : (
                    <GameIcon
                      name={mainReward.iconName}
                      size={54}
                      tone={mainReward.tone}
                    />
                  )}
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                    style={styles.rewardText}
                  >
                    {mainReward.label}
                  </Text>
                </View>
              )}
            </Animated.View>

            <View style={styles.statusShell}>
              <Text
                style={[
                  styles.statusText,
                  isWorld ? styles.statusTextWorld : null,
                ]}
              >
                {canContinue ? 'Recompensa!' : 'Abrindo baú...'}
              </Text>
            </View>
            <Animated.View style={[styles.action, { opacity: buttonOpacity }]}>
              {canContinue ? (
                <PrimaryButton
                  disabled={isCollecting}
                  title={isCollecting ? 'Coletando...' : 'Coletar'}
                  onPress={handleCollect}
                />
              ) : null}
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
        <RewardCollectOverlay
          animationKey={`${animationKey}-${coinCollectAmount}`}
          coinAmount={coinCollectAmount}
          coinTarget={coinCollectTarget}
          visible={isCollecting && coinCollectAmount > 0}
          onComplete={handleCollectAnimationComplete}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: {
    minHeight: 62,
    width: '100%',
  },
  modalRoot: {
    flex: 1,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#5A35C8',
    borderColor: '#FFD35A',
    borderRadius: 18,
    borderWidth: 3,
    gap: spacing.xs,
    maxWidth: 388,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
    width: '92%',
    ...shadows.card,
  },
  cardWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.pill,
    height: 120,
    left: -40,
    position: 'absolute',
    right: -40,
    top: -72,
  },
  cardWashWorld: {
    backgroundColor: 'rgba(255, 211, 90, 0.16)',
    height: 150,
  },
  cardWorld: {
    backgroundColor: '#241044',
    borderColor: '#FFE178',
    maxWidth: 404,
  },
  chestHolder: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  flash: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: radii.pill,
    height: 172,
    position: 'absolute',
    width: 172,
  },
  flashWorld: {
    backgroundColor: 'rgba(255, 244, 184, 0.9)',
    height: 212,
    width: 212,
  },
  openRing: {
    borderColor: 'rgba(255, 244, 184, 0.9)',
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 166,
    position: 'absolute',
    width: 210,
    zIndex: 2,
  },
  openRingWorld: {
    borderColor: 'rgba(255, 225, 120, 0.92)',
    height: 204,
    width: 258,
  },
  kicker: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  kickerWorld: {
    color: '#FFF4B8',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(3, 8, 18, 0.9)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  overlayWorld: {
    backgroundColor: 'rgba(8, 3, 24, 0.94)',
  },
  rewardChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderColor: 'rgba(255, 225, 120, 0.34)',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  rewardChipText: {
    color: colors.inkOnDark,
    fontSize: 10,
    fontWeight: '900',
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    width: '100%',
  },
  rewardBeam: {
    backgroundColor: 'rgba(255, 244, 184, 0.6)',
    borderRadius: radii.pill,
    height: 112,
    position: 'absolute',
    top: 54,
    width: 58,
    zIndex: 3,
  },
  rewardBeamWorld: {
    backgroundColor: 'rgba(255, 225, 120, 0.62)',
    height: 136,
    top: 58,
    width: 72,
  },
  rewardHeroCopy: {
    flex: 1,
    minWidth: 0,
  },
  rewardHeroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    width: '100%',
  },
  rewardKicker: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rewardPanel: {
    alignItems: 'center',
    backgroundColor: '#FFF8E6',
    borderBottomColor: '#A55D00',
    borderBottomWidth: 5,
    borderColor: '#FFD35A',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  rewardPanelWorld: {
    backgroundColor: 'rgba(255, 248, 230, 0.14)',
    borderBottomColor: '#9F6A00',
    borderColor: '#FFE178',
    minHeight: 126,
  },
  rewardText: {
    color: colors.primaryDark,
    flexShrink: 1,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
    height: 226,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  stageWorld: {
    height: 246,
  },
  statusShell: {
    alignItems: 'center',
    minHeight: 18,
    justifyContent: 'center',
  },
  statusText: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statusTextWorld: {
    color: '#FFF4B8',
  },
  title: {
    color: colors.inkOnDark,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { height: 3, width: 0 },
    textShadowRadius: 3,
  },
});
