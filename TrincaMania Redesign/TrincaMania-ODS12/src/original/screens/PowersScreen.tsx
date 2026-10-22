import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { msg } from '../messages';

import { useBottomNavClearance } from '../components/BottomNavBar';
import { GameIcon } from '../components/GameIcon';
import { MenuHeroBanner } from '../components/MenuPrimitives';
import { PowerIcon } from '../components/PowerIcon';
import { ScreenShell } from '../components/ScreenShell';
import { TabScene } from '../components/TabScene';
import { POWER_UP_ORDER, POWER_UP_UI } from '../../data/powerUps';
import { PROFILE_ACTION_ASSETS } from '../data/profileActionAssets';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { PowerUpType, ProgressState } from '../../types/game';
import { powersTutorialTestId } from '../utils/e2eSelectors';
import { getCurrentWorldId } from '../../utils/worldProgress';

type PowersScreenProps = {
  progress: ProgressState;
  onClose?: () => void;
  onOpenTutorial?: (powerType: PowerUpType) => void;
};

/**
 * Aba Poderes: o inventário do jogador, com os mesmos cartões da Loja.
 * A compra acontece no contexto da fase, pelo carrinho ao lado das moedas,
 * sem duplicar um catalogo na Loja principal.
 */
export function PowersScreen({
  onClose,
  onOpenTutorial,
  progress,
}: PowersScreenProps) {
  const currentWorldId = getCurrentWorldId(progress);
  const bottomNavClearance = useBottomNavClearance();
  const totalPowerUps =
    progress.itemCounts.hint +
    progress.itemCounts.shuffle +
    progress.itemCounts.undo;

  return (
    <ScreenShell scroll={false}>
      <TabScene worldId={currentWorldId}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomNavClearance + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View style={styles.titleBlock}>
              <Text style={styles.sectionKicker}>{msg('Poderes')}</Text>
              <Text style={styles.sectionTitle}>{msg('Seu inventário')}</Text>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.totalPill}>
                <GameIcon name="powers" size={24} tone="purple" />
                <Text style={styles.totalText}>{totalPowerUps}</Text>
              </View>
              {onClose ? (
                <Pressable
                  accessibilityLabel={msg('Voltar ao perfil')}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  <GameIcon name="back" size={20} tone="purple" />
                  <Text style={styles.backButtonText}>{msg('Perfil')}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <MenuHeroBanner
            eyebrow={msg('Inventário')}
            imageAccessibilityLabel={msg('Poderes especiais')}
            imageSource={PROFILE_ACTION_ASSETS.powers}
            subtitle={msg(
              'Consulte os poderes que você já conquistou para a próxima jogada.',
            )}
            title={msg('Ferramentas da jornada')}
          />

          <View style={styles.itemList}>
            {POWER_UP_ORDER.map((powerType) => {
              const item = POWER_UP_UI[powerType];
              const count = progress.itemCounts[powerType];

              return (
                <View key={powerType} style={styles.itemCard}>
                  <View pointerEvents="none" style={styles.itemAccent} />
                  <View pointerEvents="none" style={styles.itemCardBevel} />
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
                        {msg('Estoque')}
                      </Text>
                      <Text style={styles.stockText}>{count}</Text>
                    </View>
                    {onOpenTutorial ? (
                      <Pressable
                        accessibilityHint={msg(
                          'Abre a demonstração de {param1}.',
                          {
                            param1: String(
                              item.shopTitle.toLocaleLowerCase('pt-BR'),
                            ),
                          },
                        )}
                        accessibilityLabel={msg('Como usar {param1}', {
                          param1: String(item.shopTitle),
                        })}
                        accessibilityRole="button"
                        testID={powersTutorialTestId(powerType)}
                        onPress={() => onOpenTutorial(powerType)}
                        style={({ pressed }) => [
                          styles.tutorialButton,
                          pressed ? styles.buttonPressed : null,
                        ]}
                      >
                        <Text style={styles.tutorialButtonText}>
                          {msg('Como usar')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.notePanel}>
            <GameIcon name="cart" size={32} tone="green" />
            <View style={styles.noteCopy}>
              <Text style={styles.noteTitle}>{msg('Onde comprar')}</Text>
              <Text style={styles.noteText}>
                {msg(
                  'Para comprar um poder, toque no carrinho ao lado das moedas durante a fase.',
                )}
              </Text>
            </View>
          </View>
        </ScrollView>
      </TabScene>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.goldDark,
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  backButtonText: {
    color: colors.primaryDark,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }, { scale: 0.98 }],
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  itemAccent: {
    backgroundColor: colors.secondary,
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
    backgroundColor: colors.surface,
    // Borda de cor única (sem borderBottomColor divergente): no Android,
    // borderRadius + overflow:hidden + cores de borda diferentes por lado é um
    // gatilho conhecido de artefato de recorte no canto arredondado. O relevo
    // "3D" do rodapé vem só do itemCardBevel abaixo, uma faixa sólida sem borda
    // própria — evita esse caminho de renderização nativo por completo.
    borderColor: colors.gold,
    borderRadius: 14,
    borderWidth: 2,
    gap: spacing.xs,
    overflow: 'hidden',
    padding: spacing.sm,
    paddingLeft: spacing.md,
    position: 'relative',
    ...shadows.card,
  },
  itemCardBevel: {
    backgroundColor: colors.goldDark,
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
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
    backgroundColor: colors.surfaceWarm,
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
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
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
    backgroundColor: colors.creamLight,
    borderColor: colors.border,
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
    color: colors.gold,
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
  tutorialButton: {
    alignItems: 'center',
    backgroundColor: colors.action,
    borderColor: colors.surfaceSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  tutorialButtonText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
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
    backgroundColor: colors.panelDark,
    borderBottomColor: colors.backgroundDeep,
    borderBottomWidth: 4,
    borderColor: colors.shellAccent,
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
