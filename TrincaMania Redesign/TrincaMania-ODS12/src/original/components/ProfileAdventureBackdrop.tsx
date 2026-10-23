import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ImageBackground, ImageSourcePropType, StyleSheet } from 'react-native';

import { spacing } from '../styles/theme';

type ProfileAdventureBackdropProps = {
  children: ReactNode;
};

/**
 * Canonical global Profile scenery. It intentionally does not reuse a world
 * map: Profile represents the complete ODS12 journey, independent of the current map.
 */
export const PROFILE_BACKGROUND_ASSET_PENDING = false;

export const PROFILE_BACKGROUND_ASSET =
  require('../../../assets/original/profile/profile_adventure_clearing_bg.webp') as ImageSourcePropType;

export function ProfileAdventureBackdrop({
  children,
}: ProfileAdventureBackdropProps) {
  return (
    <ImageBackground
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      source={PROFILE_BACKGROUND_ASSET}
      style={styles.container}
    >
      <LinearGradient
        colors={[
          'rgba(7, 24, 32, 0.16)',
          'rgba(7, 24, 32, 0.04)',
          'rgba(7, 24, 32, 0.34)',
        ]}
        end={{ x: 0.9, y: 1 }}
        start={{ x: 0.1, y: 0 }}
        style={styles.readabilityOverlay}
      >
        {children}
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { resizeMode: 'cover' },
  container: {
    flex: 1,
    margin: -spacing.md,
  },
  readabilityOverlay: {
    flex: 1,
  },
});
