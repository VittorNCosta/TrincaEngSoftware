/** Shared geometry for the campaign shell chrome.
 *
 * These values describe the minimum shell, not map art. Keeping them in one
 * place prevents the map and navigation from inventing slightly different
 * clearances for the same phone viewport.
 */
// The map begins immediately below the fixed 48px HUD row.
export const CAMPAIGN_TOP_BAR_HEIGHT = 48;
export const CAMPAIGN_TOUCH_TARGET_SIZE = 48;

export const getCampaignMapViewportHeight = ({
  bottomInset,
  bottomNavHeight,
  screenHeight,
  topBarHeight = CAMPAIGN_TOP_BAR_HEIGHT,
  topInset,
}: Readonly<{
  bottomInset: number;
  bottomNavHeight: number;
  screenHeight: number;
  topBarHeight?: number;
  topInset: number;
}>) =>
  Math.max(
    0,
    screenHeight - topInset - topBarHeight - bottomNavHeight - bottomInset,
  );
