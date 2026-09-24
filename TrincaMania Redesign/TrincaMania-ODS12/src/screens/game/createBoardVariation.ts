import { buildChapterLevel } from '../../data/chapters';
import type { GeneratedLevelOptions } from '../../types/game';
import { revealAvailableMysteryTiles } from '../../utils/gameLogic';
import { generatePlayableLevel } from '../../utils/levelGenerator';

// Mapa de capítulo não mora em `LEVELS`, e `generatePlayableLevel` cai em
// `LEVELS[0]` quando não acha o id — sem este desvio a fase de capítulo abriria
// com o tabuleiro de w1-001.
// Sem `options`, o mapa de capítulo nasce da semente estável do id: o jogador
// reencontra o tabuleiro que largou pela metade. O "tentar novamente" precisa
// passar um `random` próprio, senão devolve o layout idêntico enquanto a UI
// anuncia "Nova variação pronta." — a campanha re-sorteia e ele não.
export const createBoardVariation = (
  levelId: string,
  options: GeneratedLevelOptions = {},
) => {
  const chapterLevel = buildChapterLevel(levelId, options);

  return revealAvailableMysteryTiles(
    (chapterLevel ?? generatePlayableLevel(levelId, options)).tiles,
  );
};
