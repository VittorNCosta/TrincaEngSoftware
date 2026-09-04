import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  ImageBackground,
  type LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { BonusWorldChestMarker } from '../components/BonusWorldChestMarker';
import { CampaignMapLandmarkMarker } from '../components/CampaignMapLandmarkMarker';
import { CampaignMapSegments } from '../components/CampaignMapSegments';
import { MapHud } from '../components/MapHud';
import { GameIcon } from '../components/GameIcon';
import { MapLevelNode } from '../components/MapLevelNode';
import { MapStoneTrail, TrailPoint } from '../components/MapStoneTrail';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { ShopMapMarker } from '../components/ShopMapMarker';
import {
  resolveLegacyCampaignMapAsset,
  WORLD1_SCENE_BACKGROUND,
} from '../data/campaignMapAssets';
import { LEVELS } from '../data/levels';
import { getWorldMapConfig } from '../data/worldMapConfigs';
import { WORLDS, getWorldById } from '../data/worlds';
import { LivesState, formatLifeTimer } from '../storage/livesStorage';
import { getBonusWorldChestProgress } from '../storage/progressStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import {
  Level,
  ProgressState,
  RestCheckpointRewardResult,
  WorldId,
} from '../types/game';
import { WindowTarget } from '../types/ui';
import {
  getNextWorldLevelAfterLevel,
  isLastKnownShopMarker,
  isShopUnlockedAfterLevel,
  shouldShowShopAfterLevel,
  shouldShowWorldPortalAfterLevel,
} from '../utils/shop';
import {
  getCurrentLevelForWorld,
  getCurrentWorldId,
  getWorldProgress,
  isWorldUnlocked,
} from '../utils/worldProgress';
import { getLevelDisplayLabel } from '../utils/levelDisplay';
import {
  createCampaignMapTransform,
  deriveCampaignMapLevelState,
  getCampaignMapEntityFrames,
  getCampaignMapFocusLevelId,
  getCampaignMapFrameCenter,
  getCampaignMapOpeningScrollOffset,
} from '../utils/campaignMapLayout';

const MAP_HEIGHT = 1320;
const MAP_WIDTH = 320;
const MAP_MIN_HEIGHT = 960;
const MAP_NODE_BOTTOM = 116;
const MAP_NODE_STEP = 110;
// Folga no topo para a bolha mais alta não ficar sob o HUD flutuante.
const MAP_NODE_TOP_PADDING = 170;
const NODE_PATH_LEFTS = [112, 42, 202, 72, 184, 46, 206, 82, 190, 118];
// Altura aproximada da área visível do mapa; só alimenta o parallax.
const MAP_VIEWPORT_ESTIMATE = 720;
// Quanto o cenário anda no total: 0,25x o percurso das bolhas.
const MAP_PARALLAX_TRAVEL = 260;
const LEGACY_MAP_OPENING_BOTTOM_INSET = 48;
const LEGACY_MAP_OPENING_FOCUS_RATIO = 0.45;
const LEGACY_MAP_OPENING_TOP_INSET = 170;

const getWorldMapHeight = (levelCount: number) =>
  Math.max(
    MAP_MIN_HEIGHT,
    MAP_NODE_TOP_PADDING +
      MAP_NODE_BOTTOM +
      Math.max(0, levelCount - 1) * MAP_NODE_STEP,
  );

const getLevelNodePosition = (localIndex: number, mapHeight: number) => ({
  left: NODE_PATH_LEFTS[localIndex % NODE_PATH_LEFTS.length],
  top: mapHeight - MAP_NODE_BOTTOM - localIndex * MAP_NODE_STEP,
});

const getShopMarkerPosition = (
  localIndex: number,
  mapHeight: number,
  hasPortal: boolean,
) => {
  const levelPosition = getLevelNodePosition(localIndex, mapHeight);
  const sideLeft = levelPosition.left > MAP_WIDTH / 2 ? 18 : 186;

  return {
    left: hasPortal ? 18 : sideLeft,
    top: Math.max(28, levelPosition.top - 48),
  };
};

const getPortalMarkerPosition = (localIndex: number, mapHeight: number) => {
  const levelPosition = getLevelNodePosition(localIndex, mapHeight);

  return {
    left: 186,
    top: Math.max(20, levelPosition.top - 82),
  };
};

const getBonusChestMarkerPosition = (mapHeight: number) => ({
  left: 88,
  top: Math.max(170, mapHeight - MAP_NODE_BOTTOM - MAP_NODE_STEP * 2 - 56),
});

type LevelSelectScreenProps = {
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

type SelectedTarget =
  | {
      levelId: string;
      type: 'level';
    }
  | {
      afterLevelId: string;
      comingSoon: boolean;
      type: 'shop';
    }
  | {
      afterLevelId: string;
      targetWorldId: WorldId;
      type: 'worldPortal';
    }
  | {
      type: 'bonusChest';
    };

type MapToastState = {
  id: number;
  text: string;
};

const MAP_OBJECTIVE_SNIPPETS = [
  'Forme trincas e limpe a mesa.',
  'Libere peças e avance.',
  'Observe as camadas.',
  'Complete para continuar.',
];

const getShortObjective = (level: Level) =>
  level.worldId === 1
    ? MAP_OBJECTIVE_SNIPPETS[
        (level.worldLevelNumber - 1) % MAP_OBJECTIVE_SNIPPETS.length
      ]
    : level.objectiveText.replace(/^Objetivo:\s*/, '');

const getWorldSelectorSubtitle = (worldId: WorldId) => {
  switch (worldId) {
    case 1:
      return 'Parque';
    case 2:
      return 'Vale';
    case 3:
      return 'Central';
    case 4:
      return 'Viveiro';
    case 5:
      return 'Usina';
    case 6:
      return 'Cooperativa';
    case 7:
      return 'Rota';
    case 8:
      return 'Fórum';
    case 21:
      return 'Jardim Renascido';
    default:
      return '';
  }
};

export function LevelSelectScreen({
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
    worldComplete,
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
      setMapContentLayout({ height, worldId: selectedWorldId });
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
  }, [initialWorldId, progress]);

  useEffect(() => {
    if (isWorldUnlocked(selectedWorldId, progress)) {
      return;
    }

    setSelectedTarget(undefined);
    setSelectedWorldId(getCurrentWorldId(progress));
  }, [progress, selectedWorldId]);

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

  useEffect(() => {
    if (
      !isActive ||
      !openingScrollTarget ||
      appliedOpeningKeyRef.current === openingScrollTarget.key
    ) {
      return undefined;
    }

    appliedOpeningKeyRef.current = openingScrollTarget.key;
    mapFade.stopAnimation();
    mapFade.setValue(0);
    mapScrollY.setValue(openingScrollTarget.y);
    mapScrollRef.current?.scrollTo({
      animated: false,
      y: openingScrollTarget.y,
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
  }, [isActive, mapFade, mapScrollY, openingScrollTarget]);

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
    ? !progress.unlockedLevelIds.includes(selectedLevel.id)
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
            selectedWorld.theme === 'mountain' ? styles.mapFrameMountain : null,
            selectedWorld.theme === 'crystal' ? styles.mapFrameCrystal : null,
            selectedWorld.theme === 'sweet' ? styles.mapFrameSweet : null,
            segmentedMapConfig
              ? { backgroundColor: segmentedMapConfig.backgroundColor }
              : null,
            { opacity: mapFade },
          ]}
        >
          {selectedWorldId === 21 ? (
            <View pointerEvents="none" style={styles.bonusMapBadge}>
              <Text style={styles.bonusMapBadgeText}>Bônus</Text>
              <Text style={styles.bonusMapBadgeName}>Jardim Renascido</Text>
            </View>
          ) : null}
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
            {segmentedMapConfig ? (
              segmentedMapTransform ? (
                <View
                  pointerEvents="box-none"
                  style={[
                    styles.segmentedMapLayer,
                    {
                      height: segmentedMapTransform.contentHeight,
                      width: segmentedMapTransform.width,
                    },
                  ]}
                >
                  {useWorld1SceneBackground ? null : (
                    <CampaignMapSegments
                      segments={segmentedMapConfig.segments}
                      transform={segmentedMapTransform}
                    />
                  )}
                  {segmentedMapConfig.levelAnchors.map((anchor) => {
                    const level = worldLevelById.get(anchor.levelId);

                    if (!level) {
                      return null;
                    }

                    const state = deriveCampaignMapLevelState(
                      level.id,
                      currentLevel?.id,
                      progress,
                    );
                    const frames = getCampaignMapEntityFrames(
                      anchor.point,
                      segmentedMapConfig.levelNodeSize,
                      segmentedMapConfig.levelNodeOrigin,
                      segmentedMapTransform,
                      segmentedMapConfig.minimumTouchSize,
                    );

                    return (
                      <View
                        key={anchor.levelId}
                        pointerEvents="box-none"
                        style={[styles.segmentedEntityPosition, frames.visual]}
                      >
                        <View
                          style={[
                            styles.segmentedEntityScale,
                            {
                              height: segmentedMapConfig.levelNodeSize.height,
                              transform: [
                                { scale: segmentedMapTransform.scale },
                              ],
                              width: segmentedMapConfig.levelNodeSize.width,
                            },
                          ]}
                        >
                          <MapLevelNode
                            completed={state === 'completed'}
                            current={state === 'current'}
                            level={level}
                            locked={state === 'locked'}
                            selected={
                              selectedTarget?.type === 'level' &&
                              selectedTarget.levelId === level.id
                            }
                            onPress={selectLevel}
                            stars={progress.levelStars[level.id] ?? 0}
                          />
                        </View>
                      </View>
                    );
                  })}
                  {segmentedMapConfig.landmarks.map((landmark) => {
                    const frames = getCampaignMapEntityFrames(
                      landmark.point,
                      landmark.visualSize,
                      landmark.origin,
                      segmentedMapTransform,
                      segmentedMapConfig.minimumTouchSize,
                    );
                    const landmarkPosition = [
                      styles.segmentedEntityPosition,
                      frames.visual,
                    ];
                    const landmarkScale = [
                      styles.segmentedEntityScale,
                      {
                        height: landmark.visualSize.height,
                        transform: [{ scale: segmentedMapTransform.scale }],
                        width: landmark.visualSize.width,
                      },
                    ];

                    if (
                      (landmark.kind === 'rest' || landmark.kind === 'shop') &&
                      landmark.afterLevelId &&
                      shouldShowShopAfterLevel(landmark.afterLevelId)
                    ) {
                      const level = worldLevelById.get(landmark.afterLevelId);

                      if (!level) {
                        return null;
                      }

                      const locked = !isShopUnlockedAfterLevel(
                        level.id,
                        progress,
                      );
                      const selected =
                        selectedTarget?.type === 'shop' &&
                        selectedTarget.afterLevelId === level.id &&
                        !selectedTarget.comingSoon;

                      return (
                        <View
                          key={landmark.id}
                          pointerEvents="box-none"
                          style={landmarkPosition}
                        >
                          <View style={landmarkScale}>
                            <CampaignMapLandmarkMarker
                              afterLevelLabel={getLevelDisplayLabel(level)}
                              kind={landmark.kind}
                              locked={locked}
                              selected={selected}
                              visualKey={landmark.visualKey}
                              onPress={() =>
                                selectShop(level.id, false, locked)
                              }
                            />
                          </View>
                        </View>
                      );
                    }

                    if (
                      landmark.kind === 'portal' &&
                      landmark.afterLevelId &&
                      landmark.targetWorldId !== undefined &&
                      shouldShowWorldPortalAfterLevel(landmark.afterLevelId)
                    ) {
                      const afterLevelId = landmark.afterLevelId;
                      const targetWorldId = landmark.targetWorldId;
                      const nextWorldLevel =
                        getNextWorldLevelAfterLevel(afterLevelId);

                      if (
                        !nextWorldLevel ||
                        nextWorldLevel.worldId !== targetWorldId
                      ) {
                        return null;
                      }

                      const targetWorld = getWorldById(targetWorldId);
                      const locked = !isWorldUnlocked(targetWorldId, progress);
                      const selected =
                        selectedTarget?.type === 'worldPortal' &&
                        selectedTarget.afterLevelId === afterLevelId;

                      return (
                        <View
                          key={landmark.id}
                          pointerEvents="box-none"
                          style={landmarkPosition}
                        >
                          <View style={landmarkScale}>
                            <CampaignMapLandmarkMarker
                              kind={landmark.kind}
                              locked={locked}
                              selected={selected}
                              visualKey={landmark.visualKey}
                              worldLabel={targetWorld.label}
                              onPress={() =>
                                selectWorldPortal(afterLevelId, targetWorldId)
                              }
                            />
                          </View>
                        </View>
                      );
                    }

                    return null;
                  })}
                </View>
              ) : (
                <View
                  pointerEvents="none"
                  style={[
                    styles.segmentedMapLayer,
                    {
                      height: selectedMapHeight,
                      width: mapViewport.width || '100%',
                    },
                  ]}
                />
              )
            ) : (
              <View
                pointerEvents="box-none"
                style={[styles.mapLayer, { height: selectedMapHeight }]}
              >
                <MapStoneTrail points={trailPoints} />
                {worldLevels.map((level) => {
                  const localIndex = level.worldLevelNumber - 1;
                  const completed = completedLevelIdSet.has(level.id);
                  const locked = !unlockedLevelIdSet.has(level.id);
                  const current =
                    currentLevel?.id === level.id && !completed && !locked;
                  const selected =
                    selectedTarget?.type === 'level' &&
                    selectedTarget.levelId === level.id;
                  const showShop = shouldShowShopAfterLevel(level.id);
                  const showFutureMarker = isLastKnownShopMarker(level.id);
                  const shopLocked =
                    showShop && !isShopUnlockedAfterLevel(level.id, progress);
                  const futureLocked =
                    showFutureMarker &&
                    !isShopUnlockedAfterLevel(level.id, progress);
                  const shopSelected =
                    selectedTarget?.type === 'shop' &&
                    selectedTarget.afterLevelId === level.id &&
                    !selectedTarget.comingSoon;
                  const futureSelected =
                    selectedTarget?.type === 'shop' &&
                    selectedTarget.afterLevelId === level.id &&
                    selectedTarget.comingSoon;
                  const nextWorldLevel = getNextWorldLevelAfterLevel(level.id);
                  const nextWorld = nextWorldLevel
                    ? getWorldById(nextWorldLevel.worldId)
                    : undefined;
                  const showWorldPortal = shouldShowWorldPortalAfterLevel(
                    level.id,
                  );
                  const position = getLevelNodePosition(
                    localIndex,
                    selectedMapHeight,
                  );
                  const portalPosition = showWorldPortal
                    ? getPortalMarkerPosition(localIndex, selectedMapHeight)
                    : undefined;
                  const shopPosition = showShop
                    ? getShopMarkerPosition(
                        localIndex,
                        selectedMapHeight,
                        showWorldPortal || showFutureMarker,
                      )
                    : undefined;
                  const futurePosition = showFutureMarker
                    ? getPortalMarkerPosition(localIndex, selectedMapHeight)
                    : undefined;
                  const portalSelected =
                    selectedTarget?.type === 'worldPortal' &&
                    selectedTarget.afterLevelId === level.id;
                  const portalLocked = nextWorldLevel
                    ? !isWorldUnlocked(nextWorldLevel.worldId, progress)
                    : false;
                  return (
                    <Fragment key={level.id}>
                      <View style={[styles.nodePosition, position]}>
                        <MapLevelNode
                          completed={completed}
                          current={current}
                          level={level}
                          locked={locked}
                          selected={selected}
                          onPress={selectLevel}
                          stars={progress.levelStars[level.id] ?? 0}
                        />
                      </View>
                      {showShop && shopPosition ? (
                        <View style={[styles.shopPosition, shopPosition]}>
                          <ShopMapMarker
                            afterLevelLabel={getLevelDisplayLabel(level)}
                            locked={shopLocked}
                            selected={shopSelected}
                            onPress={() =>
                              selectShop(level.id, false, shopLocked)
                            }
                          />
                        </View>
                      ) : null}
                      {showFutureMarker && futurePosition ? (
                        <View style={[styles.shopPosition, futurePosition]}>
                          <ShopMapMarker
                            afterLevelLabel={getLevelDisplayLabel(level)}
                            comingSoon
                            locked={futureLocked}
                            selected={futureSelected}
                            onPress={() =>
                              selectShop(level.id, true, futureLocked)
                            }
                          />
                        </View>
                      ) : null}
                      {showWorldPortal &&
                      nextWorldLevel &&
                      nextWorld &&
                      portalPosition ? (
                        <View style={[styles.portalPosition, portalPosition]}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{
                              disabled: portalLocked,
                              selected: portalSelected,
                            }}
                            hitSlop={8}
                            onPress={() => {
                              selectWorldPortal(
                                level.id,
                                nextWorldLevel.worldId,
                              );
                            }}
                            style={({ pressed }) => [
                              styles.portalMarker,
                              portalLocked ? styles.portalMarkerLocked : null,
                              portalSelected
                                ? styles.portalMarkerSelected
                                : null,
                              pressed ? styles.portalMarkerPressed : null,
                            ]}
                          >
                            <View style={styles.portalGlow} />
                            <GameIcon
                              muted={portalLocked}
                              name={portalLocked ? 'lock' : 'map'}
                              size={28}
                              tone={portalLocked ? 'neutral' : 'blue'}
                            />
                            <Text numberOfLines={1} style={styles.portalLabel}>
                              {nextWorld.label}
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </Fragment>
                  );
                })}
                {selectedWorldId === 21 ? (
                  <View
                    style={[
                      styles.bonusChestPosition,
                      bonusChestMarkerPosition,
                    ]}
                  >
                    <BonusWorldChestMarker
                      completedCount={bonusWorldChest.completedCount}
                      selected={selectedTarget?.type === 'bonusChest'}
                      state={bonusChestState}
                      totalCount={bonusWorldChest.totalCount}
                      onPress={selectBonusChest}
                    />
                  </View>
                ) : null}
              </View>
            )}
          </Animated.ScrollView>
          <View pointerEvents="none" style={styles.mapBottomScrim} />
        </Animated.View>

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

const styles = StyleSheet.create({
  bonusMapBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 139, 193, 0.94)',
    borderColor: '#FFE1F0',
    borderRadius: radii.pill,
    borderWidth: 2,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    position: 'absolute',
    top: 74,
    zIndex: 6,
    ...shadows.card,
  },
  bonusMapBadgeName: {
    color: colors.inkOnDark,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  bonusMapBadgeText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  bonusChestPosition: {
    alignItems: 'center',
    position: 'absolute',
    zIndex: 6,
  },
  // Fica acima do painel de seleção (bottom + minHeight dele), para nunca ficar
  // coberto quando o jogador toca numa fase.
  chaptersButton: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderColor: '#E8B64B',
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: BOTTOM_NAV_HEIGHT + 100,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    position: 'absolute',
    right: spacing.md,
    zIndex: 8,
    ...shadows.button,
  },
  chaptersButtonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }, { scale: 0.97 }],
  },
  chaptersButtonText: {
    color: colors.ink,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#F05278',
    borderBottomColor: '#A9274A',
    borderBottomWidth: 3,
    borderColor: '#FFC0CE',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 30,
    zIndex: 2,
  },
  closeButtonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }, { scale: 0.96 }],
  },
  container: {
    flex: 1,
    marginBottom: -spacing.md,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
  },
  difficultyBadge: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  difficultyText: {
    color: colors.ink,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  lockedBadge: {
    backgroundColor: '#CAD4CE',
    borderColor: '#E7EFE9',
  },
  lockedPanelBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  caveGlow: {
    backgroundColor: 'rgba(163, 232, 255, 0.42)',
    borderRadius: radii.pill,
    height: 28,
    position: 'absolute',
    width: 72,
  },
  caveGlowOne: {
    right: 22,
    top: 446,
    transform: [{ rotate: '-14deg' }],
  },
  caveGlowTwo: {
    left: 18,
    top: 820,
    transform: [{ rotate: '12deg' }],
  },
  mapFrame: {
    backgroundColor: '#86DCC3',
    flex: 1,
    overflow: 'hidden',
  },
  mapFrameMountain: {
    backgroundColor: '#89B7CF',
  },
  mapFrameCrystal: {
    backgroundColor: '#988BEA',
  },
  mapFrameSweet: {
    backgroundColor: '#FFE4F0',
  },
  mapBottomScrim: {
    backgroundColor: 'rgba(7, 24, 32, 0.34)',
    bottom: 0,
    height: 46,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  mapBackgroundHitArea: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  mapImageAsset: {
    borderRadius: 0,
  },
  // Camada do cenário ancorada na tela. A folga extra fica embaixo porque o parallax
  // desloca a arte para cima (translateY negativo) conforme o mapa rola.
  mapParallax: {
    bottom: -MAP_PARALLAX_TRAVEL,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mapParallaxImage: {
    flex: 1,
  },
  mapLayer: {
    alignSelf: 'center',
    height: MAP_HEIGHT,
    position: 'relative',
    width: MAP_WIDTH,
    zIndex: 3,
  },
  mapScrollContent: {
    minHeight: MAP_HEIGHT,
    // Folga da barra de abas full-bleed, para o fim do mapa não ficar sob ela.
    paddingBottom: BOTTOM_NAV_HEIGHT,
    position: 'relative',
  },
  mountainMist: {
    backgroundColor: 'rgba(243, 251, 255, 0.24)',
    borderRadius: radii.pill,
    height: 48,
    left: -20,
    position: 'absolute',
    right: -20,
  },
  mountainMistBottom: {
    top: 1030,
    transform: [{ rotate: '-5deg' }],
  },
  mountainMistTop: {
    top: 250,
    transform: [{ rotate: '6deg' }],
  },
  mountainShape: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 150,
    borderRightColor: 'transparent',
    borderRightWidth: 150,
    height: 0,
    left: 10,
    position: 'absolute',
    width: 0,
  },
  mountainShapeBack: {
    borderBottomColor: 'rgba(78, 106, 134, 0.34)',
    borderBottomWidth: 250,
    top: 70,
  },
  mountainShapeFront: {
    borderBottomColor: 'rgba(109, 137, 151, 0.45)',
    borderBottomWidth: 300,
    left: -44,
    top: 330,
  },
  mountainThemeLayer: {
    backgroundColor: 'rgba(35, 70, 100, 0.28)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  nodePosition: {
    alignItems: 'center',
    position: 'absolute',
  },
  panelBottomRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  panelButton: {
    minWidth: 108,
  },
  panelCopy: {
    flex: 1,
  },
  panelBanner: {
    alignSelf: 'center',
    backgroundColor: '#F7B91E',
    borderColor: '#FFF2A7',
    borderRadius: radii.pill,
    borderWidth: 2,
    marginTop: -18,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    ...shadows.button,
  },
  panelBannerLocked: {
    backgroundColor: '#8D9BA0',
    borderColor: '#D5E0E0',
  },
  panelBannerPortal: {
    backgroundColor: '#5E82DE',
    borderColor: '#E7F0FF',
  },
  panelBannerSoon: {
    backgroundColor: '#6F82D8',
    borderColor: '#DDE6FF',
  },
  panelBannerText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 1,
  },
  panelDescription: {
    color: colors.ink,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 15,
  },
  panelHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  panelDifficultyRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  panelStarIcon: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  panelStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  panelTitle: {
    color: colors.ink,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  panelTitleBlock: {
    flex: 1,
  },
  portalGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.28)',
    borderRadius: radii.pill,
    height: 78,
    position: 'absolute',
    width: 90,
  },
  portalLabel: {
    color: colors.inkOnDark,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  portalMarker: {
    alignItems: 'center',
    backgroundColor: '#5E82DE',
    borderBottomColor: '#2E438B',
    borderBottomWidth: 4,
    borderColor: '#E7F0FF',
    borderRadius: 16,
    borderWidth: 3,
    gap: 2,
    height: 74,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 90,
    ...shadows.button,
  },
  portalMarkerLocked: {
    backgroundColor: '#7B8B93',
    borderBottomColor: '#46565F',
    borderColor: '#D5E0E0',
  },
  portalMarkerPressed: {
    opacity: 0.9,
    transform: [{ translateY: 2 }, { scale: 0.98 }],
  },
  portalMarkerSelected: {
    borderColor: '#FFF7C8',
  },
  portalPosition: {
    alignItems: 'center',
    position: 'absolute',
  },
  rewardCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 5,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: 3,
    gap: spacing.md,
    maxWidth: 360,
    padding: spacing.xl,
    width: '88%',
    ...shadows.card,
  },
  rewardKicker: {
    color: colors.primaryDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rewardOverlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  rewardText: {
    color: colors.muted,
    fontSize: fontSizes.md,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  rewardTitle: {
    color: colors.ink,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  selectionPanel: {
    backgroundColor: '#FFF8E8',
    borderColor: '#E8B64B',
    borderRadius: 16,
    borderWidth: 3,
    // Sobe acima da barra de abas, senão o botão Jogar fica embaixo dela.
    bottom: BOTTOM_NAV_HEIGHT,
    gap: 5,
    left: 0,
    minHeight: 92,
    paddingBottom: 7,
    paddingHorizontal: spacing.sm,
    paddingRight: 42,
    paddingTop: 30,
    position: 'absolute',
    right: 0,
    zIndex: 9,
    ...shadows.card,
  },
  segmentedEntityPosition: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 4,
  },
  segmentedEntityScale: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedMapLayer: {
    alignSelf: 'center',
    position: 'relative',
    zIndex: 3,
  },
  shopPanelEmoji: {
    fontSize: 22,
  },
  shopPanelIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  shopPosition: {
    alignItems: 'center',
    position: 'absolute',
  },
  sweetCrystal: {
    backgroundColor: 'rgba(133, 210, 245, 0.52)',
    borderColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: 8,
    borderWidth: 2,
    height: 44,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 44,
  },
  sweetCrystalOne: {
    right: 24,
    top: 372,
  },
  sweetCrystalTwo: {
    left: 30,
    top: 1030,
  },
  sweetEmoji: {
    color: '#C75693',
    fontSize: 24,
    opacity: 0.72,
    position: 'absolute',
  },
  sweetEmojiOne: {
    left: 44,
    top: 286,
    transform: [{ rotate: '-10deg' }],
  },
  sweetEmojiThree: {
    right: 44,
    top: 936,
    transform: [{ rotate: '14deg' }],
  },
  sweetEmojiTwo: {
    right: 54,
    top: 668,
    transform: [{ rotate: '10deg' }],
  },
  sweetHill: {
    backgroundColor: 'rgba(255, 245, 216, 0.62)',
    borderColor: 'rgba(255, 211, 106, 0.72)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 190,
    position: 'absolute',
    width: 360,
  },
  sweetHillBack: {
    left: -50,
    top: 110,
    transform: [{ rotate: '-7deg' }],
  },
  sweetHillFront: {
    right: -88,
    top: 760,
    transform: [{ rotate: '9deg' }],
  },
  sweetThemeLayer: {
    backgroundColor: 'rgba(255, 196, 218, 0.34)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: 2,
    maxWidth: '96%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  toastSlot: {
    bottom: BOTTOM_NAV_HEIGHT + 132,
    left: 0,
    minHeight: 38,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  toastText: {
    color: colors.ink,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
});
