import { Tile, TileKind } from '../../../types/game';
import { MatchRule } from '../policies/MatchRule';
import { activeMatchRule } from '../policies/MatchRuleRegistry';
import { compareRolesByCycleStep } from '../value-objects/CardRole';

export type TrayTripleRemoval = {
  removedKind?: TileKind;
  removedTiles: Tile[];
  tray: Tile[];
};

export const countTilesByKind = (tiles: Tile[], kind: TileKind) =>
  tiles.filter((tile) => tile.kind === kind).length;

/**
 * Insere a peça agrupada com as do mesmo material e, dentro do grupo, na ordem
 * do ciclo (resíduo → lixeira → reciclagem). A bandeja passa a ler como uma
 * linha do tempo: o jogador vê o que já juntou e o que falta.
 */
export const insertTileGroupedInTray = (tray: Tile[], tile: Tile): Tile[] => {
  const groupIndexes = tray.reduce<number[]>((indexes, trayTile, index) => {
    if (trayTile.kind === tile.kind) {
      indexes.push(index);
    }

    return indexes;
  }, []);

  if (groupIndexes.length === 0) {
    return [...tray, tile];
  }

  const insertBeforeIndex = groupIndexes.find(
    (index) => compareRolesByCycleStep(tray[index].role, tile.role) > 0,
  );
  const targetIndex =
    insertBeforeIndex ?? groupIndexes[groupIndexes.length - 1] + 1;

  return [...tray.slice(0, targetIndex), tile, ...tray.slice(targetIndex)];
};

/**
 * Remove da bandeja a trinca fechada, se existir, conforme a regra ativa.
 */
export const removeCompletedTripleFromTray = (
  tray: Tile[],
  rule: MatchRule = activeMatchRule,
): TrayTripleRemoval => {
  const triple = rule.findCompletedTriple(tray);

  if (!triple || triple.length === 0) {
    return {
      removedTiles: [],
      tray,
    };
  }

  const tripleIds = new Set(triple.map((tile) => tile.id));

  return {
    removedKind: triple[0].kind,
    removedTiles: triple,
    tray: tray.filter((tile) => !tripleIds.has(tile.id)),
  };
};

/**
 * Variante restrita a um material — usada pela camada de compatibilidade e por
 * efeitos visuais que já sabem qual material fechou.
 */
export const removeCompletedTripleOfKind = (
  tray: Tile[],
  kind: TileKind,
  rule: MatchRule = activeMatchRule,
): Tile[] => {
  const triple = rule.selectTripleFrom(tray.filter((tile) => tile.kind === kind));

  if (!triple) {
    return tray;
  }

  const tripleIds = new Set(triple.map((tile) => tile.id));

  return tray.filter((tile) => !tripleIds.has(tile.id));
};

/** Papéis que ainda faltam para fechar a trinca de um material na bandeja. */
export const getMissingRolesForKind = (
  tray: Tile[],
  kind: TileKind,
  rule: MatchRule = activeMatchRule,
) => {
  const heldRoles = new Set(
    tray.filter((tile) => tile.kind === kind).map((tile) => tile.role),
  );

  return rule.buildTripleRoles().filter((role) => !heldRoles.has(role));
};
