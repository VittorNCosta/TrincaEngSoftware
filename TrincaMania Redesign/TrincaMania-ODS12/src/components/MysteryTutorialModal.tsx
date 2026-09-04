import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from './PrimaryButton';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type MysteryTutorialModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function MysteryTutorialModal({
  visible,
  onClose,
}: MysteryTutorialModalProps) {
  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.tilePreview}>
            <View style={styles.tileFace}>
              <Text style={styles.questionMark}>?</Text>
            </View>
            <View pointerEvents="none" style={styles.tileGlow} />
          </View>

          <Text style={styles.title}>Pilha Misteriosa</Text>
          <Text style={styles.description}>
            {
              'Peças com ? escondem o símbolo real. Elas revelam quando ficam livres.'
            }
          </Text>

          <PrimaryButton title="Entendi" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF5D8',
    borderBottomColor: '#8D58DA',
    borderBottomWidth: 5,
    borderColor: '#D7C5FF',
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
  questionMark: {
    color: '#F8F2FF',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 42,
    textShadowColor: 'rgba(114, 236, 255, 0.7)',
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 8,
  },
  tileFace: {
    alignItems: 'center',
    backgroundColor: 'rgba(126, 77, 232, 0.66)',
    borderColor: 'rgba(242, 236, 255, 0.92)',
    borderRadius: radii.md,
    borderWidth: 2,
    height: 54,
    justifyContent: 'center',
    width: 54,
    zIndex: 1,
  },
  tileGlow: {
    backgroundColor: 'rgba(116, 235, 255, 0.28)',
    borderRadius: radii.pill,
    bottom: -8,
    left: -8,
    position: 'absolute',
    right: -8,
    top: -8,
  },
  tilePreview: {
    alignItems: 'center',
    backgroundColor: '#4B2E89',
    borderBottomColor: '#211046',
    borderBottomWidth: 5,
    borderColor: '#C7B6FF',
    borderWidth: 3,
    borderRadius: 16,
    height: 66,
    justifyContent: 'center',
    overflow: 'visible',
    width: 66,
    ...shadows.button,
  },
  title: {
    color: '#4B2E89',
    fontSize: fontSizes.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
});
