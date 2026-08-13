import AsyncStorage from '@react-native-async-storage/async-storage';

import { CHAPTERS, CHAPTER_LEVELS, getChapterLevelSummary } from '../data/chapters';
import { ChapterId } from '../types/game';

/**
 * Progresso dos capítulos, em chave própria.
 *
 * ## Por que não entrou em `progressStorage`
 *
 * `normalizeProgress` filtra id desconhecido com `Array.prototype.includes`
 * sobre `LEVEL_IDS`, então um id `chNN-NNN` mandado para lá seria descartado em
 * silêncio. As duas saídas eram estender `LEVEL_IDS` ou usar outra chave.
 *
 * Estender custaria caro e em dois eixos. Custo medido: `normalizeProgress`
 * roda em 0,9 ms hoje com 203 ids; só a varredura de ids conhecidos vai a
 * 4,4 ms com 1203 ids, e ela acontece várias vezes por chamada — o que
 * obrigaria a reescrever `normalizeProgress` inteiro em Set/Map. Custo
 * semântico: a regra de desbloqueio de lá é da campanha
 * (`LEVEL_IDS[índice + 1]`), então concatenar as listas faria a última fase da
 * campanha abrir o primeiro mapa de capítulo por adjacência de array, e o baú
 * comum passaria a contar mapa de capítulo.
 *
 * Chave separada deixa as 203 fases canônicas exatamente como estão. Moedas,
 * vidas e poderes continuam no progresso compartilhado — aqui mora só a
 * conclusão e a estrela de cada mapa de capítulo.
 */
export type ChapterProgressState = {
  /** mapId → estrelas (1..3). Ter entrada significa mapa concluído. */
  mapStars: Record<string, number>;
};

export type ChapterProgressSummary = {
  chapterId: ChapterId;
  completedCount: number;
  totalCount: number;
  unlocked: boolean;
};

export type ChapterMapCompletionResult = {
  previousStars: number;
  progress: ChapterProgressState;
  savedStars: number;
  starsEarned: number;
  unlockedMapTitle?: string;
};

const STORAGE_KEY = '@trinca-mania/chapter-progress-v1';
const CHAPTER_MAP_IDS = CHAPTER_LEVELS.map((summary) => summary.id);
// Map em vez de array: a consulta de id conhecido acontece por mapa concluído e
// por render da lista, e é exatamente o `includes` linear que encarece o
// caminho da campanha.
const CHAPTER_MAP_ORDER = new Map(
  CHAPTER_MAP_IDS.map((mapId, index) => [mapId, index] as const),
);

export const createInitialChapterProgress = (): ChapterProgressState => ({ mapStars: {} });

export const normalizeChapterProgress = (
  progress: Partial<ChapterProgressState> | undefined,
): ChapterProgressState => {
  const storedStars = progress?.mapStars;

  if (!storedStars || typeof storedStars !== 'object' || Array.isArray(storedStars)) {
    return createInitialChapterProgress();
  }

  return {
    mapStars: Object.entries(storedStars).reduce<Record<string, number>>(
      (knownStars, [mapId, value]) => {
        if (
          !CHAPTER_MAP_ORDER.has(mapId) ||
          typeof value !== 'number' ||
          !Number.isFinite(value)
        ) {
          return knownStars;
        }

        knownStars[mapId] = Math.max(1, Math.min(3, Math.floor(value)));
        return knownStars;
      },
      {},
    ),
  };
};

export const getChapterMapStars = (progress: ChapterProgressState, mapId: string) =>
  progress.mapStars[mapId] ?? 0;

/**
 * Desbloqueio derivado, não persistido: o primeiro mapa está sempre aberto e
 * cada mapa abre quando o anterior é concluído, na ordem de `CHAPTER_LEVELS` —
 * que já é capítulo 1 mapa 1 … capítulo 10 mapa 100. Concluir o mapa 100 de um
 * capítulo abre o mapa 1 do seguinte, que é como o capítulo inteiro destrava.
 */
export const isChapterMapUnlocked = (mapId: string, progress: ChapterProgressState) => {
  const order = CHAPTER_MAP_ORDER.get(mapId);

  if (order === undefined) {
    return false;
  }

  return order === 0 || progress.mapStars[CHAPTER_MAP_IDS[order - 1]] !== undefined;
};

export const getNextChapterMapId = (mapId: string) => {
  const order = CHAPTER_MAP_ORDER.get(mapId);

  return order === undefined ? undefined : CHAPTER_MAP_IDS[order + 1];
};

export const getChapterProgressSummaries = (
  progress: ChapterProgressState,
): ChapterProgressSummary[] =>
  CHAPTERS.map((chapter) => ({
    chapterId: chapter.id,
    completedCount: chapter.levelIds.reduce(
      (count, mapId) => (progress.mapStars[mapId] === undefined ? count : count + 1),
      0,
    ),
    totalCount: chapter.levelIds.length,
    unlocked: isChapterMapUnlocked(chapter.levelIds[0], progress),
  }));

/**
 * Conclui um mapa. Guarda a melhor estrela, como a campanha, e devolve o que a
 * tela de resultado precisa. Um id fora dos capítulos é descartado pela
 * normalização da saída, então nada entra na chave por engano.
 */
export const applyChapterMapCompletion = (
  progress: ChapterProgressState,
  mapId: string,
  starsEarned: number,
): ChapterMapCompletionResult => {
  const currentProgress = normalizeChapterProgress(progress);
  const previousStars = currentProgress.mapStars[mapId] ?? 0;
  const normalizedStars = Math.max(1, Math.min(3, Math.floor(starsEarned)));
  const savedStars = Math.max(previousStars, normalizedStars);
  const nextMapId = getNextChapterMapId(mapId);

  return {
    previousStars,
    progress: normalizeChapterProgress({
      mapStars: { ...currentProgress.mapStars, [mapId]: savedStars },
    }),
    savedStars,
    starsEarned: normalizedStars,
    unlockedMapTitle:
      previousStars === 0 && nextMapId ? getChapterLevelSummary(nextMapId)?.title : undefined,
  };
};

export const loadChapterProgress = async (): Promise<ChapterProgressState> => {
  const rawProgress = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawProgress) {
    return createInitialChapterProgress();
  }

  try {
    return normalizeChapterProgress(JSON.parse(rawProgress) as Partial<ChapterProgressState>);
  } catch {
    return createInitialChapterProgress();
  }
};

export const saveChapterProgress = async (progress: ChapterProgressState) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeChapterProgress(progress)));
};
