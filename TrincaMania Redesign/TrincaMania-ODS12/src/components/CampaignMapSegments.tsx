import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { resolveCampaignMapSegmentAsset } from '../data/campaignMapAssets';
import type {
  CampaignMapSegment,
  CampaignMapSegmentLayer,
} from '../types/campaignMap';
import type { CampaignMapTransform } from '../utils/campaignMapLayout';

const LAYER_DEPTH: Record<CampaignMapSegmentLayer['role'], number> = {
  effect: 1,
  foreground: 2,
  terrain: 0,
};

type CampaignMapSegmentsProps = Readonly<{
  segments: readonly CampaignMapSegment[];
  transform: CampaignMapTransform;
}>;

export const CampaignMapSegments = memo(function CampaignMapSegments({
  segments,
  transform,
}: CampaignMapSegmentsProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.layer,
        {
          height: transform.contentHeight,
          width: transform.width,
        },
      ]}
    >
      {segments.map((segment) => (
        <View
          key={segment.id}
          style={[
            styles.segment,
            {
              height: segment.height * transform.scale,
              top: segment.top * transform.scale,
              width: transform.width,
            },
          ]}
        >
          {segment.layers.map((layer) => {
            const source = resolveCampaignMapSegmentAsset(layer.assetKey);

            if (!source) {
              return null;
            }

            return (
              <Image
                fadeDuration={0}
                key={layer.id}
                resizeMethod="resize"
                resizeMode="stretch"
                source={source}
                style={[
                  styles.segmentLayer,
                  { zIndex: LAYER_DEPTH[layer.role] },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  segment: {
    left: 0,
    position: 'absolute',
  },
  segmentLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
