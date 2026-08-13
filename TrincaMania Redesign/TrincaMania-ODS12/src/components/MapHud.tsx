import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from './GameIcon';
import { radii, shadows } from '../styles/theme';
import { World, WorldId } from '../types/game';
import { WindowTarget } from '../types/ui';
import { playButtonSound } from '../utils/sounds';

type MapHudProps = {
  coins: number;
  completedCount: number;
  hasNextWorld: boolean;
  hasPreviousWorld: boolean;
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
          style={({ pressed }) => [styles.topButtonTouch, pressed ? styles.pressed : null]}
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
          style={({ pressed }) => [styles.topButtonTouch, pressed ? styles.pressed : null]}
        >
          <View pointerEvents="none" style={styles.settingsButton}>
            <GameIcon name="settings" size={28} tone="blue" variant="plain" />
          </View>
        </Pressable>
        <View style={styles.topSpacer} />
        <View style={styles.pillStack}>
          <Pressable
            accessibilityLabel="Ganhar vidas"
            accessibilityRole="button"
            onPress={onAddLives}
            style={({ pressed }) => [styles.pillTouch, pressed ? styles.pressed : null]}
          >
            <View pointerEvents="none" style={styles.pill}>
              <GameIcon name="heart" size={24} tone="pink" />
              <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.pillValue}>
                {lives}
              </Text>
              <Text style={[styles.pillFooter, styles.pillFooterLives]}>{livesFooter}</Text>
              <View style={[styles.addButton, styles.addLives]}>
                <Text style={styles.addLivesText}>+</Text>
              </View>
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel="Ganhar moedas"
            accessibilityRole="button"
            onPress={onAddCoins}
            style={({ pressed }) => [styles.pillTouch, pressed ? styles.pressed : null]}
          >
            <View
              ref={coinPillRef}
              pointerEvents="none"
              style={styles.pill}
              onLayout={reportCoinCounterLayout}
            >
              <GameIcon name="coin" size={24} tone="gold" />
              <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.pillValue}>
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
            style={[styles.arrow, hasPreviousWorld ? styles.arrowActive : null]}
          >
            <GameIcon muted={!hasPreviousWorld} name="back" size={24} tone="gold" />
          </View>
        </Pressable>

        <View style={styles.worldPlate}>
          <View pointerEvents="none" style={[styles.plateNotch, styles.plateNotchLeft]} />
          <View pointerEvents="none" style={[styles.plateNotch, styles.plateNotchRight]} />
          <Text numberOfLines={1} style={styles.worldName}>
            {worldName}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progressPercent))}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        </View>

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
          <View pointerEvents="none" style={[styles.arrow, hasNextWorld ? styles.arrowActive : null]}>
            <GameIcon muted={!hasNextWorld} name="next" size={24} tone="gold" />
          </View>
        </Pressable>
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
    borderColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  addCoins: {
    backgroundColor: '#F2A93B',
    marginLeft: 6,
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
    backgroundColor: '#4FBCFF',
    borderBottomColor: '#185C94',
    borderBottomWidth: 5,
    borderColor: '#C8ECFF',
    borderRadius: 13,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    width: 40,
    ...shadows.button,
  },
  topButtonTouch: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  hud: {
    gap: 6,
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 8,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 32, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 4,
    height: 25,
    paddingLeft: 3,
    paddingRight: 3,
  },
  pillFooter: {
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 4,
    marginRight: 6,
  },
  pillFooterLives: {
    color: '#9FE8CF',
  },
  pillStack: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
  },
  pillTouch: {
    alignItems: 'flex-end',
    height: 48,
    justifyContent: 'center',
  },
  pillValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
    maxWidth: 34,
    minWidth: 16,
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
  topSpacer: {
    flex: 1,
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
