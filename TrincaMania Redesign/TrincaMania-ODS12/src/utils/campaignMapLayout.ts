import type {
  CampaignMapAnchorOrigin,
  CampaignMapLevelState,
  CampaignMapPoint,
  CampaignMapSize,
  PartialWorldMapConfigRegistry,
  SegmentedWorldMapConfig,
  WorldMapConfig,
} from '../types/campaignMap';
import type { ProgressState, WorldId } from '../types/game';

const GEOMETRY_EPSILON = 0.000001;
const CAMPAIGN_MAP_SITES = new Set([
  'bridge',
  'clearing',
  'crossing',
  'curve',
  'platform',
]);
const CAMPAIGN_MAP_SEGMENT_LAYER_ROLES = new Set([
  'effect',
  'foreground',
  'terrain',
]);

export type CampaignMapTransform = Readonly<{
  contentHeight: number;
  scale: number;
  width: number;
}>;

export type CampaignMapFrame = Readonly<{
  height: number;
  left: number;
  top: number;
  width: number;
}>;

export type CampaignMapEntityFrames = Readonly<{
  touch: CampaignMapFrame;
  visual: CampaignMapFrame;
}>;

export type CampaignMapValidationContext = Readonly<{
  expectedLevelIds?: readonly string[];
  expectedWorldId?: WorldId;
  knownAssetKeys?: ReadonlySet<string>;
  knownLandmarkVisualKeys?: ReadonlySet<string>;
  knownWorldIds?: ReadonlySet<number>;
}>;

type LevelIdentity = Readonly<{
  id: string;
  worldId: WorldId;
}>;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPositiveFinite = (value: unknown): value is number =>
  isFiniteNumber(value) && value > 0;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const assertPositiveFinite = (value: number, label: string) => {
  if (!isPositiveFinite(value)) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
};

export const createCampaignMapTransform = (
  config: SegmentedWorldMapConfig,
  availableWidth: number,
): CampaignMapTransform => {
  assertPositiveFinite(config.designSize.width, 'config.designSize.width');
  assertPositiveFinite(config.designSize.height, 'config.designSize.height');
  assertPositiveFinite(availableWidth, 'availableWidth');

  const scale = availableWidth / config.designSize.width;

  return {
    contentHeight: config.designSize.height * scale,
    scale,
    width: availableWidth,
  };
};

export const transformCampaignMapPoint = (
  point: CampaignMapPoint,
  transform: CampaignMapTransform,
): CampaignMapPoint => ({
  x: point.x * transform.scale,
  y: point.y * transform.scale,
});

export const getCampaignMapFrame = (
  point: CampaignMapPoint,
  size: CampaignMapSize,
  origin: CampaignMapAnchorOrigin,
  transform: CampaignMapTransform,
): CampaignMapFrame => {
  assertPositiveFinite(size.width, 'size.width');
  assertPositiveFinite(size.height, 'size.height');

  if (
    !isFiniteNumber(origin.x) ||
    !isFiniteNumber(origin.y) ||
    origin.x < 0 ||
    origin.x > 1 ||
    origin.y < 0 ||
    origin.y > 1
  ) {
    throw new RangeError(
      'origin coordinates must be finite numbers between 0 and 1',
    );
  }

  const transformedPoint = transformCampaignMapPoint(point, transform);
  const width = size.width * transform.scale;
  const height = size.height * transform.scale;

  return {
    height,
    left: transformedPoint.x - width * origin.x,
    top: transformedPoint.y - height * origin.y,
    width,
  };
};

export const getCampaignMapFrameCenter = (
  frame: CampaignMapFrame,
): CampaignMapPoint => ({
  x: frame.left + frame.width / 2,
  y: frame.top + frame.height / 2,
});

export const getCampaignMapEntityFrames = (
  point: CampaignMapPoint,
  size: CampaignMapSize,
  origin: CampaignMapAnchorOrigin,
  transform: CampaignMapTransform,
  minimumTouchSize: number,
): CampaignMapEntityFrames => {
  assertPositiveFinite(minimumTouchSize, 'minimumTouchSize');
  const visual = getCampaignMapFrame(point, size, origin, transform);
  const visualCenter = getCampaignMapFrameCenter(visual);
  const touchWidth = Math.max(minimumTouchSize, visual.width);
  const touchHeight = Math.max(minimumTouchSize, visual.height);

  return {
    touch: {
      height: touchHeight,
      left: visualCenter.x - touchWidth / 2,
      top: visualCenter.y - touchHeight / 2,
      width: touchWidth,
    },
    visual,
  };
};

export const getCampaignMapScrollBounds = (
  contentHeight: number,
  viewportHeight: number,
) => {
  assertPositiveFinite(contentHeight, 'contentHeight');
  assertPositiveFinite(viewportHeight, 'viewportHeight');

  return {
    maximum: Math.max(0, contentHeight - viewportHeight),
    minimum: 0,
  };
};

export const getCampaignMapOpeningScrollOffset = ({
  contentHeight,
  fixedBottomInset = 0,
  fixedTopInset = 0,
  focusRatio,
  focusY,
  viewportHeight,
}: Readonly<{
  contentHeight: number;
  fixedBottomInset?: number;
  fixedTopInset?: number;
  focusRatio: number;
  focusY: number;
  viewportHeight: number;
}>) => {
  const bounds = getCampaignMapScrollBounds(contentHeight, viewportHeight);

  if (!isFiniteNumber(focusY)) {
    throw new RangeError('focusY must be a finite number');
  }

  if (!isFiniteNumber(fixedTopInset) || fixedTopInset < 0) {
    throw new RangeError('fixedTopInset must be a non-negative finite number');
  }

  if (!isFiniteNumber(fixedBottomInset) || fixedBottomInset < 0) {
    throw new RangeError(
      'fixedBottomInset must be a non-negative finite number',
    );
  }

  if (!isFiniteNumber(focusRatio) || focusRatio < 0 || focusRatio > 1) {
    throw new RangeError('focusRatio must be a finite number between 0 and 1');
  }

  const usableHeight = Math.max(
    0,
    viewportHeight - fixedTopInset - fixedBottomInset,
  );
  const desiredViewportY = clamp(
    fixedTopInset + usableHeight * focusRatio,
    0,
    viewportHeight,
  );

  return clamp(focusY - desiredViewportY, bounds.minimum, bounds.maximum);
};

export const getCampaignMapFocusLevelId = (
  orderedLevelIds: readonly string[],
  progress: Pick<ProgressState, 'completedLevelIds' | 'unlockedLevelIds'>,
): string | undefined => {
  const completedIds = new Set(progress.completedLevelIds);
  const unlockedIds = new Set(progress.unlockedLevelIds);
  const nextIncomplete = orderedLevelIds.find(
    (levelId) => unlockedIds.has(levelId) && !completedIds.has(levelId),
  );

  if (nextIncomplete) {
    return nextIncomplete;
  }

  for (let index = orderedLevelIds.length - 1; index >= 0; index -= 1) {
    if (unlockedIds.has(orderedLevelIds[index])) {
      return orderedLevelIds[index];
    }
  }

  return orderedLevelIds[0];
};

export const deriveCampaignMapLevelState = (
  levelId: string,
  currentLevelId: string | undefined,
  progress: Pick<ProgressState, 'completedLevelIds' | 'unlockedLevelIds'>,
): CampaignMapLevelState => {
  if (progress.completedLevelIds.includes(levelId)) {
    return 'completed';
  }

  if (!progress.unlockedLevelIds.includes(levelId)) {
    return 'locked';
  }

  return currentLevelId === levelId ? 'current' : 'available';
};

export const resolveCampaignMapWorldSelection = (
  requestedWorldId: WorldId | undefined,
  fallbackWorldId: WorldId,
  unlockedWorldIds: readonly WorldId[],
): WorldId => {
  const unlockedSet = new Set(unlockedWorldIds);

  if (requestedWorldId !== undefined && unlockedSet.has(requestedWorldId)) {
    return requestedWorldId;
  }

  if (unlockedSet.has(fallbackWorldId)) {
    return fallbackWorldId;
  }

  return unlockedWorldIds[0] ?? fallbackWorldId;
};

export const createSelectedWorldMapModel = <TLevel extends LevelIdentity>(
  selectedWorldId: WorldId,
  registry: PartialWorldMapConfigRegistry,
  levels: readonly TLevel[],
) => {
  const config = registry[selectedWorldId];

  if (!config) {
    return undefined;
  }

  const selectedLevels = levels.filter(
    (level) => level.worldId === selectedWorldId,
  );

  return {
    config,
    levelIds: selectedLevels.map((level) => level.id),
    levels: selectedLevels,
    segments: config.mode === 'segmented' ? config.segments : [],
    worldId: selectedWorldId,
  };
};

const validatePoint = (
  label: string,
  point: CampaignMapPoint,
  designSize: CampaignMapSize,
  errors: string[],
) => {
  if (!isFiniteNumber(point.x)) {
    errors.push(`${label}.x:must-be-finite`);
  } else if (point.x < 0 || point.x > designSize.width) {
    errors.push(`${label}.x:out-of-bounds`);
  }

  if (!isFiniteNumber(point.y)) {
    errors.push(`${label}.y:must-be-finite`);
  } else if (point.y < 0 || point.y > designSize.height) {
    errors.push(`${label}.y:out-of-bounds`);
  }
};

const validateOrigin = (
  label: string,
  origin: CampaignMapAnchorOrigin,
  errors: string[],
) => {
  (['x', 'y'] as const).forEach((axis) => {
    const value = origin[axis];

    if (!isFiniteNumber(value) || value < 0 || value > 1) {
      errors.push(`${label}.${axis}:must-be-between-0-and-1`);
    }
  });
};

const validateSize = (
  label: string,
  size: CampaignMapSize,
  errors: string[],
) => {
  if (!isPositiveFinite(size.width)) {
    errors.push(`${label}.width:must-be-positive-finite`);
  }

  if (!isPositiveFinite(size.height)) {
    errors.push(`${label}.height:must-be-positive-finite`);
  }
};

const validateDesignFrame = (
  label: string,
  point: CampaignMapPoint,
  size: CampaignMapSize,
  origin: CampaignMapAnchorOrigin,
  designSize: CampaignMapSize,
  errors: string[],
) => {
  if (
    !isFiniteNumber(point.x) ||
    !isFiniteNumber(point.y) ||
    !isPositiveFinite(size.width) ||
    !isPositiveFinite(size.height) ||
    !isFiniteNumber(origin.x) ||
    !isFiniteNumber(origin.y)
  ) {
    return;
  }

  const left = point.x - size.width * origin.x;
  const right = left + size.width;
  const top = point.y - size.height * origin.y;
  const bottom = top + size.height;

  if (
    left < -GEOMETRY_EPSILON ||
    top < -GEOMETRY_EPSILON ||
    right > designSize.width + GEOMETRY_EPSILON ||
    bottom > designSize.height + GEOMETRY_EPSILON
  ) {
    errors.push(`${label}:visual-frame-out-of-bounds`);
  }
};

export const validateWorldMapConfig = (
  config: WorldMapConfig,
  context: CampaignMapValidationContext = {},
): string[] => {
  const errors: string[] = [];

  if (
    context.expectedWorldId !== undefined &&
    config.worldId !== context.expectedWorldId
  ) {
    errors.push(`worldId:expected-${context.expectedWorldId}`);
  }

  if (context.knownWorldIds && !context.knownWorldIds.has(config.worldId)) {
    errors.push('worldId:unknown');
  }

  if (
    typeof config.identityKey !== 'string' ||
    config.identityKey.trim().length === 0
  ) {
    errors.push('identityKey:required');
  }

  if (config.mode === 'legacy') {
    if (
      typeof config.rendererKey !== 'string' ||
      config.rendererKey.trim().length === 0
    ) {
      errors.push('rendererKey:required');
    }

    return errors;
  }

  validateSize('designSize', config.designSize, errors);
  validateSize('levelNodeSize', config.levelNodeSize, errors);
  validateOrigin('levelNodeOrigin', config.levelNodeOrigin, errors);

  if (
    typeof config.backgroundColor !== 'string' ||
    config.backgroundColor.trim().length === 0
  ) {
    errors.push('backgroundColor:required');
  }

  if (!isPositiveFinite(config.minimumTouchSize)) {
    errors.push('minimumTouchSize:must-be-positive-finite');
  }

  if (!isPositiveFinite(config.roadWidth)) {
    errors.push('roadWidth:must-be-positive-finite');
  }

  if (!isFiniteNumber(config.segmentOverlap) || config.segmentOverlap < 0) {
    errors.push('segmentOverlap:must-be-non-negative-finite');
  }

  if (
    !isFiniteNumber(config.openingFocusRatio) ||
    config.openingFocusRatio < 0 ||
    config.openingFocusRatio > 1
  ) {
    errors.push('openingFocusRatio:must-be-between-0-and-1');
  }

  if (
    !isFiniteNumber(config.openingInsets?.top) ||
    config.openingInsets.top < 0
  ) {
    errors.push('openingInsets.top:must-be-non-negative-finite');
  }

  if (
    !isFiniteNumber(config.openingInsets?.bottom) ||
    config.openingInsets.bottom < 0
  ) {
    errors.push('openingInsets.bottom:must-be-non-negative-finite');
  }

  if (
    config.progressionDirection !== 'bottom-to-top' &&
    config.progressionDirection !== 'top-to-bottom'
  ) {
    errors.push('progressionDirection:unknown');
  }

  validatePoint('entry', config.entry, config.designSize, errors);
  validatePoint('exit', config.exit, config.designSize, errors);

  if (config.segments.length === 0) {
    errors.push('segments:required');
  }

  const segmentIds = new Set<string>();
  const segmentLayerIds = new Set<string>();
  config.segments.forEach((segment, index) => {
    const label = `segments[${index}]`;

    if (segmentIds.has(segment.id)) {
      errors.push(`${label}.id:duplicate`);
    }
    segmentIds.add(segment.id);

    if (typeof segment.id !== 'string' || segment.id.trim().length === 0) {
      errors.push(`${label}.id:required`);
    }

    if (!Array.isArray(segment.layers) || segment.layers.length === 0) {
      errors.push(`${label}.layers:required`);
    } else
      segment.layers.forEach((layer, layerIndex) => {
        const layerLabel = `${label}.layers[${layerIndex}]`;

        if (segmentLayerIds.has(layer.id)) {
          errors.push(`${layerLabel}.id:duplicate`);
        }
        segmentLayerIds.add(layer.id);

        if (typeof layer.id !== 'string' || layer.id.trim().length === 0) {
          errors.push(`${layerLabel}.id:required`);
        }

        if (
          typeof layer.assetKey !== 'string' ||
          layer.assetKey.trim().length === 0
        ) {
          errors.push(`${layerLabel}.assetKey:required`);
        } else if (
          context.knownAssetKeys &&
          !context.knownAssetKeys.has(layer.assetKey)
        ) {
          errors.push(`${layerLabel}.assetKey:unknown`);
        }

        if (!CAMPAIGN_MAP_SEGMENT_LAYER_ROLES.has(layer.role)) {
          errors.push(`${layerLabel}.role:unknown`);
        }
      });

    if (!isFiniteNumber(segment.top) || segment.top < 0) {
      errors.push(`${label}.top:must-be-non-negative-finite`);
    }

    if (!isPositiveFinite(segment.height)) {
      errors.push(`${label}.height:must-be-positive-finite`);
    }

    if (
      isFiniteNumber(segment.top) &&
      isPositiveFinite(segment.height) &&
      segment.top + segment.height > config.designSize.height + GEOMETRY_EPSILON
    ) {
      errors.push(`${label}:out-of-bounds`);
    }

    if (index === 0) {
      return;
    }

    const previous = config.segments[index - 1];
    if (
      !isFiniteNumber(previous.top) ||
      !isPositiveFinite(previous.height) ||
      !isFiniteNumber(segment.top)
    ) {
      return;
    }

    if (segment.top < previous.top) {
      errors.push(`${label}:not-sorted`);
    }

    const actualOverlap = previous.top + previous.height - segment.top;
    if (actualOverlap < -GEOMETRY_EPSILON) {
      errors.push(`${label}:segment-gap`);
    }

    if (
      isFiniteNumber(config.segmentOverlap) &&
      Math.abs(actualOverlap - config.segmentOverlap) > GEOMETRY_EPSILON
    ) {
      errors.push(`${label}:overlap-must-equal-${config.segmentOverlap}`);
    }
  });

  const firstSegment = config.segments[0];
  const lastSegment = config.segments[config.segments.length - 1];
  if (firstSegment && Math.abs(firstSegment.top) > GEOMETRY_EPSILON) {
    errors.push('segments:first-must-start-at-zero');
  }
  if (
    lastSegment &&
    isFiniteNumber(lastSegment.top) &&
    isPositiveFinite(lastSegment.height) &&
    Math.abs(lastSegment.top + lastSegment.height - config.designSize.height) >
      GEOMETRY_EPSILON
  ) {
    errors.push('segments:last-must-end-at-design-height');
  }

  const expectedLevelIds = context.expectedLevelIds ?? [];
  const expectedLevelIdSet = new Set(expectedLevelIds);
  const anchorIds = new Set<string>();
  let previousRouteProgress = -Infinity;
  let previousLevelY: number | undefined;

  if (config.levelAnchors.length === 0) {
    errors.push('levelAnchors:required');
  }

  config.levelAnchors.forEach((anchor, index) => {
    const label = `levelAnchors[${index}]`;

    if (anchorIds.has(anchor.levelId)) {
      errors.push(`${label}.levelId:duplicate`);
    }
    anchorIds.add(anchor.levelId);

    if (expectedLevelIds.length > 0) {
      if (!expectedLevelIdSet.has(anchor.levelId)) {
        errors.push(`${label}.levelId:unknown`);
      } else if (expectedLevelIds[index] !== anchor.levelId) {
        errors.push(`${label}.levelId:out-of-order`);
      }
    }

    validatePoint(`${label}.point`, anchor.point, config.designSize, errors);

    if (!CAMPAIGN_MAP_SITES.has(anchor.site)) {
      errors.push(`${label}.site:unknown`);
    }

    validateDesignFrame(
      label,
      anchor.point,
      config.levelNodeSize,
      config.levelNodeOrigin,
      config.designSize,
      errors,
    );

    if (
      !isFiniteNumber(anchor.routeProgress) ||
      anchor.routeProgress <= 0 ||
      anchor.routeProgress >= 1
    ) {
      errors.push(`${label}.routeProgress:must-be-between-0-and-1-exclusive`);
    } else if (anchor.routeProgress <= previousRouteProgress) {
      errors.push(`${label}.routeProgress:not-increasing`);
    }
    previousRouteProgress = anchor.routeProgress;

    if (previousLevelY !== undefined && isFiniteNumber(anchor.point.y)) {
      const wrongDirection =
        config.progressionDirection === 'bottom-to-top'
          ? anchor.point.y >= previousLevelY
          : anchor.point.y <= previousLevelY;

      if (wrongDirection) {
        errors.push(`${label}.point.y:wrong-progression-direction`);
      }
    }
    previousLevelY = anchor.point.y;
  });

  expectedLevelIds.forEach((levelId) => {
    if (!anchorIds.has(levelId)) {
      errors.push(`levelAnchors:missing-${levelId}`);
    }
  });

  if (config.road.length < 2) {
    errors.push('road:requires-at-least-two-points');
  }

  config.road.forEach((point, index) => {
    validatePoint(`road[${index}]`, point, config.designSize, errors);
  });

  const firstRoadPoint = config.road[0];
  const lastRoadPoint = config.road[config.road.length - 1];
  if (config.road.length !== config.levelAnchors.length + 2) {
    errors.push('road:must-contain-entry-levels-and-exit');
  }
  if (
    firstRoadPoint &&
    (firstRoadPoint.x !== config.entry.x || firstRoadPoint.y !== config.entry.y)
  ) {
    errors.push('road:first-point-must-match-entry');
  }
  if (
    lastRoadPoint &&
    (lastRoadPoint.x !== config.exit.x || lastRoadPoint.y !== config.exit.y)
  ) {
    errors.push('road:last-point-must-match-exit');
  }
  config.levelAnchors.forEach((anchor, index) => {
    const roadPoint = config.road[index + 1];

    if (
      !roadPoint ||
      roadPoint.x !== anchor.point.x ||
      roadPoint.y !== anchor.point.y
    ) {
      errors.push(`road:level-point-mismatch-${anchor.levelId}`);
    }
  });

  const landmarkIds = new Set<string>();
  config.landmarks.forEach((landmark, index) => {
    const label = `landmarks[${index}]`;

    if (landmarkIds.has(landmark.id)) {
      errors.push(`${label}.id:duplicate`);
    }
    landmarkIds.add(landmark.id);

    if (typeof landmark.id !== 'string' || landmark.id.trim().length === 0) {
      errors.push(`${label}.id:required`);
    }

    validatePoint(`${label}.point`, landmark.point, config.designSize, errors);

    if (!CAMPAIGN_MAP_SITES.has(landmark.site)) {
      errors.push(`${label}.site:unknown`);
    }
    if (
      typeof landmark.visualKey !== 'string' ||
      landmark.visualKey.trim().length === 0
    ) {
      errors.push(`${label}.visualKey:required`);
    } else if (
      context.knownLandmarkVisualKeys &&
      !context.knownLandmarkVisualKeys.has(landmark.visualKey)
    ) {
      errors.push(`${label}.visualKey:unknown`);
    }
    validateSize(`${label}.visualSize`, landmark.visualSize, errors);
    validateOrigin(`${label}.origin`, landmark.origin, errors);
    validateDesignFrame(
      label,
      landmark.point,
      landmark.visualSize,
      landmark.origin,
      config.designSize,
      errors,
    );

    if (
      landmark.afterLevelId &&
      expectedLevelIds.length > 0 &&
      !expectedLevelIdSet.has(landmark.afterLevelId)
    ) {
      errors.push(`${label}.afterLevelId:unknown`);
    }

    if (
      (landmark.kind === 'rest' || landmark.kind === 'shop') &&
      !landmark.afterLevelId
    ) {
      errors.push(`${label}.afterLevelId:required-for-${landmark.kind}`);
    }

    if (landmark.kind === 'portal') {
      if (!landmark.afterLevelId) {
        errors.push(`${label}.afterLevelId:required-for-portal`);
      }
      if (landmark.targetWorldId === undefined) {
        errors.push(`${label}.targetWorldId:required-for-portal`);
      }
    }

    if (
      landmark.targetWorldId !== undefined &&
      context.knownWorldIds &&
      !context.knownWorldIds.has(landmark.targetWorldId)
    ) {
      errors.push(`${label}.targetWorldId:unknown`);
    }
  });

  return errors;
};

export const validateWorldMapRegistry = (
  registry: PartialWorldMapConfigRegistry,
  expectedWorldIds: readonly WorldId[],
): string[] => {
  const errors: string[] = [];
  const identityKeys = new Set<string>();
  const rendererKeys = new Set<string>();

  expectedWorldIds.forEach((worldId) => {
    const config = registry[worldId];

    if (!config) {
      errors.push(`registry:${worldId}:missing`);
      return;
    }

    if (config.worldId !== worldId) {
      errors.push(`registry:${worldId}:worldId-mismatch`);
    }

    if (identityKeys.has(config.identityKey)) {
      errors.push(`registry:${worldId}:identityKey-duplicate`);
    }
    identityKeys.add(config.identityKey);

    if (config.mode === 'legacy') {
      if (rendererKeys.has(config.rendererKey)) {
        errors.push(`registry:${worldId}:rendererKey-duplicate`);
      }
      rendererKeys.add(config.rendererKey);
    }
  });

  return errors;
};
