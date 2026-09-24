import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../styles/theme';

type ScreenShellProps = {
  children: ReactNode;
  scroll?: boolean;
};

function BackgroundPanels() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={styles.canopyPanel} />
      <View style={styles.trailPanel} />
      <View style={styles.deepPanel} />
      <View style={styles.sidePanel} />
    </View>
  );
}

export function ScreenShell({ children, scroll = true }: ScreenShellProps) {
  if (!scroll) {
    return (
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={styles.safeArea}
      >
        <BackgroundPanels />
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={styles.safeArea}
    >
      <BackgroundPanels />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  canopyPanel: {
    backgroundColor: colors.backgroundAlt,
    height: 250,
    left: -40,
    position: 'absolute',
    right: -40,
    top: -115,
    transform: [{ rotate: '-10deg' }],
  },
  content: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  deepPanel: {
    backgroundColor: colors.backgroundDeep,
    bottom: -120,
    height: 270,
    left: -40,
    position: 'absolute',
    right: -40,
    transform: [{ rotate: '-8deg' }],
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sidePanel: {
    backgroundColor: colors.backgroundSoft,
    height: 260,
    opacity: 0.2,
    position: 'absolute',
    right: -100,
    top: 210,
    transform: [{ rotate: '13deg' }],
    width: 240,
  },
  trailPanel: {
    backgroundColor: '#835C2F',
    height: 170,
    left: -70,
    opacity: 0.3,
    position: 'absolute',
    right: -70,
    top: 310,
    transform: [{ rotate: '9deg' }],
  },
});
