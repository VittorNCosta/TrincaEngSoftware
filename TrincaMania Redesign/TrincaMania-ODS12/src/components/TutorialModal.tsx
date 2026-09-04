import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameIcon, GameIconName, GameIconTone } from './GameIcon';
import { PrimaryButton } from './PrimaryButton';
import { activeMatchRule } from '../domain/recycling/policies/MatchRuleRegistry';
import { BASE_TRAY_CAPACITY } from '../storage/trayBoostStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type TutorialModalProps = {
  visible: boolean;
  onFinish: () => void;
};

type TutorialStep = {
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
    text: 'Peças claras podem entrar na barra de coleta. Peças escuras ainda estão presas por outra camada.',
  },
  {
    iconName: 'check',
    iconTone: 'green',
    // A regra do jogo mora no domínio; o tutorial só a repete. Assim trocar a
    // regra não deixa o tutorial ensinando algo que o jogo não faz mais.
    title: activeMatchRule.label,
    text: `${activeMatchRule.description} A cor da peça é a cor da lixeira daquele material.`,
  },
  {
    iconName: 'tray',
    iconTone: 'danger',
    title: 'Cuide da barra',
    text: `A bandeja começa com ${BASE_TRAY_CAPACITY} espaços ativos. Forme trincas antes que ela encha; extras são apenas uma ajuda.`,
  },
  {
    iconName: 'powers',
    iconTone: 'purple',
    title: 'Use itens mágicos',
    text: 'Trinca Mágica, Voltar e Misturar ajudam nas fases difíceis. Eles gastam moedas.',
  },
];

export function TutorialModal({ visible, onFinish }: TutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const step = TUTORIAL_STEPS[stepIndex];
  const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    if (!visible) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      return;
    }

    cardOpacity.setValue(0);
    cardScale.setValue(0.92);
    Animated.parallel([
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
    ]).start();
  }, [cardOpacity, cardScale, stepIndex, visible]);

  const finishTutorial = () => {
    setStepIndex(0);
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
    <Modal animationType="none" transparent visible={visible}>
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={styles.overlay}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <Text style={styles.kicker}>Guia da campanha</Text>
          <GameIcon name={step.iconName} size={68} tone={step.iconTone} />
          <View style={styles.stepDots}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={`tutorial-dot-${index}`}
                style={[
                  styles.stepDot,
                  index === stepIndex ? styles.activeStepDot : null,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepCount}>
            {stepIndex + 1}/{TUTORIAL_STEPS.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>

          <View style={styles.examplePanel}>
            <Text style={styles.exampleText}>
              Escolha peças livres para montar trincas e avançar pelo mapa.
            </Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              title={isLastStep ? 'Começar' : 'Próximo'}
              onPress={nextStep}
            />
            <PrimaryButton
              size="compact"
              testID="tutorial-pular"
              title="Pular"
              variant="secondary"
              onPress={finishTutorial}
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
  activeStepDot: {
    backgroundColor: colors.primary,
    width: 24,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF5D8',
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 5,
    borderColor: colors.primary,
    borderRadius: 18,
    borderWidth: 3,
    gap: spacing.sm,
    maxWidth: 350,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '90%',
    ...shadows.card,
  },
  examplePanel: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: 2,
    padding: spacing.sm,
    width: '100%',
  },
  exampleText: {
    color: colors.ink,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    lineHeight: 19,
    textAlign: 'center',
  },
  kicker: {
    color: colors.primaryDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
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
    color: colors.muted,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    lineHeight: 26,
    textAlign: 'center',
  },
});
