import { useEffect } from 'react';
import { type GameStatus, type WorldId } from '../types/game';
import {
  duckMusic,
  playMetaMusic,
  playWorldMusic,
  unduckMusic,
} from '../utils/music';

export function useGameMusic(
  worldId: WorldId,
  status: GameStatus,
  settingsVisible: boolean,
) {
  useEffect(() => {
    if (status === 'playing') playWorldMusic(worldId);
    else playMetaMusic();
    return () => playMetaMusic();
  }, [worldId, status]);

  useEffect(() => {
    if (!settingsVisible && status === 'playing') return;
    // Register the duck even when the persisted preference is muted, so
    // enabling music with a modal open also respects the reduced volume.
    duckMusic();
    return () => unduckMusic();
  }, [settingsVisible, status]);
}
