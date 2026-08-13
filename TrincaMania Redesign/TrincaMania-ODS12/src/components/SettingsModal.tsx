import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameIcon, GameIconName, GameIconTone } from './GameIcon';
import { AppSettings } from '../storage/settingsStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type SettingsModalProps = {
  settings: AppSettings;
  visible: boolean;
  onClose: () => void;
  onEnableSilentMode: () => void;
  onResetProgress: () => void;
  onToggleHaptics: () => void;
  onToggleSound: () => void;
};

type SettingsActionProps = {
  active?: boolean;
  iconName: GameIconName;
  label: string;
  status?: string;
  tone?: GameIconTone;
  onPress: () => void;
};

function SettingsAction({
  active = false,
  iconName,
  label,
  status,
  tone = 'gold',
  onPress,
}: SettingsActionProps) {
  const stateMark = active ? '\u2713' : '\u00D7';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        active ? styles.actionButtonActive : styles.actionButtonInactive,
        active && tone === 'green' ? styles.actionButtonGreen : null,
        active && tone === 'purple' ? styles.actionButtonPurple : null,
        !active && tone === 'purple' ? styles.actionButtonPurpleIdle : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <GameIcon muted={!active} name={iconName} size={40} tone={active ? tone : 'neutral'} />
      <View style={styles.actionCopy}>
        <Text numberOfLines={1} style={styles.actionLabel}>
          {label}
        </Text>
        {status ? (
          <Text numberOfLines={1} style={styles.actionStatus}>
            {status}
          </Text>
        ) : null}
      </View>
      <View style={[styles.stateBadge, active ? styles.activeBadge : styles.inactiveBadge]}>
        <Text style={[styles.stateBadgeText, active ? styles.activeBadgeText : styles.inactiveBadgeText]}>
          {stateMark}
        </Text>
      </View>
    </Pressable>
  );
}

export function SettingsModal({
  settings,
  visible,
  onClose,
  onEnableSilentMode,
  onResetProgress,
  onToggleHaptics,
  onToggleSound,
}: SettingsModalProps) {
  const silentModeActive = !settings.soundEnabled && !settings.hapticsEnabled;
  const handleResetProgress = () => {
    Alert.alert(
      'Resetar progresso?',
      'Esta ação apaga fases, moedas, poderes, vidas, baús, chaves e progresso salvo. Use apenas se tiver certeza.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar tudo',
          style: 'destructive',
          onPress: () => {
            onResetProgress();
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.overlay}>
        <Pressable accessibilityRole="button" style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <View pointerEvents="none" style={styles.panelGlow} />
          <View style={styles.header}>
            <GameIcon name="settings" size={42} tone="gold" />
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>Trinca Mania</Text>
              <Text style={styles.title}>Configurações</Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar configurações"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
            >
              <GameIcon name="close" size={30} tone="danger" />
            </Pressable>
          </View>

          <View style={styles.actionList}>
            <SettingsAction
              active={settings.soundEnabled}
              iconName={settings.soundEnabled ? 'sound-on' : 'sound-off'}
              label={`Som: ${settings.soundEnabled ? 'Ligado' : 'Desligado'}`}
              status="Efeitos sonoros"
              tone="gold"
              onPress={onToggleSound}
            />
            <SettingsAction
              active={settings.hapticsEnabled}
              iconName={settings.hapticsEnabled ? 'vibration-on' : 'vibration-off'}
              label={`Vibração: ${settings.hapticsEnabled ? 'Ligada' : 'Desligada'}`}
              status="Resposta ao toque"
              tone="green"
              onPress={onToggleHaptics}
            />
            <SettingsAction
              active={silentModeActive}
              iconName="moon"
              label="Modo silencioso"
              status={silentModeActive ? 'Ativo' : 'Som e vibração off'}
              tone="purple"
              onPress={onEnableSilentMode}
            />
          </View>

          <View style={styles.advancedPanel}>
            <Text style={styles.advancedTitle}>Opções avançadas</Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleResetProgress}
              style={({ pressed }) => [styles.resetButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.resetButtonText}>Resetar progresso</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.doneButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.doneButtonText}>Fechar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#F2A93B',
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 5,
    borderColor: '#FFF4C9',
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 62,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadows.button,
  },
  actionButtonActive: {
    borderColor: '#FFFFFF',
  },
  actionButtonInactive: {
    backgroundColor: '#273256',
    borderBottomColor: '#11182E',
    borderColor: '#617098',
  },
  actionButtonGreen: {
    backgroundColor: '#42E5A7',
    borderBottomColor: '#087A54',
  },
  actionButtonPurple: {
    backgroundColor: '#8A65FF',
    borderBottomColor: '#2C0E56',
  },
  actionButtonPurpleIdle: {
    backgroundColor: '#4B3A83',
    borderBottomColor: '#241052',
    borderColor: '#8B7BE0',
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionLabel: {
    color: colors.inkOnDark,
    fontSize: fontSizes.md,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.22)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 1,
  },
  actionList: {
    gap: spacing.sm,
  },
  actionStatus: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  advancedPanel: {
    backgroundColor: 'rgba(7, 24, 32, 0.32)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  advancedTitle: {
    color: 'rgba(255, 233, 168, 0.78)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  activeBadge: {
    backgroundColor: '#FFFFFF',
  },
  activeBadgeText: {
    color: colors.successDark,
  },
  inactiveBadge: {
    backgroundColor: '#1B2440',
  },
  inactiveBadgeText: {
    color: '#D8E3FF',
  },
  stateBadge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  stateBadgeText: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 17,
  },
  backdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  doneButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#28C96F',
    borderBottomColor: '#087A54',
    borderBottomWidth: 5,
    borderColor: '#C7FFD9',
    borderRadius: radii.pill,
    borderWidth: 2,
    minHeight: 48,
    minWidth: 150,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  doneButtonText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(4, 9, 24, 0.62)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  panel: {
    backgroundColor: 'rgba(36, 21, 88, 0.98)',
    borderBottomColor: '#120932',
    borderBottomWidth: 7,
    borderColor: 'rgba(255, 211, 90, 0.74)',
    borderRadius: 24,
    borderWidth: 3,
    gap: spacing.md,
    maxWidth: 360,
    overflow: 'hidden',
    padding: spacing.md,
    position: 'relative',
    width: '100%',
    ...shadows.card,
  },
  panelGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.18)',
    borderRadius: radii.pill,
    height: 110,
    left: -26,
    position: 'absolute',
    right: 80,
    top: -70,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }, { scale: 0.98 }],
  },
  resetButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: 'rgba(255, 192, 206, 0.42)',
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  resetButtonText: {
    color: '#FFD9E4',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.inkOnDark,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 2,
  },
});
