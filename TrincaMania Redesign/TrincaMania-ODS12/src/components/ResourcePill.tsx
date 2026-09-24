import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon, GameIconName, GameIconTone } from './GameIcon';
import { radii } from '../styles/theme';
import { WindowTarget } from '../types/ui';

type ResourcePillProps = {
  addTone?: 'green' | 'gold';
  footer?: string;
  iconName: GameIconName;
  iconTone?: GameIconTone;
  value: string;
  onLayoutInWindow?: (target: WindowTarget) => void;
  onAdd?: () => void;
};

/**
 * Pílula de recurso do HUD. O ícone transborda para fora da pílula à esquerda —
 * é o que faz ela ler como objeto sobre o cenário e não como campo de formulário.
 */
export function ResourcePill({
  addTone = 'gold',
  footer,
  iconName,
  iconTone = 'gold',
  value,
  onAdd,
  onLayoutInWindow,
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

  return (
    <View ref={pillRef} style={styles.pill} onLayout={reportLayout}>
      <View style={styles.iconWrap}>
        <GameIcon name={iconName} size={24} tone={iconTone} />
      </View>
      <Text style={styles.value}>{value}</Text>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      {onAdd ? (
        <Pressable
          accessibilityLabel="Adicionar"
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => [
            styles.add,
            addTone === 'green' ? styles.addGreen : styles.addGold,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text
            style={
              addTone === 'green' ? styles.addTextGreen : styles.addTextGold
            }
          >
            +
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  add: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
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
  footer: {
    color: '#9FE8CF',
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
    backgroundColor: 'rgba(7, 24, 32, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    height: 27,
    marginLeft: 12,
    paddingLeft: 5,
    paddingRight: 3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.94 }],
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 17,
    minWidth: 16,
    textAlign: 'center',
  },
});
