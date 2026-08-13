import { CARD_ROLE_CYCLE, CardRole } from '../value-objects/CardRole';
import { MatchRule, MatchableTile, groupByMaterial } from './MatchRule';

/**
 * Regra oficial da versão ODS 12.
 *
 *   🧴 resíduo  +  🟥 lixeira correta  +  ♻️ reciclagem   (mesmo material)
 *
 * Três resíduos de plástico NÃO fecham trinca — falta o descarte correto e o
 * resultado. É exatamente esse atrito que faz o jogador aprender a associação.
 */
const pickOnePerRole = <TTile extends MatchableTile>(
  tiles: TTile[],
): TTile[] | undefined => {
  const selected: TTile[] = [];

  for (const role of CARD_ROLE_CYCLE) {
    const match = tiles.find(
      (tile) => tile.role === role && !selected.some((chosen) => chosen.id === tile.id),
    );

    if (!match) {
      return undefined;
    }

    selected.push(match);
  }

  return selected;
};

export const RecyclingCycleMatchRule: MatchRule = {
  description:
    'Junte o resíduo, a lixeira da cor certa e o símbolo de reciclagem do mesmo material.',
  id: 'recycling-cycle',
  label: 'Ciclo da reciclagem',

  buildTripleRoles(): CardRole[] {
    return [...CARD_ROLE_CYCLE];
  },

  findCompletedTriple<TTile extends MatchableTile>(tray: TTile[]): TTile[] | undefined {
    for (const [, materialTiles] of groupByMaterial(tray)) {
      const triple = pickOnePerRole(materialTiles);

      if (triple) {
        // Devolve na ordem da bandeja para a animação de consumo sair coerente.
        const tripleIds = new Set(triple.map((tile) => tile.id));

        return tray.filter((tile) => tripleIds.has(tile.id));
      }
    }

    return undefined;
  },

  selectTripleFrom<TTile extends MatchableTile>(candidates: TTile[]): TTile[] | undefined {
    for (const [, materialTiles] of groupByMaterial(candidates)) {
      const triple = pickOnePerRole(materialTiles);

      if (triple) {
        return triple;
      }
    }

    return undefined;
  },
};
