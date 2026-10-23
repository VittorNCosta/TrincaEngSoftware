import { StyleSheet, View } from 'react-native';
import Svg, { Path } from './svgPrimitives';
import { radii, shadows } from '../styles/theme';
/** Seta e acabamento do botão de troca de mundo do TrincaMania original. */
export function WorldNavigationIcon({
  direction,
  disabled = false,
}: {
  direction: 'back' | 'next';
  disabled?: boolean;
}) {
  const ink = disabled ? '#16203F' : '#7A4A0C';
  const fill = disabled ? '#DCE5E7' : '#FFFDF2';
  const path =
    direction === 'back' ? 'M39 14 21 32l18 18' : 'M25 14l18 18-18 18';
  return (
    <View
      pointerEvents="none"
      style={[styles.bubble, disabled ? styles.disabled : null]}
    >
      <View style={styles.innerGlow} />
      <View style={styles.shine} />
      <Svg height={17} viewBox="0 0 64 64" width={17}>
        <Path
          d={path}
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={16}
        />
        <Path
          d={path}
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={9}
        />
      </Svg>
    </View>
  );
}
const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    backgroundColor: '#FFD23F',
    borderBottomColor: '#A55D00',
    borderBottomWidth: 3,
    borderColor: '#FFF8D8',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 21,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 21,
    ...shadows.button,
  },
  disabled: {
    backgroundColor: '#303B60',
    borderBottomColor: '#11182E',
    borderColor: '#7482AA',
    opacity: 0.86,
  },
  innerGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: radii.pill,
    bottom: 4,
    left: 4,
    position: 'absolute',
    right: 4,
    top: 4,
  },
  shine: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radii.pill,
    height: 5,
    left: 3,
    position: 'absolute',
    right: 7,
    top: 2,
  },
});
