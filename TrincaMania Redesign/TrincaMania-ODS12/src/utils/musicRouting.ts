import { type WorldId } from '../types/game';

export type MusicKey = 'meta' | 1 | 2 | 3 | 4 | 21;

/** O mapa e todas as fases do mesmo mundo compartilham uma única faixa. */
export const resolveMusicKeyForWorld = (worldId: WorldId): MusicKey => {
  const campaignWorldId = worldId >= 101 ? worldId - 100 : worldId;

  switch (campaignWorldId) {
    case 1:
    case 2:
    case 3:
    case 4:
      return campaignWorldId;
    case 9:
      return 2;
    case 10:
      return 3;
    default:
      // Mundos 5–8 ainda não têm MP3 própria; usam a faixa do mundo bônus.
      return 21;
  }
};
