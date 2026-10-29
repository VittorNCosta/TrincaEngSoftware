import { Image, View } from 'react-native';
import { MapLevelPedestal } from '../../components/MapLevelPedestal';
import { MapTrailSign } from '../../components/MapTrailSign';
import { getWorldVisualAssets } from '../../data/worldVisualAssets';
import { WORLDS } from '../../data/worlds';
import type { Level, ProgressState, WorldId } from '../../types/game';
import {
  MAP_ART_TOP_INSET,
  type IllustratedMapLayout,
} from './illustratedMapLayout';
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
};

/** Pinta também a folga de rolagem e a área sob a barra de navegação. */
export function IllustratedMapBottomFill({
  worldId,
  layout,
  contentHeight,
}: {
  worldId: WorldId;
  layout: IllustratedMapLayout;
  contentHeight: number;
}) {
  const top = MAP_ART_TOP_INSET + layout.artHeight - 1;
  const slices = Math.max(
    1,
    Math.ceil((contentHeight - top) / layout.artHeight),
  );
  return (
    <View
      pointerEvents="none"
      testID="map-bottom-art"
      style={{
        position: 'absolute',
        top,
        bottom: 0,
        width: layout.width,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: slices }, (_, index) => (
        <Image
          key={index}
          accessible={false}
          source={getWorldVisualAssets(worldId).map}
          resizeMode="contain"
          style={{
            width: '100%',
            height: layout.artHeight,
            flexShrink: 0,
            transform: [{ scaleY: index % 2 === 0 ? -1 : 1 }],
          }}
        />
      ))}
    </View>
  );
}

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
}: Props) {
  const { scale } = layout;
  const index = WORLDS.findIndex(({ id }) => id === worldId);
  const previous = WORLDS[index - 1];
  const next = WORLDS[index + 1];
  const mapArtwork = getWorldVisualAssets(worldId).map;
  return (
    <View
      pointerEvents="box-none"
      testID={`illustrated-map-${worldId}`}
      style={{ width: layout.width, height: layout.height, zIndex: 3 }}
    >
      {/* Mantém a folga dos controles sem revelar um canvas vazio no topo.
          A faixa usa a borda da própria arte espelhada, sem esticar o mapa
          ou deslocar os pedestais; a junção compartilha a mesma linha de pixels. */}
      <View
        pointerEvents="none"
        testID="map-top-art"
        style={{
          position: 'absolute',
          top: 0,
          width: layout.width,
          // A arte principal cobre 1 px extra e evita uma linha de composição.
          height: MAP_ART_TOP_INSET + 1,
          overflow: 'hidden',
        }}
      >
        <Image
          accessible={false}
          source={mapArtwork}
          resizeMode="contain"
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: layout.artHeight,
            transform: [{ scaleY: -1 }],
          }}
        />
      </View>
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
          source={mapArtwork}
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
              // A área transparente da placa de passagem não deve capturar
              // o toque da última fase quando as duas ficam próximas.
              zIndex: 1,
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
            accessibilityLabel={`Portal para ${next.label}${isWorldUnlocked(next.id, progress) ? '' : ', bloqueado'}`}
            scale={scale}
            onPress={() =>
              selectWorldPortal(levels[levels.length - 1].id, next.id)
            }
          />
        </View>
      ) : null}
    </View>
  );
}
