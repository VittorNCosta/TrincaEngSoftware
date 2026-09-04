import {
  CampaignWorldId,
  Level,
  LevelDifficulty,
  PowerUpType,
  Tile,
} from '../types/game';
import { buildCardAssignment } from '../domain/recycling/services/LevelCompositionService';
import { TRIPLE_SIZE } from '../domain/recycling/value-objects/CardRole';
import {
  MATERIAL_TYPES,
  MaterialType,
} from '../domain/recycling/value-objects/MaterialType';
import { curveProgress, DifficultyCurve } from '../utils/difficultyCurve';
import { getTilePosition } from './boardPositions';

/**
 * Grupo de peças de um material. A contagem é sempre múltipla de 3: cada bloco
 * de três peças é um ciclo completo (resíduo → lixeira → reciclagem).
 */
type MaterialGroup = [MaterialType, number];

type LevelSeed = Omit<Level, 'tiles'> & {
  /** Quantos materiais diferentes entram na fase. Limitado por `MATERIAL_TYPES`. */
  kindCount: number;
  tileCount: number;
};
type MainWorldId = Exclude<CampaignWorldId, 21>;

/**
 * Intercala os materiais em rodízio para que peças do mesmo ciclo não fiquem
 * empilhadas em sequência no tabuleiro.
 */
const distributeMaterials = (groups: MaterialGroup[]) => {
  const remainingGroups = groups.map(([material, count]) => ({
    count,
    material,
  }));
  const materials: MaterialType[] = [];

  while (remainingGroups.some((group) => group.count > 0)) {
    remainingGroups.forEach((group) => {
      if (group.count > 0) {
        materials.push(group.material);
        group.count -= 1;
      }
    });
  }

  return materials;
};

export const createTileGroups = (
  tileCount: number,
  kindCount: number,
): MaterialGroup[] => {
  const tripleCount = tileCount / TRIPLE_SIZE;
  const selectedMaterials = MATERIAL_TYPES.slice(
    0,
    Math.max(1, Math.min(kindCount, MATERIAL_TYPES.length)),
  );
  const groups = selectedMaterials.map((material) => ({ count: 0, material }));

  for (let index = 0; index < tripleCount; index += 1) {
    groups[index % groups.length].count += TRIPLE_SIZE;
  }

  return groups
    .filter((group) => group.count > 0)
    .map((group): MaterialGroup => [group.material, group.count]);
};

/**
 * Semeia as peças da fase.
 *
 * A n-ésima peça de um material recebe o papel `n % 3` do ciclo, então cada
 * bloco de três peças daquele material forma exatamente um ciclo fechável.
 * Como a contagem por grupo é sempre múltipla de 3, nenhum ciclo fica pela
 * metade — a fase continua vencível por construção.
 */
const makeTiles = (levelId: string, groups: MaterialGroup[]): Tile[] => {
  const emittedByMaterial = new Map<MaterialType, number>();

  return distributeMaterials(groups).map((material, index) => {
    const [x, y, z] = getTilePosition(index);
    const emitted = emittedByMaterial.get(material) ?? 0;
    emittedByMaterial.set(material, emitted + 1);

    return {
      ...buildCardAssignment(
        material,
        emitted % TRIPLE_SIZE,
        Math.floor(emitted / TRIPLE_SIZE),
      ),
      id: `${levelId}-${index + 1}`,
      x,
      y,
      z,
    };
  });
};

const createLevel = ({ kindCount, tileCount, ...level }: LevelSeed): Level => ({
  ...level,
  tiles: makeTiles(level.id, createTileGroups(tileCount, kindCount)),
});

const createMainLevel = (
  worldId: MainWorldId,
  worldLevelNumber: number,
  displayNumber: number,
  title: string,
  difficulty: LevelDifficulty,
  objectiveText: string,
  tileCount: number,
  kindCount: number,
  threeStars: number,
  twoStars: number,
  recommendedPower?: PowerUpType,
  mysteryTileCount?: number,
): LevelSeed => {
  const worldPrefix = `w${worldId}`;

  return {
    difficulty,
    displayLabel: String(displayNumber),
    id: `${worldPrefix}-${String(worldLevelNumber).padStart(3, '0')}`,
    kindCount,
    ...(mysteryTileCount ? { mysteryTileCount } : {}),
    number: displayNumber,
    objectiveText,
    recommendedPower,
    starTimeLimits: {
      threeStars,
      twoStars,
    },
    tileCount,
    title,
    worldId,
    worldLevelNumber,
  };
};

const createBonusLevel = (
  worldLevelNumber: number,
  displayLabel: string,
  title: string,
  objectiveText: string,
  tileCount: number,
  kindCount: number,
  threeStars: number,
  twoStars: number,
  recommendedPower?: PowerUpType,
  mysteryTileCount?: number,
): LevelSeed => ({
  difficulty: 'bonus',
  displayLabel,
  id: `bonus-w1-${String(worldLevelNumber).padStart(3, '0')}`,
  kindCount,
  ...(mysteryTileCount ? { mysteryTileCount } : {}),
  number: Number(displayLabel),
  objectiveText,
  recommendedPower,
  starTimeLimits: {
    threeStars,
    twoStars,
  },
  tileCount,
  title,
  worldId: 21,
  worldLevelNumber,
});

/**
 * Configuração de geração de um dos 10 mundos da campanha.
 *
 * Desde a redução de 203 para 100 fases (8 mundos × 25 → 10 mundos × 10), os
 * 10 mundos são gerados pelo mesmo mecanismo — antes só os mundos 4–8 eram
 * assim; manter 3 mundos autorais à mão para 10 fases cada não compensava o
 * custo de manutenção (é o "mais sustentável" citado no roadmap). Cada mundo
 * ainda tem sua própria curva de dificuldade, faixa de peças e banda de
 * dificuldade, então continuam soando diferentes um do outro.
 */
type GeneratedWorldConfig = {
  worldId: MainWorldId;
  /** Forma da rampa de dificuldade dentro do mundo — ver `difficultyCurve.ts`. */
  difficultyCurve: DifficultyCurve;
  /** Rótulo de dificuldade de cada uma das 10 fases do mundo, em ordem. */
  difficultyBand: LevelDifficulty[];
  /** Banda [primeira fase, última fase] de peças-mistério, a dedo por mundo. */
  mysteryRange: { max: number; min: number };
  /** Banda [primeira fase, última fase] de peças no tabuleiro, a dedo por mundo. */
  tileRange: { max: number; min: number };
  objectivePatterns: string[];
  timeBase: {
    threeStars: number;
    twoStars: number;
  };
  titles: string[];
};

/** Fases por mundo e tamanho do bloco da curva de dificuldade (o mesmo dos marcos de descanso/loja). */
const WORLD_LEVELS_PER_MAP = 10;
const WORLD_DIFFICULTY_BLOCK_SIZE = 2;

const GENERATED_WORLD_CONFIGS: GeneratedWorldConfig[] = [
  {
    worldId: 1,
    difficultyCurve: { gamma: 1.1, blockGrowth: 1.05 },
    difficultyBand: [
      'easy', 'easy', 'easy', 'normal', 'normal', 'normal', 'hard', 'hard', 'hard', 'expert',
    ],
    mysteryRange: { min: 2, max: 4 },
    tileRange: { min: 9, max: 30 },
    timeBase: { threeStars: 40, twoStars: 70 },
    titles: [
      'Entrada do Parque',
      'Trilha dos Recicláveis',
      'Primeiro Ecoponto',
      'Banco das Latas',
      'Descanso do Parque',
      'Gramado das Trincas',
      'Quiosque Verde',
      'Colina das Lixeiras',
      'Playground Sustentável',
      'Guardião do Parque',
    ],
    objectivePatterns: [
      'Forme trincas com calma e aprenda o ciclo do material.',
      'Libere as peças de cima antes de mexer nas de baixo.',
      'Observe o tabuleiro antes de encher a bandeja.',
      'Combine resíduo, lixeira e símbolo para fechar o ciclo.',
    ],
  },
  {
    worldId: 2,
    difficultyCurve: { gamma: 1.2, blockGrowth: 1.1 },
    difficultyBand: [
      'normal', 'normal', 'hard', 'hard', 'hard', 'hard', 'hard', 'expert', 'expert', 'expert',
    ],
    mysteryRange: { min: 3, max: 5 },
    tileRange: { min: 27, max: 39 },
    timeBase: { threeStars: 100, twoStars: 170 },
    titles: [
      'Portão do Vale',
      'Estrada de Terra',
      'Ponte da Carga',
      'Caverna de Apoio',
      'Descanso na Estrada',
      'Posto de Troca',
      'Ponte de Ferro',
      'Vale Extenso',
      'Estrada Congelada',
      'Guardião do Trajeto',
    ],
    objectivePatterns: [
      'Abra caminho entre as pedras antes de formar trincas arriscadas.',
      'Planeje a rota e mantenha espaço na bandeja.',
      'Libere as peças presas para seguir viagem.',
      'Controle a bandeja nas subidas mais difíceis do vale.',
    ],
  },
  {
    worldId: 3,
    difficultyCurve: { gamma: 1.3, blockGrowth: 1.12 },
    difficultyBand: [
      'hard', 'hard', 'hard', 'expert', 'expert', 'expert', 'expert', 'expert', 'master', 'master',
    ],
    mysteryRange: { min: 3, max: 5 },
    tileRange: { min: 33, max: 45 },
    timeBase: { threeStars: 160, twoStars: 260 },
    titles: [
      'Entrada da Central',
      'Pátio de Materiais',
      'Colunas de Aço',
      'Escadaria Operária',
      'Loja de Suprimentos',
      'Salão de Triagem',
      'Câmara das Prensas',
      'Torre de Contêineres',
      'Núcleo Operacional',
      'Guardião da Central',
    ],
    objectivePatterns: [
      'Leia as camadas da central antes de mexer no centro.',
      'Priorize peças que abrem vários caminhos ao mesmo tempo.',
      'Evite encher a bandeja enquanto libera os fardos.',
      'Revele os materiais certos para avançar pela central.',
    ],
  },
  {
    worldId: 4,
    difficultyCurve: { gamma: 1.4, blockGrowth: 1.15 },
    difficultyBand: [
      'expert', 'expert', 'expert', 'expert', 'expert', 'expert', 'master', 'master', 'master', 'master',
    ],
    mysteryRange: { min: 4, max: 6 },
    tileRange: { min: 39, max: 48 },
    timeBase: { threeStars: 220, twoStars: 350 },
    titles: [
      'Entrada do Viveiro',
      'Canteiro Novo',
      'Trilha das Mudas',
      'Cerca Viva',
      'Descanso do Jardineiro',
      'Estufa Dourada',
      'Mercado da Horta',
      'Colmeia Ativa',
      'Portão do Viveiro',
      'Guardião do Viveiro',
    ],
    objectivePatterns: [
      'Limpe as camadas do viveiro sem encher a bandeja.',
      'Revele as mudas na ordem certa e mantenha espaço para trincas.',
      'Use as peças livres para abrir as laterais antes do centro.',
      'Planeje a sequência das camadas e segure poderes para emergências.',
    ],
  },
  {
    worldId: 5,
    difficultyCurve: { gamma: 1.5, blockGrowth: 1.18 },
    difficultyBand: [
      'expert', 'expert', 'expert', 'master', 'master', 'master', 'master', 'master', 'master', 'master',
    ],
    mysteryRange: { min: 4, max: 7 },
    tileRange: { min: 42, max: 51 },
    timeBase: { threeStars: 260, twoStars: 410 },
    titles: [
      'Entrada da Usina',
      'Composteira Nova',
      'Trilha do Vapor',
      'Leira Quente',
      'Descanso do Biodigestor',
      'Camadas Mornas',
      'Mercado do Adubo',
      'Câmara de Fermentação',
      'Chaves do Vapor',
      'Guardião da Usina',
    ],
    objectivePatterns: [
      'Abra espaço nas camadas quentes antes de revelar mistérios.',
      'Escolha peças que destravam vários caminhos de uma vez.',
      'Evite acumular pares soltos enquanto o tabuleiro fica mais denso.',
      'Controle a bandeja e resolva os bloqueios com calma.',
    ],
  },
  {
    worldId: 6,
    difficultyCurve: { gamma: 1.6, blockGrowth: 1.2 },
    difficultyBand: [
      'expert', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master',
    ],
    mysteryRange: { min: 5, max: 7 },
    tileRange: { min: 45, max: 54 },
    timeBase: { threeStars: 300, twoStars: 470 },
    titles: [
      'Entrada da Cooperativa',
      'Praça dos Catadores',
      'Carrinho de Coleta',
      'Rua da Reciclagem',
      'Descanso do Galpão',
      'Balança Comunitária',
      'Mercado dos Catadores',
      'Telhados da Vila',
      'Prensa Comunitária',
      'Guardião dos Catadores',
    ],
    objectivePatterns: [
      'Leia o tabuleiro por setores e libere as rotas principais.',
      'Monte trincas sem bloquear as peças que abrem novas camadas.',
      'Use as laterais para ganhar espaço antes das decisões finais.',
      'Revele mistérios quando houver bandeja suficiente para reagir.',
    ],
  },
  {
    worldId: 7,
    difficultyCurve: { gamma: 1.7, blockGrowth: 1.25 },
    difficultyBand: [
      'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master',
    ],
    mysteryRange: { min: 5, max: 8 },
    tileRange: { min: 48, max: 57 },
    timeBase: { threeStars: 340, twoStars: 530 },
    titles: [
      'Entrada da Rota',
      'Pontos Cruzados',
      'Rota de Volta',
      'Ponte da Devolução',
      'Descanso do Motorista',
      'Mercado de Trocas',
      'Depósito Compartilhado',
      'Loja do Distribuidor',
      'Escada da Fábrica',
      'Guardião da Rota',
    ],
    objectivePatterns: [
      'Priorize peças que liberam camadas altas e reduzem o risco da bandeja.',
      'Segure espaço para trincas tardias quando os mistérios aparecerem.',
      'Resolva as bordas antes de tocar nas peças mais presas.',
      'Planeje movimentos curtos para evitar travar o fim da fase.',
    ],
  },
  {
    worldId: 8,
    difficultyCurve: { gamma: 1.8, blockGrowth: 1.3 },
    difficultyBand: [
      'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master',
    ],
    mysteryRange: { min: 6, max: 8 },
    tileRange: { min: 51, max: 60 },
    timeBase: { threeStars: 380, twoStars: 590 },
    titles: [
      'Portão do Fórum',
      'Praça Central',
      'Distrito das Ideias',
      'Caminho Iluminado',
      'Descanso dos Delegados',
      'Ponte da Assembleia',
      'Mercado Circular',
      'Painel Final',
      'Torre da Inovação',
      'Guardião do Fórum',
    ],
    objectivePatterns: [
      'Resolva as camadas finais com planejamento e poucos movimentos vazios.',
      'Mantenha a bandeja limpa para atravessar os mistérios finais.',
      'Abra caminhos duplos antes de formar trincas muito cedo.',
      'Use cada peça livre para preparar o próximo grupo de trincas.',
    ],
  },
  {
    worldId: 9,
    difficultyCurve: { gamma: 1.9, blockGrowth: 1.35 },
    difficultyBand: [
      'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master',
    ],
    mysteryRange: { min: 6, max: 9 },
    tileRange: { min: 54, max: 60 },
    timeBase: { threeStars: 420, twoStars: 650 },
    titles: [
      'Portão do Distrito',
      'Linha de Recepção',
      'Pátio das Prensas',
      'Galpão dos Fardos',
      'Descanso da Linha',
      'Forno de Refundição',
      'Mercado dos Insumos',
      'Torre de Extrusão',
      'Corredor da Fábrica',
      'Guardião do Distrito',
    ],
    objectivePatterns: [
      'Organize os fardos por material antes de abrir a linha.',
      'Libere as prensas sem deixar a bandeja travar.',
      'Priorize peças que destravam vários lotes de uma vez.',
      'Controle o ritmo da linha até o último fardo.',
    ],
  },
  {
    worldId: 10,
    difficultyCurve: { gamma: 2, blockGrowth: 1.4 },
    difficultyBand: [
      'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master', 'master',
    ],
    mysteryRange: { min: 7, max: 10 },
    tileRange: { min: 57, max: 60 },
    timeBase: { threeStars: 460, twoStars: 710 },
    titles: [
      'Portão da Cúpula',
      'Saguão dos Delegados',
      'Sala de Metas',
      'Corredor dos Dados',
      'Descanso da Cúpula',
      'Mercado das Nações',
      'Painel do Clima',
      'Galeria das Conquistas',
      'Última Assembleia',
      'Guardião da Cúpula',
    ],
    objectivePatterns: [
      'Mantenha a calma diante da cúpula mais exigente do jogo.',
      'Priorize peças que abrem várias frentes ao mesmo tempo.',
      'Segure espaço na bandeja até o painel final.',
      'Feche cada trinca com precisão para vencer a cúpula.',
    ],
  },
];

const getGeneratedDifficulty = (
  config: GeneratedWorldConfig,
  worldLevelNumber: number,
): LevelDifficulty => config.difficultyBand[worldLevelNumber - 1];

const getGeneratedTileCount = (config: GeneratedWorldConfig, curved: number) => {
  const { min, max } = config.tileRange;
  const raw = min + (max - min) * curved;

  return Math.round(raw / TRIPLE_SIZE) * TRIPLE_SIZE;
};

/** Fases que revelam peça-mistério dentro do mundo: o marco de descanso (5) e a reta final (8–10). */
const MYSTERY_LEVEL_NUMBERS = new Set([5, 8, 9, 10]);
/** Peça-mistério nunca passa de 1/6 do tabuleiro da fase — trava de design do C-07. */
const MYSTERY_BOARD_FRACTION_CAP = 1 / 6;

const getGeneratedMysteryCount = (
  config: GeneratedWorldConfig,
  worldLevelNumber: number,
  curved: number,
  tileCount: number,
) => {
  if (!MYSTERY_LEVEL_NUMBERS.has(worldLevelNumber)) {
    return undefined;
  }

  const { min, max } = config.mysteryRange;
  const raw = Math.round(min + (max - min) * curved);
  const cap = Math.floor(tileCount * MYSTERY_BOARD_FRACTION_CAP);

  return Math.min(raw, cap);
};

const getGeneratedKindCount = (worldId: MainWorldId, worldLevelNumber: number) => {
  // O mundo 1 introduz os materiais aos poucos (3 → 5); os demais já abrem com todos.
  if (worldId === 1) {
    return Math.min(2 + worldLevelNumber, MATERIAL_TYPES.length);
  }

  return MATERIAL_TYPES.length;
};

const getGeneratedRecommendedPower = (
  worldId: MainWorldId,
  worldLevelNumber: number,
): PowerUpType => {
  // Fase 1 do tutorial sempre recomenda a dica, para casar com o passo a passo prático.
  if (worldId === 1 && worldLevelNumber === 1) {
    return 'hint';
  }

  const rotation: PowerUpType[] = [
    'shuffle',
    'hint',
    'undo',
    'shuffle',
    'undo',
  ];

  return rotation[(worldLevelNumber - 1) % rotation.length];
};

/**
 * Ponto de partida (fase 1) e faixa percorrida até a última fase do mundo,
 * calculados a partir do formato antigo (linear em `worldLevelNumber`, com
 * empurrão de marco a cada bloco) para os dois extremos continuarem
 * previsíveis — só o meio do caminho segue `config.difficultyCurve` em vez de
 * uma reta.
 */
const WORLD_STAR_TIME_BASE_OFFSET = { threeStars: 5, twoStars: 8 };
const WORLD_STAR_TIME_SPAN = { threeStars: 144, twoStars: 240 };

const getGeneratedStarTimes = (
  config: GeneratedWorldConfig,
  curved: number,
) => {
  return {
    threeStars: Math.round(
      config.timeBase.threeStars +
        WORLD_STAR_TIME_BASE_OFFSET.threeStars +
        WORLD_STAR_TIME_SPAN.threeStars * curved,
    ),
    twoStars: Math.round(
      config.timeBase.twoStars +
        WORLD_STAR_TIME_BASE_OFFSET.twoStars +
        WORLD_STAR_TIME_SPAN.twoStars * curved,
    ),
  };
};

const createGeneratedCampaignLevels = (): LevelSeed[] =>
  GENERATED_WORLD_CONFIGS.flatMap((config) =>
    config.titles.map((title, index) => {
      const worldLevelNumber = index + 1;
      const displayNumber = (config.worldId - 1) * WORLD_LEVELS_PER_MAP + worldLevelNumber;
      // Uma curva por fase, reaproveitada pelo tempo de estrela, pela contagem
      // de peças e pela de mistério — os três só precisam de onde a fase cai
      // na rampa de dificuldade do mundo, não de recalculá-la cada um.
      const curved = curveProgress(
        worldLevelNumber,
        WORLD_LEVELS_PER_MAP,
        WORLD_DIFFICULTY_BLOCK_SIZE,
        config.difficultyCurve,
      );
      const starTimes = getGeneratedStarTimes(config, curved);
      const tileCount = getGeneratedTileCount(config, curved);
      const objectiveText =
        config.objectivePatterns[
          (worldLevelNumber - 1) % config.objectivePatterns.length
        ];

      return createMainLevel(
        config.worldId,
        worldLevelNumber,
        displayNumber,
        title,
        getGeneratedDifficulty(config, worldLevelNumber),
        `Objetivo: ${objectiveText}`,
        tileCount,
        getGeneratedKindCount(config.worldId, worldLevelNumber),
        starTimes.threeStars,
        starTimes.twoStars,
        getGeneratedRecommendedPower(config.worldId, worldLevelNumber),
        getGeneratedMysteryCount(config, worldLevelNumber, curved, tileCount),
      );
    }),
  );

const LEVEL_SEEDS: LevelSeed[] = [
  ...createGeneratedCampaignLevels(),
  createBonusLevel(
    1,
    '10.1',
    'Jardim em Flor',
    'Objetivo: Complete o bônus revelando as peças escondidas.',
    48,
    8,
    200,
    300,
    'hint',
    4,
  ),
  createBonusLevel(
    2,
    '10.2',
    'Broto Dourado',
    'Objetivo: Resolva o bônus revelando as peças escondidas.',
    54,
    8,
    240,
    360,
    'undo',
    5,
  ),
  createBonusLevel(
    3,
    '10.3',
    'Renascer Verde',
    'Objetivo: Domine as pilhas misteriosas para conquistar o bônus final.',
    60,
    8,
    280,
    420,
    'shuffle',
    6,
  ),
];

export const LEVELS: Level[] = LEVEL_SEEDS.map(createLevel);

/** Índice de acesso por id, para evitar varreduras lineares sobre `LEVELS`. */
export const LEVEL_BY_ID: ReadonlyMap<string, Level> = new Map(
  LEVELS.map((level) => [level.id, level]),
);
