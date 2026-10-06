import { CampaignMapLayers } from './levelSelect/CampaignMapLayers';
import { MapSelectionPanel } from './levelSelect/MapSelectionPanel';
import type { SelectedTarget } from './levelSelect/types';
import { isChapterModeUnlocked } from '../utils/chapterAvailability';
import {
  MAP_VIEWPORT_ESTIMATE,
  MAP_PARALLAX_TRAVEL,
  LEGACY_MAP_OPENING_BOTTOM_INSET,
  LEGACY_MAP_OPENING_FOCUS_RATIO,
  LEGACY_MAP_OPENING_TOP_INSET,
  getWorldMapHeight,
  getLevelNodePosition,
  getBonusChestMarkerPosition,
  getWorldSelectorSubtitle,
} from './levelSelect/mapPresentation';
import { styles } from './levelSelect/styles';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  type LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { MapHud } from '../components/MapHud';
import { GameIcon } from '../components/GameIcon';
import type { TrailPoint } from '../components/MapStoneTrail';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import {
  resolveLegacyCampaignMapAsset,
  WORLD1_SCENE_BACKGROUND,
} from '../data/campaignMapAssets';
import { LEVELS } from '../data/levels';
import { getWorldMapConfig } from '../data/worldMapConfigs';
import { WORLDS, getWorldById } from '../data/worlds';
import { LivesState, formatLifeTimer } from '../storage/livesStorage';
import { getBonusWorldChestProgress } from '../storage/progressStorage';
import {
  ProgressState,
  RestCheckpointRewardResult,
  WorldId,
} from '../types/game';
import { WindowTarget } from '../types/ui';
import { isShopUnlockedAfterLevel } from '../utils/shop';
import {
  getCurrentLevelForWorld,
  getCurrentWorldId,
  getWorldProgress,
  isWorldUnlocked as isWorldNormallyUnlocked,
} from '../utils/worldProgress';
import {
  createCampaignMapTransform,
  getCampaignMapEntityFrames,
  getCampaignMapFocusLevelId,
  getCampaignMapFrameCenter,
  getCampaignMapOpeningScrollOffset,
} from '../utils/campaignMapLayout';

type LevelSelectScreenProps = {
  devMode?: boolean;
  activeTrayCapacity: number;
  initialWorldId?: WorldId;
  isActive?: boolean;
  livesState: LivesState;
  progress: ProgressState;
  timeUntilNextLifeMs: number;
  onCoinCounterLayout?: (target: WindowTarget) => void;
  onOpenChapters: () => void;
  onOpenProfile: () => void;
  onOpenShop: (worldId?: WorldId) => void;
  onOpenSettings: () => void;
  onOpenWorldChest: (worldChestId?: string) => void;
  onOpenRestCheckpoint: (
    afterLevelId: string,
  ) => Promise<RestCheckpointRewardResult>;
  onResetProgress: () => void;
  onSelectLevel: (levelId: string) => void;
};

type MapToastState = {
  id: number;
  text: string;
};

export function LevelSelectScreen({
  devMode = false,
  activeTrayCapacity,
  initialWorldId,
  isActive = true,
  livesState,
  progress,
  timeUntilNextLifeMs,
  onCoinCounterLayout,
  onOpenChapters,
  onOpenProfile,
  onOpenShop,
  onOpenSettings,
  onOpenWorldChest,
  onOpenRestCheckpoint,
  onSelectLevel,
}: LevelSelectScreenProps) {
  const isWorldUnlocked = useCallback(
    (worldId: WorldId, state: ProgressState) =>
      devMode || isWorldNormallyUnlocked(worldId, state),
    [devMode],
  );
  const mapScrollRef = useRef<ScrollView>(null);
  const appliedOpeningKeyRef = useRef<string | undefined>(undefined);
  const lastInitialWorldIdRef = useRef(initialWorldId);
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId>(() =>
    initialWorldId && isWorldUnlocked(initialWorldId, progress)
      ? initialWorldId
      : getCurrentWorldId(progress),
  );
  const [mapViewport, setMapViewport] = useState({ height: 0, width: 0 });
  const [mapContentLayout, setMapContentLayout] = useState<
    { height: number; worldId: WorldId } | undefined
  >();
  const selectedWorld = getWorldById(selectedWorldId);
  const {
    completedCount,
    levels: worldLevels,
    progressPercent,
    totalCount,
  } = useMemo(
    () => getWorldProgress(selectedWorldId, progress),
    [progress, selectedWorldId],
  );
  const currentLevel = getCurrentLevelForWorld(selectedWorldId, progress);
  const selectedMapConfig = getWorldMapConfig(selectedWorldId);
  const segmentedMapConfig =
    selectedMapConfig?.mode === 'segmented' ? selectedMapConfig : undefined;
  const segmentedMapTransform = useMemo(
    () =>
      segmentedMapConfig && mapViewport.width > 0
        ? createCampaignMapTransform(segmentedMapConfig, mapViewport.width)
        : undefined,
    [mapViewport.width, segmentedMapConfig],
  );
  const selectedMapHeight = segmentedMapTransform
    ? segmentedMapTransform.contentHeight
    : segmentedMapConfig
      ? segmentedMapConfig.designSize.height
      : getWorldMapHeight(worldLevels.length);
  // Mundo 1 usa a arte de cena única no lugar dos blocos de floresta
  // ilustrados: os blocos são opacos e cobrem qualquer fundo colocado atrás
  // deles, então a troca precisa desligar os blocos (abaixo) e não só somar
  // uma camada por trás.
  const useWorld1SceneBackground = selectedWorldId === 1;
  const selectedMapBackground = useWorld1SceneBackground
    ? WORLD1_SCENE_BACKGROUND
    : selectedMapConfig?.mode === 'legacy'
      ? resolveLegacyCampaignMapAsset(selectedMapConfig.rendererKey)
      : undefined;
  const bonusWorldChest = getBonusWorldChestProgress(progress);
  const bonusWorldChestPendingId = bonusWorldChest.available
    ? bonusWorldChest.id
    : undefined;
  const bonusChestMarkerPosition =
    getBonusChestMarkerPosition(selectedMapHeight);
  const [selectedTarget, setSelectedTarget] = useState<
    SelectedTarget | undefined
  >();
  const [restCheckpointReward, setRestCheckpointReward] = useState<
    RestCheckpointRewardResult | undefined
  >();
  const [isOpeningRestCheckpoint, setIsOpeningRestCheckpoint] = useState(false);
  const [toast, setToast] = useState<MapToastState | undefined>();
  const panelAnim = useRef(new Animated.Value(0)).current;
  const mapFade = useRef(new Animated.Value(0)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const mapScrollY = useRef(new Animated.Value(0)).current;
  const onMapScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: mapScrollY } } }], {
        useNativeDriver: true,
      }),
    [mapScrollY],
  );
  const mapParallaxOffset = useMemo(
    () =>
      mapScrollY.interpolate({
        extrapolate: 'clamp',
        inputRange: [0, Math.max(1, selectedMapHeight - MAP_VIEWPORT_ESTIMATE)],
        outputRange: [0, -MAP_PARALLAX_TRAVEL],
      }),
    [mapScrollY, selectedMapHeight],
  );

  const onMapViewportLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    setMapViewport((previous) =>
      Math.abs(previous.height - height) < 0.5 &&
      Math.abs(previous.width - width) < 0.5
        ? previous
        : { height, width },
    );
  }, []);

  const onMapContentSizeChange = useCallback(
    (_width: number, height: number) => {
      setMapContentLayout((previous) =>
        previous?.height === height && previous.worldId === selectedWorldId
          ? previous
          : { height, worldId: selectedWorldId },
      );
    },
    [selectedWorldId],
  );

  const openingFocusLevelId = useMemo(
    () =>
      segmentedMapConfig
        ? getCampaignMapFocusLevelId(
            segmentedMapConfig.levelAnchors.map(({ levelId }) => levelId),
            progress,
          )
        : currentLevel?.id,
    [currentLevel?.id, progress, segmentedMapConfig],
  );

  const openingScrollTarget = useMemo(() => {
    if (
      !openingFocusLevelId ||
      mapViewport.height <= 0 ||
      mapViewport.width <= 0 ||
      mapContentLayout?.worldId !== selectedWorldId ||
      mapContentLayout.height <= 0
    ) {
      return undefined;
    }

    let fixedBottomInset = LEGACY_MAP_OPENING_BOTTOM_INSET;
    let fixedTopInset = LEGACY_MAP_OPENING_TOP_INSET;
    let focusRatio = LEGACY_MAP_OPENING_FOCUS_RATIO;
    let focusY: number | undefined;

    if (segmentedMapConfig && segmentedMapTransform) {
      const anchor = segmentedMapConfig.levelAnchors.find(
        ({ levelId }) => levelId === openingFocusLevelId,
      );

      if (anchor) {
        const frames = getCampaignMapEntityFrames(
          anchor.point,
          segmentedMapConfig.levelNodeSize,
          segmentedMapConfig.levelNodeOrigin,
          segmentedMapTransform,
          segmentedMapConfig.minimumTouchSize,
        );
        focusY = getCampaignMapFrameCenter(frames.visual).y;
        fixedBottomInset = segmentedMapConfig.openingInsets.bottom;
        fixedTopInset = segmentedMapConfig.openingInsets.top;
        focusRatio = segmentedMapConfig.openingFocusRatio;
      }
    } else if (currentLevel) {
      const position = getLevelNodePosition(
        currentLevel.worldLevelNumber - 1,
        selectedMapHeight,
      );
      focusY = position.top + 49;
    }

    if (focusY === undefined) {
      return undefined;
    }

    return {
      key: [
        selectedWorldId,
        openingFocusLevelId,
        Math.round(mapViewport.height),
        Math.round(mapViewport.width),
        Math.round(selectedMapHeight),
      ].join(':'),
      y: getCampaignMapOpeningScrollOffset({
        contentHeight: selectedMapHeight,
        fixedBottomInset,
        fixedTopInset,
        focusRatio,
        focusY,
        viewportHeight: mapViewport.height,
      }),
    };
  }, [
    currentLevel,
    mapContentLayout,
    mapViewport.height,
    mapViewport.width,
    openingFocusLevelId,
    segmentedMapConfig,
    segmentedMapTransform,
    selectedMapHeight,
    selectedWorldId,
  ]);

  useEffect(() => {
    if (lastInitialWorldIdRef.current === initialWorldId) {
      return;
    }

    lastInitialWorldIdRef.current = initialWorldId;

    if (!initialWorldId || !isWorldUnlocked(initialWorldId, progress)) {
      return;
    }

    setSelectedTarget(undefined);
    setSelectedWorldId(initialWorldId);
  }, [initialWorldId, progress, isWorldUnlocked]);

  useEffect(() => {
    if (isWorldUnlocked(selectedWorldId, progress)) {
      return;
    }

    setSelectedTarget(undefined);
    setSelectedWorldId(getCurrentWorldId(progress));
  }, [progress, selectedWorldId, isWorldUnlocked]);

  useEffect(() => {
    appliedOpeningKeyRef.current = undefined;
    mapFade.stopAnimation();
    mapFade.setValue(0);
    mapScrollY.setValue(0);
  }, [mapFade, mapScrollY, selectedWorldId]);

  // A aba Mapa continua montada enquanto o jogador navega pelas outras abas.
  // Ao voltar para ela, limpamos a chave aplicada para o mapa reabrir na fase atual.
  useEffect(() => {
    if (!isActive) {
      return;
    }

    appliedOpeningKeyRef.current = undefined;
  }, [isActive]);

  // Layout notifications may recreate the target object without changing the
  // opening position. Only a different position should cancel a pending reveal.
  const openingScrollKey = openingScrollTarget
    ? `${openingScrollTarget.key}:${openingScrollTarget.y}`
    : undefined;
  const openingScrollY = openingScrollTarget?.y;
  useEffect(() => {
    if (
      !isActive ||
      !openingScrollKey ||
      openingScrollY === undefined ||
      appliedOpeningKeyRef.current === openingScrollKey
    ) {
      return undefined;
    }

    appliedOpeningKeyRef.current = openingScrollKey;
    mapFade.stopAnimation();
    mapFade.setValue(0);
    mapScrollY.setValue(openingScrollY);
    mapScrollRef.current?.scrollTo({
      animated: false,
      y: openingScrollY,
    });

    let fadeAnimation: Animated.CompositeAnimation | undefined;
    const frame = requestAnimationFrame(() => {
      fadeAnimation = Animated.timing(mapFade, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      });
      fadeAnimation.start();
    });

    return () => {
      cancelAnimationFrame(frame);
      fadeAnimation?.stop();
    };
  }, [isActive, mapFade, mapScrollY, openingScrollKey, openingScrollY]);

  useEffect(() => {
    if (!selectedTarget) {
      panelAnim.setValue(0);
      return;
    }

    panelAnim.setValue(0);
    Animated.spring(panelAnim, {
      friction: 8,
      tension: 120,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [panelAnim, selectedTarget]);

  useEffect(() => {
    if (!toast) {
      toastOpacity.setValue(0);
      return undefined;
    }

    toastOpacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(toastOpacity, {
        duration: 140,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setToast(undefined);
      }
    });

    return () => animation.stop();
  }, [toast, toastOpacity]);

  const showToast = (text: string) => {
    setToast({ id: Date.now() + Math.random(), text });
  };

  const selectWorld = (worldId: WorldId) => {
    if (!isWorldUnlocked(worldId, progress)) {
      showToast(getWorldById(worldId).lockedText);
      return;
    }

    setSelectedTarget(undefined);
    setSelectedWorldId(worldId);
  };

  const selectLevel = useCallback((levelId: string) => {
    setSelectedTarget({ levelId, type: 'level' });
  }, []);

  const selectShop = (
    afterLevelId: string,
    comingSoon: boolean,
    locked: boolean,
  ) => {
    if (locked) {
      showToast(
        'Complete as fases anteriores para liberar este ponto de descanso.',
      );
      return;
    }

    setSelectedTarget({ afterLevelId, comingSoon, type: 'shop' });
  };

  const selectWorldPortal = (afterLevelId: string, targetWorldId: WorldId) => {
    setSelectedTarget({ afterLevelId, targetWorldId, type: 'worldPortal' });
  };

  const selectBonusChest = () => {
    if (bonusWorldChestPendingId) {
      setSelectedTarget(undefined);
      onOpenWorldChest(bonusWorldChestPendingId);
      return;
    }

    setSelectedTarget({ type: 'bonusChest' });
  };

  const closePanel = () => {
    Animated.timing(panelAnim, {
      duration: 160,
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setSelectedTarget(undefined);
    });
  };

  const playSelectedLevel = (levelId: string, locked: boolean) => {
    if (locked) {
      showToast('Complete a fase anterior para desbloquear.');
      return;
    }

    onSelectLevel(levelId);
  };

  const openSelectedShop = (
    afterLevelId: string,
    comingSoon: boolean,
    locked: boolean,
  ) => {
    if (comingSoon) {
      showToast('Próximo capítulo em breve.');
      return;
    }

    if (locked) {
      showToast(
        'Complete as fases anteriores para liberar este ponto de descanso.',
      );
      return;
    }

    const shopLevel = LEVELS.find((level) => level.id === afterLevelId);

    setIsOpeningRestCheckpoint(true);
    onOpenRestCheckpoint(afterLevelId)
      .then((reward) => {
        if (reward.granted) {
          setRestCheckpointReward(reward);
          return;
        }

        setSelectedTarget(undefined);
        onOpenShop(shopLevel?.worldId ?? reward.worldId ?? selectedWorldId);
      })
      .catch(() => {
        setSelectedTarget(undefined);
        onOpenShop(shopLevel?.worldId ?? selectedWorldId);
      })
      .finally(() => {
        setIsOpeningRestCheckpoint(false);
      });
  };

  const openSelectedWorld = (targetWorldId: WorldId, locked: boolean) => {
    const targetWorld = getWorldById(targetWorldId);

    if (locked) {
      showToast(targetWorld.lockedText);
      return;
    }

    setSelectedTarget(undefined);
    setSelectedWorldId(targetWorldId);
  };

  const selectedLevel =
    selectedTarget?.type === 'level'
      ? LEVELS.find((level) => level.id === selectedTarget.levelId)
      : undefined;
  const selectedShopLevel =
    selectedTarget?.type === 'shop'
      ? LEVELS.find((level) => level.id === selectedTarget.afterLevelId)
      : undefined;
  const selectedPortalLevel =
    selectedTarget?.type === 'worldPortal'
      ? LEVELS.find((level) => level.id === selectedTarget.afterLevelId)
      : undefined;
  const selectedPortalWorld =
    selectedTarget?.type === 'worldPortal'
      ? getWorldById(selectedTarget.targetWorldId)
      : undefined;
  const selectedLevelLocked = selectedLevel
    ? !devMode && !progress.unlockedLevelIds.includes(selectedLevel.id)
    : false;
  const selectedLevelStars = selectedLevel
    ? (progress.levelStars[selectedLevel.id] ?? 0)
    : 0;
  const selectedShopLocked =
    selectedTarget?.type === 'shop'
      ? !isShopUnlockedAfterLevel(selectedTarget.afterLevelId, progress)
      : false;
  const selectedPortalLocked =
    selectedTarget?.type === 'worldPortal'
      ? !isWorldUnlocked(selectedTarget.targetWorldId, progress)
      : false;
  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });
  // As 3 abas de mundo viraram ‹ › com pontinhos: a navegação anda pela lista
  // de mundos já desbloqueados, na ordem em que aparecem no WORLDS.
  const unlockedWorlds = WORLDS.filter((world) =>
    isWorldUnlocked(world.id, progress),
  );
  const selectedWorldIndex = unlockedWorlds.findIndex(
    (world) => world.id === selectedWorldId,
  );
  const previousWorld =
    selectedWorldIndex > 0 ? unlockedWorlds[selectedWorldIndex - 1] : undefined;
  const nextWorld =
    selectedWorldIndex >= 0 && selectedWorldIndex < unlockedWorlds.length - 1
      ? unlockedWorlds[selectedWorldIndex + 1]
      : undefined;
  const bonusChestState = bonusWorldChestPendingId
    ? 'available'
    : bonusWorldChest.claimed
      ? 'claimed'
      : 'locked';

  const trailPoints: TrailPoint[] = useMemo(
    () =>
      worldLevels.map((level) => {
        const position = getLevelNodePosition(
          level.worldLevelNumber - 1,
          selectedMapHeight,
        );

        return { left: position.left + 44, top: position.top + 35 };
      }),
    [selectedMapHeight, worldLevels],
  );
  // Consulta por fase virava varredura de array dentro do map: com 100+ nós isso
  // era O(n²) em cada render do mapa.
  const completedLevelIdSet = useMemo(
    () => new Set(progress.completedLevelIds),
    [progress.completedLevelIds],
  );
  const unlockedLevelIdSet = useMemo(
    () => new Set(progress.unlockedLevelIds),
    [progress.unlockedLevelIds],
  );
  const worldLevelById = useMemo(
    () => new Map(worldLevels.map((level) => [level.id, level] as const)),
    [worldLevels],
  );

  return (
    <ScreenShell scroll={false}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.mapFrame,
            selectedWorld.theme === 'azulado' ? styles.mapFrameAzulado : null,
            selectedWorld.theme === 'violeta' ? styles.mapFrameVioleta : null,
            selectedWorld.theme === 'rosado' ? styles.mapFrameRosado : null,
            segmentedMapConfig
              ? { backgroundColor: segmentedMapConfig.backgroundColor }
              : null,
            { opacity: mapFade },
          ]}
        >
          {selectedMapBackground ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.mapParallax,
                { transform: [{ translateY: mapParallaxOffset }] },
              ]}
            >
              <ImageBackground
                imageStyle={styles.mapImageAsset}
                resizeMode="cover"
                source={selectedMapBackground}
                style={styles.mapParallaxImage}
              />
            </Animated.View>
          ) : null}
          <Animated.ScrollView
            key={`campaign-map-${selectedWorldId}`}
            ref={mapScrollRef}
            contentContainerStyle={[
              styles.mapScrollContent,
              // O minHeight é do border box: soma a folga da barra de abas para o
              // mapa em si continuar com a altura desenhada.
              { minHeight: selectedMapHeight + BOTTOM_NAV_HEIGHT },
            ]}
            onContentSizeChange={onMapContentSizeChange}
            onLayout={onMapViewportLayout}
            onScroll={onMapScroll}
            removeClippedSubviews
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {selectedTarget ? (
              <Pressable
                accessibilityRole="button"
                onPress={closePanel}
                style={styles.mapBackgroundHitArea}
              />
            ) : null}
            <CampaignMapLayers
              segmentedMapConfig={segmentedMapConfig}
              segmentedMapTransform={segmentedMapTransform}
              selectedMapHeight={selectedMapHeight}
              mapViewport={mapViewport}
              worldLevelById={worldLevelById}
              currentLevel={currentLevel}
              progress={progress}
              devMode={devMode}
              selectedTarget={selectedTarget}
              selectLevel={selectLevel}
              selectShop={selectShop}
              selectWorldPortal={selectWorldPortal}
              isWorldUnlocked={isWorldUnlocked}
              trailPoints={trailPoints}
              worldLevels={worldLevels}
              completedLevelIdSet={completedLevelIdSet}
              unlockedLevelIdSet={unlockedLevelIdSet}
              selectedWorldId={selectedWorldId}
              bonusChestMarkerPosition={bonusChestMarkerPosition}
              bonusWorldChest={bonusWorldChest}
              bonusChestState={bonusChestState}
              selectBonusChest={selectBonusChest}
            />
          </Animated.ScrollView>
          <View pointerEvents="none" style={styles.mapBottomScrim} />
        </Animated.View>

        {devMode || isChapterModeUnlocked(progress) ? (
          <Pressable
            accessibilityLabel="Capítulos"
            accessibilityRole="button"
            onPress={onOpenChapters}
            style={({ pressed }) => [
              styles.chaptersButton,
              pressed ? styles.chaptersButtonPressed : null,
            ]}
          >
            <GameIcon name="world" size={22} tone="blue" />
            <Text style={styles.chaptersButtonText}>Capítulos</Text>
          </Pressable>
        ) : null}

        <MapHud
          coins={progress.coins}
          completedCount={completedCount}
          hasNextWorld={Boolean(nextWorld)}
          hasPreviousWorld={Boolean(previousWorld)}
          lives={livesState.currentLives}
          livesFooter={
            livesState.currentLives < livesState.maxLives
              ? formatLifeTimer(timeUntilNextLifeMs)
              : 'CHEIO'
          }
          progressPercent={progressPercent}
          selectedWorldId={selectedWorldId}
          totalCount={totalCount}
          worldName={getWorldSelectorSubtitle(selectedWorldId)}
          worlds={WORLDS}
          onAddCoins={() => onOpenShop(selectedWorldId)}
          onAddLives={() => onOpenShop(selectedWorldId)}
          onCoinCounterLayout={onCoinCounterLayout}
          onOpenProfile={onOpenProfile}
          onOpenSettings={onOpenSettings}
          onNextWorld={() => {
            if (nextWorld) {
              selectWorld(nextWorld.id);
            }
          }}
          onPreviousWorld={() => {
            if (previousWorld) {
              selectWorld(previousWorld.id);
            }
          }}
        />

        <MapSelectionPanel
          selectedTarget={selectedTarget}
          panelAnim={panelAnim}
          panelTranslateY={panelTranslateY}
          closePanel={closePanel}
          bonusWorldChest={bonusWorldChest}
          bonusWorldChestPendingId={bonusWorldChestPendingId}
          selectedLevel={selectedLevel}
          selectedLevelLocked={selectedLevelLocked}
          selectedLevelStars={selectedLevelStars}
          playSelectedLevel={playSelectedLevel}
          selectedShopLevel={selectedShopLevel}
          selectedShopLocked={selectedShopLocked}
          isOpeningRestCheckpoint={isOpeningRestCheckpoint}
          openSelectedShop={openSelectedShop}
          selectedPortalLevel={selectedPortalLevel}
          selectedPortalWorld={selectedPortalWorld}
          selectedPortalLocked={selectedPortalLocked}
          openSelectedWorld={openSelectedWorld}
        />

        <Modal
          animationType="fade"
          transparent
          visible={restCheckpointReward !== undefined}
        >
          <View style={styles.rewardOverlay}>
            <View style={styles.rewardCard}>
              <Text style={styles.rewardKicker}>Ponto de descanso</Text>
              <Text style={styles.rewardTitle}>Ponto de descanso</Text>
              <Text style={styles.rewardText}>
                {restCheckpointReward?.rewardType === 'life'
                  ? 'Você recuperou 1 vida para continuar a jornada.'
                  : `Vidas cheias! Você recebeu ${restCheckpointReward?.coinsEarned ?? 0} moedas.`}
              </Text>
              <PrimaryButton
                title="Abrir loja"
                onPress={() => {
                  const worldId =
                    restCheckpointReward?.worldId ?? selectedWorldId;
                  setRestCheckpointReward(undefined);
                  setSelectedTarget(undefined);
                  onOpenShop(worldId);
                }}
              />
            </View>
          </View>
        </Modal>

        <View style={styles.toastSlot} pointerEvents="none">
          {toast ? (
            <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
              <Text style={styles.toastText}>{toast.text}</Text>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </ScreenShell>
  );
}
