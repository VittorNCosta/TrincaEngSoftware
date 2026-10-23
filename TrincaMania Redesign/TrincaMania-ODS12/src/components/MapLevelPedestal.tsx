import { memo, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from './svgPrimitives';
import type { MapLevelNode } from './MapLevelNode';
import { GameIcon } from './GameIcon';
import { getLevelDisplayLabel } from '../utils/levelDisplay';

type Props = ComponentProps<typeof MapLevelNode> & { scale: number };

/** Pedestal baixo: superfície, espessura e sombra compartilham o ponto de apoio. */
export const MapLevelPedestal = memo(function MapLevelPedestal({
  completed,
  current,
  level,
  locked,
  selected,
  stars,
  onPress,
  scale,
}: Props) {
  const label = getLevelDisplayLabel(level);
  const state = locked
    ? 'bloqueada'
    : current
      ? 'jogar agora'
      : completed
        ? `concluída com ${stars} de 3 estrelas`
        : 'liberada';
  const rim = locked ? '#7D8E85' : current ? '#E7AE32' : '#3E9B70';
  const surface = locked ? '#CCD4C9' : current ? '#FFF0A8' : '#DFF3C6';
  const width = Math.max(44, 80 * scale);
  const height = Math.max(44, 84 * scale);
  return (
    <Pressable
      accessibilityLabel={`Fase ${label}, ${state}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked, selected }}
      testID={`map-level-${level.id}`}
      onPress={() => onPress(level.id)}
      style={({ pressed }) => [
        { width, height },
        pressed ? styles.pressed : null,
      ]}
    >
      <View
        testID={`map-level-frame-${level.id}`}
        pointerEvents="none"
        style={{ width: 80 * scale, height: 84 * scale, alignSelf: 'center' }}
      >
        <Svg
          accessible={false}
          width={80 * scale}
          height={84 * scale}
          viewBox="0 0 80 84"
        >
          <Ellipse
            cx="40"
            cy="72"
            rx="37"
            ry="7"
            fill="#2B2418"
            opacity={0.3}
          />
          {selected || current ? (
            <Ellipse
              cx="40"
              cy="70"
              rx="38"
              ry="10"
              fill="none"
              stroke="#FFF2B0"
              strokeWidth="2"
            />
          ) : null}
          <Path
            d="M7 43v15c0 10 15 17 33 17s33-7 33-17V43Z"
            fill="#6D7563"
            stroke="#495443"
            strokeWidth="2"
          />
          <Path d="M9 49v10c5 8 16 12 30 13V55Z" fill="#939882" />
          <Path d="M41 56v16c13-1 23-5 29-12V49Z" fill="#59674E" />
          <Path d="M22 57v10m34-10v10" stroke="#4E5B45" strokeWidth="2" />
          <Ellipse
            cx="40"
            cy="43"
            rx="33"
            ry="18"
            fill={rim}
            stroke="#EEE4B8"
            strokeWidth="2"
          />
          <Ellipse
            cx="40"
            cy="41"
            rx="27"
            ry="13"
            fill={surface}
            stroke={rim}
            strokeWidth="1.5"
          />
          <Path
            d="M19 36c9-7 25-8 38-2"
            stroke="#FFFCE5"
            strokeWidth="2"
            fill="none"
            opacity={0.8}
          />
        </Svg>
        <View
          testID={`map-level-ground-${level.id}`}
          style={{
            position: 'absolute',
            left: 39 * scale,
            top: 71 * scale,
            width: 2 * scale,
            height: 2 * scale,
          }}
        />
        <Text
          testID={`map-level-number-${level.id}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            position: 'absolute',
            top: 26 * scale,
            width: '100%',
            height: 30 * scale,
            textAlign: 'center',
            fontSize: (label.length > 2 ? 20 : 25) * scale,
            lineHeight: 30 * scale,
            fontWeight: '900',
            color: locked ? '#475A4B' : '#26472F',
          }}
        >
          {label}
        </Text>
        {locked || completed ? (
          <View
            style={{ position: 'absolute', right: 5 * scale, top: 18 * scale }}
          >
            <GameIcon
              name={locked ? 'lock' : 'check'}
              size={Math.max(10, 15 * scale)}
              tone={locked ? 'neutral' : 'green'}
              variant="plain"
            />
          </View>
        ) : null}
        {!locked && !current ? (
          <View
            testID={`map-level-rating-${level.id}`}
            style={{
              position: 'absolute',
              top: 57 * scale,
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {[0, 1, 2].map((index) => (
              <Text
                key={index}
                accessible={false}
                style={{
                  color: index < stars ? '#FFE165' : '#B9C7B0',
                  fontSize: 13 * scale,
                  lineHeight: 16 * scale,
                }}
              >
                ★
              </Text>
            ))}
          </View>
        ) : null}
        {current ? (
          <View
            style={{
              position: 'absolute',
              top: 59 * scale,
              left: 12 * scale,
              width: 56 * scale,
              borderRadius: 8 * scale,
              backgroundColor: '#7B3E24',
              borderColor: '#FFE6AD',
              borderWidth: 1,
            }}
          >
            <Text
              style={{
                color: '#FFF9DD',
                textAlign: 'center',
                fontWeight: '800',
                fontSize: 13 * scale,
                lineHeight: 17 * scale,
              }}
            >
              Jogar
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({ pressed: { opacity: 0.8 } });
