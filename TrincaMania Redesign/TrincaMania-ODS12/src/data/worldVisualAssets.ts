import type { ImageSourcePropType } from 'react-native';
import type { WorldId } from '../types/game';

export const WORLD_VISUAL_ASSETS: Record<
  number,
  { map: ImageSourcePropType; game: ImageSourcePropType }
> = {
  1: {
    map: require('../../assets/map/worlds/w01_parque_map.png'),
    game: require('../../assets/map/worlds/w01_parque_game.png'),
  },
  2: {
    map: require('../../assets/map/worlds/w02_vale_map.png'),
    game: require('../../assets/map/worlds/w02_vale_game.png'),
  },
  3: {
    map: require('../../assets/map/worlds/w03_central_map.png'),
    game: require('../../assets/map/worlds/w03_central_game.png'),
  },
  4: {
    map: require('../../assets/map/worlds/w04_viveiro_map.png'),
    game: require('../../assets/map/worlds/w04_viveiro_game.png'),
  },
  5: {
    map: require('../../assets/map/worlds/w05_usina_map.png'),
    game: require('../../assets/map/worlds/w05_usina_game.png'),
  },
  6: {
    map: require('../../assets/map/worlds/w06_cooperativa_map.png'),
    game: require('../../assets/map/worlds/w06_cooperativa_game.png'),
  },
  7: {
    map: require('../../assets/map/worlds/w07_rota_map.png'),
    game: require('../../assets/map/worlds/w07_rota_game.png'),
  },
  8: {
    map: require('../../assets/map/worlds/w08_forum_map.png'),
    game: require('../../assets/map/worlds/w08_forum_game.png'),
  },
  9: {
    map: require('../../assets/map/worlds/w09_distrito_map.png'),
    game: require('../../assets/map/worlds/w09_distrito_game.png'),
  },
  10: {
    map: require('../../assets/map/worlds/w10_cupula_map.png'),
    game: require('../../assets/map/worlds/w10_cupula_game.png'),
  },
};

// Os capítulos 101–110 usam as mesmas famílias de arte dos mundos 1–10.
export const getVisualWorldId = (worldId: WorldId): number =>
  worldId >= 101 ? worldId - 100 : worldId === 21 ? 4 : worldId;

export const getWorldVisualAssets = (worldId: WorldId) =>
  WORLD_VISUAL_ASSETS[getVisualWorldId(worldId)] ?? WORLD_VISUAL_ASSETS[1];
