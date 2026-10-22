import { StyleSheet, Pressable, Text, View } from 'react-native';
import { msg } from '../messages';
import { forestPolish, spacing } from '../styles/theme';
import { GameIcon, type GameIconName } from './GameIcon';

type Props = {
  title: string;
  description?: string;
  nativeValue?: string;
  icon: GameIconName;
  checked?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  testID?: string;
  onPress: () => void;
};

export function SettingsPreferenceRow({
  title,
  description,
  nativeValue,
  icon,
  checked,
  expanded,
  disabled = false,
  accessibilityHint,
  accessibilityLabel,
  testID,
  onPress,
}: Props) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityValue={nativeValue ? { text: nativeValue } : undefined}
      accessibilityRole={checked === undefined ? 'button' : 'switch'}
      aria-checked={checked}
      accessibilityState={{
        disabled,
        ...(checked === undefined ? {} : { checked }),
        ...(expanded === undefined ? {} : { expanded }),
      }}
      disabled={disabled}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <GameIcon name={icon} size={24} tone="gold" variant="plain" />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {nativeValue ? (
          <Text style={styles.description}>{nativeValue}</Text>
        ) : null}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {checked === undefined ? (
        <Text accessible={false} style={styles.chevron}>
          {expanded ? '⌄' : '›'}
        </Text>
      ) : (
        <View
          accessible={false}
          style={[styles.control, checked && styles.controlOn]}
        >
          <Text style={[styles.controlText, checked && styles.controlTextOn]}>
            {checked ? msg('ON') : msg('OFF')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    padding: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(97, 59, 28, 0.16)',
  },
  copy: { flex: 1, minWidth: 0 },
  title: {
    color: forestPolish.woodDark,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  description: {
    color: forestPolish.wood,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  chevron: {
    color: forestPolish.wood,
    fontSize: 24,
    minWidth: 24,
    textAlign: 'center',
  },
  control: {
    minWidth: 44,
    minHeight: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: forestPolish.woodLight,
    backgroundColor: '#EFE5CC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  controlOn: {
    backgroundColor: forestPolish.moss,
    borderColor: forestPolish.moss,
  },
  controlText: {
    color: forestPolish.woodDark,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
  },
  controlTextOn: { color: forestPolish.cream },
  pressed: { backgroundColor: '#F3E7C6' },
  disabled: { opacity: 0.65 },
});
