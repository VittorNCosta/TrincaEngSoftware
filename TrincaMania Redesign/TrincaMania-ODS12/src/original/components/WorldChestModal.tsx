import { ScrollView, Text, View, Modal, StyleSheet } from 'react-native';
import { msg } from '../messages';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorldChestArt } from '../../components/ChestArt';
import {
  ChestOpeningModal,
  ChestRewardItem,
} from '../../components/ChestOpeningModal';
import { GameIcon } from './GameIcon';
import { PrimaryButton } from './PrimaryButton';
import { RewardAssetIcon } from './RewardAssetIcon';
import { POWER_UP_UI } from '../../data/powerUps';
import {
  KEY_COST,
  getBonusWorldChestId,
  getWorldChestLabel,
} from '../../storage/progressStorage';
import {
  colors,
  forestPolish,
  fontSizes,
  radii,
  shadows,
  spacing,
} from '../styles/theme';
import { WorldChestOpenResult } from '../../types/game';
import { WindowTarget } from '../../types/ui';
import { playChestOpenSound, playRewardSparkleSound } from '../../utils/sounds';

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
      return msg('Moedas insuficientes.');
    case 'no-key':
      return msg('Você precisa de uma chave para abrir.');
    case 'already-opened':
      return msg('Este baú já foi aberto.');
    case 'unavailable':
      return msg('Este baú não está disponível agora.');
    default:
      return undefined;
  }
};

const getWorldChestRewardItems = (
  result?: WorldChestOpenResult,
): ChestRewardItem[] => {
  if (!result?.reward) {
    return [];
  }

  return [
    ...(result.reward.lifeGranted
      ? [
          {
            iconName: 'heart' as const,
            label: msg('+1 vida'),
            tone: 'pink' as const,
          },
        ]
      : []),
    {
      iconName: 'coin' as const,
      label: msg('+{param1} moedas', { param1: String(result.reward.coins) }),
      tone: 'gold' as const,
    },
    {
      iconName: 'powers' as const,
      label: `+1 ${POWER_UP_UI.hint.label}`,
      tone: 'blue' as const,
    },
    {
      iconName: 'shuffle' as const,
      label: `+1 ${POWER_UP_UI.shuffle.label}`,
      tone: 'purple' as const,
    },
    {
      iconName: 'undo' as const,
      label: `+1 ${POWER_UP_UI.undo.label}`,
      tone: 'green' as const,
    },
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
  const alreadyCollected = result?.status === 'already-opened';
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
      <Modal
        accessibilityLabel="Baú Especial"
        animationType="fade"
        onRequestClose={() => {
          if (!isOpening) onClose();
        }}
        transparent
        visible={visible && !isRevealVisible}
      >
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={styles.overlay}
        >
          <View style={styles.card}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
            >
              {opened || alreadyCollected ? (
                <GameIcon name="win" size={62} tone="green" />
              ) : (
                <WorldChestArt size={104} />
              )}
              <Text style={styles.kicker}>
                {worldChestId
                  ? getWorldChestLabel(worldChestId)
                  : msg('Baú Especial')}
              </Text>
              <Text style={styles.title}>
                {alreadyCollected
                  ? msg('Recompensa coletada')
                  : opened
                    ? isBonusChest
                      ? msg('Baú Especial aberto!')
                      : msg('Mundo concluído!')
                    : msg('Baú Especial disponível')}
              </Text>
              <Text style={styles.subtitle}>
                {alreadyCollected
                  ? msg('Este baú já foi aberto. Sua recompensa está guardada.')
                  : opened
                    ? msg('Você abriu um Baú Especial!')
                    : isBonusChest
                      ? msg(
                          'Recompensa do Reino Açucarado. Use uma chave para abrir agora.',
                        )
                      : msg('Use uma chave para abrir agora ou volte depois.')}
              </Text>

              {!alreadyCollected ? (
                <View style={styles.keyRow}>
                  <View style={styles.keyPill}>
                    <GameIcon name="key" size={22} tone="purple" />
                    <Text style={styles.keyText}>
                      {msg('Chaves: ')}
                      {keys}
                    </Text>
                  </View>
                  <View style={styles.keyPill}>
                    <GameIcon name="coin" size={22} tone="gold" />
                    <Text style={styles.keyText}>
                      {msg('Chave: ')}
                      {KEY_COST}
                      {msg(' moedas')}
                    </Text>
                  </View>
                </View>
              ) : null}

              {opened && result.reward ? (
                <View style={styles.rewardPanel}>
                  {rewardItems.map((item) => (
                    <View
                      key={`${item.iconName}-${item.label}`}
                      style={styles.rewardChip}
                    >
                      <GameIcon
                        name={item.iconName}
                        size={24}
                        tone={item.tone}
                      />
                      <Text style={styles.rewardText}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              ) : !alreadyCollected ? (
                <View style={styles.pendingPanel}>
                  <RewardAssetIcon name="key" size={58} />
                  <Text style={styles.pendingText}>
                    {keys > 0
                      ? msg('Você tem chave para abrir este baú.')
                      : coins >= KEY_COST
                        ? msg('Sem chaves. Compre uma por moedas e abra agora.')
                        : msg(
                            'Sem chaves no momento. O baú fica guardado para depois.',
                          )}
                  </Text>
                  {statusMessage ? (
                    <Text accessibilityRole="alert" style={styles.statusText}>
                      {statusMessage}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View
              accessibilityLiveRegion="polite"
              accessibilityState={{ busy: isOpening }}
              style={styles.footer}
            >
              {opened || alreadyCollected ? (
                <PrimaryButton
                  appearance="forest"
                  variant="secondary"
                  title={msg('Fechar')}
                  onPress={onClose}
                />
              ) : isOpening ? (
                <View style={styles.openingStatus}>
                  <Text style={styles.openingStatusText}>
                    {msg('Abrindo baú...')}
                  </Text>
                </View>
              ) : (
                <View style={styles.actions}>
                  {keys > 0 ? (
                    <PrimaryButton
                      appearance="forest"
                      title={msg('Abrir com 1 chave')}
                      onPress={onOpenWithKey}
                    />
                  ) : (
                    <PrimaryButton
                      appearance="forest"
                      title={msg('Comprar chave por {param1}', {
                        param1: String(KEY_COST),
                      })}
                      onPress={onBuyAndOpen}
                    />
                  )}
                  <PrimaryButton
                    appearance="forest"
                    title={msg('Depois')}
                    variant="secondary"
                    onPress={onClose}
                  />
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      <ChestOpeningModal
        animationKey={revealKey}
        kicker={isBonusChest ? msg('Baú Especial') : msg('Baú de Mundo')}
        rewardItems={rewardItems}
        title={
          isBonusChest
            ? msg('Recompensa do Reino Açucarado')
            : msg('Recompensa Especial')
        }
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
  scroll: { flexShrink: 1, width: '100%' },
  body: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  footer: { padding: spacing.lg, width: '100%' },
  actions: {
    gap: spacing.sm,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: forestPolish.cream,
    borderColor: forestPolish.bark,
    borderRadius: radii.menuCard,
    borderWidth: 2,
    maxHeight: '100%',
    flexShrink: 1,
    maxWidth: 380,
    overflow: 'hidden',
    width: '100%',
    ...shadows.menuCard,
  },
  keyPill: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
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
    color: forestPolish.wood,
    flexShrink: 1,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  kicker: {
    color: forestPolish.wood,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 27, 24, 0.65)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pendingPanel: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    width: '100%',
  },
  pendingText: {
    color: forestPolish.wood,
    fontSize: fontSizes.md,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'center',
  },
  rewardPanel: {
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    padding: spacing.md,
    width: '100%',
  },
  rewardChip: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  rewardText: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.md,
    flexShrink: 1,
    fontWeight: '900',
  },
  openingStatus: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 225, 120, 0.16)',
    borderColor: 'rgba(255, 225, 120, 0.36)',
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  openingStatusText: {
    color: forestPolish.wood,
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
    color: forestPolish.wood,
    fontSize: fontSizes.md,
    fontWeight: '800',
    lineHeight: 21,
    textAlign: 'center',
  },
  title: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
});
