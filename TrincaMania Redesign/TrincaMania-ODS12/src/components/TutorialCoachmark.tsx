import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../styles/theme';
import { PrimaryButton } from './PrimaryButton';
import {
  TutorialFrame,
  TutorialGuide,
  tutorialPalette,
  useTutorialReducedMotion,
} from './TutorialVisuals';

export function TutorialCoachmark({
  message,
  onAdvance,
}: {
  message?: { title: string; text: string; button: string };
  onAdvance: () => void;
}) {
  const reducedMotion = useTutorialReducedMotion();
  const { height } = useWindowDimensions();
  return (
    <Modal
      accessibilityLabel={message?.title}
      animationType={reducedMotion ? 'none' : 'fade'}
      transparent
      visible={Boolean(message)}
      onRequestClose={() => undefined}
    >
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={styles.overlay}
      >
        {message ? (
          <View style={[styles.card, { maxHeight: height - spacing.md * 2 }]}>
            <TutorialFrame>
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
              >
                <View style={styles.header}>
                  <TutorialGuide />
                  <View style={styles.heading}>
                    <Text style={styles.kicker}>Aprenda jogando</Text>
                    <Text style={styles.title}>{message.title}</Text>
                  </View>
                </View>
                <Text style={styles.text}>{message.text}</Text>
                <PrimaryButton
                  testID="tutorial-pratico-avancar"
                  title={message.button}
                  onPress={onAdvance}
                />
              </ScrollView>
            </TutorialFrame>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(44, 28, 16, 0.65)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: { maxWidth: 350, width: '100%', overflow: 'hidden' },
  content: { gap: spacing.sm },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  heading: { flex: 1, minWidth: 0, gap: spacing.xs },
  kicker: {
    color: tutorialPalette.moss,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: tutorialPalette.woodDark,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  text: {
    color: tutorialPalette.woodDark,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
});
