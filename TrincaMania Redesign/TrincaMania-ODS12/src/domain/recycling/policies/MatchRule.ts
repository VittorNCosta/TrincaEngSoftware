import { CardRole } from '../value-objects/CardRole';
import { MaterialType } from '../value-objects/MaterialType';

/**
 * Forma mínima que uma peça precisa ter para ser avaliada por uma regra de
 * trinca. Manter isso estreito é o que deixa o domínio testável sem React,
 * sem Expo e sem o resto do app.
 */
export type MatchableTile = {
  id: string;
  kind: MaterialType;
  role: CardRole;
};

/**
 * Política de domínio: "o que conta como uma trinca?".
 *
 * O jogo original tinha uma única resposta implícita ("três peças iguais").
 * A versão ODS 12 precisa de outra ("o ciclo completo de um material"), e é
 * plausível que apareçam outras em mundos futuros. Por isso a regra virou uma
 * estratégia explícita em vez de um `if` espalhado pelo código.
 */
export type MatchRule = {
  /** Texto curto exibido no tutorial e no modal de regras. */
  readonly description: string;
  readonly id: string;
  readonly label: string;

  /**
   * Papéis que compõem uma trinca completa de um material. O gerador de níveis
   * usa isso para distribuir as peças garantindo que o nível seja vencível.
   */
  buildTripleRoles(): CardRole[];

  /**
   * Encontra, na bandeja, uma trinca já fechada. Retorna as peças exatas que
   * devem sair (na ordem em que estão na bandeja) ou `undefined`.
   */
  findCompletedTriple<TTile extends MatchableTile>(tray: TTile[]): TTile[] | undefined;

  /**
   * Dado um conjunto de peças candidatas de um mesmo material, retorna a
   * combinação que fecha trinca — usado pela dica e pela "trinca mágica".
   */
  selectTripleFrom<TTile extends MatchableTile>(candidates: TTile[]): TTile[] | undefined;
};

export const groupByMaterial = <TTile extends MatchableTile>(tiles: TTile[]) =>
  tiles.reduce<Map<MaterialType, TTile[]>>((groups, tile) => {
    groups.set(tile.kind, [...(groups.get(tile.kind) ?? []), tile]);

    return groups;
  }, new Map<MaterialType, TTile[]>());
