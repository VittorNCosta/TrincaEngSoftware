import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { WorldChestArt } from './ChestArt';
import { ChestOpeningModal, ChestRewardItem } from './ChestOpeningModal';
import { GameIcon } from './GameIcon';
import { PrimaryButton } from './PrimaryButton';
import { RewardAssetIcon } from './RewardAssetIcon';
import { KEY_COST, getBonusWorldChestId, getWorldChestLabel } from '../storage/progressStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { WorldChestOpenResult } from '../types/game';
import { WindowTarget } from '../types/ui';
import { playChestOpenSound, playRewardSparkleSound } from '../utils/sounds';

type WorldChestModalProps = {
  coins: number;
  isOpening: boolean;
  keys: number;
  result?: WorldChestOpenResult;
  visible: boolean;
  worldChestId?: string;
  coinCollectTarget?: WindowTarget;
  onBuyAndOpen: () => void;
  onClose: () => void;
  onOpenWithKey: () => void;
};

const getStatusMessage = (result?: WorldChestOpenResult) => {
  switch (result?.status) {
    case 'insufficient-coins':
      return 'Moedas insuficientes.';
    case 'no-key':
      return 'Você precisa de uma chave para abrir.';
    case 'already-opened':
      return 'Este baú já foi aberto.';
    case 'unavailable':
      return 'Este baú não está disponível agora.';
    default:
      return undefined;
  }
};

const getWorldChestRewardItems = (result?: WorldChestOpenResult): ChestRewardItem[] => {
  if (!result?.reward) {
    return [];
  }

  return [
    ...(result.reward.lifeGranted
      ? [{ iconName: 'heart' as const, label: '+1 vida', tone: 'pink' as const }]
      : []),
    { iconName: 'coin' as const, label: `+${result.reward.coins} moedas`, tone: 'gold' as const },
    { iconName: 'powers' as const, label: '+1 Trinca Mágica', tone: 'blue' as const },
    { iconName: 'shuffle' as const, label: '+1 Misturar', tone: 'purple' as const },
    { iconName: 'undo' as const, label: '+1 Voltar', tone: 'green' as const },
  ];
};

export function WorldChestModal({
  coins,
  isOpening,
  keys,
  result,
  visible,
  worldChestId,
  coinCollectTarget,
  onBuyAndOpen,
  onClose,
  onOpenWithKey,
}: WorldChestModalProps) {
  const opened = result?.status === 'opened';
  const statusMessage = getStatusMessage(result);
  const rewardItems = getWorldChestRewardItems(result);
  const isBonusChest = worldChestId === getBonusWorldChestId();
  const revealKey =
    opened && result?.reward
      ? `${result.worldChestId}-${result.reward.coins}-${result.reward.lifeGranted ? 'life' : 'coins'}`
      : undefined;
  const [isRevealVisible, setIsRevealVisible] = useState(false);
  const shownRevealKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!visible) {
      setIsRevealVisible(false);
      shownRevealKeyRef.current = undefined;
      return;
    }

    if (!revealKey || rewardItems.length === 0) {
      return;
    }

    if (shownRevealKeyRef.current === revealKey) {
      return;
    }

    shownRevealKeyRef.current = revealKey;
    setIsRevealVisible(true);
  }, [revealKey, rewardItems.length, visible]);

  return (
    <>
      <Modal animationType="fade" transparent visible={visible}>
        <View style={styles.overlay}>
          <View style={styles.card}>
          {opened ? <GameIcon name="win" size={62} tone="green" /> : <WorldChestArt size={104} />}
          <Text style={styles.kicker}>
            {worldChestId ? getWorldChestLabel(worldChestId) : 'Baú Especial'}
          </Text>
          <Text style={styles.title}>
            {opened ? (isBonusChest ? 'Baú Especial aberto!' : 'Mundo concluído!') : 'Baú Especial disponível'}
          </Text>
          <Text style={styles.subtitle}>
            {opened
              ? 'Você abriu um Baú Especial!'
              : isBonusChest
                ? 'Recompensa do Jardim Renascido. Use uma chave para abrir agora.'
                : 'Use uma chave para abrir agora ou volte depois.'}
          </Text>

          <View style={styles.keyRow}>
            <View style={styles.keyPill}>
              <GameIcon name="key" size={22} tone="purple" />
              <Text style={styles.keyText}>Chaves: {keys}</Text>
            </View>
            <View style={styles.keyPill}>
              <GameIcon name="coin" size={22} tone="gold" />
              <Text style={styles.keyText}>Chave: {KEY_COST} moedas</Text>
            </View>
          </View>

          {opened && result.reward ? (
            <View style={styles.rewardPanel}>
              {rewardItems.map((item) => (
                <View key={`${item.iconName}-${item.label}`} style={styles.rewardChip}>
                  <GameIcon name={item.iconName} size={24} tone={item.tone} />
                  <Text style={styles.rewardText}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.pendingPanel}>
              <RewardAssetIcon name="key" size={58} />
              <Text style={styles.pendingText}>
                {keys > 0
                  ? 'Você tem chave para abrir este baú.'
                  : coins >= KEY_COST
                    ? 'Sem chaves. Compre uma por moedas e abra agora.'
                    : 'Sem chaves no momento. O baú fica guardado para depois.'}
              </Text>
              {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
            </View>
          )}

          {opened ? (
            <PrimaryButton title="Fechar" onPress={onClose} />
          ) : isOpening ? (
            <View style={styles.openingStatus}>
              <Text style={styles.openingStatusText}>Abrindo baú...</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              {keys > 0 ? (
                <PrimaryButton
                  title="Abrir com 1 chave"
                  onPress={onOpenWithKey}
                />
              ) : (
                <PrimaryButton
                  title={`Comprar chave por ${KEY_COST}`}
                  onPress={onBuyAndOpen}
                />
              )}
              <PrimaryButton size="compact" title="Depois" variant="secondary" onPress={onClose} />
            </View>
          )}
          </View>
        </View>
      </Modal>
      <ChestOpeningModal
        animationKey={revealKey}
        kicker={isBonusChest ? 'Baú Especial' : 'Baú de Mundo'}
        rewardItems={rewardItems}
        title={isBonusChest ? 'Recompensa do Jardim Renascido' : 'Recompensa Especial'}
        variant="world"
        visible={isRevealVisible && rewardItems.length > 0}
        coinCollectTarget={coinCollectTarget}
        onClose={() => {
          setIsRevealVisible(false);
          onClose();
        }}
        onOpenMoment={playChestOpenSound}
        onRewardMoment={playRewardSparkleSound}
      />
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#241044',
    borderBottomColor: '#8F6500',
    borderBottomWidth: 6,
    borderColor: '#FFE178',
    borderRadius: radii.card,
    borderWidth: 3,
    gap: spacing.sm,
    maxWidth: 380,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '90%',
    ...shadows.card,
  },
  keyPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 225, 120, 0.34)',
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  keyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  keyText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  kicker: {
    color: '#FFF4B8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 3, 24, 0.9)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pendingPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 225, 120, 0.32)',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: spacing.xs,
    padding: spacing.md,
    width: '100%',
  },
  pendingText: {
    color: '#FFE9A8',
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'center',
  },
  rewardPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 230, 0.12)',
    borderColor: '#FFE178',
    borderRadius: radii.card,
    borderWidth: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    padding: spacing.md,
    width: '100%',
  },
  rewardChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 225, 120, 0.34)',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  rewardText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  openingStatus: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 225, 120, 0.16)',
    borderColor: 'rgba(255, 225, 120, 0.36)',
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  openingStatusText: {
    color: '#FFF4B8',
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusText: {
    color: colors.dangerDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#FFE9A8',
    fontSize: fontSizes.md,
    fontWeight: '800',
    lineHeight: 21,
    textAlign: 'center',
  },
  title: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
});
