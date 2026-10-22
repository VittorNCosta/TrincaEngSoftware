import type { ImageSourcePropType } from 'react-native';

export type ProfileActionAssetKey =
  | 'backpack'
  | 'checkin'
  | 'cosmetics'
  | 'dailyChallenge'
  | 'diary'
  | 'howToPlay'
  | 'mastery'
  | 'missions'
  | 'powers'
  | 'recipes'
  | 'rewards'
  | 'secretLevels'
  | 'settings'
  | 'story'
  | 'worldPath';

/** Canonical Profile-only artwork registry. BottomNav assets live elsewhere. */
export const PROFILE_ACTION_ASSETS: Readonly<
  Record<ProfileActionAssetKey, ImageSourcePropType>
> = {
  backpack:
    require('../../../assets/original/profile/optimized/backpack.png') as ImageSourcePropType,
  checkin:
    require('../../../assets/original/profile/optimized/checkin.png') as ImageSourcePropType,
  cosmetics:
    require('../../../assets/original/profile/optimized/cosmetics.png') as ImageSourcePropType,
  dailyChallenge:
    require('../../../assets/original/profile/optimized/daily_challenge.png') as ImageSourcePropType,
  diary:
    require('../../../assets/original/profile/optimized/diary.png') as ImageSourcePropType,
  howToPlay:
    require('../../../assets/original/profile/optimized/how_to_play.png') as ImageSourcePropType,
  mastery:
    require('../../../assets/original/profile/optimized/mastery.png') as ImageSourcePropType,
  missions:
    require('../../../assets/original/profile/optimized/missions.png') as ImageSourcePropType,
  powers:
    require('../../../assets/original/profile/optimized/powers.png') as ImageSourcePropType,
  recipes:
    require('../../../assets/original/profile/optimized/recipes.png') as ImageSourcePropType,
  rewards:
    require('../../../assets/original/profile/optimized/rewards.png') as ImageSourcePropType,
  secretLevels:
    require('../../../assets/original/profile/optimized/secret_levels.png') as ImageSourcePropType,
  settings:
    require('../../../assets/original/profile/optimized/settings.png') as ImageSourcePropType,
  story:
    require('../../../assets/original/profile/optimized/story.png') as ImageSourcePropType,
  worldPath:
    require('../../../assets/original/profile/optimized/world_path.png') as ImageSourcePropType,
};

/** Deliberate corrections for transparent-canvas silhouettes. */
export const PROFILE_ACTION_ICON_SCALES: Readonly<
  Record<ProfileActionAssetKey, number>
> = {
  backpack: 1.14,
  checkin: 1,
  cosmetics: 0.98,
  dailyChallenge: 1.08,
  diary: 1.03,
  howToPlay: 1.01,
  mastery: 1.2,
  missions: 0.98,
  powers: 1.14,
  recipes: 1.04,
  rewards: 1.08,
  secretLevels: 1.02,
  settings: 1,
  story: 1.08,
  worldPath: 1.03,
};
