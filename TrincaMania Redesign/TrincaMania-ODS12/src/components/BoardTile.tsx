import { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { TileIcon } from './TileIcon';
import { radii } from '../styles/theme';
import { Tile } from '../types/game';
import { WindowTarget } from '../types/ui';
import { TILE_SIZE } from '../utils/gameLogic';
import { playBlockedSound } from '../utils/sounds';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BoardTileProps = {
  tile: Tile;
  blocked: boolean;
  boardOriginX: number;
  boardOriginY: number;
  disabled: boolean;
  highlighted: boolean;
  onLayoutInWindow?: (tileId: string, target: WindowTarget) => void;
  onBlockedPress?: () => void;
  onPress: (tileId: string) => void;
};

function BoardTileBase({
  tile,
  blocked,
  boardOriginX,
  boardOriginY,
  disabled,
  highlighted,
  onLayoutInWindow,
  onBlockedPress,
  onPress,
}: BoardTileProps) {
  const isDisabled = disabled;
  const isMysteryHidden = tile.mystery === true && tile.revealed !== true;
  const tileRef = useRef<View>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const tapFlash = useRef(new Animated.Value(0)).current;
  const blockedFlash = useRef(new Animated.Value(0)).current;
  const revealFlash = useRef(new Animated.Value(0)).current;
  const wasMysteryHiddenRef = useRef(isMysteryHidden);
  const lastBlockedSoundAtRef = useRef(0);

  useEffect(
    () => () => {
      scale.stopAnimation();
      shake.stopAnimation();
      tapFlash.stopAnimation();
      blockedFlash.stopAnimation();
      revealFlash.stopAnimation();
    },
    [blockedFlash, revealFlash, scale, shake, tapFlash],
  );

  useEffect(() => {
    if (!highlighted || blocked) {
      scale.stopAnimation();
      scale.setValue(1);
      return undefined;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          duration: 420,
          toValue: 1.09,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          duration: 420,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [blocked, highlighted, scale]);

  useEffect(() => {
    if (
      wasMysteryHiddenRef.current &&
      tile.mystery === true &&
      tile.revealed === true
    ) {
      revealFlash.setValue(0);
      Animated.sequence([
        Animated.timing(revealFlash, {
          duration: 120,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(revealFlash, {
          duration: 360,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }

    wasMysteryHiddenRef.current = isMysteryHidden;
  }, [isMysteryHidden, revealFlash, tile.mystery, tile.revealed]);

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      friction: 8,
      tension: 180,
      toValue: value,
      useNativeDriver: true,
    }).start();
  };

  const playBlockedShake = () => {
    shake.stopAnimation();
    blockedFlash.stopAnimation();
    shake.setValue(0);
    blockedFlash.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(shake, {
          duration: 45,
          toValue: 1.15,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          duration: 45,
          toValue: -1.15,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          duration: 45,
          toValue: 0.7,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          duration: 45,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(blockedFlash, {
          duration: 60,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(blockedFlash, {
          duration: 180,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const playTapFlash = () => {
    tapFlash.setValue(0);
    Animated.sequence([
      Animated.timing(tapFlash, {
        duration: 80,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(tapFlash, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const reportLayout = useCallback(() => {
    if (!onLayoutInWindow) {
      return;
    }

    requestAnimationFrame(() => {
      tileRef.current?.measureInWindow((x, y, width, height) => {
        onLayoutInWindow(tile.id, { height, width, x, y });
      });
    });
  }, [onLayoutInWindow, tile.id]);

  const shakeOffset = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });

  return (
    <AnimatedPressable
      ref={tileRef}
      accessibilityLabel={`${isMysteryHidden ? 'Peça misteriosa' : `Peça ${tile.emoji}`}${
        blocked ? ', bloqueada' : ''
      }`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled || blocked }}
      // O rótulo de acessibilidade não identifica uma peça: `Peça 🧴` cabe em
      // várias ao mesmo tempo, por construção. Sem um identificador estável,
      // nenhum teste consegue dizer "toque *nesta* peça" — e sem isso não dá
      // para jogar uma fase pela interface, só verificar que ela renderiza.
      testID={`board-tile-${tile.id}`}
      disabled={isDisabled}
      onPress={() => {
        if (blocked) {
          playBlockedShake();
          const now = Date.now();

          if (now - lastBlockedSoundAtRef.current >= 180) {
            lastBlockedSoundAtRef.current = now;
            playBlockedSound();
          }
          onBlockedPress?.();
          return;
        }

        playTapFlash();
        reportLayout();
        onPress(tile.id);
      }}
      onLayout={reportLayout}
      onPressIn={() => {
        if (!blocked && !isDisabled) {
          animateTo(0.91);
        }
      }}
      onPressOut={() => {
        if (!highlighted) {
          animateTo(1);
        }
      }}
      style={[
        styles.tile,
        blocked ? styles.blocked : styles.available,
        isMysteryHidden ? styles.mysteryTile : null,
        isMysteryHidden && blocked ? styles.mysteryTileBlocked : null,
        highlighted && !blocked ? styles.highlighted : null,
        disabled ? styles.disabled : null,
        {
          elevation: tile.z + 3,
          left: tile.x - boardOriginX,
          top: tile.y - boardOriginY,
          transform: [{ translateX: shakeOffset }, { scale }],
          zIndex: tile.z * 10,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.tapFlash, { opacity: tapFlash }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.blockedFlash, { opacity: blockedFlash }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.revealFlash, { opacity: revealFlash }]}
      />
      <View pointerEvents="none" style={styles.innerBottomShade} />
      <View pointerEvents="none" style={styles.specular} />
      {isMysteryHidden ? (
        <View
          style={[
            styles.mysteryMarkWrap,
            blocked ? styles.mysteryMarkWrapBlocked : null,
          ]}
        >
          <Text
            style={[
              styles.mysteryMark,
              blocked ? styles.mysteryMarkBlocked : null,
            ]}
          >
            ?
          </Text>
        </View>
      ) : (
        <View pointerEvents="none" style={blocked ? styles.blockedIcon : null}>
          <TileIcon
            fallbackEmoji={tile.emoji}
            highlighted={highlighted && !blocked}
            kind={tile.kind}
            role={tile.role}
            size={38}
          />
        </View>
      )}
      {blocked && !isMysteryHidden ? (
        <>
          <View pointerEvents="none" style={styles.blockedVeil}>
            <View style={styles.blockedVeilShade} />
          </View>
          <View pointerEvents="none" style={styles.blockedBadge}>
            <View style={styles.lockShackle} />
            <View style={styles.lockBody}>
              <View style={styles.lockKeyhole} />
            </View>
          </View>
        </>
      ) : null}
      {highlighted && !blocked ? (
        <View pointerEvents="none" style={styles.hintGlow} />
      ) : null}
    </AnimatedPressable>
  );
}

export const BoardTile = memo(BoardTileBase);

const styles = StyleSheet.create({
  available: {
    opacity: 1,
  },
  blocked: {
    backgroundColor: '#C7C0AF',
    borderBottomColor: '#706958',
    borderColor: '#918A78',
    opacity: 1,
    shadowOpacity: 0.16,
  },
  blockedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(27, 35, 48, 0.74)',
    borderColor: 'rgba(230, 237, 247, 0.68)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 16,
    justifyContent: 'center',
    position: 'absolute',
    right: 3,
    top: 3,
    width: 16,
    zIndex: 7,
  },
  blockedIcon: {
    opacity: 0.76,
  },
  blockedVeil: {
    backgroundColor: 'rgba(24, 31, 38, 0.14)',
    borderRadius: 19,
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 4,
  },
  // Sombra interna na base do véu: dá o mesmo assentamento do inset do kit.
  blockedVeilShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderBottomLeftRadius: 19,
    borderBottomRightRadius: 19,
    height: 11,
    width: '100%',
  },
  blockedFlash: {
    backgroundColor: 'rgba(240, 82, 120, 0.28)',
    borderColor: '#FFC0CE',
    borderRadius: 16,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 5,
  },
  disabled: {
    opacity: 0.64,
  },
  highlighted: {
    backgroundColor: '#FFF6C8',
    shadowColor: '#FFD35A',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.58,
    shadowRadius: 8,
  },
  mysteryMark: {
    color: '#F8F2FF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    textShadowColor: 'rgba(114, 236, 255, 0.7)',
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 6,
  },
  mysteryMarkBlocked: {
    color: 'rgba(248, 242, 255, 0.82)',
    textShadowColor: 'rgba(114, 236, 255, 0.38)',
    textShadowRadius: 3,
  },
  mysteryMarkWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(126, 77, 232, 0.66)',
    borderColor: 'rgba(242, 236, 255, 0.9)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  mysteryMarkWrapBlocked: {
    backgroundColor: 'rgba(105, 83, 163, 0.56)',
    borderColor: 'rgba(225, 218, 247, 0.68)',
  },
  mysteryTile: {
    backgroundColor: '#4B2E89',
    borderBottomColor: '#211046',
    borderColor: '#C7B6FF',
  },
  mysteryTileBlocked: {
    backgroundColor: '#4B4A68',
    borderBottomColor: '#302F49',
    borderColor: '#8582A7',
  },
  revealFlash: {
    backgroundColor: 'rgba(86, 225, 235, 0.22)',
    borderColor: '#7DEEF4',
    borderRadius: 16,
    borderWidth: 3,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 6,
  },
  hintGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.34)',
    borderColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 3,
    bottom: 2,
    left: 2,
    position: 'absolute',
    right: 2,
    top: 2,
  },
  // Tratamento 4 · Jelly/Candy: um único corpo de doce, sem face aninhada.
  // A face creme dentro do tile creme era o que fazia a fruta sumir.
  tile: {
    alignItems: 'center',
    backgroundColor: '#FFE7A6',
    borderBottomColor: '#C9922F',
    borderBottomWidth: 5,
    borderColor: '#FFF5D3',
    borderRadius: 19,
    borderWidth: 2,
    height: TILE_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#04131A',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 13,
    width: TILE_SIZE,
  },
  // Sombra interna na base — o doce assenta em vez de flutuar.
  innerBottomShade: {
    backgroundColor: 'rgba(161, 99, 20, 0.24)',
    borderBottomLeftRadius: 19,
    borderBottomRightRadius: 19,
    bottom: 0,
    height: 10,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  lockBody: {
    alignItems: 'center',
    backgroundColor: '#E7EDF0',
    borderRadius: 3,
    height: 7,
    justifyContent: 'center',
    marginTop: -1,
    width: 9,
  },
  lockKeyhole: {
    backgroundColor: '#3E4850',
    borderRadius: radii.pill,
    height: 3,
    width: 1.5,
  },
  lockShackle: {
    borderColor: '#E7EDF0',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    height: 5,
    width: 7,
  },
  // Domo de luz no canto superior esquerdo.
  specular: {
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: radii.pill,
    height: 11,
    left: 7,
    position: 'absolute',
    top: 4,
    width: 21,
  },
  tapFlash: {
    backgroundColor: 'rgba(255, 211, 90, 0.28)',
    borderColor: '#FFD35A',
    borderRadius: 16,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 5,
  },
});
