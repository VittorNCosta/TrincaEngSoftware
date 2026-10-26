import type { ImageSourcePropType } from 'react-native';
type RaviExpression = 'default' | 'explain' | 'happy' | 'insufficient';

// Supplied paths on disk: assets/shop/v2 (without ui/).
export const SHOP_ASSETS = {
  background:
    require('../../../assets/original/shop/v2/shop_market_background.webp') as ImageSourcePropType,
  counter:
    require('../../../assets/original/shop/v2/shop_counter.webp') as ImageSourcePropType,
  priceTag:
    require('../../../assets/original/shop/v2/shop_price_tag.webp') as ImageSourcePropType,
  speechBubble:
    require('../../../assets/original/shop/v2/shop_speech_bubble.webp') as ImageSourcePropType,
  glow: require('../../../assets/original/shop/v2/shop_product_glow.webp') as ImageSourcePropType,
  extraTray:
    require('../../../assets/original/shop/v2/product_extra_tray.webp') as ImageSourcePropType,
};
export const RAVI_SHOP_ASSETS: Record<RaviExpression, ImageSourcePropType> = {
  default:
    require('../../../assets/original/characters/ravi/shop_default.webp') as ImageSourcePropType,
  explain:
    require('../../../assets/original/characters/ravi/shop_explain.webp') as ImageSourcePropType,
  happy:
    require('../../../assets/original/characters/ravi/shop_happy.webp') as ImageSourcePropType,
  insufficient:
    require('../../../assets/original/characters/ravi/shop_insufficient.webp') as ImageSourcePropType,
};
