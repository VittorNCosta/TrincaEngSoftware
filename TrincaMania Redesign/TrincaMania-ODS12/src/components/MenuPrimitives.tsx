import { ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

import { GameIcon, GameIconName, GameIconTone } from './GameIcon';
import {
  colors,
  fontSizes,
  radii,
  shadows,
  spacing,
  touchTargets,
} from '../styles/theme';
import { getMenuHeroArtworkSize } from '../utils/menuLayout';

export type MenuCardVariant =
  'standard' | 'interactive' | 'selected' | 'locked' | 'reward' | 'danger';
export type MenuBadgeTone =
  'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'locked';

type MenuHeaderProps = {
  backDisabled?: boolean;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  tone?: 'surface' | 'dark';
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
};

export function MenuHeader({
  backDisabled = false,
  title,
  eyebrow,
  subtitle,
  tone = 'surface',
  onBack,
  backLabel = 'Voltar',
  right,
}: MenuHeaderProps) {
  const isDark = tone === 'dark';

  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityLabel={backLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: backDisabled }}
          disabled={backDisabled}
          hitSlop={touchTargets.hitSlop}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            isDark ? styles.backButtonDark : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <GameIcon
            name="back"
            size={22}
            tone={isDark ? 'gold' : 'purple'}
            variant="plain"
          />
        </Pressable>
      ) : null}
      <View style={styles.headerCopy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, isDark ? styles.eyebrowDark : null]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          numberOfLines={2}
          style={[styles.title, isDark ? styles.titleDark : null]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

type MenuHeroBannerProps = {
  eyebrow?: string;
  imageAccessibilityLabel?: string;
  imageSource: ImageSourcePropType;
  subtitle: string;
  title: string;
};

/** Compact visual anchor for secondary screens, sized for the narrowest phone QA width. */
export function MenuHeroBanner({
  eyebrow,
  imageAccessibilityLabel,
  imageSource,
  subtitle,
  title,
}: MenuHeroBannerProps) {
  const { width } = useWindowDimensions();
  const artworkSize = getMenuHeroArtworkSize(width);

  return (
    <View style={styles.heroBanner}>
      <View style={styles.heroCopy}>
        {eyebrow ? <Text style={styles.heroEyebrow}>{eyebrow}</Text> : null}
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.84}
          numberOfLines={2}
          style={styles.heroTitle}
        >
          {title}
        </Text>
        <Text numberOfLines={3} style={styles.heroSubtitle}>
          {subtitle}
        </Text>
      </View>
      <View
        style={[
          styles.heroArtworkFrame,
          { height: artworkSize + 12, width: artworkSize + 12 },
        ]}
      >
        <Image
          accessibilityLabel={imageAccessibilityLabel}
          resizeMode="contain"
          source={imageSource}
          style={{ height: artworkSize, width: artworkSize }}
        />
      </View>
    </View>
  );
}

type MenuSectionHeaderProps = {
  tone?: 'surface' | 'dark';
  title: string;
  meta?: string;
};

export function MenuSectionHeader({
  title,
  meta,
  tone = 'surface',
}: MenuSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionTitle,
          tone === 'dark' ? styles.sectionTitleDark : null,
        ]}
      >
        {title}
      </Text>
      {meta ? <MenuBadge tone="neutral">{meta}</MenuBadge> : null}
    </View>
  );
}

type MenuBadgeProps = {
  children: ReactNode;
  tone?: MenuBadgeTone;
};

export function MenuBadge({ children, tone = 'neutral' }: MenuBadgeProps) {
  return (
    <View
      accessibilityRole="text"
      style={[styles.badge, styles[`badge_${tone}`]]}
    >
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>
        {children}
      </Text>
    </View>
  );
}

type MenuCardProps = {
  children: ReactNode;
  variant?: MenuCardVariant;
  onPress?: () => void;
  hitSlop?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function MenuCard({
  children,
  variant = 'standard',
  onPress,
  hitSlop,
  accessibilityLabel,
  accessibilityHint,
  selected = false,
  disabled = false,
  style,
  testID,
}: MenuCardProps) {
  const cardStyle = [
    styles.card,
    styles[`card_${variant}`],
    selected ? styles.card_selected : null,
    disabled ? styles.card_disabled : null,
    style,
  ];

  if (!onPress) {
    return (
      <View
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, selected }}
        accessible={Boolean(accessibilityLabel)}
        style={cardStyle}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed ? styles.pressed : null]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

type MenuProgressBarProps = {
  value: number;
  tone?: 'accent' | 'success' | 'warning';
  accessibilityLabel?: string;
};

export function MenuProgressBar({
  value,
  tone = 'accent',
  accessibilityLabel,
}: MenuProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible
      style={styles.progressTrack}
    >
      <View
        style={[
          styles.progressFill,
          styles[`progressFill_${tone}`],
          { width: `${clampedValue}%` },
        ]}
      />
    </View>
  );
}

type MenuEmptyStateProps = {
  iconName?: GameIconName;
  iconTone?: GameIconTone;
  imageAccessibilityLabel?: string;
  imageSize?: number;
  imageSource?: ImageSourcePropType;
  title: string;
  description: string;
  tone?: 'light' | 'dark';
};

export function MenuEmptyState({
  iconName = 'info',
  iconTone = 'purple',
  imageAccessibilityLabel,
  imageSize = 104,
  imageSource,
  title,
  description,
  tone = 'light',
}: MenuEmptyStateProps) {
  return (
    <View
      style={[
        styles.emptyState,
        tone === 'dark' ? styles.emptyStateDark : null,
      ]}
    >
      {imageSource ? (
        <Image
          accessibilityLabel={imageAccessibilityLabel}
          resizeMode="contain"
          source={imageSource}
          style={{ height: imageSize, width: imageSize }}
        />
      ) : (
        <View style={styles.emptyIcon}>
          <GameIcon name={iconName} size={30} tone={iconTone} />
        </View>
      )}
      <Text
        style={[
          styles.emptyTitle,
          tone === 'dark' ? styles.emptyTitleDark : null,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.emptyDescription,
          tone === 'dark' ? styles.emptyDescriptionDark : null,
        ]}
      >
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderSoft,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  backButtonDark: {
    backgroundColor: colors.shellElevated,
    borderColor: colors.shellAccent,
  },
  badge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badge_accent: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  badge_danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  badge_locked: {
    backgroundColor: colors.lockedSurface,
    borderColor: colors.locked,
  },
  badge_neutral: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderSoft,
  },
  badge_success: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  badge_warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  badgeText: {
    fontSize: fontSizes.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  badgeText_accent: { color: colors.dangerDark },
  badgeText_danger: { color: colors.dangerDark },
  badgeText_locked: { color: colors.lockedText },
  badgeText_neutral: { color: colors.textSecondary },
  badgeText_success: { color: colors.successDark },
  badgeText_warning: { color: colors.warning },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radii.menuCard,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.menuCard,
  },
  card_danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  card_disabled: { opacity: 0.58 },
  card_interactive: { borderColor: colors.borderStrong },
  card_locked: {
    backgroundColor: colors.lockedSurface,
    borderColor: colors.locked,
  },
  card_reward: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.gold,
  },
  card_selected: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.action,
    borderWidth: 2,
  },
  card_standard: {},
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyDescriptionDark: { color: 'rgba(255, 248, 232, 0.82)' },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderSoft,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  emptyState: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyStateDark: { padding: spacing.md },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyTitleDark: { color: colors.inkOnDark },
  eyebrow: {
    color: colors.action,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  eyebrowDark: { color: colors.gold },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
  },
  headerCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  headerRight: { alignItems: 'center', justifyContent: 'center' },
  heroArtworkFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 211, 90, 0.12)',
    borderColor: colors.shellAccent,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: 'center',
  },
  heroBanner: {
    alignItems: 'center',
    backgroundColor: colors.panelDark,
    borderColor: colors.shellAccent,
    borderRadius: radii.menuCard,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 124,
    padding: spacing.md,
    ...shadows.menuCard,
  },
  heroCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  heroEyebrow: {
    color: colors.gold,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    color: colors.profileTextMuted,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    lineHeight: 19,
  },
  heroTitle: {
    color: colors.inkOnDark,
    fontSize: fontSizes.lg,
    fontWeight: '900',
    lineHeight: 22,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  progressFill_accent: { backgroundColor: colors.action },
  progressFill_success: { backgroundColor: colors.success },
  progressFill_warning: { backgroundColor: colors.gold },
  progressTrack: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  sectionTitleDark: { color: colors.creamLight },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitleDark: { color: colors.profileTextMuted },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    lineHeight: 26,
  },
  titleDark: { color: colors.inkOnDark },
});
