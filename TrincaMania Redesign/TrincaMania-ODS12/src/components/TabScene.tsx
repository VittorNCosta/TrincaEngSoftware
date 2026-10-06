import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useMemo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { getWorldVisualAssets } from '../data/worldVisualAssets';
import { colors, spacing } from '../styles/theme';
import { WorldId } from '../types/game';

type TabSceneProps = {
  children: ReactNode;
  worldId: WorldId;
};

/**
 * As abas compartilham a arte ODS 12 atual do mundo, com véus para preservar
 * a leitura dos painéis.
 */
export function TabScene({ children, worldId }: TabSceneProps) {
  const background = useMemo(
    () => getWorldVisualAssets(worldId).game,
    [worldId],
  );

  return (
    <ImageBackground
      imageStyle={styles.sceneImage}
      resizeMode="cover"
      source={background}
      style={styles.container}
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
