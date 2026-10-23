import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  Platform,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playButtonSound } from '../utils/sounds';
export type MainTabKey = 'map' | 'rewards' | 'powers' | 'profile';
type NavItem = { key: MainTabKey; label: string };
export const MAIN_TAB_ITEMS: NavItem[] = [
  { key: 'map', label: 'Mapa' },
  { key: 'rewards', label: 'Prêmios' },
  { key: 'powers', label: 'Poderes' },
  { key: 'profile', label: 'Perfil' },
];
// Os destinos continuam sendo os do ODS; as artes são do original atualizado.
const NAV_ICONS: Record<MainTabKey, ImageSourcePropType> = {
  map: require('../../assets/ui/navigation/map.png'),
  rewards: require('../../assets/ui/navigation/rewards.png'),
  powers: require('../../assets/ui/navigation/powers.png'),
  profile: require('../../assets/ui/navigation/profile.png'),
};
const NAV_BASE = require('../../assets/ui/navigation/nav_base.png');
export const BOTTOM_NAV_HEIGHT = 86;
type BottomNavBarProps = {
  activeIndex: number;
  onSelect: (index: number) => void;
};
export function BottomNavBar({ activeIndex, onSelect }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { bottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(31, 56, 34, 0)', 'rgba(42, 30, 17, 0.88)']}
        pointerEvents="none"
        style={styles.backdrop}
      />
      <View pointerEvents="none" style={styles.rail}>
        <Image
          accessible={false}
          fadeDuration={0}
          resizeMode="stretch"
          source={NAV_BASE}
          style={styles.railImage}
        />
      </View>
      {MAIN_TAB_ITEMS.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="button"
            accessibilityState={
              Platform.OS === 'web' ? undefined : { selected: isActive }
            }
            aria-pressed={Platform.OS === 'web' ? isActive : undefined}
            key={item.key}
            testID={`nav-${item.key}`}
            onPress={() => {
              if (!isActive) playButtonSound();
              onSelect(index);
            }}
            style={({ pressed }) => [
              styles.item,
              isActive ? styles.itemActive : styles.itemInactive,
              pressed ? styles.itemPressed : null,
            ]}
          >
            <View pointerEvents="none" style={styles.itemContent}>
              <View style={styles.iconWrap}>
                {isActive ? <View style={styles.activeHalo} /> : null}
                <Image
                  accessible={false}
                  fadeDuration={0}
                  resizeMode="contain"
                  source={NAV_ICONS[item.key]}
                  style={[styles.icon, !isActive ? styles.iconInactive : null]}
                />
              </View>
              <View
                style={[
                  styles.labelPlate,
                  isActive ? styles.labelPlateActive : null,
                ]}
              >
                <Text
                  maxFontSizeMultiplier={1.4}
                  numberOfLines={1}
                  style={[styles.label, isActive ? styles.labelActive : null]}
                >
                  {item.label}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    bottom: 0,
    flexDirection: 'row',
    height: BOTTOM_NAV_HEIGHT,
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: 4,
    paddingTop: 4,
    position: 'absolute',
    right: 0,
    zIndex: 12,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, top: -14 },
  rail: {
    bottom: -4,
    height: 88,
    left: 0,
    position: 'absolute',
    width: '100%',
  },
  railImage: { height: '100%', width: '100%' },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingBottom: 1,
    paddingHorizontal: 2,
    paddingTop: 1,
  },
  itemActive: { zIndex: 1 },
  itemInactive: { opacity: 0.98 },
  itemPressed: { opacity: 0.9 },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  icon: { height: 44, width: 44 },
  iconInactive: { opacity: 0.94 },
  activeHalo: {
    backgroundColor: 'rgba(255, 224, 144, 0.38)',
    borderColor: '#F5CF75',
    borderRadius: 28,
    borderWidth: 2,
    height: 46,
    left: -2,
    position: 'absolute',
    shadowColor: '#F5CF75',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.66,
    shadowRadius: 8,
    top: -1,
    width: 52,
  },
  labelPlate: {
    alignItems: 'center',
    backgroundColor: '#F3DFB8',
    borderColor: '#97622B',
    borderRadius: 999,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    maxWidth: '100%',
    minWidth: 64,
    paddingHorizontal: 6,
    width: 78,
  },
  labelPlateActive: {
    backgroundColor: '#FFF5D8',
    borderColor: '#F5CF75',
    shadowColor: '#F5CF75',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.56,
    shadowRadius: 5,
  },
  label: {
    color: '#59391E',
    fontSize: 10,
    fontWeight: '900',
    includeFontPadding: false,
    letterSpacing: 0.3,
    lineHeight: 12,
    maxWidth: '100%',
    textTransform: 'uppercase',
  },
  labelActive: { color: '#2C1C10' },
});
