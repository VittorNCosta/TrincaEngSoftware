export const MENU_QA_VIEWPORT_WIDTHS = [320, 360, 392, 412] as const;

export function getMenuHeroArtworkSize(width: number) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 360;
  return Math.max(80, Math.min(104, Math.round(safeWidth * 0.24)));
}
