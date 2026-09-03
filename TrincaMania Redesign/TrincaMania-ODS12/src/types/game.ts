import { CardRole } from '../domain/recycling/value-objects/CardRole';
import { MaterialType } from '../domain/recycling/value-objects/MaterialType';

/**
 * Versão ODS 12: a "espécie" de uma peça é o MATERIAL reciclável, não mais uma
 * fruta. É o material que define com quem a peça combina — o papel dentro do
 * ciclo (`Tile.role`) define o que falta para fechar a trinca.
 */
export type TileKind = MaterialType;

export type Tile = {
  /** Carta do catálogo (`material:papel:variante`), usada para desenhar a arte. */
  cardId: string;
  id: string;
  kind: TileKind;
  emoji: string;
  /** Posição da carta no ciclo: resíduo → lixeira → reciclagem. */
  role: CardRole;
  x: number;
  y: number;
  z: number;
  mystery?: boolean;
  revealed?: boolean;
  removed?: boolean;
};

export type LevelDifficulty =
  'easy' | 'normal' | 'hard' | 'expert' | 'master' | 'bonus';

/** Mundos da campanha canônica: as 203 fases de `LEVELS`. */
export type CampaignWorldId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 21;

/**
 * Ids reservados aos capítulos (`CHAPTERS`). Ficam numa faixa própria, a partir
 * de 101, para nunca colidirem com um mundo da campanha — e para que qualquer
 * `switch` existente sobre mundo caia no `default` em vez de acertar por acaso
 * o ramo de outro mundo.
 */
export type ChapterWorldId =
  101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110;

export type WorldId = CampaignWorldId | ChapterWorldId;

export type WorldTheme = 'forest' | 'mountain' | 'crystal' | 'sweet';

export type WorldUnlockRule =
  'complete-world-1' | 'three-stars-world-1' | 'three-stars-world-2';

export type World = {
  id: WorldId;
  isBonus?: boolean;
  label: string;
  levelIds: string[];
  name: string;
  subtitle: string;
  theme: WorldTheme;
  levelStart: number;
  levelEnd: number;
  unlockAfterLevelId?: string;
  unlockRule?: WorldUnlockRule;
  lockedText: string;
};

export type StarTimeLimits = {
  threeStars: number;
  twoStars: number;
};

export type Level = {
  difficulty: LevelDifficulty;
  displayLabel: string;
  id: string;
  mysteryTileCount?: number;
  number: number;
  objectiveText: string;
  recommendedPower?: PowerUpType;
  starTimeLimits: StarTimeLimits;
  title: string;
  tiles: Tile[];
  worldId: WorldId;
  worldLevelNumber: number;
};

export type ChapterId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Marco de ritmo dentro de um capítulo.
 *
 * `rest` e `shop` caem de 10 em 10 mapas e `guardian` fecha o capítulo no mapa
 * 100. O marco nunca reduz a carga do mapa (peças, materiais, mistério seguem
 * subindo) — o alívio vem pelo orçamento de tempo das estrelas, que afrouxa no
 * descanso e na loja e aperta no guardião.
 */
export type ChapterMilestone = 'guardian' | 'rest' | 'shop';

export type ChapterTheme =
  | 'aterro'
  | 'circular'
  | 'compostagem'
  | 'feira'
  | 'metal'
  | 'papel'
  | 'rio'
  | 'sucata'
  | 'triagem'
  | 'vidro';

export type Chapter = {
  id: ChapterId;
  /** Material que a identidade do capítulo destaca. Não restringe o tabuleiro. */
  focusMaterial: MaterialType;
  levelIds: string[];
  lockedText: string;
  name: string;
  subtitle: string;
  theme: ChapterTheme;
  worldId: ChapterWorldId;
};

/**
 * Metadado de um mapa de capítulo.
 *
 * É o que fica em memória para os 1000 mapas: só descrição e parâmetros. As
 * peças (~144 bytes cada) só existem quando `buildChapterLevel` monta o
 * tabuleiro para jogar, seguindo o mesmo padrão de `generatePlayableLevel`.
 */
export type ChapterLevelSummary = {
  /** Posição global no conjunto dos capítulos, de 1 a 1000. */
  campaignPosition: number;
  chapterId: ChapterId;
  chapterMapNumber: number;
  difficulty: LevelDifficulty;
  displayLabel: string;
  id: string;
  kindCount: number;
  milestone?: ChapterMilestone;
  mysteryTileCount: number;
  number: number;
  objectiveText: string;
  recommendedPower: PowerUpType;
  starTimeLimits: StarTimeLimits;
  tileCount: number;
  title: string;
  worldId: ChapterWorldId;
};

export type LevelDifficultyProfile = {
  difficulty: LevelDifficulty;
  kindCount: number;
  maxZ: number;
  mysteryTileCount?: number;
  openingTriple?: boolean;
  tileCount: number;
};

export type GeneratedLevelOptions = {
  preserveOpeningTriple?: boolean;
  random?: () => number;
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type LevelStars = Record<string, number>;

export type PowerUpInventory = Record<PowerUpType, number>;

export type ChestRewardType = 'life' | 'coins';

export type ChestProgressSummary = {
  completedCount: number;
  isLevelCounted: boolean;
  opened: boolean;
  progressCount: number;
  remainingCount: number;
  requiredCount: number;
};

export type ChestRewardSummary = {
  amount: number;
  label: string;
  type: ChestRewardType;
};

export type WorldChestOpenMode = 'key' | 'buy-key';

export type WorldChestOpenStatus =
  'already-opened' | 'insufficient-coins' | 'no-key' | 'opened' | 'unavailable';

export type WorldChestRewardSummary = {
  coins: number;
  itemCounts: PowerUpInventory;
  lifeGranted: boolean;
};

export type WorldChestOpenResult = {
  keyPurchased: boolean;
  progress: ProgressState;
  reward?: WorldChestRewardSummary;
  status: WorldChestOpenStatus;
  worldChestId: string;
};

export type WorldChestSummary = {
  id: string;
  isNew: boolean;
  worldId: WorldId;
};

export type PlayerProgress = {
  bonusWorldAchievementShown: boolean;
  chestProgressLevelIds: string[];
  claimedWorldChestIds: string[];
  collectedRestCheckpointIds: string[];
  completedLevelIds: string[];
  unlockedLevelIds: string[];
  itemCounts: PowerUpInventory;
  keys: number;
  levelStars: LevelStars;
  pendingWorldChestIds: string[];
  coins: number;
};

export type ProgressState = PlayerProgress;

export type PowerUpType = 'hint' | 'shuffle' | 'undo';

export type RestCheckpointRewardResult = {
  coinsEarned?: number;
  granted: boolean;
  rewardType?: 'life' | 'coins';
  worldId: WorldId;
};

export type MoveHistoryItem = {
  board: Tile[];
  formedTriple: boolean;
  tray: Tile[];
  removedKind?: TileKind;
};

export type MoveResult = {
  board: Tile[];
  tray: Tile[];
  removedKind?: TileKind;
  /**
   * Ids exatos das peças que fecharam a trinca. Sob a regra do ciclo a bandeja
   * pode conter mais peças do mesmo material do que as três consumidas (dois
   * resíduos e uma lixeira, por exemplo), então "as três primeiras do material"
   * não identifica mais a trinca — a animação de consumo precisa dos ids.
   */
  removedTileIds?: string[];
  status: GameStatus;
};
