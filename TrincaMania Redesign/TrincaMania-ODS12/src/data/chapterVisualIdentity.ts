/**
 * Identidade visual determinística dos mapas de capítulo.
 *
 * ## O problema
 *
 * São 1000 mapas e existem ~10 PNGs em `assets/map`. Gerar 1000 imagens não é
 * opção. O que dá para fazer é o que todo jogo com conteúdo procedural faz:
 * tratar a arte como um **pool finito** e gerar por cima dele uma identidade —
 * paleta, ordem de camadas, semente de variante — que muda de mapa para mapa.
 *
 * ## As duas garantias
 *
 * 1. **Determinismo**: a identidade é função pura do id do mapa. O mesmo id
 *    devolve sempre a mesma paleta, a mesma ordem de segmentos e a mesma
 *    semente. Nada de `Math.random`, nada de estado de módulo.
 *
 * 2. **Sem colisão dentro do capítulo**: os 100 mapas irmãos são visualmente
 *    distintos por construção, não por sorte. Isso não sai de um hash puro —
 *    hash colide, e num pool pequeno colide bem antes de 100 amostras. Então a
 *    identidade combina duas fontes:
 *
 *    - as dimensões que **garantem** distinção vêm do índice do mapa dentro do
 *      capítulo: matiz por rotação de ângulo áureo (100 matizes espalhados pela
 *      roda) e arranjo de segmentos por passo coprimo do total de arranjos
 *      possíveis (100 ordens distintas);
 *    - as dimensões de **tempero** (jitter de matiz, quantos segmentos entram,
 *      semente de variante de carta) vêm do hash FNV-1a do id, que é o que dá a
 *      sensação de irregularidade.
 *
 *    Ambas continuam sendo função do id — o capítulo e o número saem do próprio
 *    id, e um id fora do formato cai num caminho de fallback também derivado do
 *    hash.
 */
import type { ChapterTheme } from '../types/game';
import { mixSeed, stableHash } from '../utils/deterministicRandom';

export type ChapterVisualIdentity = {
  accentColor: string;
  backgroundColor: string;
  baseColor: string;
  /** Semente passada ao gerador para escolher variantes de carta do resíduo. */
  cardVariantSeed: number;
  mapId: string;
  /** Seleção ordenada do pool finito de arte. Nunca vazia. */
  segmentKeys: string[];
  themeKey: ChapterTheme;
};

/**
 * Pool finito de arte de mapa. São os PNGs que já existem em
 * `assets/map/world1` e estão registrados em `CAMPAIGN_MAP_SEGMENT_ASSETS`.
 * Nenhuma imagem nova é gerada — o que varia é a ordem e o recorte.
 */
export const CHAPTER_ART_SEGMENT_KEYS = [
  'parque-canopy',
  'parque-entry',
  'parque-gate',
  'parque-grove',
  'parque-river',
  'parque-sunlit',
  'parque-trailhead',
] as const;

export const CHAPTER_MAPS_PER_CHAPTER = 100;
export const CHAPTER_COUNT = 10;

/** Ângulo áureo: espalha N matizes pela roda sem agrupar. */
const GOLDEN_ANGLE = 137.508;
const MIN_SEGMENTS = 3;
const MAX_SEGMENTS = CHAPTER_ART_SEGMENT_KEYS.length;

/** Arranjos de `size` itens tirados de `total`: P(total, size) = total!/(total-size)!. */
const arrangementCount = (total: number, size: number) => {
  let result = 1;

  for (let index = 0; index < size; index += 1) {
    result *= total - index;
  }

  return result;
};

/**
 * Passo usado para espalhar os 100 mapas irmãos pelos arranjos possíveis.
 *
 * Precisa ser coprimo de P(7, k) para todo k usado (210, 840, 2520, 5040). 11 é
 * primo e maior que 7, então não divide nenhum deles — `slot * 11 mod P` visita
 * 100 valores distintos e cada irmão recebe um arranjo de arte diferente.
 *
 * O menor desses totais é P(7, 3) = 210, folgado acima dos 100 mapas: por isso
 * `MIN_SEGMENTS` é 3, e não 1 ou 2 (P(7,1) = 7 e P(7,2) = 42 colidiriam).
 */
const ARRANGEMENT_STRIDE = 11;

export const CHAPTER_THEME_BY_ID: Record<number, ChapterTheme> = {
  1: 'aterro',
  2: 'rio',
  3: 'feira',
  4: 'triagem',
  5: 'vidro',
  6: 'metal',
  7: 'compostagem',
  8: 'papel',
  9: 'sucata',
  10: 'circular',
};

/**
 * Matiz de abertura de cada capítulo. Escolhidas com ~36° de distância entre
 * capítulos vizinhos para que dois capítulos nunca se confundam de relance.
 */
const CHAPTER_BASE_HUE: Record<number, number> = {
  1: 28,
  2: 198,
  3: 96,
  4: 262,
  5: 154,
  6: 44,
  7: 118,
  8: 214,
  9: 12,
  10: 288,
};

const CHAPTER_ID_PATTERN = /^ch(\d{1,2})-(\d{1,3})$/;

export type ChapterMapCoordinates = {
  chapterNumber: number;
  mapNumber: number;
};

/** Id canônico de um mapa de capítulo: `ch03-047`. */
export const buildChapterMapId = (chapterNumber: number, mapNumber: number) =>
  `ch${String(chapterNumber).padStart(2, '0')}-${String(mapNumber).padStart(3, '0')}`;

export const parseChapterMapId = (
  mapId: string,
): ChapterMapCoordinates | undefined => {
  const match = CHAPTER_ID_PATTERN.exec(mapId);

  if (!match) {
    return undefined;
  }

  const chapterNumber = Number(match[1]);
  const mapNumber = Number(match[2]);

  if (
    chapterNumber < 1 ||
    chapterNumber > CHAPTER_COUNT ||
    mapNumber < 1 ||
    mapNumber > CHAPTER_MAPS_PER_CHAPTER
  ) {
    return undefined;
  }

  return { chapterNumber, mapNumber };
};

const toHex = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');

/** HSL → hex. Só matemática de cor; sem dependência de plataforma. */
const hslToHex = (hue: number, saturation: number, lightness: number) => {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const safeSaturation = Math.max(0, Math.min(1, saturation));
  const safeLightness = Math.max(0, Math.min(1, lightness));
  const chroma = (1 - Math.abs(2 * safeLightness - 1)) * safeSaturation;
  const secondary = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const offset = safeLightness - chroma / 2;
  const sector = Math.floor(normalizedHue / 60) % 6;
  const channels: [number, number, number][] = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ];
  const [red, green, blue] = channels[sector];

  return `#${toHex((red + offset) * 255)}${toHex((green + offset) * 255)}${toHex(
    (blue + offset) * 255,
  )}`;
};

/**
 * Decodifica um rank em um arranjo ordenado de `size` itens do pool.
 *
 * É uma bijeção entre [0, P(total, size)) e os arranjos possíveis: rank
 * distinto devolve arranjo distinto, *já no tamanho final*. A versão anterior
 * decodificava a permutação inteira e depois cortava — e o corte reintroduzia
 * colisão, porque duas permutações diferentes podem começar igual. Este é o
 * detalhe que faz a garantia valer de verdade.
 */
const pickOrderedSubset = <T>(
  items: readonly T[],
  size: number,
  rank: number,
): T[] => {
  const pool = [...items];
  const safeSize = Math.max(1, Math.min(size, pool.length));
  const total = arrangementCount(pool.length, safeSize);
  const subset: T[] = [];
  let remainingRank = ((rank % total) + total) % total;

  for (let picked = 0; picked < safeSize; picked += 1) {
    const blockSize = arrangementCount(pool.length - 1, safeSize - picked - 1);
    const index = Math.floor(remainingRank / blockSize);
    remainingRank %= blockSize;
    subset.push(pool.splice(index, 1)[0]);
  }

  return subset;
};

/**
 * Identidade visual de um mapa. Função pura do id.
 *
 * Ids fora do formato `chNN-NNN` (um mapa avulso, um id de teste) não quebram:
 * caem numa coordenada derivada do próprio hash. A garantia de não-colisão vale
 * para os ids canônicos de capítulo, que são os 1000 que o jogo usa.
 */
export const getChapterVisualIdentity = (
  mapId: string,
): ChapterVisualIdentity => {
  const hash = stableHash(mapId);
  const coordinates = parseChapterMapId(mapId) ?? {
    chapterNumber: (hash % CHAPTER_COUNT) + 1,
    mapNumber: (mixSeed(hash, 7) % CHAPTER_MAPS_PER_CHAPTER) + 1,
  };
  const slot = coordinates.mapNumber - 1;
  const baseHue = CHAPTER_BASE_HUE[coordinates.chapterNumber] ?? hash % 360;

  // Jitter mantido em ±1° de propósito: tempera a paleta sem chegar perto de
  // fechar o vão entre dois matizes vizinhos da rotação áurea.
  const jitter = (mixSeed(hash, 11) % 2001) / 1000 - 1;
  const hue = (baseHue + slot * GOLDEN_ANGLE + jitter + 360) % 360;
  const saturationTier = slot % 5;
  const lightnessTier = Math.floor(slot / 20) % 5;
  const saturation = 0.42 + saturationTier * 0.07;
  const lightness = 0.36 + lightnessTier * 0.05;

  // Quantos segmentos entram é tempero (vem do hash); *quais* e em que ordem é
  // garantia (vem do slot, por passo coprimo). Mapas com contagens diferentes já
  // se distinguem pelo tamanho; com a mesma contagem, o passo garante arranjos
  // distintos dentro do capítulo.
  const segmentCount =
    MIN_SEGMENTS + (mixSeed(hash, 23) % (MAX_SEGMENTS - MIN_SEGMENTS + 1));
  const arrangementRank =
    slot * ARRANGEMENT_STRIDE + coordinates.chapterNumber * 509;

  return {
    accentColor: hslToHex(
      hue + 42,
      Math.min(0.92, saturation + 0.3),
      lightness + 0.26,
    ),
    backgroundColor: hslToHex(
      hue - 8,
      saturation * 0.55,
      0.12 + lightnessTier * 0.02,
    ),
    baseColor: hslToHex(hue, saturation, lightness),
    cardVariantSeed: mixSeed(hash, 31) % 997,
    mapId,
    segmentKeys: pickOrderedSubset(
      CHAPTER_ART_SEGMENT_KEYS,
      segmentCount,
      arrangementRank,
    ),
    themeKey: CHAPTER_THEME_BY_ID[coordinates.chapterNumber] ?? 'circular',
  };
};

/** Assinatura textual da identidade. Usada nos testes de não-colisão. */
export const getChapterVisualSignature = (identity: ChapterVisualIdentity) =>
  [
    identity.baseColor,
    identity.accentColor,
    identity.backgroundColor,
    identity.cardVariantSeed,
    identity.themeKey,
    identity.segmentKeys.join('>'),
  ].join('|');
