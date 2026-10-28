import { Fragment } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CampaignMapLandmarkMarker } from '../../components/CampaignMapLandmarkMarker';
import { GameIcon } from '../../components/GameIcon';
import { MapLevelNode } from '../../components/MapLevelNode';
import { MapStoneTrail, type TrailPoint } from '../../components/MapStoneTrail';
import { getWorldById } from '../../data/worlds';
import type { SegmentedWorldMapConfig } from '../../types/campaignMap';
import type { Level, ProgressState, WorldId } from '../../types/game';
import {
  deriveCampaignMapLevelState,
  getCampaignMapEntityFrames,
  type CampaignMapTransform,
} from '../../utils/campaignMapLayout';
import {
  getNextWorldLevelAfterLevel,
  shouldShowWorldPortalAfterLevel,
} from '../../utils/shop';
import {
  getLevelNodePosition,
  getPortalMarkerPosition,
} from './mapPresentation';
import { styles } from './styles';
import type { SelectedTarget } from './types';

type CampaignMapLayersProps = {
  segmentedMapConfig: SegmentedWorldMapConfig | undefined;
  segmentedMapTransform: CampaignMapTransform | undefined;
  selectedMapHeight: number;
  mapViewport: { width: number };
  worldLevelById: ReadonlyMap<string, Level>;
  currentLevel: Level | undefined;
  progress: ProgressState;
  devMode: boolean;
  selectedTarget: SelectedTarget | undefined;
  selectLevel: (levelId: string) => void;
  selectWorldPortal: (afterLevelId: string, targetWorldId: WorldId) => void;
  isWorldUnlocked: (worldId: WorldId, progress: ProgressState) => boolean;
  trailPoints: TrailPoint[];
  worldLevels: Level[];
  completedLevelIdSet: ReadonlySet<string>;
  unlockedLevelIdSet: ReadonlySet<string>;
};

export function CampaignMapLayers({
  segmentedMapConfig,
  segmentedMapTransform,
  selectedMapHeight,
  mapViewport,
  worldLevelById,
  currentLevel,
  progress,
  devMode,
  selectedTarget,
  selectLevel,
  selectWorldPortal,
  isWorldUnlocked,
  trailPoints,
  worldLevels,
  completedLevelIdSet,
  unlockedLevelIdSet,
}: CampaignMapLayersProps) {
  return (
    <>
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
            {segmentedMapConfig.levelAnchors.map((anchor) => {
              const level = worldLevelById.get(anchor.levelId);

              if (!level) {
                return null;
              }

              const normalState = deriveCampaignMapLevelState(
                level.id,
                currentLevel?.id,
                progress,
              );
              const state =
                devMode && normalState === 'locked' ? 'available' : normalState;
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
                        transform: [{ scale: segmentedMapTransform.scale }],
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
            const locked = !devMode && !unlockedLevelIdSet.has(level.id);
            const current =
              currentLevel?.id === level.id && !completed && !locked;
            const selected =
              selectedTarget?.type === 'level' &&
              selectedTarget.levelId === level.id;
            const nextWorldLevel = getNextWorldLevelAfterLevel(level.id);
            const nextWorld = nextWorldLevel
              ? getWorldById(nextWorldLevel.worldId)
              : undefined;
            const showWorldPortal = shouldShowWorldPortalAfterLevel(level.id);
            const position = getLevelNodePosition(
              localIndex,
              selectedMapHeight,
            );
            const portalPosition = showWorldPortal
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
                        selectWorldPortal(level.id, nextWorldLevel.worldId);
                      }}
                      style={({ pressed }) => [
                        styles.portalMarker,
                        portalLocked ? styles.portalMarkerLocked : null,
                        portalSelected ? styles.portalMarkerSelected : null,
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
        </View>
      )}
    </>
  );
}
