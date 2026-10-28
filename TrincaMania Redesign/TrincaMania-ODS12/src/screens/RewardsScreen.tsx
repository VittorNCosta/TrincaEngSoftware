import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  type ImageSourcePropType,
  View,
} from 'react-native';

import { useBottomNavClearance } from '../components/BottomNavBar';
import {
  MenuCard,
  MenuHeader,
  MenuSectionHeader,
} from '../original/components/MenuPrimitives';
import { msg } from '../original/messages';
import {
  GameIcon,
  GameIconName,
  GameIconTone,
} from '../original/components/GameIcon';
import { PrimaryButton } from '../original/components/PrimaryButton';
import { ScreenShell } from '../original/components/ScreenShell';
import { TabScene } from '../original/components/TabScene';
import { CHEST_PHASES_REQUIRED } from '../storage/progressStorage';
import {
  COIN_TRAY_SLOT_COST,
  MAX_TRAY_CAPACITY,
  TrayBoostPurchaseResult,
  TrayBoostState,
  formatTrayBoostRemaining,
} from '../storage/trayBoostStorage';
import {
  colors,
  forestPolish,
  fontSizes,
  radii,
  shadows,
  spacing,
  touchTargets,
} from '../original/styles/theme';
import { ProgressState } from '../types/game';
import { playShopBuySound } from '../utils/sounds';
import { getCurrentWorldId } from '../utils/worldProgress';

type RewardsScreenProps = {
  activeTrayCapacity: number;
  bonusTraySlotRemainingMs: number;
  coinTraySlotRemainingMs: number;
  progress: ProgressState;
  trayBoostState: TrayBoostState;
  onOpenSettings: () => void;
  onPurchaseCoinTraySlot: () => Promise<TrayBoostPurchaseResult>;
  onShowTutorial: () => void;
  onClose?: () => void;
};

type RewardCardProps = {
  actionLabel?: string;
  disabled?: boolean;
  iconName: GameIconName;
  iconTone?: GameIconTone;
  imageAccessibilityLabel?: string;
  imageSource?: ImageSourcePropType;
  progressPercent?: number;
  status: string;
  title: string;
  onPress?: () => void;
};

function RewardCard({
  actionLabel,
  disabled = false,
  iconName,
  iconTone = 'gold',
  imageAccessibilityLabel,
  imageSource,
  progressPercent,
  status,
  title,
  onPress,
}: RewardCardProps) {
  return (
    <MenuCard
      accessibilityHint={
        onPress && !disabled
          ? actionLabel
            ? msg('Ação disponível: {param1}.', { param1: String(actionLabel) })
            : msg('Abre esta recompensa.')
          : undefined
      }
      accessibilityLabel={onPress ? `${title}. ${status}` : undefined}
      disabled={disabled}
      hitSlop={onPress ? touchTargets.hitSlop : undefined}
      onPress={onPress}
      style={[
        styles.rewardCard,
        actionLabel && !disabled ? styles.rewardCardReady : null,
        disabled ? styles.rewardCardDisabled : null,
      ]}
      variant={
        actionLabel && !disabled ? 'reward' : disabled ? 'locked' : 'standard'
      }
    >
      <View style={styles.rewardTopRow}>
        {imageSource ? (
          <Image
            accessibilityLabel={imageAccessibilityLabel}
            resizeMode="contain"
            source={imageSource}
            style={styles.rewardImage}
          />
        ) : (
          <GameIcon
            muted={disabled}
            name={iconName}
            size={40}
            tone={iconTone}
          />
        )}
        {actionLabel ? (
          <View
            style={[
              styles.rewardActionPill,
              disabled ? styles.rewardActionPillDisabled : null,
            ]}
          >
            <Text style={styles.rewardActionText}>{actionLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.rewardTitle}>{title}</Text>
      <Text style={styles.rewardStatus}>{status}</Text>
      {progressPercent !== undefined ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={msg('Progresso de {param1}', {
            param1: String(title),
          })}
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.max(0, Math.min(100, progressPercent)),
          }}
          style={styles.rewardProgressTrack}
        >
          <View
            style={[
              styles.rewardProgressFill,
              { width: `${Math.max(0, Math.min(100, progressPercent))}%` },
            ]}
          />
        </View>
      ) : null}
    </MenuCard>
  );
}

type HubShortcutProps = {
  alert?: boolean;
  iconName: GameIconName;
  iconTone?: GameIconTone;
  label: string;
  muted?: boolean;
  onPress: () => void;
};

function HubShortcut({
  alert = false,
  iconName,
  iconTone = 'purple',
  label,
  muted = false,
  onPress,
}: HubShortcutProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.hubShortcut,
        muted ? styles.hubShortcutMuted : null,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      {alert ? (
        <View style={styles.shortcutAlert}>
          <Text style={styles.shortcutAlertText}>!</Text>
        </View>
      ) : null}
      <GameIcon muted={muted} name={iconName} size={40} tone={iconTone} />
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        numberOfLines={2}
        style={styles.hubShortcutLabel}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Aba Recompensas: os cartões de prêmio e os atalhos que viviam na antiga
 * HomeScreen. A Loja saiu daqui — ela abre pelo carrinho dentro da fase.
 */
export function RewardsScreen({
  activeTrayCapacity,
  bonusTraySlotRemainingMs,
  coinTraySlotRemainingMs,
  progress,
  trayBoostState,
  onOpenSettings,
  onPurchaseCoinTraySlot,
  onShowTutorial,
  onClose,
}: RewardsScreenProps) {
  const bottomNavClearance = useBottomNavClearance();
  const currentWorldId = getCurrentWorldId(progress);
  const [message, setMessage] = useState<string | undefined>();
  const [trayBoostMessage, setTrayBoostMessage] = useState<
    string | undefined
  >();
  const trayPlusActive =
    trayBoostState.coinSlotExpiresAt !== null && coinTraySlotRemainingMs > 0;
  const bonusSlotActive =
    trayBoostState.adSlotExpiresAt !== null && bonusTraySlotRemainingMs > 0;
  const missingTrayPlusCoins = Math.max(
    0,
    COIN_TRAY_SLOT_COST - progress.coins,
  );
  const canBuyTrayPlus = missingTrayPlusCoins === 0;
  const chestProgressCount =
    progress.chestProgressLevelIds.length % CHEST_PHASES_REQUIRED;
  const chestProgressPercent =
    (chestProgressCount / CHEST_PHASES_REQUIRED) * 100;
  const chestRemainingCount =
    chestProgressCount === 0
      ? CHEST_PHASES_REQUIRED
      : CHEST_PHASES_REQUIRED - chestProgressCount;

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeout = setTimeout(() => setMessage(undefined), 2200);
    return () => clearTimeout(timeout);
  }, [message]);

  const handleChestShortcut = () => {
    setMessage(`Baú comum: ${chestProgressCount}/${CHEST_PHASES_REQUIRED}.`);
  };

  const handleSoon = (label: string) => {
    setMessage(`${label} em breve.`);
  };

  const handlePurchaseTrayPlus = () => {
    onPurchaseCoinTraySlot()
      .then((result) => {
        if (result.purchased) {
          playShopBuySound();
          setTrayBoostMessage('Bandeja Plus ativada por 24h!');
          setMessage('Bandeja Plus ativada.');
          return;
        }

        const nextMessage =
          result.reason === 'insufficient-coins'
            ? 'Moedas insuficientes.'
            : 'Bandeja Plus já está ativa.';

        setTrayBoostMessage(nextMessage);
        setMessage(nextMessage);
      })
      .catch(() => {
        setTrayBoostMessage('Não foi possível ativar agora.');
        setMessage('Não foi possível ativar agora.');
      });
  };

  const commonChestStatus =
    chestProgressCount > 0
      ? `Faltam ${chestRemainingCount} fase${chestRemainingCount === 1 ? '' : 's'}`
      : 'A cada 5 fases';
  const bonusSlotStatus = bonusSlotActive
    ? `Ativo: ${formatTrayBoostRemaining(bonusTraySlotRemainingMs)}`
    : 'Bônus de bandeja';
  const trayPlusStatus = trayPlusActive
    ? `Ativa: ${formatTrayBoostRemaining(coinTraySlotRemainingMs)}`
    : `${COIN_TRAY_SLOT_COST} moedas / 24h`;

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
          <MenuHeader
            title="Recompensas"
            eyebrow="Prêmios da jornada"
            tone="dark"
            onBack={onClose}
            backLabel="Voltar ao perfil"
            right={
              <Pressable
                accessibilityLabel="Abrir configurações"
                accessibilityRole="button"
                onPress={onOpenSettings}
                style={styles.settingsButton}
              >
                <GameIcon name="settings" size={30} tone="blue" />
                <Text style={styles.settingsText}>Menu</Text>
              </Pressable>
            }
          />

          {message ? (
            <View style={styles.toast}>
              <Text numberOfLines={1} style={styles.toastText}>
                {message}
              </Text>
            </View>
          ) : null}

          <View style={styles.rewardsSection}>
            <MenuSectionHeader title="Próximos prêmios" tone="dark" />
            {trayBoostMessage ? (
              <Text numberOfLines={1} style={styles.trayBoostMessage}>
                {trayBoostMessage}
              </Text>
            ) : null}

            <View style={styles.rewardGrid}>
              <RewardCard
                iconName="chest"
                iconTone="gold"
                progressPercent={chestProgressPercent}
                status={`${chestProgressCount}/${CHEST_PHASES_REQUIRED} - ${commonChestStatus}`}
                title="Baú Comum"
              />
              <RewardCard
                iconName="bonus"
                iconTone="blue"
                status={
                  bonusSlotActive ? bonusSlotStatus : 'Disponível na fase'
                }
                title="Espaço Bônus"
              />
              <RewardCard
                actionLabel={
                  trayPlusActive
                    ? undefined
                    : canBuyTrayPlus
                      ? 'Ativar'
                      : `Faltam ${missingTrayPlusCoins}`
                }
                disabled={!trayPlusActive && !canBuyTrayPlus}
                iconName="tray"
                iconTone="green"
                status={trayPlusStatus}
                title={`Bandeja ${activeTrayCapacity}/${MAX_TRAY_CAPACITY}`}
                onPress={trayPlusActive ? undefined : handlePurchaseTrayPlus}
              />
            </View>
          </View>

          <View style={styles.hubShortcutRow}>
            <HubShortcut
              iconName="chest"
              iconTone="gold"
              label="BAÚS"
              onPress={handleChestShortcut}
            />
            <HubShortcut
              iconName="event"
              iconTone="blue"
              label="Eventos"
              muted
              onPress={() => handleSoon('Eventos')}
            />
            <HubShortcut
              iconName="ranking"
              iconTone="gold"
              label="Ranking"
              muted
              onPress={() => handleSoon('Ranking')}
            />
          </View>

          <View style={styles.quickActions}>
            <View style={styles.howToAction}>
              <PrimaryButton
                size="compact"
                title="Como jogar"
                variant="secondary"
                onPress={onShowTutorial}
              />
            </View>
          </View>
        </ScrollView>
      </TabScene>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }, { scale: 0.98 }],
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  howToAction: {
    flex: 1,
    maxWidth: 190,
  },
  hubShortcut: {
    alignItems: 'center',
    backgroundColor: forestPolish.cream,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 2,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 64,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    position: 'relative',
    ...shadows.menuCard,
  },
  hubShortcutLabel: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hubShortcutMuted: {
    backgroundColor: colors.lockedSurface,
    borderColor: colors.borderSoft,
  },
  hubShortcutRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  quickActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingBottom: spacing.xs,
  },
  rewardActionPill: {
    backgroundColor: colors.successDark,
    borderColor: forestPolish.leaf,
    borderRadius: radii.pill,
    borderWidth: 2,
    flexShrink: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  rewardActionPillDisabled: {
    backgroundColor: colors.lockedText,
    borderColor: colors.lockedSurface,
  },
  rewardActionText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rewardCard: {
    backgroundColor: forestPolish.cream,
    borderColor: colors.border,
    borderRadius: radii.menuCard,
    borderWidth: 1,
    flexBasis: '100%',
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 112,
    padding: spacing.lg,
    ...shadows.menuCard,
  },
  rewardCardDisabled: {
    backgroundColor: colors.lockedSurface,
    borderColor: colors.borderSoft,
  },
  rewardCardReady: {
    borderColor: forestPolish.moss,
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rewardImage: { height: 40, width: 40 },
  rewardProgressFill: {
    backgroundColor: forestPolish.moss,
    borderRadius: radii.pill,
    height: '100%',
  },
  rewardProgressTrack: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 10,
    overflow: 'hidden',
  },
  rewardStatus: {
    color: forestPolish.wood,
    fontSize: fontSizes.md,
    fontWeight: '700',
    lineHeight: 22,
  },
  rewardTitle: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  rewardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 28,
  },
  rewardsSection: {
    gap: spacing.sm,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 232, 0.95)',
    // Ver comentário equivalente em PowersScreen.itemCard: borda de cor única +
    // settingsButtonBevel (faixa sólida, sem borda própria) em vez de
    // borderBottomColor divergente, para evitar o artefato de recorte no canto
    // arredondado do Android.
    borderColor: colors.cream,
    borderRadius: 18,
    borderWidth: 2,
    gap: 1,
    minHeight: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    minWidth: 58,
    padding: spacing.sm,
    ...shadows.card,
  },
  settingsButtonBevel: {
    backgroundColor: colors.goldDark,
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  settingsText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  shortcutAlert: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderColor: '#FFC0CE',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    top: -7,
    width: 22,
    zIndex: 2,
  },
  shortcutAlertText: {
    color: colors.inkOnDark,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    maxWidth: '96%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  toastText: {
    color: colors.ink,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  trayBoostMessage: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'right',
  },
});
