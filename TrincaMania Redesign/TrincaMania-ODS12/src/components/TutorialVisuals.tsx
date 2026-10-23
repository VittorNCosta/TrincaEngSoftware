import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ReactNode } from 'react';

import { radii, spacing } from '../styles/theme';

// Presentation and artwork copied from the original web tutorial (df882fb).
export const tutorialPalette = {
  wood: '#613B1C',
  woodDark: '#2C1C10',
  cream: '#FFF3CE',
  moss: '#35531B',
};

export function useTutorialReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReducedMotion(value);
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
  return reducedMotion;
}

export function TutorialFrame({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <View style={styles.frame}>
      {onClose ? (
        <Pressable
          accessibilityLabel="Fechar tutorial"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.close}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      ) : null}
      <View style={[styles.content, onClose ? styles.closeSpacing : null]}>
        {children}
      </View>
    </View>
  );
}

export function TutorialGuide() {
  return (
    <Image
      accessible={false}
      source={require('../../assets/ui/tutorials/tutorial_guide.png')}
      resizeMode="contain"
      style={styles.guide}
    />
  );
}

export function TutorialTarget({ showHand = true }: { showHand?: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.target]}
    >
      <Image
        accessible={false}
        source={require('../../assets/ui/tutorials/tutorial_glow.png')}
        resizeMode="stretch"
        style={styles.glow}
      />
      {showHand ? (
        <Image
          accessible={false}
          source={require('../../assets/ui/tutorials/tutorial_pointer.png')}
          resizeMode="contain"
          style={styles.pointer}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: tutorialPalette.cream,
    borderColor: tutorialPalette.wood,
    borderWidth: 2,
    borderRadius: radii.menuCard,
    padding: spacing.md,
    flexShrink: 1,
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: { color: tutorialPalette.woodDark, fontSize: 28 },
  content: { flexShrink: 1 },
  closeSpacing: { paddingTop: 32 },
  guide: { width: 70, height: 88 },
  target: { zIndex: 40 },
  pointer: {
    position: 'absolute',
    width: 72,
    height: 72,
    left: '50%',
    top: '50%',
    transform: [{ translateX: -20.16 }, { translateY: -20.16 }],
  },
  glow: {
    position: 'absolute',
    width: '160%',
    height: '160%',
    left: '-30%',
    top: '-30%',
  },
});
