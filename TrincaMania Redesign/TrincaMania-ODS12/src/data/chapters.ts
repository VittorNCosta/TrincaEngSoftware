/**
 * Capítulos: 10 x 100 mapas jogáveis, paralelos às 103 fases canônicas.
 *
 * ## Por que um registro paralelo
 *
 * `LEVELS` e `WORLDS` descrevem a campanha canônica e há teste travando as 103
 * fases. Os capítulos não entram lá: são um segundo registro, com ids próprios
 * (`chNN-NNN`) e mundos próprios (`ChapterWorldId`, faixa 101–110). O jogo
 * continua enxergando 103 fases canônicas; quem quiser capítulos importa daqui.
 *
 * ## Memória
 *
 * 1000 mapas x ~55 peças x ~144 bytes daria uns 8 MB se as peças fossem
 * materializadas no import — em celular de entrada isso é caro e é desperdício,
 * porque o jogador vê um tabuleiro por vez. Então o que fica eager é só o
 * metadado (`CHAPTER_LEVELS`, ~1000 objetos pequenos) e as peças nascem em
 * `buildChapterLevel`, no mesmo padrão de `generatePlayableLevel`.
 *
 * ## Curva de dificuldade (design)
 *
 * Cada capítulo é um arco completo, não 100 mapas iguais com nome diferente.
 * Dentro de um capítulo, do mapa 1 ao 100, sobem monotonicamente:
 *
 * - `tileCount` — da banda mínima à máxima do capítulo, sempre múltiplo de 3;
 * - `kindCount` — de 3 a 5 materiais (o catálogo tem 5), o que aperta a leitura
 *   de cor de lixeira;
 * - `mysteryTileCount` — de 0 até no máximo um sexto do tabuleiro;
 * - a pressão de tempo — os segundos por peça caem conforme o mapa avança.
 *
 * As bandas de cada capítulo também sobem entre capítulos, então o capítulo 10
 * abre mais pesado do que o capítulo 1 fecha.
 *
 * ## Ritmo (marcos)
 *
 * De 10 em 10 mapas há um marco: descanso (10, 30, 50, 70, 90) e loja (20, 40,
 * 60, 80). O mapa 100 é o guardião do capítulo. O marco **não** derruba a
 * dificuldade — isso quebraria a progressão e é a armadilha clássica de "fase
 * de alívio" que vira fase vazia. O alívio vem pelo orçamento de tempo: o
 * descanso dá 30% mais folga, a loja 20%, e o guardião tira 10%.
 */
import {
  Chapter,
  ChapterId,
  ChapterLevelSummary,
  ChapterMilestone,
  ChapterTheme,
  ChapterWorldId,
  GeneratedLevelOptions,
  Level,
  LevelDifficulty,
  LevelDifficultyProfile,
  PowerUpType,
  Tile,
} from '../types/game';
import { buildCardAssignment } from '../domain/recycling/services/LevelCompositionService';
import { TRIPLE_SIZE } from '../domain/recycling/value-objects/CardRole';
import {
  MATERIAL_TYPES,
  MaterialType,
} from '../domain/recycling/value-objects/MaterialType';
import {
  createSeededRandom,
  mixSeed,
  stableHash,
} from '../utils/deterministicRandom';
import {
  bandIndex,
  curveProgress,
  DifficultyCurve,
} from '../utils/difficultyCurve';
import { generatePlayableLevelFrom } from '../utils/levelGenerator';
import { MAX_TILE_POSITIONS, takeTilePositions } from './boardPositions';
import {
  CHAPTER_COUNT,
  CHAPTER_MAPS_PER_CHAPTER,
  buildChapterMapId,
  getChapterVisualIdentity,
  parseChapterMapId,
} from './chapterVisualIdentity';

export { CHAPTER_COUNT, CHAPTER_MAPS_PER_CHAPTER };

/** Ordem canônica de dificuldade. O índice é o que os testes comparam. */
export const CHAPTER_DIFFICULTY_ORDER: LevelDifficulty[] = [
  'easy',
  'normal',
  'hard',
  'expert',
  'master',
];

export const getChapterDifficultyRank = (difficulty: LevelDifficulty) => {
  const rank = CHAPTER_DIFFICULTY_ORDER.indexOf(difficulty);

  return rank === -1 ? CHAPTER_DIFFICULTY_ORDER.length : rank;
};

const MIN_KIND_COUNT = 3;
const MAX_KIND_COUNT = MATERIAL_TYPES.length;
/** Teto de mistério: mais de um sexto do tabuleiro vira adivinhação, não leitura. */
const MYSTERY_SHARE_DIVISOR = 6;

type ChapterBlueprint = {
  focusMaterial: MaterialType;
  id: ChapterId;
  /** Forma da rampa de dificuldade dentro do capítulo — ver `difficultyCurve.ts`. */
  difficultyCurve: DifficultyCurve;
  lockedText: string;
  /** Banda de peças [primeiro mapa, mapa 100]. Ambos múltiplos de 3. */
  maxTileCount: number;
  minTileCount: number;
  name: string;
  objectivePatterns: string[];
  /** 10 prefixos temáticos. Compostos com os 10 sufixos, dão 100 títulos. */
  titlePrefixes: string[];
  subtitle: string;
  theme: ChapterTheme;
};

/**
 * Cada bloco de 10 mapas (o mesmo tamanho do marco descanso/loja) pesa mais
 * que o anterior, e escala entre capítulos: o capítulo 10 já entra com uma
 * rampa mais agressiva do que o capítulo 1 usa do início ao fim dele. Os
 * valores de `difficultyCurve` em cada `CHAPTER_BLUEPRINTS` são escolhidos a
 * dedo, não derivados desta escala — é o ponto de a curva ser por capítulo:
 * dá pra retunar um capítulo sozinho sem recalcular os outros nove.
 */
const CHAPTER_DIFFICULTY_BLOCK_SIZE = 10;

/**
 * Sufixos compartilhados por todos os capítulos. 10 prefixos x 10 sufixos = 100
 * títulos distintos por capítulo, sem uma única string por mapa.
 */
const TITLE_SUFFIXES = [
  'da Coleta',
  'da Triagem',
  'do Descarte',
  'do Retorno',
  'da Esteira',
  'do Ciclo',
  'da Prensa',
  'do Reuso',
  'da Trinca',
  'do Fecho',
];

const MILESTONE_TITLE_PREFIX: Record<ChapterMilestone, string> = {
  guardian: 'Guardião',
  rest: 'Descanso',
  shop: 'Loja',
};

const CHAPTER_BLUEPRINTS: ChapterBlueprint[] = [
  {
    id: 1,
    difficultyCurve: { gamma: 1.2, blockGrowth: 1.1 },
    name: 'Aterro Adormecido',
    subtitle: 'Onde o descarte parou',
    theme: 'aterro',
    focusMaterial: 'plastico',
    minTileCount: 18,
    maxTileCount: 48,
    lockedText:
      'Conclua o Parque da Coleta Seletiva para abrir o Aterro Adormecido.',
    titlePrefixes: [
      'Vala',
      'Encosta',
      'Cratera',
      'Talude',
      'Cobertura',
      'Fenda',
      'Planalto',
      'Margem',
      'Trincheira',
      'Sopé',
    ],
    objectivePatterns: [
      'Abra a camada de cobertura antes de mexer no centro do tabuleiro.',
      'Feche as trincas de plástico e não deixe a bandeja acumular resíduo solto.',
      'Leia a cor da lixeira antes de recolher a peça — errar o material trava o ciclo.',
      'Libere as peças presas nas bordas para destravar o miolo do aterro.',
    ],
  },
  {
    id: 2,
    difficultyCurve: { gamma: 1.3, blockGrowth: 1.12 },
    name: 'Rio de Plástico',
    subtitle: 'A correnteza devolve tudo',
    theme: 'rio',
    focusMaterial: 'plastico',
    minTileCount: 24,
    maxTileCount: 54,
    lockedText: 'Conclua o Aterro Adormecido para abrir o Rio de Plástico.',
    titlePrefixes: [
      'Foz',
      'Corredeira',
      'Remanso',
      'Barragem',
      'Meandro',
      'Boia',
      'Bacia',
      'Vazante',
      'Cheia',
      'Nascente',
    ],
    objectivePatterns: [
      'Recolha o que a correnteza trouxe sem lotar a bandeja.',
      'Priorize as peças que destravam duas camadas de uma vez.',
      'Guarde espaço na bandeja para as trincas que só fecham no fim.',
      'Resolva as margens antes de encarar o leito do rio.',
    ],
  },
  {
    id: 3,
    difficultyCurve: { gamma: 1.4, blockGrowth: 1.14 },
    name: 'Feira do Reaproveitamento',
    subtitle: 'Nada aqui vira lixo',
    theme: 'feira',
    focusMaterial: 'organico',
    minTileCount: 30,
    maxTileCount: 60,
    lockedText:
      'Conclua o Rio de Plástico para abrir a Feira do Reaproveitamento.',
    titlePrefixes: [
      'Banca',
      'Caixote',
      'Balança',
      'Corredor',
      'Toldo',
      'Engradado',
      'Praça',
      'Carrinho',
      'Feirante',
      'Descarga',
    ],
    objectivePatterns: [
      'Separe o orgânico do resto antes que a bandeja encha.',
      'Feche o ciclo completo: resíduo, lixeira e símbolo do mesmo material.',
      'Abra caminho pelas laterais e deixe o centro para o final.',
      'Revele as peças mistério só quando houver bandeja para reagir.',
    ],
  },
  {
    id: 4,
    difficultyCurve: { gamma: 1.5, blockGrowth: 1.16 },
    name: 'Galpão da Triagem',
    subtitle: 'A esteira não para',
    theme: 'triagem',
    focusMaterial: 'papel',
    minTileCount: 36,
    maxTileCount: 66,
    lockedText:
      'Conclua a Feira do Reaproveitamento para abrir o Galpão da Triagem.',
    titlePrefixes: [
      'Esteira',
      'Baia',
      'Fardo',
      'Rampa',
      'Silo',
      'Bica',
      'Mesa',
      'Ponte',
      'Cabine',
      'Doca',
    ],
    objectivePatterns: [
      'Acompanhe o ritmo da esteira e não deixe resíduo parado na bandeja.',
      'Cada material tem sua baia: leia a cor antes de recolher.',
      'Remova o topo para liberar as peças presas embaixo.',
      'Planeje a ordem das camadas em vez de recolher a primeira peça livre.',
    ],
  },
  {
    id: 5,
    difficultyCurve: { gamma: 1.6, blockGrowth: 1.18 },
    name: 'Forno de Vidro',
    subtitle: 'Reciclável infinitas vezes',
    theme: 'vidro',
    focusMaterial: 'vidro',
    minTileCount: 42,
    maxTileCount: 72,
    lockedText: 'Conclua o Galpão da Triagem para abrir o Forno de Vidro.',
    titlePrefixes: [
      'Fornalha',
      'Caco',
      'Molde',
      'Sopro',
      'Recozimento',
      'Cadinho',
      'Bancada',
      'Chama',
      'Lingote',
      'Têmpera',
    ],
    objectivePatterns: [
      'O verde é do vidro: confirme a lixeira antes de fechar a trinca.',
      'Abra dois caminhos antes de gastar uma peça livre.',
      'Segure a bandeja limpa até revelar as peças mistério do centro.',
      'Resolva as pilhas altas primeiro — elas travam o resto do tabuleiro.',
    ],
  },
  {
    id: 6,
    difficultyCurve: { gamma: 1.7, blockGrowth: 1.2 },
    name: 'Pátio do Metal',
    subtitle: 'Energia que volta inteira',
    theme: 'metal',
    focusMaterial: 'metal',
    minTileCount: 48,
    maxTileCount: 78,
    lockedText: 'Conclua o Forno de Vidro para abrir o Pátio do Metal.',
    titlePrefixes: [
      'Prensa',
      'Sucata',
      'Ímã',
      'Guincho',
      'Bobina',
      'Chapa',
      'Solda',
      'Pátio',
      'Retalho',
      'Torno',
    ],
    objectivePatterns: [
      'O amarelo é do metal: cada lata tem um destino só.',
      'Não empilhe peças do mesmo papel na bandeja sem fechar o ciclo.',
      'Use o topo do tabuleiro para abrir espaço nas camadas presas.',
      'Deixe as peças mistério para quando a bandeja estiver folgada.',
    ],
  },
  {
    id: 7,
    difficultyCurve: { gamma: 1.8, blockGrowth: 1.22 },
    name: 'Horta de Compostagem',
    subtitle: 'Resto de comida vira adubo',
    theme: 'compostagem',
    focusMaterial: 'organico',
    minTileCount: 54,
    maxTileCount: 84,
    lockedText: 'Conclua o Pátio do Metal para abrir a Horta de Compostagem.',
    titlePrefixes: [
      'Leira',
      'Canteiro',
      'Húmus',
      'Composteira',
      'Peneira',
      'Minhocário',
      'Estufa',
      'Adubo',
      'Sementeira',
      'Viveiro',
    ],
    objectivePatterns: [
      'O marrom é do orgânico: ele não vai para a reciclagem, vai para a composteira.',
      'Mantenha a bandeja respirando enquanto as camadas ficam mais densas.',
      'Escolha a peça que abre mais caminho, não a mais fácil.',
      'Planeje as últimas trincas antes de encostar no centro.',
    ],
  },
  {
    id: 8,
    difficultyCurve: { gamma: 1.9, blockGrowth: 1.24 },
    name: 'Biblioteca de Papel',
    subtitle: 'Uma tonelada, vinte árvores',
    theme: 'papel',
    focusMaterial: 'papel',
    minTileCount: 60,
    maxTileCount: 90,
    lockedText:
      'Conclua a Horta de Compostagem para abrir a Biblioteca de Papel.',
    titlePrefixes: [
      'Estante',
      'Resma',
      'Cadernos',
      'Arquivo',
      'Fibra',
      'Polpa',
      'Encadernação',
      'Acervo',
      'Rascunho',
      'Aparas',
    ],
    objectivePatterns: [
      'O azul é do papel: papelão, jornal e folha vão todos para a mesma lixeira.',
      'Descubra a ordem das camadas antes de comprometer a bandeja.',
      'Feche as trincas altas primeiro e deixe a base para o final.',
      'Revele o mistério com bandeja livre — sem espaço, revelar é derrota.',
    ],
  },
  {
    id: 9,
    difficultyCurve: { gamma: 2.0, blockGrowth: 1.26 },
    name: 'Ferro-Velho Renascido',
    subtitle: 'Sucata que volta a ser matéria-prima',
    theme: 'sucata',
    focusMaterial: 'metal',
    minTileCount: 66,
    maxTileCount: 96,
    lockedText:
      'Conclua a Biblioteca de Papel para abrir o Ferro-Velho Renascido.',
    titlePrefixes: [
      // "Peça" fica de fora de propósito: no vocabulário do domínio peça é uma
      // carta posicionada, e usar a palavra como topônimo confundiria a leitura.
      // "Oficina" e "Reparo" também ficam de fora, hoje por inércia: eram o
      // nome reservado ao Mundo 9 da campanha, que acabou ficando com
      // "Distrito da Reindustrialização" (C-01a). As palavras estão livres de
      // novo, mas o conjunto de prefixos é determinístico por id — mexer nele
      // renomearia mapa que jogador já viu, e não vale o troco.
      'Carcaça',
      'Ferramenta',
      'Chassi',
      'Fiação',
      'Engrenagem',
      'Manual',
      'Garantia',
      'Desmonte',
      'Ajuste',
      'Remendo',
    ],
    objectivePatterns: [
      'Cinco materiais em jogo: leia o resíduo antes de escolher a lixeira.',
      'Não abra o centro sem ter saída pelas laterais.',
      'Cada movimento precisa preparar a próxima trinca.',
      'A bandeja é o recurso escasso — gaste com intenção.',
    ],
  },
  {
    id: 10,
    difficultyCurve: { gamma: 2.2, blockGrowth: 1.3 },
    name: 'Metrópole do Ciclo Fechado',
    subtitle: 'Cem bairros, um ciclo só',
    theme: 'circular',
    focusMaterial: 'vidro',
    minTileCount: 72,
    maxTileCount: 102,
    lockedText:
      'Conclua o Ferro-Velho Renascido para abrir a Metrópole do Ciclo Fechado.',
    titlePrefixes: [
      'Avenida',
      'Ecoponto',
      'Cooperativa',
      'Distrito',
      'Central',
      'Terminal',
      'Bairro',
      'Anel',
      'Calçadão',
      'Portal',
    ],
    objectivePatterns: [
      'O ciclo completo, sem folga: resíduo, lixeira e símbolo em sequência.',
      'Aqui não existe movimento neutro — cada peça livre tem que valer.',
      'Guarde os poderes para o bloqueio real, não para o primeiro susto.',
      'Feche a cidade limpando as camadas na ordem que você planejou.',
    ],
  },
];

const POWER_ROTATION: PowerUpType[] = [
  'hint',
  'shuffle',
  'undo',
  'shuffle',
  'hint',
  'undo',
];

const toMultipleOfThree = (value: number) =>
  Math.max(TRIPLE_SIZE, Math.floor(value / 3) * 3);

const getMilestone = (mapNumber: number): ChapterMilestone | undefined => {
  if (mapNumber === CHAPTER_MAPS_PER_CHAPTER) {
    return 'guardian';
  }

  if (mapNumber % 20 === 0) {
    return 'shop';
  }

  return mapNumber % 10 === 0 ? 'rest' : undefined;
};

const MILESTONE_TIME_FACTOR: Record<ChapterMilestone, number> = {
  guardian: 0.9,
  rest: 1.3,
  shop: 1.2,
};

/**
 * Carga do mapa em [0, 1]. 60% vem do capítulo (sempre linear: cada capítulo é
 * uma unidade de conteúdo já nomeada e balanceada à parte) e 40% da posição
 * dentro dele — essa parte já entra curvada (`curvedMapProgress`), então todo
 * capítulo tem uma rampa interna que acelera perto do fim de cada bloco de 10
 * mapas, e ainda assim o capítulo 10 inteiro pesa mais que o capítulo 1
 * inteiro.
 */
const getDifficultyScore = (
  chapterId: ChapterId,
  curvedMapProgress: number,
) => {
  const chapterProgress = (chapterId - 1) / (CHAPTER_COUNT - 1);

  return chapterProgress * 0.6 + curvedMapProgress * 0.4;
};

const buildTitle = (
  blueprint: ChapterBlueprint,
  mapNumber: number,
  milestone: ChapterMilestone | undefined,
) => {
  const slot = mapNumber - 1;
  const composed = `${blueprint.titlePrefixes[slot % blueprint.titlePrefixes.length]} ${
    TITLE_SUFFIXES[
      Math.floor(slot / blueprint.titlePrefixes.length) % TITLE_SUFFIXES.length
    ]
  }`;

  return milestone
    ? `${MILESTONE_TITLE_PREFIX[milestone]}: ${composed}`
    : composed;
};

const createChapterLevelSummary = (
  blueprint: ChapterBlueprint,
  mapNumber: number,
): ChapterLevelSummary => {
  const curvedMapProgress = curveProgress(
    mapNumber,
    CHAPTER_MAPS_PER_CHAPTER,
    CHAPTER_DIFFICULTY_BLOCK_SIZE,
    blueprint.difficultyCurve,
  );
  const score = getDifficultyScore(blueprint.id, curvedMapProgress);
  const milestone = getMilestone(mapNumber);

  const tileCount = toMultipleOfThree(
    Math.min(
      blueprint.maxTileCount,
      blueprint.minTileCount +
        (blueprint.maxTileCount - blueprint.minTileCount) * curvedMapProgress,
    ),
  );
  const kindCount = Math.min(
    MAX_KIND_COUNT,
    MIN_KIND_COUNT +
      Math.floor(curvedMapProgress * 2) +
      (blueprint.id >= 6 ? 1 : 0),
  );
  const mysteryTileCount = Math.min(
    Math.floor(tileCount / MYSTERY_SHARE_DIVISOR),
    Math.floor((blueprint.id - 1) / 2) +
      Math.floor(curvedMapProgress * (3 + blueprint.id)),
  );

  // Segundos por peça caem de 7.2 a 4.2 conforme a carga sobe: é assim que o
  // limite de três estrelas aperta sem depender de número mágico por mapa.
  const secondsPerTile = 7.2 - score * 3;
  const timeFactor = milestone ? MILESTONE_TIME_FACTOR[milestone] : 1;
  const threeStars = Math.max(
    30,
    Math.round(tileCount * secondsPerTile * timeFactor),
  );
  // twoStars nasce de threeStars mais uma folga estritamente positiva, então
  // `threeStars < twoStars` é verdade por construção, não por revisão.
  const twoStars = threeStars + Math.max(25, Math.round(threeStars * 0.45));

  return {
    campaignPosition: (blueprint.id - 1) * CHAPTER_MAPS_PER_CHAPTER + mapNumber,
    chapterId: blueprint.id,
    chapterMapNumber: mapNumber,
    difficulty:
      CHAPTER_DIFFICULTY_ORDER[
        bandIndex(score, CHAPTER_DIFFICULTY_ORDER.length)
      ],
    displayLabel: String(mapNumber),
    id: buildChapterMapId(blueprint.id, mapNumber),
    kindCount,
    ...(milestone ? { milestone } : {}),
    mysteryTileCount,
    number: mapNumber,
    objectiveText: `Objetivo: ${
      blueprint.objectivePatterns[
        (mapNumber - 1) % blueprint.objectivePatterns.length
      ]
    }`,
    recommendedPower: POWER_ROTATION[(mapNumber - 1) % POWER_ROTATION.length],
    starTimeLimits: { threeStars, twoStars },
    tileCount,
    title: buildTitle(blueprint, mapNumber, milestone),
    worldId: (100 + blueprint.id) as ChapterWorldId,
  };
};

export const CHAPTER_LEVELS: ChapterLevelSummary[] = CHAPTER_BLUEPRINTS.flatMap(
  (blueprint) =>
    Array.from({ length: CHAPTER_MAPS_PER_CHAPTER }, (_, index) =>
      createChapterLevelSummary(blueprint, index + 1),
    ),
);

export const CHAPTERS: Chapter[] = CHAPTER_BLUEPRINTS.map((blueprint) => ({
  focusMaterial: blueprint.focusMaterial,
  id: blueprint.id,
  levelIds: Array.from({ length: CHAPTER_MAPS_PER_CHAPTER }, (_, index) =>
    buildChapterMapId(blueprint.id, index + 1),
  ),
  lockedText: blueprint.lockedText,
  name: blueprint.name,
  subtitle: blueprint.subtitle,
  theme: blueprint.theme,
  worldId: (100 + blueprint.id) as ChapterWorldId,
}));

const SUMMARY_BY_ID = new Map(
  CHAPTER_LEVELS.map((summary) => [summary.id, summary]),
);
const CHAPTER_BY_ID = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter]));
const SUMMARIES_BY_CHAPTER = CHAPTER_LEVELS.reduce<
  Map<ChapterId, ChapterLevelSummary[]>
>((index, summary) => {
  const bucket = index.get(summary.chapterId);

  if (bucket) {
    bucket.push(summary);
  } else {
    index.set(summary.chapterId, [summary]);
  }

  return index;
}, new Map<ChapterId, ChapterLevelSummary[]>());

export const getChapter = (chapterId: ChapterId) =>
  CHAPTER_BY_ID.get(chapterId);

export const getChapterLevelSummary = (mapId: string) =>
  SUMMARY_BY_ID.get(mapId);

export const getChapterLevelSummaries = (
  chapterId: ChapterId,
): ChapterLevelSummary[] => SUMMARIES_BY_CHAPTER.get(chapterId) ?? [];

export const isChapterMapId = (mapId: string) => SUMMARY_BY_ID.has(mapId);

/**
 * Perfil de geração do mapa. Derivado do metadado — nenhuma peça é tocada aqui,
 * então chamar isso para os 1000 mapas continua barato.
 */
export const getChapterLevelProfile = (
  summary: ChapterLevelSummary,
): LevelDifficultyProfile => {
  const positions = takeTilePositions(summary.tileCount);

  return {
    difficulty: summary.difficulty,
    kindCount: summary.kindCount,
    maxZ: positions.reduce((highest, [, , z]) => Math.max(highest, z), 0),
    mysteryTileCount: summary.mysteryTileCount,
    // Os capítulos não têm tutorial de trinca de abertura — isso é do Parque.
    openingTriple: false,
    tileCount: summary.tileCount,
  };
};

/**
 * Layout cru do mapa: posições reais com cartas de rascunho.
 *
 * As cartas colocadas aqui são descartadas — `assignCardsToRemovalOrder` as
 * reescreve a partir da ordem de remoção jogável. O que importa neste passo é
 * só a geometria (x, y, z) e a identidade estável de cada peça.
 */
const buildChapterLayout = (summary: ChapterLevelSummary): Tile[] =>
  takeTilePositions(summary.tileCount).map(([x, y, z], index) => ({
    ...buildCardAssignment(
      MATERIAL_TYPES[index % MATERIAL_TYPES.length],
      index % TRIPLE_SIZE,
      0,
    ),
    id: `${summary.id}-${index + 1}`,
    x,
    y,
    z,
  }));

/**
 * Monta o mapa jogável sob demanda.
 *
 * Por padrão o gerador é semeado pelo hash do id, então o mesmo mapa devolve
 * sempre o mesmo tabuleiro — o jogador reencontra a fase que deixou pela
 * metade. Passar `options.random` (um embaralhar, um teste) troca a semente de
 * propósito.
 */
export const buildChapterLevel = (
  mapId: string,
  options: GeneratedLevelOptions = {},
): Level | undefined => {
  const summary = getChapterLevelSummary(mapId);

  if (!summary) {
    return undefined;
  }

  const identity = getChapterVisualIdentity(summary.id);
  const profile = getChapterLevelProfile(summary);
  const baseLevel: Level = {
    difficulty: summary.difficulty,
    displayLabel: summary.displayLabel,
    id: summary.id,
    ...(summary.mysteryTileCount
      ? { mysteryTileCount: summary.mysteryTileCount }
      : {}),
    number: summary.number,
    objectiveText: summary.objectiveText,
    recommendedPower: summary.recommendedPower,
    starTimeLimits: summary.starTimeLimits,
    tiles: buildChapterLayout(summary),
    title: summary.title,
    worldId: summary.worldId,
    worldLevelNumber: summary.chapterMapNumber,
  };

  return generatePlayableLevelFrom(baseLevel, profile, {
    preserveOpeningTriple: false,
    random:
      options.random ??
      createSeededRandom(
        mixSeed(stableHash(summary.id), identity.cardVariantSeed),
      ),
  });
};

/** Teto de peças que o tabuleiro comporta. Usado pelas validações. */
export const CHAPTER_MAX_SUPPORTED_TILE_COUNT = MAX_TILE_POSITIONS;

export type ChapterValidationIssue = string;

/**
 * Validação automática da saída procedural.
 *
 * A persona de level design procedural pede métricas automáticas em vez de
 * inspeção manual: `tileCount` múltiplo de 3 (senão sobra um ciclo pela metade
 * e a fase fica invencível), limites de estrela coerentes, curva monotônica e
 * ids sem lacuna. Isto roda em teste, mas fica exportado para poder rodar em
 * qualquer pipeline.
 */
export const validateChapters = (): ChapterValidationIssue[] => {
  const issues: ChapterValidationIssue[] = [];
  const seenIds = new Set<string>();

  if (CHAPTERS.length !== CHAPTER_COUNT) {
    issues.push(`chapters:expected-${CHAPTER_COUNT}-got-${CHAPTERS.length}`);
  }

  CHAPTERS.forEach((chapter) => {
    const summaries = getChapterLevelSummaries(chapter.id);

    if (summaries.length !== CHAPTER_MAPS_PER_CHAPTER) {
      issues.push(
        `chapter-${chapter.id}:expected-${CHAPTER_MAPS_PER_CHAPTER}-maps`,
      );
    }

    let previousTileCount = 0;
    let previousRank = -1;
    let previousMystery = 0;
    let previousKindCount = 0;

    summaries.forEach((summary, index) => {
      const position = `${summary.id}`;

      if (seenIds.has(summary.id)) {
        issues.push(`${position}:duplicate-id`);
      }
      seenIds.add(summary.id);

      if (summary.chapterMapNumber !== index + 1) {
        issues.push(`${position}:map-number-gap`);
      }

      if (parseChapterMapId(summary.id) === undefined) {
        issues.push(`${position}:unparseable-id`);
      }

      if (summary.tileCount % TRIPLE_SIZE !== 0) {
        issues.push(`${position}:tileCount-not-multiple-of-3`);
      }

      if (summary.tileCount > MAX_TILE_POSITIONS) {
        issues.push(`${position}:tileCount-exceeds-board-positions`);
      }

      if (
        summary.starTimeLimits.threeStars >= summary.starTimeLimits.twoStars
      ) {
        issues.push(`${position}:threeStars-must-be-below-twoStars`);
      }

      if (
        summary.kindCount < MIN_KIND_COUNT ||
        summary.kindCount > MAX_KIND_COUNT
      ) {
        issues.push(`${position}:kindCount-out-of-range`);
      }

      if (summary.tileCount < previousTileCount) {
        issues.push(`${position}:tileCount-regression`);
      }

      if (summary.kindCount < previousKindCount) {
        issues.push(`${position}:kindCount-regression`);
      }

      if (summary.mysteryTileCount < previousMystery) {
        issues.push(`${position}:mystery-regression`);
      }

      if (getChapterDifficultyRank(summary.difficulty) < previousRank) {
        issues.push(`${position}:difficulty-regression`);
      }

      previousTileCount = summary.tileCount;
      previousKindCount = summary.kindCount;
      previousMystery = summary.mysteryTileCount;
      previousRank = getChapterDifficultyRank(summary.difficulty);
    });

    if (summaries[summaries.length - 1]?.milestone !== 'guardian') {
      issues.push(`chapter-${chapter.id}:missing-guardian`);
    }
  });

  return issues;
};
