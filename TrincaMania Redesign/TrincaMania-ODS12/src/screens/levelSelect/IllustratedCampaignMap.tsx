import { Image, View } from 'react-native';
import { MapLevelPedestal } from '../../components/MapLevelPedestal';
import { MapTrailSign } from '../../components/MapTrailSign';
import { RestStopMapMarker } from '../../components/RestStopMapMarker';
import { BonusWorldChestMarker } from '../../components/BonusWorldChestMarker';
import { getWorldVisualAssets } from '../../data/worldVisualAssets';
import { WORLDS } from '../../data/worlds';
import type { Level, ProgressState, WorldId } from '../../types/game';
import {
  isShopUnlockedAfterLevel,
  shouldShowShopAfterLevel,
} from '../../utils/shop';
import { getLevelDisplayLabel } from '../../utils/levelDisplay';
import { getBonusWorldChestProgress } from '../../storage/progressStorage';
import {
  MAP_ART_TOP_INSET,
  type IllustratedMapLayout,
} from './illustratedMapLayout';
import { getWorldSelectorSubtitle } from './mapPresentation';
import type { SelectedTarget } from './types';

type Props = {
  worldId: WorldId;
  layout: IllustratedMapLayout;
  levels: Level[];
  progress: ProgressState;
  currentLevelId?: string;
  devMode: boolean;
  selectedTarget?: SelectedTarget;
  isWorldUnlocked: (id: WorldId, progress: ProgressState) => boolean;
  selectLevel: (id: string) => void;
  selectWorld: (id: WorldId) => void;
  selectWorldPortal: (afterLevelId: string, targetWorldId: WorldId) => void;
  selectShop: (id: string, comingSoon: boolean, locked: boolean) => void;
  selectBonusChest: () => void;
};

/** Uma só superfície de rolagem mantém a arte e os objetos no mesmo chão. */
export function IllustratedCampaignMap({
  worldId,
  layout,
  levels,
  progress,
  currentLevelId,
  devMode,
  selectedTarget,
  isWorldUnlocked,
  selectLevel,
  selectWorld,
  selectWorldPortal,
  selectShop,
  selectBonusChest,
}: Props) {
  const { scale } = layout;
  const index = WORLDS.findIndex(({ id }) => id === worldId);
  const previous = WORLDS[index - 1];
  const next = WORLDS[index + 1];
  const chest = getBonusWorldChestProgress(progress);
  return (
    <View
      pointerEvents="box-none"
      testID={`illustrated-map-${worldId}`}
      style={{ width: layout.width, height: layout.height, zIndex: 3 }}
    >
      <View
        pointerEvents="none"
        testID="map-trail-art"
        style={{
          position: 'absolute',
          top: MAP_ART_TOP_INSET,
          width: layout.width,
          height: layout.artHeight,
        }}
      >
        <Image
          accessible={false}
          source={getWorldVisualAssets(worldId).map}
          resizeMode="contain"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      {levels.map((level, localIndex) => {
        const point = layout.groundPoints[localIndex];
        if (!point) return null;
        const completed = progress.completedLevelIds.includes(level.id);
        const locked =
          !devMode && !progress.unlockedLevelIds.includes(level.id);
        const touchWidth = Math.max(44, 80 * scale);
        return (
          <View
            key={level.id}
            style={{
              position: 'absolute',
              left: point.x - touchWidth / 2,
              top: point.y - 72 * scale,
            }}
          >
            <MapLevelPedestal
              level={level}
              completed={completed}
              locked={locked}
              current={!locked && !completed && currentLevelId === level.id}
              selected={
                selectedTarget?.type === 'level' &&
                selectedTarget.levelId === level.id
              }
              stars={progress.levelStars[level.id] ?? 0}
              onPress={selectLevel}
              scale={scale}
            />
          </View>
        );
      })}
      {levels
        .filter((level) => shouldShowShopAfterLevel(level.id))
        .map((level) => {
          const point = layout.groundPoints[level.worldLevelNumber - 1];
          if (!point) return null;
          const locked = !isShopUnlockedAfterLevel(level.id, progress);
          return (
            <View
              key={`rest-${level.id}`}
              style={{
                position: 'absolute',
                left: point.x + 48 * scale,
                top: point.y - 80 * scale,
                width: 104,
                height: 96,
                transformOrigin: 'top left',
                transform: [{ scale }],
              }}
            >
              <RestStopMapMarker
                afterLevelLabel={getLevelDisplayLabel(level)}
                locked={locked}
                selected={
                  selectedTarget?.type === 'shop' &&
                  selectedTarget.afterLevelId === level.id
                }
                onPress={() => selectShop(level.id, false, locked)}
              />
            </View>
          );
        })}
      {previous ? (
        <View
          style={{
            position: 'absolute',
            left: layout.previousSign.x - 56 * scale,
            top: layout.previousSign.y - 125 * scale,
          }}
        >
          <MapTrailSign
            returning
            locked={!isWorldUnlocked(previous.id, progress)}
            label={getWorldSelectorSubtitle(previous.id)}
            accessibilityLabel="Mundo anterior"
            scale={scale}
            onPress={() => selectWorld(previous.id)}
          />
        </View>
      ) : null}
      {next && levels.length ? (
        <View
          style={{
            position: 'absolute',
            left: layout.nextSign.x - 56 * scale,
            top: layout.nextSign.y - 125 * scale,
          }}
        >
          <MapTrailSign
            locked={!isWorldUnlocked(next.id, progress)}
            selected={selectedTarget?.type === 'worldPortal'}
            label={getWorldSelectorSubtitle(next.id)}
            accessibilityLabel={`Portal para ${next.label}${isWorldUnlocked(next.id, progress) ? '' : ', bloqueado'}`}
            scale={scale}
            onPress={() =>
              selectWorldPortal(levels[levels.length - 1].id, next.id)
            }
          />
        </View>
      ) : null}
      {worldId === 21 ? (
        <View
          style={{
            position: 'absolute',
            left: 400 * scale,
            top: MAP_ART_TOP_INSET + 280 * scale,
            transformOrigin: 'top left',
            transform: [{ scale }],
          }}
        >
          <BonusWorldChestMarker
            completedCount={chest.completedCount}
            totalCount={chest.totalCount}
            selected={selectedTarget?.type === 'bonusChest'}
            state={
              chest.available
                ? 'available'
                : chest.claimed
                  ? 'claimed'
                  : 'locked'
            }
            onPress={selectBonusChest}
          />
        </View>
      ) : null}
    </View>
  );
}
