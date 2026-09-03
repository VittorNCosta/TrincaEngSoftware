import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameIcon } from './GameIcon';
import { PrimaryButton } from './PrimaryButton';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { formatLifeTimer } from '../storage/livesStorage';

type NoLivesModalProps = {
  timeUntilNextLifeMs: number;
  visible: boolean;
  onClose: () => void;
};

export function NoLivesModal({
  timeUntilNextLifeMs,
  visible,
  onClose,
}: NoLivesModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <GameIcon name="heart" size={74} tone="pink" />
          <Text style={styles.title}>Sem vidas</Text>
          <Text style={styles.description}>
            Aguarde a próxima vida para continuar jogando.
          </Text>
          <View style={styles.timerPill}>
            <Text style={styles.timerLabel}>Próxima vida em</Text>
            <Text style={styles.timerValue}>
              {formatLifeTimer(timeUntilNextLifeMs)}
            </Text>
          </View>
          <PrimaryButton title="Entendi" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF3C9',
    borderColor: '#F05278',
    borderRadius: 20,
    borderWidth: 4,
    gap: spacing.md,
    maxWidth: 360,
    overflow: 'hidden',
    padding: spacing.xl,
    width: '90%',
    ...shadows.card,
  },
  description: {
    color: colors.muted,
    fontSize: fontSizes.md,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(4, 10, 22, 0.78)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  timerLabel: {
    color: colors.dangerDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  timerPill: {
    alignItems: 'center',
    backgroundColor: '#FFE1E7',
    borderColor: '#FF9AAE',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  timerValue: {
    color: colors.ink,
    fontSize: fontSizes.xl,
    fontWeight: '900',
  },
  title: {
    color: colors.ink,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
});
