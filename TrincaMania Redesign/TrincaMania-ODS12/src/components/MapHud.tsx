import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from './GameIcon';
import { radii, shadows } from '../styles/theme';
import { forestPolish } from '../original/styles/theme';
import { PROFILE_ACTION_ASSETS } from '../original/data/profileActionAssets';
import { World, WorldId } from '../types/game';
import { WindowTarget } from '../types/ui';
import { playButtonSound } from '../utils/sounds';

type MapHudProps = {
  coins: number;
  completedCount: number;
  hasNextWorld: boolean;
  hasPreviousWorld: boolean;
  showWorldNavigation?: boolean;
  lives: number;
  livesFooter: string;
  progressPercent: number;
  totalCount: number;
  worldName: string;
  worlds: World[];
  selectedWorldId: WorldId;
  onAddCoins: () => void;
  onAddLives: () => void;
  onCoinCounterLayout?: (target: WindowTarget) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onNextWorld: () => void;
  onPreviousWorld: () => void;
};

/**
 * HUD flutuante do mapa. Fica sobre o cenário full-bleed em vez de empurrá-lo
 * para baixo — as quatro faixas de UI que existiam viraram duas.
 */
export function MapHud({
  coins,
  completedCount,
  hasNextWorld,
  hasPreviousWorld,
  showWorldNavigation = true,
  lives,
  livesFooter,
  progressPercent,
  totalCount,
  worldName,
  worlds,
  selectedWorldId,
  onAddCoins,
  onAddLives,
  onCoinCounterLayout,
  onOpenProfile,
  onOpenSettings,
  onNextWorld,
  onPreviousWorld,
}: MapHudProps) {
  const coinPillRef = useRef<View>(null);
  const reportCoinCounterLayout = useCallback(() => {
    if (!onCoinCounterLayout) {
      return;
    }

    requestAnimationFrame(() => {
      coinPillRef.current?.measureInWindow((x, y, width, height) => {
        onCoinCounterLayout({ height, width, x, y });
      });
    });
  }, [onCoinCounterLayout]);

  return (
    <View pointerEvents="box-none" style={styles.hud}>
      {/* Um degradê único no lugar das cinco faixas: os degraus de opacidade
          desenhavam um risco preto reto cortando os botões do topo. */}
      <LinearGradient
        colors={[
          'rgba(7, 24, 32, 0.72)',
          'rgba(7, 24, 32, 0.58)',
          'rgba(7, 24, 32, 0.34)',
          'rgba(7, 24, 32, 0.12)',
          'rgba(7, 24, 32, 0)',
        ]}
        locations={[0, 0.32, 0.62, 0.84, 1]}
        pointerEvents="none"
        style={styles.scrim}
      />

      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel="Perfil do jogador"
          accessibilityRole="button"
          onPress={() => {
            playButtonSound();
            onOpenProfile();
          }}
          style={({ pressed }) => [
            styles.topButtonTouch,
            pressed ? styles.pressed : null,
          ]}
        >
          <View pointerEvents="none" style={styles.avatarButton}>
            <GameIcon name="avatar" size={36} variant="plain" />
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel="Abrir configurações"
          accessibilityRole="button"
          onPress={() => {
            playButtonSound();
            onOpenSettings();
          }}
          style={({ pressed }) => [
            styles.topButtonTouch,
            pressed ? styles.pressed : null,
          ]}
        >
          <View pointerEvents="none" style={styles.settingsButton}>
            <Image
              testID="map-hud-settings-art"
              accessible={false}
              resizeMode="contain"
              source={PROFILE_ACTION_ASSETS.settings}
              style={styles.settingsArtwork}
            />
          </View>
        </Pressable>
        <View style={styles.pillStack}>
          <Pressable
            accessibilityLabel="Ganhar vidas"
            accessibilityValue={{ text: `${lives} vidas, ${livesFooter}` }}
            accessibilityRole="button"
            onPress={onAddLives}
            style={({ pressed }) => [
              styles.pillTouch,
              pressed ? styles.pressed : null,
            ]}
          >
            <View pointerEvents="none" style={styles.pill}>
              <View style={styles.resourceArtworkFrame}>
                <Image
                  testID="map-hud-lives-art"
                  accessible={false}
                  resizeMode="contain"
                  source={require('../../assets/original/ui/rewards/optimized/reward_life.png')}
                  style={styles.resourceArtwork}
                />
              </View>
              <View style={styles.livesCopy}>
                <Text
                  testID="map-lives-count"
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  numberOfLines={1}
                  style={styles.pillValue}
                >
                  {lives}
                </Text>
                <Text style={[styles.pillFooter, styles.pillFooterLives]}>
                  {livesFooter}
                </Text>
              </View>
              <View style={[styles.addButton, styles.addLives]}>
                <Text style={styles.addLivesText}>+</Text>
              </View>
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel="Ganhar moedas"
            accessibilityValue={{ text: `${coins} moedas` }}
            accessibilityRole="button"
            onPress={onAddCoins}
            style={({ pressed }) => [
              styles.pillTouch,
              pressed ? styles.pressed : null,
            ]}
          >
            <View
              ref={coinPillRef}
              pointerEvents="none"
              style={styles.pill}
              onLayout={reportCoinCounterLayout}
            >
              <View style={styles.resourceArtworkFrame}>
                <Image
                  testID="map-hud-coin-art"
                  accessible={false}
                  resizeMode="contain"
                  source={require('../../assets/original/ui/rewards/optimized/reward_coin.png')}
                  style={styles.resourceArtwork}
                />
              </View>
              <Text
                testID="map-coins-count"
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                numberOfLines={1}
                style={styles.pillValue}
              >
                {coins}
              </Text>
              <View style={[styles.addButton, styles.addCoins]}>
                <Text style={styles.addCoinsText}>+</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.worldRow}>
        {showWorldNavigation ? (
          <Pressable
            accessibilityLabel="Mundo anterior"
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasPreviousWorld }}
            disabled={!hasPreviousWorld}
            onPress={() => {
              playButtonSound();
              onPreviousWorld();
            }}
            style={({ pressed }) => [
              styles.arrowTouch,
              pressed && hasPreviousWorld ? styles.pressed : null,
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.arrow,
                hasPreviousWorld ? styles.arrowActive : null,
              ]}
            >
              <GameIcon
                muted={!hasPreviousWorld}
                name="back"
                size={24}
                tone="gold"
              />
            </View>
          </Pressable>
        ) : null}

        <View style={styles.worldPlate}>
          <View
            pointerEvents="none"
            style={[styles.plateNotch, styles.plateNotchLeft]}
          />
          <View
            pointerEvents="none"
            style={[styles.plateNotch, styles.plateNotchRight]}
          />
          <Text numberOfLines={1} style={styles.worldName}>
            {worldName}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(0, Math.min(100, progressPercent))}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        </View>

        {showWorldNavigation ? (
          <Pressable
            accessibilityLabel="Próximo mundo"
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasNextWorld }}
            disabled={!hasNextWorld}
            onPress={() => {
              playButtonSound();
              onNextWorld();
            }}
            style={({ pressed }) => [
              styles.arrowTouch,
              pressed && hasNextWorld ? styles.pressed : null,
            ]}
          >
            <View
              pointerEvents="none"
              style={[styles.arrow, hasNextWorld ? styles.arrowActive : null]}
            >
              <GameIcon
                muted={!hasNextWorld}
                name="next"
                size={24}
                tone="gold"
              />
            </View>
          </Pressable>
        ) : null}
      </View>

      <View pointerEvents="none" style={styles.dots}>
        {worlds.map((item) => (
          <View
            key={`world-dot-${item.id}`}
            style={[
              styles.dot,
              item.isBonus ? styles.dotBonus : null,
              item.id === selectedWorldId ? styles.dotActive : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    borderColor: '#FFE9AE',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  addCoins: {
    backgroundColor: '#F2A93B',
    marginLeft: 0,
  },
  addCoinsText: {
    color: '#6B3F00',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  addLives: {
    backgroundColor: '#37D79B',
  },
  addLivesText: {
    color: '#065C40',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  arrow: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 32, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  arrowActive: {
    backgroundColor: 'rgba(7, 24, 32, 0.62)',
    borderColor: 'rgba(255, 211, 90, 0.6)',
  },
  arrowTouch: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: radii.pill,
    height: 5,
    width: 5,
  },
  dotActive: {
    backgroundColor: '#FFD35A',
    width: 16,
  },
  dotBonus: {
    backgroundColor: 'rgba(255, 139, 193, 0.6)',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: '#5C2A9B',
    borderBottomColor: '#2C0E56',
    borderBottomWidth: 5,
    borderColor: '#FFD35A',
    borderRadius: 14,
    borderWidth: 3,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
    ...shadows.button,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 243, 206, 0.12)',
    borderBottomColor: forestPolish.wood,
    borderBottomWidth: 5,
    borderColor: forestPolish.bark,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
    ...shadows.button,
  },
  settingsArtwork: { width: 34, height: 34 },
  topButtonTouch: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 44,
  },
  hud: {
    gap: 6,
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 8,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: '#FFF4D8',
    borderColor: forestPolish.bark,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    height: 38,
    paddingLeft: 2,
    paddingRight: 4,
    width: '100%',
    ...shadows.button,
  },
  resourceArtworkFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 34,
    height: 34,
    overflow: 'hidden',
  },
  resourceArtwork: { width: 76, height: 76 / 1.5, flexShrink: 0 },
  livesCopy: { flex: 1, alignItems: 'center', minWidth: 0 },
  pillFooter: {
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 10,
  },
  pillFooterLives: { color: forestPolish.moss },
  pillStack: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: 6,
  },
  pillTouch: {
    flex: 1,
    minWidth: 0,
    height: 48,
    justifyContent: 'center',
  },
  pillValue: {
    color: forestPolish.woodDark,
    flexShrink: 1,
    flexGrow: 1,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 17,
    minWidth: 0,
    textAlign: 'center',
  },
  plateNotch: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 7,
    borderTopColor: 'transparent',
    borderTopWidth: 7,
    height: 0,
    position: 'absolute',
    top: 11,
    width: 0,
  },
  plateNotchLeft: {
    borderRightColor: '#FFD35A',
    borderRightWidth: 9,
    left: -10,
  },
  plateNotchRight: {
    borderLeftColor: '#FFD35A',
    borderLeftWidth: 9,
    right: -10,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  progressFill: {
    backgroundColor: '#22C88C',
    borderRadius: radii.pill,
    height: '100%',
  },
  progressLabel: {
    color: '#FFE9A8',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  progressTrack: {
    backgroundColor: 'rgba(7, 24, 32, 0.55)',
    borderRadius: radii.pill,
    height: 8,
    overflow: 'hidden',
    width: 88,
  },
  scrim: {
    // O véu desce além do conteúdo do HUD: as bolhas que sobem por baixo dele
    // precisam recuar antes de sumir, senão brigam com a placa de mundo.
    bottom: -56,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 4,
  },
  worldName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 21,
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 1,
  },
  worldPlate: {
    alignItems: 'center',
    backgroundColor: '#5C2A9B',
    borderBottomColor: '#2C0E56',
    borderBottomWidth: 4,
    borderColor: '#FFD35A',
    borderRadius: 12,
    borderWidth: 3,
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...shadows.button,
  },
  worldRow: {
    alignItems: 'center',
    flexDirection: 'row',
    // As pontas douradas da placa avançam para fora; o gap impede que as setas
    // fiquem coladas nelas.
    gap: 16,
    justifyContent: 'center',
  },
});
