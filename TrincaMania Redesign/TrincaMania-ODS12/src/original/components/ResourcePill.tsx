import { Pressable, Text, View } from 'react-native';
import { memo, useCallback, useRef } from 'react';
import { StyleSheet, type AccessibilityProps } from 'react-native';

import { GameIcon, GameIconName, GameIconTone } from './GameIcon';
import { forestPolish, radii, touchTargets } from '../styles/theme';
import { WindowTarget } from '../../types/ui';

type ResourcePillProps = {
  forest?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityProps['accessibilityRole'];
  accessibilityValue?: AccessibilityProps['accessibilityValue'];
  addTone?: 'green' | 'gold';
  disabled?: boolean;
  footer?: string;
  iconName: GameIconName;
  iconTone?: GameIconTone;
  value: string;
  onLayoutInWindow?: (target: WindowTarget) => void;
  onPress?: () => void;
};

/**
 * Pílula de recurso do HUD. O ícone transborda para fora da pílula à esquerda —
 * é o que faz ela ler como objeto sobre o cenário e não como campo de formulário.
 */
function ResourcePillBase({
  forest = false,
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole,
  accessibilityValue,
  addTone = 'gold',
  disabled = false,
  footer,
  iconName,
  iconTone = 'gold',
  value,
  onLayoutInWindow,
  onPress,
}: ResourcePillProps) {
  const pillRef = useRef<View>(null);
  const reportLayout = useCallback(() => {
    if (!onLayoutInWindow) {
      return;
    }

    requestAnimationFrame(() => {
      pillRef.current?.measureInWindow((x, y, width, height) => {
        onLayoutInWindow({ height, width, x, y });
      });
    });
  }, [onLayoutInWindow]);

  const content = (
    <>
      <View style={styles.iconWrap}>
        <GameIcon name={iconName} size={24} tone={iconTone} />
      </View>
      <Text style={styles.value}>{value}</Text>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      {onPress ? (
        <View
          style={[
            styles.add,
            addTone === 'green' ? styles.addGreen : styles.addGold,
          ]}
        >
          <Text
            style={
              addTone === 'green' ? styles.addTextGreen : styles.addTextGold
            }
          >
            +
          </Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        ref={pillRef}
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityValue={accessibilityValue}
        accessible
        disabled={disabled}
        hitSlop={touchTargets.hitSlop}
        onLayout={reportLayout}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pill,
          forest ? styles.forestPill : null,
          disabled ? styles.disabled : null,
          pressed ? styles.pressed : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      ref={pillRef}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityValue={accessibilityValue}
      accessible={accessibilityLabel !== undefined}
      style={[styles.pill, forest ? styles.forestPill : null]}
      onLayout={reportLayout}
    >
      {content}
    </View>
  );
}

export const ResourcePill = memo(ResourcePillBase);

const styles = StyleSheet.create({
  forestPill: { backgroundColor: '#FFF0CB', borderColor: forestPolish.gold },
  add: {
    alignItems: 'center',
    borderColor: forestPolish.cream,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginLeft: 4,
    width: 20,
  },
  addGold: {
    backgroundColor: '#F2A93B',
  },
  addGreen: {
    backgroundColor: '#37D79B',
  },
  addTextGold: {
    color: '#6B3F00',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  addTextGreen: {
    color: '#065C40',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  disabled: {
    opacity: 0.66,
  },
  footer: {
    color: forestPolish.moss,
    fontSize: 8.5,
    fontWeight: '900',
    lineHeight: 10,
    marginLeft: 4,
  },
  iconWrap: {
    marginLeft: -12,
    marginRight: 3,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: '#FFF4D8',
    borderColor: forestPolish.gold,
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    height: 36,
    marginLeft: 12,
    paddingLeft: 5,
    paddingRight: 3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.94 }],
  },
  value: {
    color: forestPolish.woodDark,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 17,
    minWidth: 16,
    textAlign: 'center',
  },
});
