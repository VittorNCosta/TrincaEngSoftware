import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { GameIcon } from '../components/GameIcon';
import { PowerIcon } from '../components/PowerIcon';
import { ScreenShell } from '../components/ScreenShell';
import { TabScene } from '../components/TabScene';
import { POWER_UP_ORDER, POWER_UP_UI } from '../data/powerUps';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { ProgressState } from '../types/game';
import { getCurrentWorldId } from '../utils/worldProgress';

type PowersScreenProps = {
  progress: ProgressState;
};

/**
 * Aba Poderes: o inventário do jogador, com os mesmos cartões da Loja.
 * A compra em si continua na ShopScreen, aberta pelo carrinho da fase.
 */
export function PowersScreen({ progress }: PowersScreenProps) {
  const currentWorldId = getCurrentWorldId(progress);
  const totalPowerUps =
    progress.itemCounts.hint +
    progress.itemCounts.shuffle +
    progress.itemCounts.undo;

  return (
    <ScreenShell scroll={false}>
      <TabScene worldId={currentWorldId}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View style={styles.titleBlock}>
              <Text style={styles.sectionKicker}>Poderes</Text>
              <Text style={styles.sectionTitle}>Seu inventário</Text>
            </View>
            <View style={styles.totalPill}>
              <GameIcon name="powers" size={24} tone="purple" />
              <Text style={styles.totalText}>{totalPowerUps}</Text>
            </View>
          </View>

          <View style={styles.itemList}>
            {POWER_UP_ORDER.map((powerType) => {
              const item = POWER_UP_UI[powerType];
              const count = progress.itemCounts[powerType];

              return (
                <View key={powerType} style={styles.itemCard}>
                  <View pointerEvents="none" style={styles.itemAccent} />
                  <View style={styles.itemTopRow}>
                    <View style={styles.itemIconBox}>
                      <PowerIcon name={powerType} size={38} />
                    </View>
                    <View style={styles.itemCopy}>
                      <Text numberOfLines={1} style={styles.itemTitle}>
                        {item.shopTitle}
                      </Text>
                      <Text numberOfLines={3} style={styles.itemDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemBottomRow}>
                    <View style={styles.metaPill}>
                      <Text
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                        numberOfLines={1}
                        style={styles.metaLabel}
                      >
                        Estoque
                      </Text>
                      <Text style={styles.stockText}>{count}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.notePanel}>
            <GameIcon name="cart" size={32} tone="green" />
            <View style={styles.noteCopy}>
              <Text style={styles.noteTitle}>Onde comprar</Text>
              <Text numberOfLines={3} style={styles.noteText}>
                A Loja abre dentro da fase — toque no carrinho ao lado das
                moedas.
              </Text>
            </View>
          </View>
        </ScrollView>
      </TabScene>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  itemAccent: {
    backgroundColor: '#42E5A7',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 6,
  },
  itemBottomRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  itemCard: {
    backgroundColor: 'rgba(255, 248, 232, 0.96)',
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 4,
    borderColor: '#FFD35A',
    borderRadius: 14,
    borderWidth: 2,
    gap: spacing.xs,
    overflow: 'hidden',
    padding: spacing.sm,
    paddingLeft: spacing.md,
    position: 'relative',
    ...shadows.card,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  itemDescription: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 16,
  },
  itemIconBox: {
    alignItems: 'center',
    backgroundColor: '#FFF1C9',
    borderColor: colors.gold,
    borderRadius: 13,
    borderWidth: 2,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  itemList: {
    gap: spacing.sm,
  },
  itemTitle: {
    color: colors.ink,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  itemTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 10,
    textTransform: 'uppercase',
  },
  metaPill: {
    alignItems: 'center',
    backgroundColor: '#FFFDF2',
    borderColor: '#E6D2A2',
    borderRadius: radii.pill,
    borderWidth: 2,
    gap: 1,
    minWidth: 76,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  noteCopy: {
    flex: 1,
    gap: 2,
  },
  notePanel: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    ...shadows.card,
  },
  noteText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 19,
  },
  noteTitle: {
    color: colors.primaryDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionKicker: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.inkOnDark,
    fontSize: 19,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 2,
  },
  stockText: {
    color: colors.successDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  totalPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 21, 88, 0.86)',
    borderBottomColor: '#11082E',
    borderBottomWidth: 4,
    borderColor: 'rgba(255, 211, 90, 0.36)',
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  totalText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
});
