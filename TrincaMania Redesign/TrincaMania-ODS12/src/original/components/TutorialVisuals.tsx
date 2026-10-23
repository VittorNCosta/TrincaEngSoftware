import { AccessibilityInfo, Image, Pressable, Text, View } from 'react-native';
import { msg } from '../messages';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { forestPolish, radii, spacing } from '../styles/theme';

/** Static until the OS preference arrives; also follows live changes. */
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

export const TUTORIAL_ASSETS = {
  frame: require('../../../assets/original/ui/tutorials/power_tutorial_modal_frame.png'),
  guide: require('../../../assets/original/ui/tutorials/power_tutorial_luma_guide.png'),
  pointer: require('../../../assets/original/ui/tutorials/power_tutorial_pointer_hand.png'),
  glow: require('../../../assets/original/ui/tutorials/power_tutorial_highlight_glow.png'),
};

/** Shared artwork for campaign, practice and replay; never owns completion state. */
export function TutorialFrame({
  forest = false,
  compact = false,
  children,
  onClose,
  style,
}: {
  forest?: boolean;
  compact?: boolean;
  children: ReactNode;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [size, setSize] = useState({ width: 300, height: 300 });
  // Stretch only the empty centre. The official banner, corners and close art
  // keep their proportions on both short coachmarks and tall replay panels.
  const artHeight = size.width * 0.75;
  const topHeight = artHeight * 0.24;
  const bottomHeight = artHeight * 0.16;
  const middleArtHeight =
    Math.max(1, size.height - topHeight - bottomHeight) / 0.6;
  if (forest)
    return (
      <View style={[styles.forestFrame, style]}>
        {onClose ? (
          <Pressable
            accessibilityLabel={msg('Fechar tutorial')}
            accessibilityRole="button"
            onPress={onClose}
            style={styles.forestClose}
          >
            <Text style={styles.closeText}>{msg('×')}</Text>
          </Pressable>
        ) : null}
        <View
          style={[
            { flexShrink: 1, gap: spacing.sm },
            onClose ? { paddingTop: 32 } : null,
          ]}
        >
          {children}
        </View>
      </View>
    );
  return (
    <View
      onLayout={({ nativeEvent: { layout } }) =>
        setSize((current) =>
          current.width === layout.width && current.height === layout.height
            ? current
            : { width: layout.width, height: layout.height },
        )
      }
      style={[styles.frame, style]}
    >
      <View
        pointerEvents="none"
        style={[styles.artSlice, { top: 0, height: topHeight }]}
      >
        <Image
          accessible={false}
          source={TUTORIAL_ASSETS.frame}
          resizeMode="stretch"
          style={{ width: '100%', height: artHeight }}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.artSlice, { top: topHeight, bottom: bottomHeight }]}
      >
        <Image
          accessible={false}
          source={TUTORIAL_ASSETS.frame}
          resizeMode="stretch"
          style={{
            width: '100%',
            height: middleArtHeight,
            top: -middleArtHeight * 0.24,
          }}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.artSlice, { bottom: 0, height: bottomHeight }]}
      >
        <Image
          accessible={false}
          source={TUTORIAL_ASSETS.frame}
          resizeMode="stretch"
          style={{ width: '100%', height: artHeight, top: -artHeight * 0.84 }}
        />
      </View>
      <View
        style={[
          styles.content,
          compact ? styles.compactContent : null,
          {
            paddingTop: compact ? topHeight + 2 : topHeight + 6,
            // Even short instructions must stay inside the blue centre, above the wooden rim.
            paddingBottom: bottomHeight + 4,
          },
        ]}
      >
        {children}
      </View>
      {onClose ? (
        <Pressable
          accessibilityLabel={msg('Fechar tutorial')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onClose();
          }}
          style={[
            styles.close,
            {
              top: artHeight * 0.095,
              right: size.width * 0.025,
              width: size.width * 0.1,
              height: artHeight * 0.13,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export function TutorialGuide({ small = false }: { small?: boolean }) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessible={false}
      source={TUTORIAL_ASSETS.guide}
      resizeMode="contain"
      style={[styles.guide, small ? styles.smallGuide : null]}
    />
  );
}

export function TutorialGlow({ subtle = false }: { subtle?: boolean }) {
  return (
    <Image
      accessible={false}
      source={TUTORIAL_ASSETS.glow}
      resizeMode="stretch"
      style={[styles.glow, subtle ? styles.subtleGlow : null]}
    />
  );
}

/** Mount inside the actual control so scrolling and entrance transforms cannot drift. */
export function TutorialTarget({
  showHand = true,
  subtle = false,
}: {
  showHand?: boolean;
  subtle?: boolean;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { zIndex: 40 }]}
    >
      <TutorialGlow subtle={subtle} />
      {showHand ? (
        <Image
          source={TUTORIAL_ASSETS.pointer}
          resizeMode="contain"
          style={styles.pointer}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  forestFrame: {
    backgroundColor: forestPolish.cream,
    borderColor: forestPolish.wood,
    borderWidth: 2,
    borderRadius: radii.menuCard,
    padding: spacing.md,
    flexShrink: 1,
  },
  forestClose: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: { color: forestPolish.woodDark, fontSize: 28 },
  frame: { position: 'relative', flexShrink: 1 },
  artSlice: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  compactContent: { paddingHorizontal: 16, gap: 5 },
  content: {
    paddingTop: 38,
    paddingBottom: 30,
    paddingHorizontal: 26,
    gap: 8,
    flexShrink: 1,
  },
  close: {
    position: 'absolute',
    right: '5%',
    top: '5%',
    width: 36,
    height: 36,
  },
  guide: { width: 70, height: 88 },
  smallGuide: { width: 46, height: 57 },
  pointer: {
    position: 'absolute',
    width: 72,
    height: 72,
    left: '50%',
    top: '50%',
    transform: [{ translateX: -20.16 }, { translateY: -20.16 }],
  },
  // The empty centre of the supplied ring surrounds the measured component.
  glow: {
    position: 'absolute',
    width: '160%',
    height: '160%',
    left: '-30%',
    top: '-30%',
  },
  subtleGlow: {
    width: '122%',
    height: '122%',
    left: '-11%',
    top: '-11%',
    opacity: 0.52,
  },
});
