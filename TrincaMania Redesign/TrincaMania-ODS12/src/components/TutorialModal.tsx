import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameIcon, GameIconName, GameIconTone } from './GameIcon';
import { PrimaryButton } from './PrimaryButton';
import { TutorialDemoStage } from './TutorialDemoStage';
import {
  TutorialFrame,
  TutorialGuide,
  tutorialPalette,
} from './TutorialVisuals';
import type { TutorialDemoKind } from '../utils/tutorialPractice';
import { activeMatchRule } from '../domain/recycling/policies/MatchRuleRegistry';
import { BASE_TRAY_CAPACITY } from '../storage/trayBoostStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type TutorialModalProps = {
  mode?: 'automatic' | 'manual';
  visible: boolean;
  onFinish: () => void;
};

type TutorialStep = {
  demo?: TutorialDemoKind;
  iconName: GameIconName;
  iconTone: GameIconTone;
  title: string;
  text: string;
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    iconName: 'target',
    iconTone: 'blue',
    title: 'Escolha peças livres',
    text: 'Peças claras podem entrar na bandeja. Peças escuras ainda estão presas por outra camada.',
  },
  {
    demo: 'cycle',
    iconName: 'check',
    iconTone: 'green',
    // A regra do jogo mora no domínio; o tutorial só a repete. Assim trocar a
    // regra não deixa o tutorial ensinando algo que o jogo não faz mais.
    title: activeMatchRule.label,
    text: `${activeMatchRule.description} A cor da peça é a cor da lixeira daquele material.`,
  },
  {
    demo: 'tray',
    iconName: 'tray',
    iconTone: 'danger',
    title: 'Cuide da bandeja',
    text: `Você começa com ${BASE_TRAY_CAPACITY} espaços. Se a bandeja encher, a partida termina.`,
  },
  {
    iconName: 'powers',
    iconTone: 'purple',
    title: 'Use itens de apoio',
    text: 'Use um item de apoio quando precisar de ajuda para formar trincas.',
  },
  {
    demo: 'hint',
    iconName: 'hint',
    iconTone: 'purple',
    title: 'Trinca automática',
    text: 'Forma uma trinca possível com peças livres e da bandeja. Use para abrir espaço.',
  },
  {
    demo: 'shuffle',
    iconName: 'shuffle',
    iconTone: 'blue',
    title: 'Misturar peças',
    text: 'Reorganiza as peças restantes. Use quando estiver difícil encontrar uma jogada.',
  },
  {
    demo: 'undo',
    iconName: 'undo',
    iconTone: 'green',
    title: 'Voltar jogada',
    text: 'Desfaz sua última escolha válida. Use antes que a bandeja fique cheia.',
  },
];

const INTRO_STEP_COUNT = 4;
const LIBRARY_SECTIONS = [
  { title: 'Básico', indexes: [0, 1, 2] },
  { title: 'Itens de apoio', indexes: [4, 5, 6] },
] as const;

export function TutorialModal({
  mode = 'automatic',
  visible,
  onFinish,
}: TutorialModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);
  const [manualStepIndex, setManualStepIndex] = useState<number | undefined>();
  const [reducedMotion, setReducedMotion] = useState(true);
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const showingLibrary = mode === 'manual' && manualStepIndex === undefined;
  const step = showingLibrary
    ? undefined
    : TUTORIAL_STEPS[mode === 'manual' ? manualStepIndex! : stepIndex];
  const isLastStep = stepIndex === INTRO_STEP_COUNT - 1;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReducedMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    cardOpacity.stopAnimation();
    cardScale.stopAnimation();
    if (!visible) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      return undefined;
    }
    if (reducedMotion) {
      cardOpacity.setValue(1);
      cardScale.setValue(1);
      return undefined;
    }

    cardOpacity.setValue(0);
    cardScale.setValue(0.92);
    const entrance = Animated.parallel([
      Animated.timing(cardOpacity, {
        duration: 150,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        friction: 7,
        tension: 130,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [
    cardOpacity,
    cardScale,
    manualStepIndex,
    mode,
    reducedMotion,
    stepIndex,
    visible,
  ]);

  const finishTutorial = () => {
    setStepIndex(0);
    setManualStepIndex(undefined);
    onFinish();
  };

  const nextStep = () => {
    if (isLastStep) {
      finishTutorial();
      return;
    }

    setStepIndex((currentStepIndex) => currentStepIndex + 1);
  };

  return (
    <Modal
      accessibilityLabel={'Como jogar'}
      animationType="none"
      onRequestClose={finishTutorial}
      transparent
      visible={visible}
    >
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={styles.overlay}
      >
        <ScrollView
          contentContainerStyle={styles.overlayContent}
          keyboardShouldPersistTaps="handled"
          testID="tutorial-modal"
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.card,
              { maxHeight: windowHeight - spacing.md * 2 },
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <TutorialFrame onClose={finishTutorial}>
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.cardContent}
              >
                {showingLibrary ? (
                  <>
                    <View style={styles.header}>
                      <TutorialGuide />
                      <View style={styles.headerCopy}>
                        <Text style={styles.kicker}>Guia de mecânicas</Text>
                        <Text style={styles.title}>Como jogar</Text>
                      </View>
                    </View>
                    <Text style={styles.text}>
                      Escolha um assunto para rever quando quiser.
                    </Text>
                    {LIBRARY_SECTIONS.map((section) => (
                      <View key={section.title} style={styles.librarySection}>
                        <Text style={styles.librarySectionTitle}>
                          {section.title}
                        </Text>
                        {section.indexes.map((index) => {
                          const item = TUTORIAL_STEPS[index];
                          return (
                            <Pressable
                              key={item.title}
                              accessibilityLabel={item.title}
                              accessibilityRole="button"
                              onPress={() => setManualStepIndex(index)}
                              style={({ pressed }) => [
                                styles.libraryItem,
                                pressed ? styles.libraryItemPressed : null,
                              ]}
                            >
                              <GameIcon
                                name={item.iconName}
                                size={26}
                                tone={item.iconTone}
                              />
                              <View style={styles.libraryCopy}>
                                <Text style={styles.libraryItemText}>
                                  {item.title}
                                </Text>
                                <Text
                                  numberOfLines={2}
                                  style={styles.libraryDescription}
                                >
                                  {item.text}
                                </Text>
                              </View>
                              <GameIcon name="next" size={18} tone="green" />
                            </Pressable>
                          );
                        })}
                      </View>
                    ))}
                    <View style={styles.actions}>
                      <PrimaryButton title="Fechar" onPress={finishTutorial} />
                    </View>
                  </>
                ) : step ? (
                  <>
                    <View style={styles.header}>
                      <TutorialGuide />
                      <View style={styles.headerCopy}>
                        <Text style={styles.kicker}>
                          {mode === 'manual'
                            ? 'Como jogar'
                            : 'Guia da campanha'}
                        </Text>
                        <Text style={styles.title}>{step.title}</Text>
                      </View>
                    </View>
                    {mode === 'automatic' ? (
                      <>
                        <View style={styles.stepDots}>
                          {TUTORIAL_STEPS.slice(0, INTRO_STEP_COUNT).map(
                            (_, index) => (
                              <View
                                key={`tutorial-dot-${index}`}
                                style={[
                                  styles.stepDot,
                                  index === stepIndex
                                    ? styles.activeStepDot
                                    : null,
                                ]}
                              />
                            ),
                          )}
                        </View>
                        <Text style={styles.stepCount}>
                          {stepIndex + 1}/{INTRO_STEP_COUNT}
                        </Text>
                      </>
                    ) : null}
                    {step.demo ? (
                      <TutorialDemoStage
                        key={step.demo}
                        kind={step.demo}
                        visible={visible}
                      />
                    ) : null}
                    <Text style={styles.text}>{step.text}</Text>

                    <View style={styles.actions}>
                      <PrimaryButton
                        title={
                          mode === 'manual'
                            ? 'Voltar aos tutoriais'
                            : isLastStep
                              ? 'Começar'
                              : 'Próximo'
                        }
                        onPress={
                          mode === 'manual'
                            ? () => setManualStepIndex(undefined)
                            : nextStep
                        }
                      />
                      <PrimaryButton
                        size="compact"
                        testID="tutorial-pular"
                        title={mode === 'manual' ? 'Fechar' : 'Pular'}
                        variant="secondary"
                        onPress={finishTutorial}
                      />
                    </View>
                  </>
                ) : null}
              </ScrollView>
            </TutorialFrame>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    width: '100%',
  },
  activeStepDot: {
    backgroundColor: colors.primary,
    width: 24,
  },
  card: {
    backgroundColor: 'transparent',
    maxWidth: 370,
    overflow: 'hidden',
    width: '100%',
    ...shadows.card,
  },
  cardContent: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 80,
  },
  headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  libraryCopy: { flex: 1, minWidth: 0, gap: 4 },
  libraryDescription: {
    color: tutorialPalette.wood,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  kicker: {
    color: tutorialPalette.moss,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  libraryItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF45',
    borderColor: '#613B1C40',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 66,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  libraryItemPressed: {
    opacity: 0.72,
  },
  libraryItemText: {
    color: tutorialPalette.woodDark,
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  librarySection: {
    gap: spacing.xs,
    width: '100%',
  },
  librarySectionTitle: {
    color: tutorialPalette.moss,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  overlay: {
    backgroundColor: 'rgba(44, 28, 16, 0.65)',
    flex: 1,
  },
  overlayContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  stepCount: {
    color: colors.primaryDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  stepDot: {
    backgroundColor: colors.borderStrong,
    borderRadius: radii.pill,
    height: 8,
    width: 8,
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  text: {
    color: tutorialPalette.woodDark,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'left',
  },
  title: {
    color: tutorialPalette.woodDark,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    lineHeight: 26,
    textAlign: 'left',
  },
});
