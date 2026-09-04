import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameIcon } from './GameIcon';
import { PrimaryButton } from './PrimaryButton';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type BonusWorldAchievementModalProps = {
  visible: boolean;
  onContinueMap: () => void;
  onGoToBonusWorld: () => void;
};

export function BonusWorldAchievementModal({
  visible,
  onContinueMap,
  onGoToBonusWorld,
}: BonusWorldAchievementModalProps) {
  const entry = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      entry.setValue(0);
      return;
    }

    entry.setValue(0);
    Animated.spring(entry, {
      friction: 7,
      tension: 120,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entry, visible]);

  const cardTranslateY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const starScale = entry.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0.5, 1.12, 1],
  });

  return (
    <Modal
      animationType="none"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={styles.overlay}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: entry,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <View pointerEvents="none" style={styles.sparkleLayer}>
            <Animated.Text
              style={[
                styles.sparkle,
                styles.sparkleTop,
                { transform: [{ scale: starScale }] },
              ]}
            >
              {'\u2728'}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkle,
                styles.sparkleLeft,
                { transform: [{ scale: starScale }] },
              ]}
            >
              {'\u2B50'}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.sparkle,
                styles.sparkleRight,
                { transform: [{ scale: starScale }] },
              ]}
            >
              {'\u2728'}
            </Animated.Text>
          </View>

          <GameIcon name="bonus" size={72} tone="pink" />
          <Text style={styles.kicker}>Conquista desbloqueada!</Text>
          <Text style={styles.title}>Mundo bônus desbloqueado!</Text>
          <Text style={styles.subtitle}>Jardim Renascido está disponível.</Text>
          <View style={styles.rewardBox}>
            <Text style={styles.rewardText}>
              Você conquistou 3 estrelas em todas as fases do Parque da Coleta
              Seletiva.
            </Text>
          </View>
          <View style={styles.actions}>
            <PrimaryButton
              title="Ir para o mundo bônus"
              onPress={onGoToBonusWorld}
            />
            <PrimaryButton
              size="compact"
              title="Continuar no mapa"
              variant="secondary"
              onPress={onContinueMap}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF5D8',
    borderColor: '#FFD36A',
    borderRadius: 22,
    borderWidth: 4,
    gap: spacing.sm,
    maxWidth: 390,
    overflow: 'hidden',
    padding: spacing.lg,
    width: '90%',
    ...shadows.card,
    elevation: 24,
    zIndex: 20,
  },
  kicker: {
    color: '#C75693',
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 4, 16, 0.9)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  rewardBox: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FFB9D8',
    borderRadius: radii.card,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  rewardText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  sparkle: {
    color: '#FFD36A',
    fontSize: 28,
    fontWeight: '900',
    position: 'absolute',
  },
  sparkleLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sparkleLeft: {
    left: 24,
    top: 88,
  },
  sparkleRight: {
    right: 24,
    top: 104,
  },
  sparkleTop: {
    right: 72,
    top: 24,
  },
  subtitle: {
    color: colors.ink,
    fontSize: fontSizes.md,
    fontWeight: '900',
    textAlign: 'center',
  },
  title: {
    color: colors.primaryDark,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
});
