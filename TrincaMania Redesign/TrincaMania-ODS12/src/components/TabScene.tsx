import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useMemo } from 'react';
import { ImageBackground, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../styles/theme';
import { WorldId } from '../types/game';

const tabWorld1Bg = require('../../assets/map/map_world1_bg.png') as ImageSourcePropType;
const tabWorld2Bg = require('../../assets/map/map_world2_bg.png') as ImageSourcePropType;
const tabWorld3Bg = require('../../assets/map/map_world3_home_bg.png') as ImageSourcePropType;
const tabBonusBg = require('../../assets/map/map_bonus_bg.png') as ImageSourcePropType;

const getTabBackground = (worldId: WorldId) => {
  switch (worldId) {
    case 2:
    case 5:
    case 7:
      return tabWorld2Bg;
    case 3:
    case 6:
    case 8:
      return tabWorld3Bg;
    case 4:
      return tabWorld1Bg;
    case 21:
      return tabBonusBg;
    case 1:
    default:
      return tabWorld1Bg;
  }
};

type TabSceneProps = {
  children: ReactNode;
  worldId: WorldId;
};

/**
 * Cenário das abas Recompensas/Poderes/Perfil — o mesmo fundo por mundo que a
 * antiga home usava. Os véus de topo e base são degradês: os washes chapados
 * anteriores desenhavam uma borda dura sobre o conteúdo.
 */
export function TabScene({ children, worldId }: TabSceneProps) {
  const background = useMemo(() => getTabBackground(worldId), [worldId]);

  return (
    <ImageBackground
      imageStyle={styles.sceneImage}
      resizeMode="cover"
      source={background}
      style={[
        styles.container,
        worldId === 2 || worldId === 5 || worldId === 7 ? styles.containerMountain : null,
        worldId === 3 || worldId === 6 || worldId === 8 ? styles.containerCrystal : null,
        worldId === 21 ? styles.containerBonus : null,
      ]}
    >
      <View pointerEvents="none" style={styles.sceneOverlay}>
        <View style={styles.sceneWash} />
        <LinearGradient
          colors={['rgba(7, 24, 32, 0.44)', 'rgba(7, 24, 32, 0)']}
          style={styles.sceneTopWash}
        />
        <LinearGradient
          colors={['rgba(7, 24, 32, 0)', 'rgba(7, 24, 32, 0.62)']}
          style={styles.sceneBottomWash}
        />
      </View>
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDeep,
    flex: 1,
    margin: -spacing.md,
    overflow: 'hidden',
  },
  containerBonus: {
    backgroundColor: '#43204F',
  },
  containerCrystal: {
    backgroundColor: '#23164D',
  },
  containerMountain: {
    backgroundColor: '#12304F',
  },
  sceneBottomWash: {
    bottom: 0,
    height: 260,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  sceneImage: {
    opacity: 0.96,
  },
  sceneOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sceneTopWash: {
    height: 190,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sceneWash: {
    backgroundColor: 'rgba(5, 20, 26, 0.32)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
