import { StyleSheet, View } from 'react-native';
import { RedesignedIcon } from './RedesignedIcon';
import { radii, shadows } from '../styles/theme';
/** Seta e acabamento do botão de troca de mundo do TrincaMania original. */
export function WorldNavigationIcon({
  direction,
  disabled = false,
}: {
  direction: 'back' | 'next';
  disabled?: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.bubble, disabled ? styles.disabled : null]}
    >
      <View style={styles.innerGlow} />
      <View style={styles.shine} />
      <RedesignedIcon
        family="NAVEGACAO"
        name={`seta-${direction}`}
        muted={disabled}
        size={17}
      />
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
