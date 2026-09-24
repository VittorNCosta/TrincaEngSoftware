import type { WorldId } from './game';

export type CampaignMapPoint = Readonly<{
  x: number;
  y: number;
}>;

export type CampaignMapSize = Readonly<{
  height: number;
  width: number;
}>;

export type CampaignMapAnchorOrigin = Readonly<{
  x: number;
  y: number;
}>;

export type CampaignMapProgressionDirection = 'bottom-to-top' | 'top-to-bottom';

export type CampaignMapSite =
  'bridge' | 'clearing' | 'crossing' | 'curve' | 'platform';

export type CampaignMapLevelAnchor = Readonly<{
  levelId: string;
  point: CampaignMapPoint;
  routeProgress: number;
  site: CampaignMapSite;
}>;

export type CampaignMapSegmentLayerRole = 'effect' | 'foreground' | 'terrain';

export type CampaignMapSegmentLayer = Readonly<{
  assetKey: string;
  id: string;
  role: CampaignMapSegmentLayerRole;
}>;

export type CampaignMapSegment = Readonly<{
  height: number;
  id: string;
  layers: readonly CampaignMapSegmentLayer[];
  top: number;
}>;

export type CampaignMapLandmarkKind = 'chest' | 'portal' | 'rest' | 'shop';

export type CampaignMapLandmark = Readonly<{
  afterLevelId?: string;
  id: string;
  kind: CampaignMapLandmarkKind;
  origin: CampaignMapAnchorOrigin;
  point: CampaignMapPoint;
  site: CampaignMapSite;
  targetWorldId?: WorldId;
  visualKey: string;
  visualSize: CampaignMapSize;
}>;

export type SegmentedWorldMapConfig = Readonly<{
  backgroundColor: string;
  designSize: CampaignMapSize;
  entry: CampaignMapPoint;
  exit: CampaignMapPoint;
  identityKey: string;
  landmarks: readonly CampaignMapLandmark[];
  levelAnchors: readonly CampaignMapLevelAnchor[];
  levelNodeOrigin: CampaignMapAnchorOrigin;
  levelNodeSize: CampaignMapSize;
  minimumTouchSize: number;
  mode: 'segmented';
  openingFocusRatio: number;
  openingInsets: Readonly<{
    bottom: number;
    top: number;
  }>;
  progressionDirection: CampaignMapProgressionDirection;
  road: readonly CampaignMapPoint[];
  roadWidth: number;
  segmentOverlap: number;
  segments: readonly CampaignMapSegment[];
  worldId: WorldId;
}>;

export type LegacyWorldMapConfig = Readonly<{
  identityKey: string;
  mode: 'legacy';
  rendererKey: string;
  worldId: WorldId;
}>;

export type WorldMapConfig = LegacyWorldMapConfig | SegmentedWorldMapConfig;

export type WorldMapConfigRegistry = Readonly<Record<WorldId, WorldMapConfig>>;

export type PartialWorldMapConfigRegistry = Readonly<
  Partial<Record<WorldId, WorldMapConfig>>
>;

export type CampaignMapLevelState =
  'available' | 'completed' | 'current' | 'locked';
