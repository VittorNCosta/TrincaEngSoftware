import type { ImageSourcePropType } from 'react-native';
import { WORLD_VISUAL_ASSETS } from './worldVisualAssets';

// Chaves e arquivos no vocabulário ODS 12 do Mundo 1 (Parque).
export const CAMPAIGN_MAP_SEGMENT_ASSETS = {
  'parque-canopy':
    require('../../assets/map/world1/park_00_canopy.png') as ImageSourcePropType,
  'parque-entry':
    require('../../assets/map/world1/park_01_entrance.png') as ImageSourcePropType,
  'parque-grove':
    require('../../assets/map/world1/park_02_grove.png') as ImageSourcePropType,
  'parque-river':
    require('../../assets/map/world1/park_03_riverbank.png') as ImageSourcePropType,
  'parque-sunlit':
    require('../../assets/map/world1/park_04_sunlit_grove.png') as ImageSourcePropType,
  'parque-gate':
    require('../../assets/map/world1/park_05_gateway.png') as ImageSourcePropType,
  'parque-trailhead':
    require('../../assets/map/world1/park_06_trailhead.png') as ImageSourcePropType,
} as const;

export const WORLD1_SCENE_BACKGROUND = WORLD_VISUAL_ASSETS[1].map;

export const LEGACY_CAMPAIGN_MAP_ASSETS = {
  'legacy-world-2': WORLD_VISUAL_ASSETS[2].map,
  'legacy-world-3': WORLD_VISUAL_ASSETS[3].map,
  'legacy-world-4': WORLD_VISUAL_ASSETS[4].map,
  'legacy-world-5': WORLD_VISUAL_ASSETS[5].map,
  'legacy-world-6': WORLD_VISUAL_ASSETS[6].map,
  'legacy-world-7': WORLD_VISUAL_ASSETS[7].map,
  'legacy-world-8': WORLD_VISUAL_ASSETS[8].map,
  'legacy-world-9': WORLD_VISUAL_ASSETS[9].map,
  'legacy-world-10': WORLD_VISUAL_ASSETS[10].map,
  'legacy-world-21':
    require('../../assets/map/map_bonus_bg.png') as ImageSourcePropType,
} as const;

/** Cada capítulo recebe a arte ODS 12 da sua família de mundo. */
export const CHAPTER_MAP_ASSETS = {
  'chapter-map-1': WORLD_VISUAL_ASSETS[1].map,
  'chapter-map-2': WORLD_VISUAL_ASSETS[2].map,
  'chapter-map-3': WORLD_VISUAL_ASSETS[3].map,
  'chapter-map-4': WORLD_VISUAL_ASSETS[4].map,
  'chapter-map-5': WORLD_VISUAL_ASSETS[5].map,
  'chapter-map-6': WORLD_VISUAL_ASSETS[6].map,
  'chapter-map-7': WORLD_VISUAL_ASSETS[7].map,
  'chapter-map-8': WORLD_VISUAL_ASSETS[8].map,
  'chapter-map-9': WORLD_VISUAL_ASSETS[9].map,
  'chapter-map-10': WORLD_VISUAL_ASSETS[10].map,
} as const;

export type CampaignMapSegmentAssetKey =
  keyof typeof CAMPAIGN_MAP_SEGMENT_ASSETS;
export type ChapterMapAssetKey = keyof typeof CHAPTER_MAP_ASSETS;
export type LegacyCampaignMapRendererKey =
  keyof typeof LEGACY_CAMPAIGN_MAP_ASSETS;

const hasOwnKey = <T extends object>(
  value: T,
  key: PropertyKey,
): key is keyof T => Object.prototype.hasOwnProperty.call(value, key);

export const resolveCampaignMapSegmentAsset = (
  assetKey: string,
): ImageSourcePropType | undefined =>
  hasOwnKey(CAMPAIGN_MAP_SEGMENT_ASSETS, assetKey)
    ? CAMPAIGN_MAP_SEGMENT_ASSETS[assetKey]
    : undefined;

export const resolveChapterMapAsset = (
  rendererKey: string,
): ImageSourcePropType | undefined =>
  hasOwnKey(CHAPTER_MAP_ASSETS, rendererKey)
    ? CHAPTER_MAP_ASSETS[rendererKey]
    : undefined;

/**
 * Resolve o fundo de um mapa em modo `legacy`. Capítulos usam o mesmo modo, e
 * caem no pool de capítulo — quem chama (`LevelSelectScreen`) não precisa saber
 * a diferença.
 */
export const resolveLegacyCampaignMapAsset = (
  rendererKey: string,
): ImageSourcePropType | undefined =>
  hasOwnKey(LEGACY_CAMPAIGN_MAP_ASSETS, rendererKey)
    ? LEGACY_CAMPAIGN_MAP_ASSETS[rendererKey]
    : resolveChapterMapAsset(rendererKey);
