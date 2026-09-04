import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from './PrimaryButton';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type CampaignResizeNoticeModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function CampaignResizeNoticeModal({ visible, onClose }: CampaignResizeNoticeModalProps) {
  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>♻️</Text>
          </View>

          <Text style={styles.title}>A campanha mudou de tamanho</Text>
          <Text style={styles.description}>
            {
              'Cada mundo agora tem 10 fases em vez de 25, então o mapa ficou mais curto. Suas moedas, chaves e itens continuam do jeito que estavam — só o progresso além da fase 10 de um mundo não existe mais no mapa novo.'
            }
          </Text>

          <PrimaryButton title="Entendi" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTint,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 66,
    justifyContent: 'center',
    width: 66,
    ...shadows.button,
  },
  badgeIcon: {
    fontSize: 32,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.primaryDark,
    borderBottomWidth: 5,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 3,
    gap: spacing.sm,
    maxWidth: 340,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '88%',
    ...shadows.card,
  },
  description: {
    color: colors.muted,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 8, 28, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: fontSizes.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
});
