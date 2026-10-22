import { type WorldId } from '../types/game';

export type MusicKey = 'meta' | WorldId;
export const WORLDS_WITH_OWN_MUSIC_TRACK: readonly WorldId[] = [1, 2, 3, 21];

/** Mesma seleção do original; capítulos usam a família visual ODS12. */
export const resolveMusicKeyForWorld = (worldId: WorldId): MusicKey => {
  const family = (
    worldId >= 101 && worldId <= 110 ? worldId - 100 : worldId
  ) as WorldId;
  return WORLDS_WITH_OWN_MUSIC_TRACK.includes(family) ? family : 'meta';
};
