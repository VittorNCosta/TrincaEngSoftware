import { Tile } from '../../../types/game';
import { MatchRule } from '../policies/MatchRule';
import { activeMatchRule } from '../policies/MatchRuleRegistry';
import { TRIPLE_SIZE } from '../value-objects/CardRole';
import { getCardVariantAt } from '../value-objects/RecyclingCard';
import { MATERIAL_TYPES, MaterialType } from '../value-objects/MaterialType';

export { TRIPLE_SIZE };

export type CardAssignment = Pick<Tile, 'cardId' | 'emoji' | 'kind' | 'role'>;

const shuffleList = <T>(items: T[], random: () => number) => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [shuffledItems[index], shuffledItems[targetIndex]] = [
      shuffledItems[targetIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
};

const pickRandomItem = <T>(items: T[], random: () => number) =>
  items[Math.floor(random() * items.length)];

/**
 * Sorteia qual material fecha cada trinca do nível. `materialCount` controla a
 * dificuldade: quanto mais materiais em jogo, mais o jogador precisa distinguir
 * cores de lixeira sob pressão de bandeja.
 */
export const buildMaterialSequence = (
  tripleCount: number,
  materialCount: number,
  random: () => number = Math.random,
): MaterialType[] => {
  const selectedMaterials = shuffleList(MATERIAL_TYPES, random).slice(
    0,
    Math.max(1, Math.min(materialCount, MATERIAL_TYPES.length, tripleCount)),
  );
  const sequence = shuffleList(selectedMaterials, random);

  while (sequence.length < tripleCount) {
    sequence.push(pickRandomItem(selectedMaterials, random));
  }

  return shuffleList(sequence, random).slice(0, tripleCount);
};

/**
 * Monta a carta concreta de uma posição da trinca.
 *
 * `variantSeed` só muda a arte do resíduo (garrafa PET / sacola / copo). Nunca
 * muda material nem papel — é o que garante que a variedade visual não quebre a
 * regra do jogo.
 */
export const buildCardAssignment = (
  material: MaterialType,
  roleIndex: number,
  variantSeed: number,
  rule: MatchRule = activeMatchRule,
): CardAssignment => {
  const roles = rule.buildTripleRoles();
  const role = roles[roleIndex % roles.length];
  const cardEntry = getCardVariantAt(material, role, variantSeed);

  return {
    cardId: cardEntry.id,
    emoji: cardEntry.emoji,
    kind: material,
    role,
  };
};

/**
 * Distribui as cartas ao longo da ordem de remoção jogável.
 *
 * Cada bloco de 3 posições consecutivas dessa ordem recebe o ciclo completo de
 * um material. Como a ordem de remoção já é comprovadamente jogável, o nível
 * continua vencível — a diferença é que agora a trinca ensina o descarte certo
 * em vez de casar três figuras iguais.
 */
export const assignCardsToRemovalOrder = <TTile extends Tile>({
  layout,
  materialSequence,
  removalOrder,
  rule = activeMatchRule,
  variantSeed = 0,
}: {
  layout: TTile[];
  materialSequence: MaterialType[];
  removalOrder: TTile[];
  rule?: MatchRule;
  variantSeed?: number;
}): TTile[] => {
  const assignmentByTileId = new Map<string, CardAssignment>();

  removalOrder.forEach((tile, index) => {
    const tripleIndex = Math.floor(index / TRIPLE_SIZE);
    const material =
      materialSequence[tripleIndex] ?? materialSequence[0] ?? MATERIAL_TYPES[0];

    assignmentByTileId.set(
      tile.id,
      buildCardAssignment(
        material,
        index % TRIPLE_SIZE,
        variantSeed + tripleIndex,
        rule,
      ),
    );
  });

  return layout.map((tile) => {
    const assignment =
      assignmentByTileId.get(tile.id) ??
      buildCardAssignment(MATERIAL_TYPES[0], 0, variantSeed, rule);

    return {
      ...tile,
      ...assignment,
      removed: false,
    };
  });
};
