import { Animated, Pressable, Text, View } from 'react-native';
import { GameIcon } from '../../components/GameIcon';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MapLevelDetails } from '../../components/MapLevelDetails';
import { useBottomNavClearance } from '../../components/BottomNavBar';
import type { getWorldById } from '../../data/worlds';
import type { Level, WorldId } from '../../types/game';
import { styles } from './styles';
import type { SelectedTarget } from './types';

type MapSelectionPanelProps = {
  selectedTarget: SelectedTarget | undefined;
  panelAnim: Animated.Value;
  panelTranslateY: Animated.AnimatedInterpolation<number>;
  closePanel: () => void;
  selectedLevel: Level | undefined;
  selectedLevelLocked: boolean;
  selectedLevelStars: number;
  playSelectedLevel: (levelId: string, locked: boolean) => void;
  selectedPortalLevel: Level | undefined;
  selectedPortalWorld: ReturnType<typeof getWorldById> | undefined;
  selectedPortalLocked: boolean;
  openSelectedWorld: (targetWorldId: WorldId, locked: boolean) => void;
};

export function MapSelectionPanel({
  selectedTarget,
  panelAnim,
  panelTranslateY,
  closePanel,
  selectedLevel,
  selectedLevelLocked,
  selectedLevelStars,
  playSelectedLevel,
  selectedPortalLevel,
  selectedPortalWorld,
  selectedPortalLocked,
  openSelectedWorld,
}: MapSelectionPanelProps) {
  const bottomNavClearance = useBottomNavClearance();
  return (
    <>
      {selectedTarget ? (
        <Animated.View
          style={[
            styles.selectionPanel,
            selectedTarget.type === 'level' ? styles.levelSelectionPanel : null,
            {
              bottom: bottomNavClearance,
              opacity: panelAnim,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Fechar painel de seleção"
            accessibilityRole="button"
            hitSlop={8}
            onPress={closePanel}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
          >
            <GameIcon name="close" size={30} tone="danger" />
          </Pressable>

          {selectedTarget.type === 'level' && selectedLevel ? (
            <MapLevelDetails
              level={selectedLevel}
              stars={selectedLevelStars}
              locked={selectedLevelLocked}
              onPlay={() =>
                playSelectedLevel(selectedLevel.id, selectedLevelLocked)
              }
            />
          ) : null}

          {selectedTarget.type === 'worldPortal' &&
          selectedPortalLevel &&
          selectedPortalWorld ? (
            <>
              <View
                style={[
                  styles.panelBanner,
                  selectedPortalLocked
                    ? styles.panelBannerLocked
                    : styles.panelBannerPortal,
                ]}
              >
                <Text style={styles.panelBannerText}>
                  {selectedPortalLocked
                    ? 'Bloqueado'
                    : selectedPortalWorld.label}
                </Text>
              </View>
              <View style={styles.panelHeader}>
                <View style={styles.panelTitleBlock}>
                  <Text numberOfLines={1} style={styles.panelTitle}>
                    {selectedPortalLocked
                      ? selectedPortalWorld.isBonus
                        ? 'Mundo secreto'
                        : 'Mundo bloqueado'
                      : selectedPortalWorld.name}
                  </Text>
                  <Text numberOfLines={2} style={styles.panelDescription}>
                    {selectedPortalLocked
                      ? selectedPortalWorld.lockedText
                      : selectedPortalWorld.isBonus
                        ? 'Jardim Renascido liberado.'
                        : `${selectedPortalWorld.name} liberado.`}
                  </Text>
                </View>
                <View style={styles.panelButton}>
                  <PrimaryButton
                    disabled={selectedPortalLocked}
                    size="small"
                    title={
                      selectedPortalLocked
                        ? 'Bloqueado'
                        : selectedPortalWorld.isBonus
                          ? 'Ir para bônus'
                          : 'Abrir mundo'
                    }
                    onPress={() =>
                      openSelectedWorld(
                        selectedPortalWorld.id,
                        selectedPortalLocked,
                      )
                    }
                  />
                </View>
              </View>
            </>
          ) : null}
        </Animated.View>
      ) : null}
    </>
  );
}
