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
type GeneratedWorldId = 4 | 5 | 6 | 7 | 8;

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

type GeneratedWorldConfig = {
  /**
   * Forma da rampa de dificuldade dentro do mundo — ver `difficultyCurve.ts`.
   * Escolhida a dedo por mundo, não derivada de fórmula: é o ponto de ter uma
   * curva por mundo em vez de uma só pro jogo inteiro — cada entrada pode ser
   * retunada sozinha sem recalcular as outras.
   */
  difficultyCurve: DifficultyCurve;
  /** Banda [primeira fase, fase 25] de peças-mistério, também a dedo por mundo. */
  mysteryRange: { max: number; min: number };
  objectivePatterns: string[];
  timeBase: {
    threeStars: number;
    twoStars: number;
  };
  titles: string[];
  worldId: GeneratedWorldId;
};

/** Fases por mundo e tamanho do bloco da curva de dificuldade (o mesmo dos marcos de descanso/loja). */
const WORLD_LEVELS_PER_MAP = 25;
const WORLD_DIFFICULTY_BLOCK_SIZE = 5;

const GENERATED_WORLD_CONFIGS: GeneratedWorldConfig[] = [
  {
    worldId: 4,
    difficultyCurve: { gamma: 1.3, blockGrowth: 1.15 },
    mysteryRange: { min: 4, max: 6 },
    timeBase: { threeStars: 740, twoStars: 1080 },
    titles: [
      'Entrada do Viveiro',
      'Canteiro Novo',
      'Trilha das Mudas',
      'Cerca Viva',
      'Descanso do Jardineiro',
      'Caminho das Abelhas',
      'Rede de Sementes',
      'Estufa Dourada',
      'Composto Fresco',
      'Mercado da Horta',
      'Ilha de Flores',
      'Colmeia Ativa',
      'Trilha das Borboletas',
      'Deck do Viveiro',
      'Canteiro Escondido',
      'Nuvem de Polen',
      'Horta Azul',
      'Portao do Viveiro',
      'Fileira de Mudas',
      'Loja do Jardineiro',
      'Viveiro Novo',
      'Rota das Sementes',
      'Estufa Comunitaria',
      'Ultima Muda',
      'Guardiao do Viveiro',
    ],
    objectivePatterns: [
      'Limpe as camadas do viveiro sem encher a bandeja.',
      'Revele as mudas na ordem certa e mantenha espaco para trincas.',
      'Use as pecas livres para abrir as laterais antes do centro.',
      'Planeje a sequencia das camadas e segure poderes para emergencias.',
    ],
  },
  {
    worldId: 5,
    difficultyCurve: { gamma: 1.5, blockGrowth: 1.2 },
    mysteryRange: { min: 5, max: 6 },
    timeBase: { threeStars: 780, twoStars: 1140 },
    titles: [
      'Entrada da Usina',
      'Composteira Nova',
      'Trilha do Vapor',
      'Leira Quente',
      'Descanso do Biodigestor',
      'Rio de Adubo',
      'Pontes Organicas',
      'Camadas Mornas',
      'Bolhas de Biogas',
      'Mercado do Adubo',
      'Fornalha Organica',
      'Gotas de Umidade',
      'Corredor Termico',
      'Parede de Humus',
      'Camara de Fermentacao',
      'Camadas Decompostas',
      'Sala Aquecida',
      'Pico do Composto',
      'Chaves do Vapor',
      'Loja da Composteira',
      'Anel do Biodigestor',
      'Escada da Fermentacao',
      'Camara Termica',
      'Boca da Usina',
      'Guardiao da Usina',
    ],
    objectivePatterns: [
      'Abra espaco nas camadas quentes antes de revelar misterios.',
      'Escolha pecas que destravam varios caminhos de uma vez.',
      'Evite acumular pares soltos enquanto o tabuleiro fica mais denso.',
      'Controle a bandeja e resolva os bloqueios com calma.',
    ],
  },
  {
    worldId: 6,
    difficultyCurve: { gamma: 1.7, blockGrowth: 1.25 },
    mysteryRange: { min: 5, max: 7 },
    timeBase: { threeStars: 820, twoStars: 1200 },
    titles: [
      'Entrada da Cooperativa',
      'Praca dos Catadores',
      'Carrinho de Coleta',
      'Rua da Reciclagem',
      'Descanso do Galpao',
      'Associacao Unida',
      'Balanca Comunitaria',
      'Beco dos Fardos',
      'Galeria da Cooperativa',
      'Mercado dos Catadores',
      'Carroca Cheia',
      'Fios e Fardos',
      'Escadas do Galpao',
      'Viaduto Movimentado',
      'Sinal Verde',
      'Jardim da Cooperativa',
      'Tunel de Passagem',
      'Telhados da Vila',
      'Portal da Comunidade',
      'Loja da Cooperativa',
      'Distrito dos Catadores',
      'Prensa Comunitaria',
      'Cracha Dourado',
      'Ultima Rua',
      'Guardiao dos Catadores',
    ],
    objectivePatterns: [
      'Leia o tabuleiro por setores e libere as rotas principais.',
      'Monte trincas sem bloquear as pecas que abrem novas camadas.',
      'Use as laterais para ganhar espaco antes das decisoes finais.',
      'Revele misterios quando houver bandeja suficiente para reagir.',
    ],
  },
  {
    worldId: 7,
    difficultyCurve: { gamma: 1.9, blockGrowth: 1.3 },
    mysteryRange: { min: 6, max: 7 },
    timeBase: { threeStars: 860, twoStars: 1260 },
    titles: [
      'Entrada da Rota',
      'Pontos Cruzados',
      'Rota de Volta',
      'Ponte da Devolucao',
      'Descanso do Motorista',
      'Paradas Frequentes',
      'Vale dos Pontos',
      'Caverna de Estoque',
      'Sinais Luminosos',
      'Mercado de Trocas',
      'Nuvem de Etiquetas',
      'Trilha de Volta',
      'Deposito Compartilhado',
      'Mirante da Expedicao',
      'Chave da Devolucao',
      'Colina dos Pontos',
      'Teto da Transportadora',
      'Passagem Reversa',
      'Marcas do Caminho',
      'Loja do Distribuidor',
      'Noite da Expedicao',
      'Cume do Trajeto',
      'Escada da Fabrica',
      'Ultima Parada',
      'Guardiao da Rota',
    ],
    objectivePatterns: [
      'Priorize pecas que liberam camadas altas e reduzem o risco da bandeja.',
      'Segure espaco para trincas tardias quando os misterios aparecerem.',
      'Resolva as bordas antes de tocar nas pecas mais presas.',
      'Planeje movimentos curtos para evitar travar o fim da fase.',
    ],
  },
  {
    worldId: 8,
    difficultyCurve: { gamma: 2.2, blockGrowth: 1.4 },
    mysteryRange: { min: 6, max: 8 },
    timeBase: { threeStars: 900, twoStars: 1320 },
    titles: [
      'Portao do Forum',
      'Praca Central',
      'Distrito das Ideias',
      'Caminho Iluminado',
      'Descanso dos Delegados',
      'Jardim do Forum',
      'Colunas Verdes',
      'Praca das Bandeiras',
      'Ponte da Assembleia',
      'Mercado Circular',
      'Auditorio Claro',
      'Ecos da Conferencia',
      'Escada da Tribuna',
      'Painel Final',
      'Chaves do Forum',
      'Torre da Inovacao',
      'Rota das Parcerias',
      'Camara de Debates',
      'Selo Verde',
      'Loja do Forum',
      'Aurora do Futuro',
      'Arco Principal',
      'Distrito Circular',
      'Ultima Assembleia',
      'Guardiao do Forum',
    ],
    objectivePatterns: [
      'Resolva as camadas finais com planejamento e poucos movimentos vazios.',
      'Mantenha a bandeja limpa para atravessar os misterios finais.',
      'Abra caminhos duplos antes de formar trincas muito cedo.',
      'Use cada peca livre para preparar o proximo grupo de trincas.',
    ],
  },
];

const getGeneratedDifficulty = (
  worldId: GeneratedWorldId,
  worldLevelNumber: number,
): LevelDifficulty => {
  if (worldId === 4) {
    return worldLevelNumber <= 15 ? 'expert' : 'master';
  }

  return 'master';
};

const getGeneratedTileCount = (
  worldId: GeneratedWorldId,
  worldLevelNumber: number,
) => {
  if (worldId === 4) {
    return worldLevelNumber <= 8 ? 54 : worldLevelNumber <= 16 ? 57 : 60;
  }

  if (worldId === 5) {
    return worldLevelNumber <= 8 ? 57 : 60;
  }

  return 60;
};

const getGeneratedMysteryCount = (
  config: GeneratedWorldConfig,
  worldLevelNumber: number,
  curved: number,
) => {
  const usesMystery =
    worldLevelNumber % 5 === 0 ||
    (worldLevelNumber >= 12 && worldLevelNumber % 4 === 0);

  if (!usesMystery) {
    return undefined;
  }

  const { min, max } = config.mysteryRange;

  return Math.round(min + (max - min) * curved);
};

const getGeneratedRecommendedPower = (
  worldLevelNumber: number,
): PowerUpType => {
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
 * Ponto de partida (fase 1) e faixa percorrida até a fase 25, calculados a
 * partir do formato antigo (linear em `worldLevelNumber`, com empurrão de
 * marco a cada bloco de 5) para os dois extremos continuarem no mesmo lugar
 * de antes — só o meio do caminho passa a seguir `config.difficultyCurve` em
 * vez de uma reta.
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
      const displayNumber = (config.worldId - 1) * 25 + worldLevelNumber;
      // Uma curva por fase, reaproveitada pelo tempo de estrela e pela
      // contagem de mistério — os dois só precisam de onde a fase cai na
      // rampa de dificuldade do mundo, não de recalculá-la cada um.
      const curved = curveProgress(
        worldLevelNumber,
        WORLD_LEVELS_PER_MAP,
        WORLD_DIFFICULTY_BLOCK_SIZE,
        config.difficultyCurve,
      );
      const starTimes = getGeneratedStarTimes(config, curved);
      const objectiveText =
        config.objectivePatterns[
          (worldLevelNumber - 1) % config.objectivePatterns.length
        ];

      return createMainLevel(
        config.worldId,
        worldLevelNumber,
        displayNumber,
        title,
        getGeneratedDifficulty(config.worldId, worldLevelNumber),
        `Objetivo: ${objectiveText}`,
        getGeneratedTileCount(config.worldId, worldLevelNumber),
        8,
        starTimes.threeStars,
        starTimes.twoStars,
        getGeneratedRecommendedPower(worldLevelNumber),
        getGeneratedMysteryCount(config, worldLevelNumber, curved),
      );
    }),
  );

const LEVEL_SEEDS: LevelSeed[] = [
  createMainLevel(
    1,
    1,
    1,
    'Entrada do Parque',
    'easy',
    'Objetivo: Forme a primeira trinca livre para abrir o Parque da Coleta Seletiva.',
    9,
    3,
    45,
    75,
    'hint',
  ),
  createMainLevel(
    1,
    2,
    2,
    'Trilha dos Recicláveis',
    'easy',
    'Objetivo: Limpe uma mesa aberta e avance pela trilha principal.',
    12,
    4,
    55,
    90,
    'hint',
  ),
  createMainLevel(
    1,
    3,
    3,
    'Primeiro Ecoponto',
    'easy',
    'Objetivo: Observe as primeiras camadas e libere o caminho com calma.',
    15,
    5,
    60,
    100,
    'hint',
  ),
  createMainLevel(
    1,
    4,
    4,
    'Banco das Latas',
    'normal',
    'Objetivo: Encontre trincas enquanto algumas peças bloqueiam a passagem.',
    18,
    5,
    75,
    120,
    'hint',
  ),
  createMainLevel(
    1,
    5,
    5,
    'Descanso do Parque',
    'normal',
    'Objetivo: Controle a bandeja enquanto as camadas ficam mais espertas.',
    21,
    6,
    85,
    140,
    'undo',
  ),
  createMainLevel(
    1,
    6,
    6,
    'Riacho Limpo',
    'normal',
    'Objetivo: Abra espaço antes de acumular peças soltas demais.',
    21,
    6,
    100,
    165,
    'undo',
  ),
  createMainLevel(
    1,
    7,
    7,
    'Gramado das Trincas',
    'normal',
    'Objetivo: Planeje a ordem das camadas para não lotar a bandeja.',
    24,
    7,
    115,
    185,
    'shuffle',
  ),
  createMainLevel(
    1,
    8,
    8,
    'Quiosque Verde',
    'hard',
    'Objetivo: Use o topo para destravar uma mesa cheia sem pressa.',
    27,
    7,
    130,
    210,
    'shuffle',
  ),
  createMainLevel(
    1,
    9,
    9,
    'Colina das Lixeiras',
    'hard',
    'Objetivo: Avance por camadas altas segurando espaço para combos.',
    36,
    8,
    155,
    250,
    'shuffle',
  ),
  createMainLevel(
    1,
    10,
    10,
    'Feira do Parque',
    'hard',
    'Objetivo: Limpe a mesa final do mundo com ordem e estratégia.',
    42,
    8,
    180,
    285,
    'shuffle',
  ),
  createMainLevel(
    1,
    11,
    11,
    'Caminho das Mudas',
    'hard',
    'Objetivo: Abra caminho pelas trincas escondidas.',
    42,
    8,
    185,
    285,
    'shuffle',
  ),
  createMainLevel(
    1,
    12,
    12,
    'Raízes Renovadas',
    'hard',
    'Objetivo: Libere as peças presas entre as raízes.',
    45,
    8,
    205,
    310,
    'hint',
  ),
  createMainLevel(
    1,
    13,
    13,
    'Canteiro Florido',
    'hard',
    'Objetivo: Planeje antes de encher a bandeja.',
    45,
    8,
    220,
    335,
    'shuffle',
  ),
  createMainLevel(
    1,
    14,
    14,
    'Tronco Reaproveitado',
    'hard',
    'Objetivo: Remova as peças do topo para abrir o centro.',
    48,
    8,
    235,
    360,
    'undo',
  ),
  createMainLevel(
    1,
    15,
    15,
    'Trilha das Folhas',
    'hard',
    'Objetivo: Algumas peças misteriosas revelam quando ficam livres.',
    48,
    8,
    250,
    385,
    'shuffle',
    2,
  ),
  createMainLevel(
    1,
    16,
    16,
    'Lago da Reciclagem',
    'hard',
    'Objetivo: Cuidado com as peças escondidas no fundo.',
    51,
    8,
    270,
    410,
    'hint',
  ),
  createMainLevel(
    1,
    17,
    17,
    'Ponte dos Materiais',
    'hard',
    'Objetivo: Mantenha espaço livre na bandeja.',
    51,
    8,
    285,
    430,
    'undo',
  ),
  createMainLevel(
    1,
    18,
    18,
    'Playground Sustentável',
    'expert',
    'Objetivo: Encontre combinações antes de avançar.',
    54,
    8,
    305,
    455,
    'shuffle',
  ),
  createMainLevel(
    1,
    19,
    19,
    'Viveiro de Mudas',
    'expert',
    'Objetivo: Priorize peças que liberam várias camadas.',
    54,
    8,
    320,
    480,
    'hint',
  ),
  createMainLevel(
    1,
    20,
    20,
    'Mercado do Parque',
    'expert',
    'Objetivo: Revele as peças misteriosas sem encher a bandeja.',
    57,
    8,
    340,
    510,
    'shuffle',
    3,
  ),
  createMainLevel(
    1,
    21,
    21,
    'Gramado Extenso',
    'expert',
    'Objetivo: As trincas certas abrem novos caminhos.',
    57,
    8,
    355,
    535,
    'undo',
  ),
  createMainLevel(
    1,
    22,
    22,
    'Pedras do Caminho',
    'expert',
    'Objetivo: Controle a bandeja nas camadas mais difíceis.',
    60,
    8,
    380,
    565,
    'shuffle',
  ),
  createMainLevel(
    1,
    23,
    23,
    'Portal do Ecoponto',
    'expert',
    'Objetivo: Libere o centro sem travar os cantos.',
    60,
    8,
    400,
    595,
    'hint',
  ),
  createMainLevel(
    1,
    24,
    24,
    'Última Trilha',
    'expert',
    'Objetivo: Planeje cada trinca antes de tocar.',
    60,
    8,
    420,
    620,
    'undo',
  ),
  createMainLevel(
    1,
    25,
    25,
    'Guardião do Parque',
    'expert',
    'Objetivo: Use estratégia para revelar as peças misteriosas no momento certo.',
    60,
    8,
    440,
    655,
    'shuffle',
    4,
  ),
  createMainLevel(
    2,
    1,
    26,
    'Portão do Vale',
    'hard',
    'Objetivo: Conheça o caminho das montanhas.',
    45,
    8,
    245,
    360,
    'undo',
  ),
  createMainLevel(
    2,
    2,
    27,
    'Estrada de Terra',
    'hard',
    'Objetivo: Abra caminho entre as pedras.',
    48,
    8,
    275,
    400,
    'shuffle',
  ),
  createMainLevel(
    2,
    3,
    28,
    'Ponte da Carga',
    'hard',
    'Objetivo: Planeje antes de encher a bandeja.',
    51,
    8,
    305,
    445,
    'shuffle',
  ),
  createMainLevel(
    2,
    4,
    29,
    'Caverna de Apoio',
    'hard',
    'Objetivo: Libere peças escondidas.',
    54,
    8,
    335,
    490,
    'hint',
  ),
  createMainLevel(
    2,
    5,
    30,
    'Descanso na Estrada',
    'hard',
    'Objetivo: Complete este desafio do vale.',
    57,
    8,
    370,
    540,
    'shuffle',
  ),
  createMainLevel(
    2,
    6,
    31,
    'Descida Íngreme',
    'hard',
    'Objetivo: Continue abrindo caminho pelas montanhas.',
    51,
    8,
    330,
    480,
    'shuffle',
  ),
  createMainLevel(
    2,
    7,
    32,
    'Curva dos Caminhões',
    'hard',
    'Objetivo: Remova as peças do topo para liberar o centro.',
    51,
    8,
    350,
    510,
    'hint',
  ),
  createMainLevel(
    2,
    8,
    33,
    'Neblina da Estrada',
    'hard',
    'Objetivo: Planeje as trincas antes de encher a bandeja.',
    54,
    8,
    370,
    540,
    'shuffle',
  ),
  createMainLevel(
    2,
    9,
    34,
    'Posto de Troca',
    'hard',
    'Objetivo: Cuidado com as peças escondidas nas camadas.',
    54,
    8,
    390,
    570,
    'undo',
  ),
  createMainLevel(
    2,
    10,
    35,
    'Feira da Estrada',
    'hard',
    'Objetivo: As pilhas misteriosas começam a testar sua estratégia.',
    54,
    8,
    410,
    600,
    'shuffle',
    3,
  ),
  createMainLevel(
    2,
    11,
    36,
    'Ponte de Ferro',
    'expert',
    'Objetivo: Mantenha espaço na bandeja para as próximas trincas.',
    57,
    8,
    430,
    630,
    'undo',
  ),
  createMainLevel(
    2,
    12,
    37,
    'Terminal Suspenso',
    'expert',
    'Objetivo: Libere as laterais antes de avançar no centro.',
    57,
    8,
    450,
    660,
    'hint',
  ),
  createMainLevel(
    2,
    13,
    38,
    'Pedras do Trajeto',
    'expert',
    'Objetivo: Escolha peças que abrem múltiplos caminhos.',
    57,
    8,
    470,
    690,
    'shuffle',
  ),
  createMainLevel(
    2,
    14,
    39,
    'Trilha Sinuosa',
    'expert',
    'Objetivo: Não deixe a bandeja travar nas últimas peças.',
    60,
    8,
    495,
    720,
    'undo',
  ),
  createMainLevel(
    2,
    15,
    40,
    'Refúgio dos Motoristas',
    'expert',
    'Objetivo: Planeje suas jogadas para revelar as peças certas.',
    60,
    8,
    520,
    750,
    'shuffle',
    4,
  ),
  createMainLevel(
    2,
    16,
    41,
    'Galpão Provisório',
    'expert',
    'Objetivo: Remova camadas superiores para liberar os blocos presos.',
    60,
    8,
    540,
    780,
    'hint',
  ),
  createMainLevel(
    2,
    17,
    42,
    'Parada Obrigatória',
    'expert',
    'Objetivo: Use estratégia para abrir o tabuleiro por partes.',
    60,
    8,
    560,
    810,
    'shuffle',
  ),
  createMainLevel(
    2,
    18,
    43,
    'Vale Extenso',
    'expert',
    'Objetivo: Encontre as trincas escondidas entre as camadas.',
    60,
    8,
    580,
    840,
    'undo',
  ),
  createMainLevel(
    2,
    19,
    44,
    'Trevo Antigo',
    'expert',
    'Objetivo: Priorize peças que destravam o maior caminho.',
    60,
    8,
    600,
    870,
    'hint',
  ),
  createMainLevel(
    2,
    20,
    45,
    'Loja da Frota',
    'expert',
    'Objetivo: Controle a bandeja enquanto revela novos símbolos.',
    60,
    8,
    620,
    900,
    'shuffle',
    5,
  ),
  createMainLevel(
    2,
    21,
    46,
    'Estrada Congelada',
    'expert',
    'Objetivo: Mantenha a bandeja limpa nas decisões finais.',
    60,
    8,
    640,
    930,
    'undo',
  ),
  createMainLevel(
    2,
    22,
    47,
    'Ruído dos Motores',
    'expert',
    'Objetivo: Não repita o mesmo papel do ciclo antes de abrir o caminho.',
    60,
    8,
    660,
    960,
    'hint',
  ),
  createMainLevel(
    2,
    23,
    48,
    'Portão de Carga',
    'expert',
    'Objetivo: Libere o portão removendo as camadas certas.',
    60,
    8,
    680,
    990,
    'shuffle',
  ),
  createMainLevel(
    2,
    24,
    49,
    'Travessia Final',
    'expert',
    'Objetivo: Controle cada movimento antes da fase final.',
    60,
    8,
    700,
    1020,
    'undo',
  ),
  createMainLevel(
    2,
    25,
    50,
    'Guardião do Trajeto',
    'expert',
    'Objetivo: Vença o Guardião do Trajeto revelando as pilhas misteriosas.',
    60,
    8,
    720,
    1050,
    'shuffle',
    6,
  ),
  createMainLevel(
    3,
    1,
    51,
    'Entrada da Central',
    'hard',
    'Objetivo: Comece a explorar a Central de Materiais.',
    48,
    8,
    300,
    450,
    'hint',
  ),
  createMainLevel(
    3,
    2,
    52,
    'Pátio de Materiais',
    'hard',
    'Objetivo: Abra caminho entre os primeiros materiais.',
    48,
    8,
    320,
    480,
    'shuffle',
  ),
  createMainLevel(
    3,
    3,
    53,
    'Colunas de Aço',
    'hard',
    'Objetivo: Remova as peças do topo para liberar as colunas.',
    51,
    8,
    345,
    510,
    'hint',
  ),
  createMainLevel(
    3,
    4,
    54,
    'Escadaria Operária',
    'hard',
    'Objetivo: Planeje as trincas antes de avançar pela escadaria.',
    51,
    8,
    365,
    540,
    'undo',
  ),
  createMainLevel(
    3,
    5,
    55,
    'Loja de Suprimentos',
    'hard',
    'Objetivo: A Central de Materiais esconde símbolos nas pilhas.',
    51,
    8,
    385,
    570,
    'shuffle',
    2,
  ),
  createMainLevel(
    3,
    6,
    56,
    'Salão de Triagem',
    'expert',
    'Objetivo: Libere o centro sem travar os cantos.',
    54,
    8,
    410,
    600,
    'hint',
  ),
  createMainLevel(
    3,
    7,
    57,
    'Galpão Iluminado',
    'expert',
    'Objetivo: Priorize peças que abrem várias camadas.',
    54,
    8,
    430,
    630,
    'shuffle',
  ),
  createMainLevel(
    3,
    8,
    58,
    'Galeria de Estoque',
    'expert',
    'Objetivo: Encontre as trincas escondidas no estoque.',
    54,
    8,
    450,
    660,
    'undo',
  ),
  createMainLevel(
    3,
    9,
    59,
    'Câmara das Prensas',
    'expert',
    'Objetivo: Evite encher a bandeja antes de abrir caminho.',
    57,
    8,
    475,
    690,
    'hint',
  ),
  createMainLevel(
    3,
    10,
    60,
    'Mercado Interno',
    'expert',
    'Objetivo: Revele os materiais certos para seguir pela central.',
    57,
    8,
    495,
    720,
    'shuffle',
    3,
  ),
  createMainLevel(
    3,
    11,
    61,
    'Fardos em Fila',
    'expert',
    'Objetivo: Escolha peças que liberam o caminho central.',
    57,
    8,
    515,
    750,
    'undo',
  ),
  createMainLevel(
    3,
    12,
    62,
    'Pátio das Docas',
    'expert',
    'Objetivo: Abra espaço antes de formar trincas arriscadas.',
    60,
    8,
    540,
    780,
    'hint',
  ),
  createMainLevel(
    3,
    13,
    63,
    'Torre de Contêineres',
    'expert',
    'Objetivo: Remova as camadas altas para revelar as peças presas.',
    60,
    8,
    560,
    810,
    'shuffle',
  ),
  createMainLevel(
    3,
    14,
    64,
    'Fonte de Energia',
    'expert',
    'Objetivo: Controle a bandeja nas combinações finais.',
    60,
    8,
    580,
    840,
    'undo',
  ),
  createMainLevel(
    3,
    15,
    65,
    'Descanso da Central',
    'expert',
    'Objetivo: Use estratégia para lidar com peças ocultas.',
    60,
    8,
    600,
    870,
    'hint',
    4,
  ),
  createMainLevel(
    3,
    16,
    66,
    'Corredor dos Fardos',
    'expert',
    'Objetivo: Não repita o mesmo papel do ciclo sem liberar o tabuleiro.',
    60,
    8,
    620,
    900,
    'shuffle',
  ),
  createMainLevel(
    3,
    17,
    67,
    'Depósito Central',
    'expert',
    'Objetivo: Domine as camadas para avançar no depósito.',
    60,
    8,
    640,
    930,
    'undo',
  ),
  createMainLevel(
    3,
    18,
    68,
    'Núcleo Operacional',
    'expert',
    'Objetivo: Libere o núcleo removendo as peças certas.',
    60,
    8,
    660,
    960,
    'hint',
  ),
  createMainLevel(
    3,
    19,
    69,
    'Passagem dos Operários',
    'expert',
    'Objetivo: Use cada movimento para abrir uma nova rota.',
    60,
    8,
    680,
    990,
    'shuffle',
  ),
  createMainLevel(
    3,
    20,
    70,
    'Loja do Supervisor',
    'expert',
    'Objetivo: As pilhas misteriosas dominam a central.',
    60,
    8,
    700,
    1020,
    'undo',
    5,
  ),
  createMainLevel(
    3,
    21,
    71,
    'Salão das Máquinas',
    'master',
    'Objetivo: Mantenha espaço livre até as últimas camadas.',
    60,
    8,
    720,
    1050,
    'hint',
  ),
  createMainLevel(
    3,
    22,
    72,
    'Setor Azul',
    'master',
    'Objetivo: Priorize peças que destravam múltiplos grupos.',
    60,
    8,
    740,
    1080,
    'shuffle',
  ),
  createMainLevel(
    3,
    23,
    73,
    'Bloco Principal',
    'master',
    'Objetivo: Não deixe a bandeja travar no final.',
    60,
    8,
    760,
    1110,
    'undo',
  ),
  createMainLevel(
    3,
    24,
    74,
    'Portal de Saída',
    'master',
    'Objetivo: Complete a última travessia da central.',
    60,
    8,
    780,
    1140,
    'hint',
  ),
  createMainLevel(
    3,
    25,
    75,
    'Guardião da Central',
    'master',
    'Objetivo: Complete o desafio final revelando as últimas peças misteriosas.',
    60,
    8,
    810,
    1170,
    'shuffle',
    6,
  ),
  ...createGeneratedCampaignLevels(),
  createBonusLevel(
    1,
    '25.1',
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
    '25.2',
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
    '25.3',
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
