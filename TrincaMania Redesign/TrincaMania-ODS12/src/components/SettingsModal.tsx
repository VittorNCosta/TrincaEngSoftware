import Alert from '../utils/appAlert';
import { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiagnosticReport } from './DiagnosticReport';
import { GameIcon } from '../original/components/GameIcon';
import { SettingsPreferenceRow } from '../original/components/SettingsPreferenceRow';
import { AppSettings } from '../storage/settingsStorage';
import {
  colors,
  fontSizes,
  forestPolish,
  radii,
  shadows,
  spacing,
} from '../original/styles/theme';
type SettingsModalProps = {
  devMode?: boolean;
  settings: AppSettings;
  visible: boolean;
  onClose: () => void;
  onEnableSilentMode: () => void;
  onResetProgress: () => void;
  onToggleHaptics: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onUnlockAllForDevMode: () => void;
};

const confirmAction = (
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  onClose: () => void,
  destructive = false,
) => {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : undefined,
      onPress: () => {
        onConfirm();
        onClose();
      },
    },
  ]);
};

export function SettingsModal({
  devMode = false,
  settings,
  visible,
  onClose,
  onEnableSilentMode,
  onResetProgress,
  onToggleHaptics,
  onToggleSound,
  onToggleMusic,
  onUnlockAllForDevMode,
}: SettingsModalProps) {
  const [diagnosticsVisible, setDiagnosticsVisible] = useState(false);
  const silentModeActive =
    !settings.soundEnabled &&
    !settings.musicEnabled &&
    !settings.hapticsEnabled;
  const handleResetProgress = () =>
    confirmAction(
      'Resetar progresso?',
      'Esta ação apaga fases, moedas, poderes, vidas, baús, chaves e progresso salvo. Use apenas se tiver certeza.',
      'Resetar tudo',
      onResetProgress,
      onClose,
      true,
    );

  const handleUnlockAllForDevMode = () =>
    confirmAction(
      devMode ? 'Sair do modo dev?' : 'Liberar todas as fases?',
      'Liberação temporária nesta sessão. Não altera estrelas nem desbloqueios salvos. Partidas e compras continuam seguindo as regras normais.',
      devMode ? 'Desativar' : 'Liberar nesta sessão',
      onUnlockAllForDevMode,
      onClose,
    );

  return (
    <Modal
      accessibilityLabel="Configurações"
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.overlay, styles.preferencesOverlay]}
      >
        <Pressable
          accessible={false}
          focusable={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={[styles.panel, styles.preferencesPanel]}>
          <View pointerEvents="none" style={styles.panelGlow} />
          <View style={styles.header}>
            <GameIcon name="settings" size={32} tone="gold" />
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>TrincaMania ODS12</Text>
              <Text
                accessibilityRole="header"
                style={[styles.title, styles.preferencesTitle]}
              >
                Configurações
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar configurações"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <GameIcon name="close" size={24} tone="gold" variant="plain" />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.contentScroll}
          >
            <View style={styles.preferenceSection}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Áudio e resposta
              </Text>
              <View style={styles.preferenceGroup}>
                <SettingsPreferenceRow
                  title="Música"
                  icon="sound-on"
                  checked={settings.musicEnabled}
                  onPress={onToggleMusic}
                />
                <SettingsPreferenceRow
                  title="Efeitos"
                  icon="sound-on"
                  checked={settings.soundEnabled}
                  onPress={onToggleSound}
                />
                <SettingsPreferenceRow
                  title="Vibração"
                  icon="vibration-on"
                  checked={settings.hapticsEnabled}
                  onPress={onToggleHaptics}
                />
                <SettingsPreferenceRow
                  title="Modo silencioso"
                  icon="moon"
                  checked={silentModeActive}
                  onPress={onEnableSilentMode}
                />
              </View>
            </View>
            <View style={styles.preferenceSection}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Privacidade e suporte
              </Text>
              <View style={styles.preferenceGroup}>
                <SettingsPreferenceRow
                  title="Política de privacidade"
                  icon="lock"
                  onPress={() => {
                    void Linking.openURL(
                      'https://vittorncosta.github.io/TrincaEngSoftware/',
                    ).catch(() =>
                      Alert.alert(
                        'Não foi possível abrir',
                        'Tente novamente quando houver conexão.',
                      ),
                    );
                  }}
                />
                <SettingsPreferenceRow
                  title="Diagnóstico"
                  icon="info"
                  expanded={diagnosticsVisible}
                  onPress={() => setDiagnosticsVisible((value) => !value)}
                />
                <SettingsPreferenceRow
                  title="Resetar progresso"
                  icon="reset"
                  onPress={handleResetProgress}
                />
              </View>
            </View>
            {diagnosticsVisible ? <DiagnosticReport /> : null}
            {__DEV__ ? (
              <View style={styles.preferenceGroup}>
                <SettingsPreferenceRow
                  title="Modo Dev"
                  description="Acesso temporário às fases"
                  icon="target"
                  checked={devMode}
                  onPress={handleUnlockAllForDevMode}
                />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: forestPolish.cream,
    borderBottomColor: forestPolish.woodLight,
    borderBottomWidth: 5,
    borderColor: forestPolish.bark,
    borderRadius: radii.menuControl,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadows.button,
  },
  actionButtonActive: {
    borderColor: forestPolish.gold,
  },
  actionButtonCompact: {
    borderBottomWidth: 3,
    borderRadius: 14,
    minHeight: 49,
    paddingVertical: 5,
  },
  actionButtonGreen: {
    backgroundColor: colors.successSoft,
    borderBottomColor: colors.successDark,
    borderColor: forestPolish.leaf,
  },
  actionButtonInactive: {
    backgroundColor: colors.lockedSurface,
    borderBottomColor: colors.lockedText,
    borderColor: colors.borderSoft,
  },
  actionButtonWarm: {
    backgroundColor: colors.surfaceWarm,
    borderBottomColor: forestPolish.woodLight,
  },
  actionButtonWarmIdle: {
    backgroundColor: colors.lockedSurface,
    borderBottomColor: colors.lockedText,
    borderColor: colors.borderSoft,
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionLabel: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  actionLabelCompact: {
    fontSize: fontSizes.sm,
  },
  actionList: {
    gap: spacing.sm,
  },
  actionStatus: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  activeBadge: {
    backgroundColor: '#FFFFFF',
  },
  activeBadgeText: {
    color: colors.successDark,
  },
  advancedPanel: {
    backgroundColor: forestPolish.cream,
    borderColor: forestPolish.bark,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    overflow: 'hidden',
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
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  contentScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderBottomColor: colors.successDark,
    borderBottomWidth: 4,
    borderColor: colors.successSoft,
    borderRadius: radii.button,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 50,
  },
  continueButtonText: {
    color: '#07583E',
    fontSize: fontSizes.md,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  devModeBanner: {
    backgroundColor: '#EFE5CC',
    borderColor: forestPolish.bark,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.xs,
  },
  devModeBannerText: {
    color: forestPolish.wood,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  exitButton: {
    backgroundColor: colors.surfaceWarm,
    borderColor: forestPolish.bark,
  },
  gameplayActionButton: {
    alignItems: 'center',
    backgroundColor: forestPolish.cream,
    borderColor: forestPolish.bark,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.xs,
  },
  gameplayActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gameplayActionText: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  gameplayPanel: {
    gap: spacing.sm,
    maxWidth: 330,
    padding: 14,
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
  inactiveBadge: {
    backgroundColor: colors.lockedText,
  },
  inactiveBadgeText: {
    color: colors.surfaceRaised,
  },
  kicker: {
    color: forestPolish.gold,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(4, 16, 24, 0.65)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  panel: {
    backgroundColor: forestPolish.wood,
    borderBottomColor: forestPolish.woodDark,
    borderBottomWidth: 7,
    borderColor: forestPolish.bark,
    borderRadius: radii.menuCard,
    borderWidth: 3,
    gap: spacing.md,
    flexShrink: 1,
    maxWidth: 360,
    maxHeight: '100%',
    overflow: 'hidden',
    padding: spacing.md,
    position: 'relative',
    width: '100%',
    ...shadows.card,
  },
  preferencesOverlay: { padding: spacing.sm + spacing.xs },
  preferencesPanel: {
    maxWidth: 420,
    padding: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    gap: spacing.sm,
  },
  preferencesTitle: { fontSize: 22, lineHeight: 28 },
  preferenceSection: { gap: spacing.xs },
  sectionTitle: {
    color: forestPolish.cream,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  preferenceGroup: {
    backgroundColor: forestPolish.cream,
    borderColor: forestPolish.bark,
    borderWidth: 1,
    borderRadius: radii.menuControl,
    overflow: 'hidden',
  },
  qaSection: {
    borderTopWidth: 1,
    borderTopColor: forestPolish.bark,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  qaContent: { gap: spacing.sm },
  scrollContent: {
    gap: spacing.md,
  },
  panelGlow: {
    backgroundColor: 'rgba(245, 207, 117, 0.16)',
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
