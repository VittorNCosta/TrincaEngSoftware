import { ScrollView, View } from 'react-native';
import { msg } from '../messages';
import { ReactNode } from 'react';
import {
  ImageBackground,
  ActivityIndicator,
  type ImageSourcePropType,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../styles/theme';

type ScreenShellProps = {
  children: ReactNode;
  scroll?: boolean;
  backgroundSource?: ImageSourcePropType;
  contentReady?: boolean;
  pendingBackgroundColor?: string;
  onBackgroundLoad?: () => void;
  onBackgroundError?: () => void;
};

function BackgroundPanels() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.backgroundLayer]}
    >
      <View style={styles.canopyPanel} />
      <View style={styles.deepPanel} />
    </View>
  );
}

export function ScreenShell({
  children,
  scroll = true,
  backgroundSource,
  contentReady = true,
  pendingBackgroundColor,
  onBackgroundLoad,
  onBackgroundError,
}: ScreenShellProps) {
  if (!scroll) {
    const content = (
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[
          styles.safeArea,
          backgroundSource ? { backgroundColor: 'transparent' } : null,
        ]}
      >
        {backgroundSource ? null : <BackgroundPanels />}
        <View
          pointerEvents={contentReady ? undefined : 'none'}
          accessibilityElementsHidden={!contentReady}
          importantForAccessibility={
            contentReady ? 'auto' : 'no-hide-descendants'
          }
          style={
            contentReady ? styles.content : [styles.content, { opacity: 0 }]
          }
        >
          {children}
        </View>
      </SafeAreaView>
    );
    return backgroundSource ? (
      <ImageBackground
        source={backgroundSource}
        resizeMode="cover"
        imageStyle={{ opacity: 0.96 }}
        style={
          pendingBackgroundColor
            ? [styles.safeArea, { backgroundColor: pendingBackgroundColor }]
            : styles.safeArea
        }
        onLoad={onBackgroundLoad}
        onError={onBackgroundError}
        fadeDuration={pendingBackgroundColor ? 0 : undefined}
      >
        {content}
        {!contentReady ? (
          <View
            style={[StyleSheet.absoluteFillObject, styles.pending]}
            pointerEvents="none"
            accessible
            accessibilityLabel={msg('Preparando tabuleiro')}
            accessibilityRole="progressbar"
          >
            <ActivityIndicator color="#824B66" />
          </View>
        ) : null}
      </ImageBackground>
    ) : (
      content
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
  pending: { alignItems: 'center', justifyContent: 'center' },
  backgroundLayer: {
    overflow: 'hidden',
  },
  canopyPanel: {
    backgroundColor: colors.shell,
    borderBottomLeftRadius: 88,
    borderBottomRightRadius: 88,
    height: 220,
    left: -20,
    position: 'absolute',
    right: -20,
    top: -82,
  },
  content: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  deepPanel: {
    backgroundColor: colors.actionDark,
    borderTopLeftRadius: 88,
    borderTopRightRadius: 88,
    bottom: -84,
    height: 232,
    left: -20,
    position: 'absolute',
    right: -20,
  },
  safeArea: {
    backgroundColor: colors.backgroundDeep,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
