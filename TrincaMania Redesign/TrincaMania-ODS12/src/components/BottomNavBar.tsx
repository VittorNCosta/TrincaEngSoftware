import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon, GameIconName } from './GameIcon';
import { playButtonSound } from '../utils/sounds';

export type MainTabKey = 'map' | 'rewards' | 'powers' | 'profile';

type NavItem = {
  iconName: GameIconName;
  key: MainTabKey;
  label: string;
};

export const MAIN_TAB_ITEMS: NavItem[] = [
  { iconName: 'nav-map', key: 'map', label: 'Mapa' },
  { iconName: 'nav-rewards', key: 'rewards', label: 'Recompensas' },
  { iconName: 'nav-powers', key: 'powers', label: 'Poderes' },
  { iconName: 'nav-profile', key: 'profile', label: 'Perfil' },
];

export const BOTTOM_NAV_HEIGHT = 86;

type BottomNavBarProps = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

/**
 * Barra full-bleed: largura total, encostada na base, sobre o conteúdo das abas.
 * A aba ativa usa a mesma placa dourada dos botões do app.
 */
export function BottomNavBar({ activeIndex, onSelect }: BottomNavBarProps) {
  return (
    <View style={styles.bar}>
      {MAIN_TAB_ITEMS.map((item, index) => {
        const isActive = index === activeIndex;

        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={item.key}
            onPress={() => {
              if (!isActive) {
                playButtonSound();
              }

              onSelect(index);
            }}
            style={({ pressed }) => [
              styles.item,
              isActive ? styles.itemActive : styles.divider,
              pressed ? styles.itemPressed : null,
            ]}
          >
            <GameIcon
              name={item.iconName}
              size={isActive ? 38 : 32}
              style={isActive ? undefined : styles.iconInactive}
              variant="plain"
            />
            <Text
              numberOfLines={1}
              style={[styles.label, isActive ? styles.labelActive : null]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'stretch',
    backgroundColor: 'rgba(36, 21, 88, 0.96)',
    borderTopColor: 'rgba(255, 211, 90, 0.5)',
    borderTopWidth: 3,
    bottom: 0,
    elevation: 12,
    flexDirection: 'row',
    height: 86,
    left: 0,
    // A folga de baixo respeita a área segura dos aparelhos com barra de gestos.
    paddingBottom: 14,
    paddingHorizontal: 4,
    paddingTop: 5,
    position: 'absolute',
    right: 0,
    shadowColor: '#040A18',
    shadowOffset: { height: -7, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    zIndex: 12,
  },
  divider: {
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderRightWidth: 1,
  },
  iconInactive: {
    opacity: 0.72,
  },
  item: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    paddingBottom: 3,
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  itemActive: {
    backgroundColor: '#FFD35A',
    borderBottomColor: '#A55D00',
    borderBottomWidth: 4,
    borderColor: '#FFF4C9',
    borderWidth: 2,
  },
  itemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  label: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: '#6B3F00',
  },
});
