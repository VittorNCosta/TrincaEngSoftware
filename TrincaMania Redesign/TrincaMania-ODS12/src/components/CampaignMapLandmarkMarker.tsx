import { ForestRestMapMarker } from './ForestRestMapMarker';
import { WorldPortalMapMarker } from './WorldPortalMapMarker';
import type { CampaignMapLandmarkKind } from '../types/campaignMap';

type CampaignMapLandmarkMarkerProps = Readonly<{
  afterLevelLabel?: string;
  kind: CampaignMapLandmarkKind;
  locked: boolean;
  selected: boolean;
  visualKey: string;
  worldLabel?: string;
  onPress: () => void;
}>;

export function CampaignMapLandmarkMarker({
  afterLevelLabel,
  kind,
  locked,
  selected,
  visualKey,
  worldLabel,
  onPress,
}: CampaignMapLandmarkMarkerProps) {
  if ((kind === 'rest' || kind === 'shop') && visualKey === 'forest-rest-cart') {
    if (!afterLevelLabel) {
      return null;
    }

    return (
      <ForestRestMapMarker
        afterLevelLabel={afterLevelLabel}
        locked={locked}
        selected={selected}
        onPress={onPress}
      />
    );
  }

  if (kind === 'portal' && visualKey === 'forest-portal-rune') {
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
