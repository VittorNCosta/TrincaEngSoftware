import { type WorldId } from '../types/game';

export type MusicKey = 'meta' | WorldId;

/**
 * Mundos com trilha temática própria hoje (assets/audio/music/*.mp3, ver
 * WORLD_MUSIC_SOURCES em music.ts). Mantido como módulo puro (sem require de
 * asset, sem expo-audio, sem react-native) para poder ser testado com
 * node:test sem depender de ambiente nativo. Se um mundo aqui não tiver uma
 * entrada correspondente em WORLD_MUSIC_SOURCES, music.ts cai no fallback
 * trilha geral de qualquer forma — nunca quebra, só perde a trilha própria.
 */
export const WORLDS_WITH_OWN_MUSIC_TRACK: readonly WorldId[] = [1, 2, 3, 4, 21];

/**
 * Mundos sem trilha própria caem na trilha geral — decisão de produto: nunca
 * silêncio, nunca reaproveitar a trilha temática de outro mundo. Data-driven:
 * um mundo novo só precisa entrar em WORLDS_WITH_OWN_MUSIC_TRACK (e no source
 * real em music.ts) para ganhar trilha própria.
 */
export const resolveMusicKeyForWorld = (worldId: WorldId): MusicKey =>
  WORLDS_WITH_OWN_MUSIC_TRACK.includes(worldId) ? worldId : 'meta';
