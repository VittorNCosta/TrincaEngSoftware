import { Image, Pressable, Text, View } from 'react-native';

const SIGN_ART = {
  open: require('../../assets/map/passage/trail_sign_waypost_open.png'),
  locked: require('../../assets/map/passage/trail_sign_waypost_locked.png'),
};

export function MapTrailSign({
  returning = false,
  locked,
  selected = false,
  label,
  accessibilityLabel,
  scale,
  onPress,
}: {
  returning?: boolean;
  locked: boolean;
  selected?: boolean;
  label: string;
  accessibilityLabel: string;
  scale: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: locked, selected }}
      onPress={onPress}
      testID={returning ? 'map-sign-previous' : 'map-sign-next'}
      style={({ pressed }) => [
        { width: 112 * scale, height: 128 * scale },
        pressed ? { opacity: 0.8 } : null,
      ]}
    >
      <Image
        accessible={false}
        source={locked ? SIGN_ART.locked : SIGN_ART.open}
        resizeMode="contain"
        style={{
          width: '100%',
          height: '100%',
          transform: [{ scaleX: returning ? -1 : 1 }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 24 * scale,
          left: 12 * scale,
          width: 88 * scale,
          backgroundColor: '#F4DFA0',
          borderRadius: 3 * scale,
          paddingVertical: 2 * scale,
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: 15 * scale,
            lineHeight: 18 * scale,
            textAlign: 'center',
            fontWeight: '900',
            color: '#56391D',
          }}
        >
          {returning ? '‹ ' : ''}
          {label}
          {returning ? '' : ' ›'}
        </Text>
      </View>
      <View
        testID={returning ? 'map-sign-ground-previous' : 'map-sign-ground-next'}
        style={{
          position: 'absolute',
          left: 55 * scale,
          top: 124 * scale,
          width: 2 * scale,
          height: 2 * scale,
        }}
      />
    </Pressable>
  );
}
