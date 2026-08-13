import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { GameIcon, GameIconName, GameIconTone } from '../components/GameIcon';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { TabScene } from '../components/TabScene';
import { CHEST_PHASES_REQUIRED, getBonusWorldChestProgress } from '../storage/progressStorage';
import {
  COIN_TRAY_SLOT_COST,
  MAX_TRAY_CAPACITY,
  TrayBoostPurchaseResult,
  TrayBoostState,
  formatTrayBoostRemaining,
} from '../storage/trayBoostStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
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
  onOpenWorldChest: (worldChestId?: string) => void;
  onPurchaseCoinTraySlot: () => Promise<TrayBoostPurchaseResult>;
  onShowTutorial: () => void;
};

type RewardCardProps = {
  actionLabel?: string;
  disabled?: boolean;
  iconName: GameIconName;
  iconTone?: GameIconTone;
  progressPercent?: number;
  status: string;
  tone?: 'gold' | 'green' | 'purple' | 'blue';
  title: string;
  onPress?: () => void;
};

function RewardCard({
  actionLabel,
  disabled = false,
  iconName,
  iconTone = 'gold',
  progressPercent,
  status,
  tone = 'gold',
  title,
  onPress,
}: RewardCardProps) {
  const isInteractive = Boolean(onPress) && !disabled;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { disabled } : undefined}
      disabled={!onPress || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.rewardCard,
        tone === 'green' ? styles.rewardCardGreen : null,
        tone === 'purple' ? styles.rewardCardPurple : null,
        tone === 'blue' ? styles.rewardCardBlue : null,
        actionLabel && !disabled ? styles.rewardCardReady : null,
        disabled ? styles.rewardCardDisabled : null,
        pressed && isInteractive ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.rewardTopRow}>
        <GameIcon muted={disabled} name={iconName} size={40} tone={iconTone} />
        {actionLabel ? (
          <View style={[styles.rewardActionPill, disabled ? styles.rewardActionPillDisabled : null]}>
            <Text numberOfLines={1} style={styles.rewardActionText}>
              {actionLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.rewardTitle}>
        {title}
      </Text>
      <Text numberOfLines={2} style={styles.rewardStatus}>
        {status}
      </Text>
      {progressPercent !== undefined ? (
        <View style={styles.rewardProgressTrack}>
          <View
            style={[
              styles.rewardProgressFill,
              { width: `${Math.max(0, Math.min(100, progressPercent))}%` },
            ]}
          />
        </View>
      ) : null}
    </Pressable>
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
      <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={2} style={styles.hubShortcutLabel}>
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
  onOpenWorldChest,
  onPurchaseCoinTraySlot,
  onShowTutorial,
}: RewardsScreenProps) {
  const currentWorldId = getCurrentWorldId(progress);
  const [message, setMessage] = useState<string | undefined>();
  const [trayBoostMessage, setTrayBoostMessage] = useState<string | undefined>();
  const trayPlusActive = trayBoostState.coinSlotExpiresAt !== null && coinTraySlotRemainingMs > 0;
  const bonusSlotActive = trayBoostState.adSlotExpiresAt !== null && bonusTraySlotRemainingMs > 0;
  const missingTrayPlusCoins = Math.max(0, COIN_TRAY_SLOT_COST - progress.coins);
  const canBuyTrayPlus = missingTrayPlusCoins === 0;
  const bonusWorldChest = getBonusWorldChestProgress(progress);
  const pendingWorldChestId = bonusWorldChest.available ? bonusWorldChest.id : undefined;
  const chestProgressCount = progress.chestProgressLevelIds.length % CHEST_PHASES_REQUIRED;
  const chestProgressPercent = (chestProgressCount / CHEST_PHASES_REQUIRED) * 100;
  const chestRemainingCount =
    chestProgressCount === 0 ? CHEST_PHASES_REQUIRED : CHEST_PHASES_REQUIRED - chestProgressCount;

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeout = setTimeout(() => setMessage(undefined), 2200);
    return () => clearTimeout(timeout);
  }, [message]);

  const handleChestShortcut = () => {
    if (pendingWorldChestId) {
      onOpenWorldChest(pendingWorldChestId);
      return;
    }

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
  const specialChestStatus = pendingWorldChestId
    ? `Disponível - ${progress.keys} chave${progress.keys === 1 ? '' : 's'}`
    : bonusWorldChest.claimed
      ? 'Recompensa coletada'
      : `Reino Açucarado ${bonusWorldChest.completedCount}/${bonusWorldChest.totalCount}`;
  const bonusSlotStatus = bonusSlotActive
    ? `Ativo: ${formatTrayBoostRemaining(bonusTraySlotRemainingMs)}`
    : 'Bônus de bandeja';
  const trayPlusStatus = trayPlusActive
    ? `Ativa: ${formatTrayBoostRemaining(coinTraySlotRemainingMs)}`
    : `${COIN_TRAY_SLOT_COST} moedas / 24h`;

  return (
    <ScreenShell scroll={false}>
      <TabScene worldId={currentWorldId}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <View style={styles.titleBlock}>
              <Text style={styles.sectionKicker}>Recompensas</Text>
              <Text style={styles.sectionTitle}>Próximos prêmios</Text>
            </View>

            <Pressable
              accessibilityLabel="Abrir configurações"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onOpenSettings}
              style={({ pressed }) => [styles.settingsButton, pressed ? styles.buttonPressed : null]}
            >
              <GameIcon name="settings" size={30} tone="blue" />
              <Text style={styles.settingsText}>Menu</Text>
            </Pressable>
          </View>

          {message ? (
            <View style={styles.toast}>
              <Text numberOfLines={1} style={styles.toastText}>
                {message}
              </Text>
            </View>
          ) : null}

          <View style={styles.rewardsSection}>
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
                actionLabel={pendingWorldChestId ? 'Abrir' : undefined}
                disabled={!pendingWorldChestId}
                iconName="specialChest"
                iconTone="purple"
                status={specialChestStatus}
                title="Baú Especial"
                tone="purple"
                onPress={pendingWorldChestId ? () => onOpenWorldChest(pendingWorldChestId) : undefined}
              />
              <RewardCard
                iconName="bonus"
                iconTone="blue"
                status={bonusSlotActive ? bonusSlotStatus : 'Disponível na fase'}
                title="Espaço Bônus"
                tone="blue"
              />
              <RewardCard
                actionLabel={
                  trayPlusActive ? undefined : canBuyTrayPlus ? 'Ativar' : `Faltam ${missingTrayPlusCoins}`
                }
                disabled={!trayPlusActive && !canBuyTrayPlus}
                iconName="tray"
                iconTone="green"
                status={trayPlusStatus}
                title={`Bandeja ${activeTrayCapacity}/${MAX_TRAY_CAPACITY}`}
                tone="green"
                onPress={trayPlusActive ? undefined : handlePurchaseTrayPlus}
              />
            </View>
          </View>

          <View style={styles.hubShortcutRow}>
            <HubShortcut
              alert={Boolean(pendingWorldChestId)}
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
              <PrimaryButton size="compact" title="Como jogar" variant="secondary" onPress={onShowTutorial} />
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
  cardPressed: {
    opacity: 0.94,
    transform: [{ translateY: 2 }, { scale: 0.99 }],
  },
  content: {
    gap: spacing.sm,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  howToAction: {
    flex: 1,
    maxWidth: 190,
  },
  hubShortcut: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 46, 137, 0.96)',
    borderBottomColor: '#241052',
    borderBottomWidth: 4,
    borderColor: '#FFD35A',
    borderRadius: 18,
    borderWidth: 2,
    flex: 1,
    gap: 1,
    justifyContent: 'center',
    minHeight: 64,
    minWidth: 0,
    paddingHorizontal: 3,
    paddingVertical: 4,
    position: 'relative',
    ...shadows.button,
  },
  hubShortcutLabel: {
    color: colors.inkOnDark,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 10,
    minHeight: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hubShortcutMuted: {
    backgroundColor: 'rgba(54, 38, 103, 0.9)',
    borderColor: 'rgba(200, 193, 255, 0.78)',
    opacity: 0.84,
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
    backgroundColor: '#28C96F',
    borderColor: '#C7FFD9',
    borderRadius: radii.pill,
    borderWidth: 2,
    maxWidth: 78,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  rewardActionPillDisabled: {
    backgroundColor: '#8D9BA0',
    borderColor: '#D5E0E0',
  },
  rewardActionText: {
    color: colors.inkOnDark,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rewardCard: {
    backgroundColor: 'rgba(57, 34, 125, 0.94)',
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 4,
    borderColor: 'rgba(255, 211, 90, 0.78)',
    borderRadius: 16,
    borderWidth: 2,
    flexBasis: '48%',
    flexGrow: 1,
    gap: 5,
    minHeight: 102,
    padding: spacing.sm,
    ...shadows.card,
  },
  rewardCardBlue: {
    borderBottomColor: '#0A4D95',
    borderColor: '#C8ECFF',
  },
  rewardCardDisabled: {
    opacity: 0.86,
  },
  rewardCardGreen: {
    borderBottomColor: colors.successDark,
    borderColor: '#C7FFD9',
  },
  rewardCardPurple: {
    borderBottomColor: '#2C0E56',
    borderColor: '#C8C1FF',
  },
  rewardCardReady: {
    backgroundColor: 'rgba(93, 55, 202, 0.98)',
    borderBottomColor: '#087A54',
    borderColor: '#42E5A7',
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rewardProgressFill: {
    backgroundColor: '#42EFAF',
    borderRadius: radii.pill,
    height: '100%',
  },
  rewardProgressTrack: {
    backgroundColor: 'rgba(7, 24, 32, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 10,
    overflow: 'hidden',
  },
  rewardStatus: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    lineHeight: 14,
  },
  rewardTitle: {
    color: colors.inkOnDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  rewardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  rewardsSection: {
    backgroundColor: 'rgba(44, 21, 104, 0.96)',
    borderBottomColor: '#120932',
    borderBottomWidth: 6,
    borderColor: 'rgba(255, 211, 90, 0.48)',
    borderRadius: 18,
    borderWidth: 3,
    gap: spacing.sm,
    padding: spacing.sm,
    ...shadows.card,
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
  settingsButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 232, 0.95)',
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 4,
    borderColor: '#FFF4C9',
    borderRadius: 18,
    borderWidth: 2,
    gap: 1,
    height: 56,
    justifyContent: 'center',
    width: 58,
    ...shadows.card,
  },
  settingsText: {
    color: colors.ink,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  shortcutAlert: {
    alignItems: 'center',
    backgroundColor: '#F05278',
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
  titleBlock: {
    flex: 1,
    minWidth: 0,
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
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  trayBoostMessage: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'right',
  },
});
