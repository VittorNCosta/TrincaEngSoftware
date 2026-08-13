import { CardRole } from '../value-objects/CardRole';
import { MatchRule, MatchableTile, groupByMaterial } from './MatchRule';

/**
 * Regra alternativa, mais simples: três peças QUALQUER do mesmo material.
 *
 *   🧴 garrafa PET + 🛍️ sacola + 🥤 copo  →  trinca de plástico
 *
 * É a primeira ideia descrita no enunciado do trabalho. Fica disponível para os
 * mundos iniciais (ou para o modo tutorial), porque ensina a classificar o
 * material antes de cobrar o ciclo inteiro do descarte.
 */
export const SameMaterialMatchRule: MatchRule = {
  description: 'Junte três itens do mesmo material reciclável.',
  id: 'same-material',
  label: 'Mesmo material',

  buildTripleRoles(): CardRole[] {
    return ['residuo', 'residuo', 'residuo'];
  },

  findCompletedTriple<TTile extends MatchableTile>(tray: TTile[]): TTile[] | undefined {
    for (const [, materialTiles] of groupByMaterial(tray)) {
      if (materialTiles.length >= 3) {
        const tripleIds = new Set(materialTiles.slice(0, 3).map((tile) => tile.id));

        return tray.filter((tile) => tripleIds.has(tile.id));
      }
    }

    return undefined;
  },

  selectTripleFrom<TTile extends MatchableTile>(candidates: TTile[]): TTile[] | undefined {
    for (const [, materialTiles] of groupByMaterial(candidates)) {
      if (materialTiles.length >= 3) {
        return materialTiles.slice(0, 3);
      }
    }

    return undefined;
  },
};
