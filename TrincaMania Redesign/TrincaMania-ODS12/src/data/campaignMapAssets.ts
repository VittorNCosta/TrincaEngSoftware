import type { ImageSourcePropType } from 'react-native';

export const CAMPAIGN_MAP_SEGMENT_ASSETS = {
  'forest-canopy':
    require('../../assets/map/world1/forest_00_canopy.png') as ImageSourcePropType,
  'forest-entry':
    require('../../assets/map/world1/forest_01_entrance.png') as ImageSourcePropType,
  'forest-grove':
    require('../../assets/map/world1/forest_02_grove.png') as ImageSourcePropType,
  'forest-river':
    require('../../assets/map/world1/forest_03_river_ruins.png') as ImageSourcePropType,
  'forest-sunlit':
    require('../../assets/map/world1/forest_04_sunlit_grove.png') as ImageSourcePropType,
  'forest-gate':
    require('../../assets/map/world1/forest_05_ancient_gate.png') as ImageSourcePropType,
  'forest-trailhead':
    require('../../assets/map/world1/forest_06_trailhead.png') as ImageSourcePropType,
} as const;

export const WORLD1_SCENE_BACKGROUND =
  require('../../assets/map/map_world1_scene_bg.png') as ImageSourcePropType;

export const LEGACY_CAMPAIGN_MAP_ASSETS = {
  'legacy-world-2':
    require('../../assets/map/map_world2_bg.png') as ImageSourcePropType,
  'legacy-world-3':
    require('../../assets/map/map_world3_select_bg.png') as ImageSourcePropType,
  'legacy-world-4':
    require('../../assets/map/map_world1_bg.png') as ImageSourcePropType,
  'legacy-world-5':
    require('../../assets/map/map_world2_bg.png') as ImageSourcePropType,
  'legacy-world-6':
    require('../../assets/map/map_world3_select_bg.png') as ImageSourcePropType,
  'legacy-world-7':
    require('../../assets/map/map_world2_bg.png') as ImageSourcePropType,
  'legacy-world-8':
    require('../../assets/map/map_world3_select_bg.png') as ImageSourcePropType,
  'legacy-world-9':
    require('../../assets/map/map_world2_bg.png') as ImageSourcePropType,
  'legacy-world-10':
    require('../../assets/map/map_world3_select_bg.png') as ImageSourcePropType,
  'legacy-world-21':
    require('../../assets/map/map_bonus_bg.png') as ImageSourcePropType,
} as const;

/**
 * Fundo de mapa de cada capítulo.
 *
 * São 10 capítulos e o pool de PNGs é finito — nenhuma imagem nova é gerada.
 * A variedade percebida vem da identidade visual de cada mapa
 * (`chapterVisualIdentity.ts`), que troca paleta e ordem de camadas por cima
 * desta base. Aqui só garantimos que nenhum capítulo caia no fallback do
 * Parque, o que faria dez capítulos parecerem o mundo 1.
 */
export const CHAPTER_MAP_ASSETS = {
  'chapter-map-1':
    require('../../assets/map/map_world1_bg.png') as ImageSourcePropType,
  'chapter-map-2':
    require('../../assets/map/map_world2_bg.png') as ImageSourcePropType,
  'chapter-map-3':
    require('../../assets/map/map_world3_select_bg.png') as ImageSourcePropType,
  'chapter-map-4':
    require('../../assets/map/map_world3_bg.png') as ImageSourcePropType,
  'chapter-map-5':
    require('../../assets/map/map_world3_home_bg.png') as ImageSourcePropType,
  'chapter-map-6':
    require('../../assets/map/map_world1_bg.png') as ImageSourcePropType,
  'chapter-map-7':
    require('../../assets/map/map_world2_bg.png') as ImageSourcePropType,
  'chapter-map-8':
    require('../../assets/map/map_world3_bg_wide.png') as ImageSourcePropType,
  'chapter-map-9':
    require('../../assets/map/map_world3_shop_bg.png') as ImageSourcePropType,
  'chapter-map-10':
    require('../../assets/map/map_bonus_bg.png') as ImageSourcePropType,
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
