import { WorldPortalMapMarker } from './WorldPortalMapMarker';
import type { CampaignMapLandmarkKind } from '../types/campaignMap';

type CampaignMapLandmarkMarkerProps = Readonly<{
  kind: CampaignMapLandmarkKind;
  locked: boolean;
  selected: boolean;
  visualKey: string;
  worldLabel?: string;
  onPress: () => void;
}>;

export function CampaignMapLandmarkMarker({
  kind,
  locked,
  selected,
  visualKey,
  worldLabel,
  onPress,
}: CampaignMapLandmarkMarkerProps) {
  if (kind === 'portal' && visualKey === 'recycling-cycle') {
    if (!worldLabel) {
      return null;
    }

    return (
      <WorldPortalMapMarker
        locked={locked}
        selected={selected}
        worldLabel={worldLabel}
        onPress={onPress}
      />
    );
  }

  return null;
}
