import type {
  CampaignMapLevelAnchor,
  CampaignMapPoint,
  CampaignMapSite,
  SegmentedWorldMapConfig,
  WorldMapConfig,
  WorldMapConfigRegistry,
} from '../types/campaignMap';
import type { ChapterWorldId, WorldId } from '../types/game';

export const BOSQUE_MAP_ASSET_KEYS = [
  'forest-canopy',
  'forest-gate',
  'forest-river',
  'forest-grove',
  'forest-sunlit',
  'forest-entry',
  'forest-trailhead',
] as const;

export const BOSQUE_MAP_LANDMARK_VISUAL_KEYS = [
  'forest-portal-rune',
  'forest-rest-cart',
] as const;

const BOSQUE_LEVEL_ANCHOR_DEFINITIONS: readonly Readonly<{
  point: CampaignMapPoint;
  site: CampaignMapSite;
}>[] = [
  { point: { x: 190, y: 2945 }, site: 'clearing' },
  { point: { x: 180, y: 2850 }, site: 'curve' },
  { point: { x: 178, y: 2755 }, site: 'crossing' },
  { point: { x: 188, y: 2660 }, site: 'curve' },
  { point: { x: 195, y: 2560 }, site: 'platform' },
  { point: { x: 190, y: 2400 }, site: 'bridge' },
  { point: { x: 180, y: 2305 }, site: 'curve' },
  { point: { x: 150, y: 2210 }, site: 'clearing' },
  { point: { x: 180, y: 2115 }, site: 'platform' },
  { point: { x: 205, y: 2020 }, site: 'crossing' },
  { point: { x: 195, y: 1860 }, site: 'clearing' },
  { point: { x: 200, y: 1765 }, site: 'curve' },
  { point: { x: 190, y: 1670 }, site: 'clearing' },
  { point: { x: 170, y: 1575 }, site: 'crossing' },
  { point: { x: 155, y: 1480 }, site: 'curve' },
  { point: { x: 180, y: 1320 }, site: 'bridge' },
  { point: { x: 160, y: 1225 }, site: 'bridge' },
  { point: { x: 185, y: 1130 }, site: 'clearing' },
  { point: { x: 175, y: 1035 }, site: 'platform' },
  { point: { x: 150, y: 940 }, site: 'crossing' },
  { point: { x: 185, y: 780 }, site: 'curve' },
  { point: { x: 180, y: 685 }, site: 'platform' },
  { point: { x: 155, y: 590 }, site: 'crossing' },
  { point: { x: 170, y: 505 }, site: 'curve' },
  { point: { x: 180, y: 415 }, site: 'platform' },
];

export const BOSQUE_LEVEL_ANCHORS: readonly CampaignMapLevelAnchor[] =
  BOSQUE_LEVEL_ANCHOR_DEFINITIONS.map(({ point, site }, index) => ({
    levelId: `w1-${String(index + 1).padStart(3, '0')}`,
    point,
    routeProgress: (index + 1) / (BOSQUE_LEVEL_ANCHOR_DEFINITIONS.length + 1),
    site,
  }));

const BOSQUE_ENTRY: CampaignMapPoint = { x: 180, y: 3080 };
const BOSQUE_EXIT: CampaignMapPoint = { x: 180, y: 270 };

export const BOSQUE_MAP_CONFIG: SegmentedWorldMapConfig = {
  backgroundColor: '#173F2B',
  designSize: { height: 3160, width: 360 },
  entry: BOSQUE_ENTRY,
  exit: BOSQUE_EXIT,
  identityKey: 'bosque-das-trincas',
  landmarks: [
    {
      afterLevelId: 'w1-005',
      id: 'bosque-rest-05',
      kind: 'rest',
      origin: { x: 0.5, y: 1 },
      point: { x: 82, y: 2500 },
      site: 'clearing',
      visualKey: 'forest-rest-cart',
      visualSize: { height: 96, width: 104 },
    },
    {
      afterLevelId: 'w1-010',
      id: 'bosque-rest-10',
      kind: 'rest',
      origin: { x: 0.5, y: 1 },
      point: { x: 264, y: 1960 },
      site: 'crossing',
      visualKey: 'forest-rest-cart',
      visualSize: { height: 96, width: 104 },
    },
    {
      afterLevelId: 'w1-015',
      id: 'bosque-rest-15',
      kind: 'rest',
      origin: { x: 0.5, y: 1 },
      point: { x: 74, y: 1420 },
      site: 'clearing',
      visualKey: 'forest-rest-cart',
      visualSize: { height: 96, width: 104 },
    },
    {
      afterLevelId: 'w1-020',
      id: 'bosque-rest-20',
      kind: 'rest',
      origin: { x: 0.5, y: 1 },
      point: { x: 282, y: 880 },
      site: 'platform',
      visualKey: 'forest-rest-cart',
      visualSize: { height: 96, width: 104 },
    },
    {
      afterLevelId: 'w1-025',
      id: 'bosque-rest-25',
      kind: 'rest',
      origin: { x: 0.5, y: 1 },
      point: { x: 72, y: 420 },
      site: 'clearing',
      visualKey: 'forest-rest-cart',
      visualSize: { height: 96, width: 104 },
    },
    {
      afterLevelId: 'w1-025',
      id: 'bosque-portal-world-2',
      kind: 'portal',
      origin: { x: 0.5, y: 1 },
      point: { x: 286, y: 420 },
      site: 'platform',
      targetWorldId: 2,
      visualKey: 'forest-portal-rune',
      visualSize: { height: 92, width: 104 },
    },
  ],
  levelAnchors: BOSQUE_LEVEL_ANCHORS,
  levelNodeOrigin: { x: 0.5, y: 1 },
  levelNodeSize: { height: 98, width: 88 },
  minimumTouchSize: 44,
  mode: 'segmented',
  openingFocusRatio: 0.45,
  openingInsets: { bottom: 48, top: 170 },
  progressionDirection: 'bottom-to-top',
  road: [
    BOSQUE_ENTRY,
    ...BOSQUE_LEVEL_ANCHORS.map(({ point }) => point),
    BOSQUE_EXIT,
  ],
  roadWidth: 68,
  segmentOverlap: 24,
  segments: [
    {
      height: 324,
      id: 'bosque-segment-canopy',
      layers: [
        {
          assetKey: 'forest-canopy',
          id: 'bosque-canopy-terrain',
          role: 'terrain',
        },
      ],
      top: 0,
    },
    {
      height: 564,
      id: 'bosque-segment-gate',
      layers: [
        { assetKey: 'forest-gate', id: 'bosque-gate-terrain', role: 'terrain' },
      ],
      top: 300,
    },
    {
      height: 564,
      id: 'bosque-segment-river',
      layers: [
        {
          assetKey: 'forest-river',
          id: 'bosque-river-terrain',
          role: 'terrain',
        },
      ],
      top: 840,
    },
    {
      height: 564,
      id: 'bosque-segment-grove',
      layers: [
        {
          assetKey: 'forest-grove',
          id: 'bosque-grove-terrain',
          role: 'terrain',
        },
      ],
      top: 1380,
    },
    {
      height: 564,
      id: 'bosque-segment-sunlit',
      layers: [
        {
          assetKey: 'forest-sunlit',
          id: 'bosque-sunlit-terrain',
          role: 'terrain',
        },
      ],
      top: 1920,
    },
    {
      height: 564,
      id: 'bosque-segment-entry',
      layers: [
        {
          assetKey: 'forest-entry',
          id: 'bosque-entry-terrain',
          role: 'terrain',
        },
      ],
      top: 2460,
    },
    {
      height: 160,
      id: 'bosque-segment-trailhead',
      layers: [
        {
          assetKey: 'forest-trailhead',
          id: 'bosque-trailhead-terrain',
          role: 'terrain',
        },
      ],
      top: 3000,
    },
  ],
  worldId: 1,
};

const legacyWorldMap = (
  worldId: Exclude<WorldId, 1>,
  identityKey: string,
): WorldMapConfig => ({
  identityKey,
  mode: 'legacy',
  rendererKey: `legacy-world-${worldId}`,
  worldId,
});

/**
 * Mapa de um capítulo.
 *
 * `WorldMapConfigRegistry` é `Record<WorldId, WorldMapConfig>` — obrigatório —,
 * então cada id de capítulo adicionado a `WorldId` precisa da sua entrada aqui,
 * senão o `tsc` quebra. É proposital: um capítulo sem mapa registrado seria um
 * capítulo que cai no fallback visual do Bosque sem ninguém perceber.
 */
const chapterWorldMap = (
  worldId: ChapterWorldId,
  identityKey: string,
): WorldMapConfig => ({
  identityKey,
  mode: 'legacy',
  rendererKey: `chapter-map-${worldId - 100}`,
  worldId,
});

export const WORLD_MAP_CONFIGS: WorldMapConfigRegistry = {
  1: BOSQUE_MAP_CONFIG,
  2: legacyWorldMap(2, 'vales-montanhosos'),
  3: legacyWorldMap(3, 'ruinas-de-cristal'),
  4: legacyWorldMap(4, 'praia-dos-tesouros'),
  5: legacyWorldMap(5, 'vulcao-doce'),
  6: legacyWorldMap(6, 'cidade-das-estrelas'),
  7: legacyWorldMap(7, 'neve-cristalina'),
  8: legacyWorldMap(8, 'reino-celestial'),
  21: legacyWorldMap(21, 'reino-acucarado'),
  101: chapterWorldMap(101, 'capitulo-aterro-adormecido'),
  102: chapterWorldMap(102, 'capitulo-rio-de-plastico'),
  103: chapterWorldMap(103, 'capitulo-feira-do-reaproveitamento'),
  104: chapterWorldMap(104, 'capitulo-galpao-da-triagem'),
  105: chapterWorldMap(105, 'capitulo-forno-de-vidro'),
  106: chapterWorldMap(106, 'capitulo-patio-do-metal'),
  107: chapterWorldMap(107, 'capitulo-horta-de-compostagem'),
  108: chapterWorldMap(108, 'capitulo-biblioteca-de-papel'),
  109: chapterWorldMap(109, 'capitulo-ferro-velho-renascido'),
  110: chapterWorldMap(110, 'capitulo-metropole-do-ciclo-fechado'),
};

/** Ids de mundo reservados aos capítulos, na ordem dos capítulos. */
export const CHAPTER_WORLD_IDS: readonly ChapterWorldId[] = [
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
];

export const getWorldMapConfig = (
  worldId: WorldId,
): WorldMapConfig | undefined => WORLD_MAP_CONFIGS[worldId];
