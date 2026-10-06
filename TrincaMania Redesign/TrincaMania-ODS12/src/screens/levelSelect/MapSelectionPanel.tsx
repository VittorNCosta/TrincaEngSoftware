import { Animated, Pressable, Text, View } from 'react-native';
import { GameIcon } from '../../components/GameIcon';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { getWorldById } from '../../data/worlds';
import type { getBonusWorldChestProgress } from '../../storage/progressStorage';
import type { Level, WorldId } from '../../types/game';
import { getLevelDisplayLabel } from '../../utils/levelDisplay';
import { getShortObjective } from './mapPresentation';
import { styles } from './styles';
import type { SelectedTarget } from './types';

type MapSelectionPanelProps = {
  selectedTarget: SelectedTarget | undefined;
  panelAnim: Animated.Value;
  panelTranslateY: Animated.AnimatedInterpolation<number>;
  closePanel: () => void;
  bonusWorldChest: ReturnType<typeof getBonusWorldChestProgress>;
  bonusWorldChestPendingId: string | undefined;
  selectedLevel: Level | undefined;
  selectedLevelLocked: boolean;
  selectedLevelStars: number;
  playSelectedLevel: (levelId: string, locked: boolean) => void;
  selectedShopLevel: Level | undefined;
  selectedShopLocked: boolean;
  isOpeningRestCheckpoint: boolean;
  openSelectedShop: (
    afterLevelId: string,
    comingSoon: boolean,
    locked: boolean,
  ) => void;
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
  bonusWorldChest,
  bonusWorldChestPendingId,
  selectedLevel,
  selectedLevelLocked,
  selectedLevelStars,
  playSelectedLevel,
  selectedShopLevel,
  selectedShopLocked,
  isOpeningRestCheckpoint,
  openSelectedShop,
  selectedPortalLevel,
  selectedPortalWorld,
  selectedPortalLocked,
  openSelectedWorld,
}: MapSelectionPanelProps) {
  return (
    <>
      {selectedTarget ? (
        <Animated.View
          style={[
            styles.selectionPanel,
            {
              opacity: panelAnim,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Fechar painel de seleção"
            accessibilityRole="button"
            onPress={closePanel}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
          >
            <GameIcon name="close" size={30} tone="danger" />
          </Pressable>

          {selectedTarget.type === 'bonusChest' ? (
            <>
              <View
                style={[
                  styles.panelBanner,
                  bonusWorldChestPendingId
                    ? styles.panelBannerPortal
                    : styles.panelBannerLocked,
                ]}
              >
                <Text style={styles.panelBannerText}>
                  {bonusWorldChestPendingId
                    ? 'Disponível'
                    : bonusWorldChest.claimed
                      ? 'Coletado'
                      : 'Bloqueado'}
                </Text>
              </View>
              <View style={styles.lockedPanelBody}>
                <GameIcon
                  muted={!bonusWorldChestPendingId}
                  name={bonusWorldChestPendingId ? 'specialChest' : 'lock'}
                  size={42}
                  tone={bonusWorldChestPendingId ? 'purple' : 'neutral'}
                />
                <View style={styles.panelCopy}>
                  <Text numberOfLines={1} style={styles.panelTitle}>
                    {bonusWorldChest.claimed
                      ? 'Baú Especial coletado'
                      : 'Baú Especial Bloqueado'}
                  </Text>
                  <Text numberOfLines={2} style={styles.panelDescription}>
                    {bonusWorldChest.claimed
                      ? 'A recompensa do Jardim Renascido já foi coletada.'
                      : 'Conclua as 3 fases do Jardim Renascido para liberar.'}
                  </Text>
                </View>
                <View style={styles.panelButton}>
                  <PrimaryButton
                    disabled
                    size="small"
                    title={bonusWorldChest.claimed ? 'Coletado' : 'Bloqueado'}
                    onPress={() => undefined}
                  />
                </View>
              </View>
            </>
          ) : null}

          {selectedTarget.type === 'level' &&
          selectedLevel &&
          selectedLevelLocked ? (
            <>
              <View style={[styles.panelBanner, styles.panelBannerLocked]}>
                <Text style={styles.panelBannerText}>Bloqueada</Text>
              </View>
              <View style={styles.lockedPanelBody}>
                <GameIcon muted name="lock" size={42} tone="neutral" />
                <View style={styles.panelCopy}>
                  <Text numberOfLines={1} style={styles.panelTitle}>
                    Fase bloqueada
                  </Text>
                  <Text numberOfLines={2} style={styles.panelDescription}>
                    Complete a fase anterior para desbloquear.
                  </Text>
                </View>
                <View style={styles.panelButton}>
                  <PrimaryButton
                    disabled
                    size="small"
                    title="Bloqueada"
                    onPress={() => undefined}
                  />
                </View>
              </View>
            </>
          ) : null}

          {selectedTarget.type === 'level' &&
          selectedLevel &&
          !selectedLevelLocked ? (
            <>
              <View style={styles.panelBanner}>
                <Text style={styles.panelBannerText}>
                  Fase {getLevelDisplayLabel(selectedLevel)}
                </Text>
              </View>
              <View style={styles.panelHeader}>
                <View style={styles.panelTitleBlock}>
                  <Text numberOfLines={2} style={styles.panelTitle}>
                    {selectedLevel.title}
                  </Text>
                  <View style={styles.panelDifficultyRow}>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>
                        {selectedLevel.difficulty}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.panelBottomRow}>
                <View style={styles.panelCopy}>
                  <View style={styles.panelStarsRow}>
                    {Array.from({ length: 3 }).map((_, index) => {
                      const isEarned = index < selectedLevelStars;

                      return (
                        <View
                          key={`panel-star-${selectedLevel.id}-${index}`}
                          style={styles.panelStarIcon}
                        >
                          <GameIcon
                            muted={!isEarned}
                            name="star"
                            size={isEarned ? 22 : 19}
                            tone={isEarned ? 'gold' : 'neutral'}
                            variant="plain"
                          />
                        </View>
                      );
                    })}
                  </View>
                  <Text numberOfLines={2} style={styles.panelDescription}>
                    {getShortObjective(selectedLevel)}
                  </Text>
                </View>
                <View style={styles.panelButton}>
                  <PrimaryButton
                    size="small"
                    // Existe outro "Jogar" na tela: a fita do nó da fase
                    // atual. Buscar por texto acharia os dois, e o fluxo de
                    // teste tocaria no errado.
                    testID="jogar-fase"
                    title="Jogar"
                    onPress={() => playSelectedLevel(selectedLevel.id, false)}
                  />
                </View>
              </View>
            </>
          ) : null}

          {selectedTarget.type === 'shop' && selectedShopLevel ? (
            <>
              <View
                style={[
                  styles.panelBanner,
                  selectedTarget.comingSoon ? styles.panelBannerSoon : null,
                ]}
              >
                <Text style={styles.panelBannerText}>
                  {selectedTarget.comingSoon ? 'Em breve' : 'Descanso'}
                </Text>
              </View>
              <View style={styles.panelHeader}>
                <View style={styles.panelTitleBlock}>
                  <Text numberOfLines={1} style={styles.panelTitle}>
                    {selectedTarget.comingSoon
                      ? 'Novo mundo em breve'
                      : 'Ponto de descanso'}
                  </Text>
                  <Text numberOfLines={1} style={styles.panelDescription}>
                    {selectedTarget.comingSoon
                      ? selectedShopLocked
                        ? 'Complete para continuar.'
                        : 'Novo capitulo em breve.'
                      : selectedShopLocked
                        ? `Libera apos fase ${getLevelDisplayLabel(selectedShopLevel)}`
                        : 'Recupere fôlego e abra a loja da campanha.'}
                  </Text>
                </View>
                <View style={styles.panelButton}>
                  <PrimaryButton
                    disabled={
                      selectedTarget.comingSoon ||
                      selectedShopLocked ||
                      isOpeningRestCheckpoint
                    }
                    size="small"
                    title={
                      selectedTarget.comingSoon
                        ? 'Em breve'
                        : selectedShopLocked
                          ? 'Fechada'
                          : 'Abrir loja'
                    }
                    onPress={() =>
                      openSelectedShop(
                        selectedShopLevel.id,
                        selectedTarget.comingSoon,
                        selectedShopLocked,
                      )
                    }
                  />
                </View>
              </View>
            </>
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
