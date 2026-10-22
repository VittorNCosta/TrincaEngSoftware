import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, spacing } from '../../original/styles/theme';
import { mediumImpact } from '../../utils/haptics';
import { playTapSound, playTripleSounds } from '../../utils/sounds';
import {
  INTRO_MINIMUM_DURATION_MS,
  shouldFinishIntro,
} from '../../utils/startupIntro';
import { IntroTile } from './IntroTile';

const ORIGINAL_TILE = require('../../../assets/intro/original-apple.png');
const INTRO_TILE_SOURCES = [ORIGINAL_TILE, ORIGINAL_TILE, ORIGINAL_TILE];
const INTRO_BACKGROUND = require('../../../assets/intro/trinca-mania-premium-background.jpg');

type TrincaManiaIntroProps = {
  appReady?: boolean;
  onFinish: () => void;
};

type Particle = {
  color: string;
  delay: number;
  endX: number;
  endY: number;
  size: number;
  startX: number;
  startY: number;
};

const PARTICLES: Particle[] = [
  {
    color: '#FFD35A',
    delay: 0,
    endX: -136,
    endY: -116,
    size: 7,
    startX: -24,
    startY: -12,
  },
  {
    color: '#8FD8FF',
    delay: 0.08,
    endX: 130,
    endY: -96,
    size: 6,
    startX: 16,
    startY: -10,
  },
  {
    color: '#42E5A7',
    delay: 0.16,
    endX: -150,
    endY: 54,
    size: 8,
    startX: -12,
    startY: 14,
  },
  {
    color: '#C8B8FF',
    delay: 0.22,
    endX: 148,
    endY: 66,
    size: 7,
    startX: 12,
    startY: 18,
  },
  {
    color: '#FFF4B8',
    delay: 0.3,
    endX: -74,
    endY: 142,
    size: 5,
    startX: -6,
    startY: 18,
  },
  {
    color: '#FF8BC1',
    delay: 0.36,
    endX: 78,
    endY: 136,
    size: 6,
    startX: 8,
    startY: 22,
  },
  {
    color: '#BDFBFF',
    delay: 0.42,
    endX: -56,
    endY: -158,
    size: 5,
    startX: -4,
    startY: -8,
  },
  {
    color: '#FFD35A',
    delay: 0.48,
    endX: 54,
    endY: -152,
    size: 5,
    startX: 4,
    startY: -8,
  },
];

const BURST_SPARKS = [
  { color: '#FFD35A', endX: -72, endY: -48, size: 6 },
  { color: '#C8B8FF', endX: 70, endY: -42, size: 5 },
  { color: '#42E5A7', endX: -82, endY: 38, size: 6 },
  { color: '#FFF4B8', endX: 80, endY: 34, size: 5 },
  { color: '#FF8BC1', endX: -42, endY: 64, size: 5 },
  { color: '#8FD8FF', endX: 46, endY: 62, size: 5 },
];

const TILE_ACCENT = '#F0A332';

export function TrincaManiaIntro({
  appReady = true,
  onFinish,
}: TrincaManiaIntroProps) {
  const { height, width } = useWindowDimensions();
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [tileAssetsReady, setTileAssetsReady] = useState(false);
  const [reactVisualReady, setReactVisualReady] = useState(false);
  const [reactSurfaceExposed, setReactSurfaceExposed] = useState(false);
  const [nativeSplashReleased, setNativeSplashReleased] = useState(false);
  const [introTimelineStarted, setIntroTimelineStarted] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const backgroundLoadedRef = useRef(false);
  const tileAssetsReadyRef = useRef([false, false, false]);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const backgroundProgress = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.78)).current;
  const signatureOpacity = useRef(new Animated.Value(0)).current;
  const signatureTranslateY = useRef(new Animated.Value(10)).current;
  const tileProgress = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const matchPulse = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(new Animated.Value(0)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const revealBackground = useCallback(() => {
    if (backgroundLoadedRef.current) {
      return;
    }

    backgroundLoadedRef.current = true;
    Animated.timing(backgroundOpacity, {
      duration: 90,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        requestAnimationFrame(() => setBackgroundReady(true));
      }
    });
  }, [backgroundOpacity]);

  const handleTileAssetReady = useCallback((index: number) => {
    if (tileAssetsReadyRef.current[index]) {
      return;
    }

    tileAssetsReadyRef.current[index] = true;
    if (tileAssetsReadyRef.current.every(Boolean)) {
      setTileAssetsReady(true);
    }
  }, []);

  const handleReactSurfaceExposed = useCallback(() => {
    setReactSurfaceExposed(true);
  }, []);

  const assetsReady = backgroundReady && tileAssetsReady;

  useEffect(() => {
    if (!assetsReady || reactVisualReady) {
      return;
    }

    const frame = requestAnimationFrame(() => setReactVisualReady(true));
    return () => cancelAnimationFrame(frame);
  }, [assetsReady, reactVisualReady]);

  useEffect(() => {
    if (!reactVisualReady || !reactSurfaceExposed || nativeSplashReleased) {
      return;
    }

    // The generated Android splash auto-releases on the first Activity draw.
    // Keep this React surface tile-free for one frame before crossing that
    // boundary, so the intro timeline cannot advance behind the native splash.
    const frame = requestAnimationFrame(() => setNativeSplashReleased(true));
    return () => cancelAnimationFrame(frame);
  }, [nativeSplashReleased, reactSurfaceExposed, reactVisualReady]);

  useEffect(() => {
    if (!nativeSplashReleased || introTimelineStarted) {
      return;
    }

    const frame = requestAnimationFrame(() => setIntroTimelineStarted(true));
    return () => cancelAnimationFrame(frame);
  }, [introTimelineStarted, nativeSplashReleased]);

  const finishIntro = useCallback(() => {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    Animated.timing(screenOpacity, {
      duration: 260,
      easing: Easing.out(Easing.quad),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onFinishRef.current();
      }
    });
  }, [screenOpacity]);

  useEffect(() => {
    if (!introTimelineStarted) {
      return;
    }

    const minimumTimer = setTimeout(
      () => setMinimumElapsed(true),
      INTRO_MINIMUM_DURATION_MS,
    );

    return () => clearTimeout(minimumTimer);
  }, [introTimelineStarted]);

  useEffect(() => {
    if (!introTimelineStarted) {
      return;
    }

    const backgroundMotion = Animated.timing(backgroundProgress, {
      duration: INTRO_MINIMUM_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    const playIntroCue = (callback: () => void) => {
      if (AppState.currentState === 'active') {
        callback();
      }
    };
    const soundTimers = [
      setTimeout(() => {
        playIntroCue(() => {
          playTapSound();
        });
      }, 220),
      setTimeout(() => {
        playIntroCue(() => {
          playTapSound();
        });
      }, 355),
      setTimeout(() => {
        playIntroCue(() => {
          playTapSound();
        });
      }, 490),
      setTimeout(() => {
        playIntroCue(() => {
          playTripleSounds();
          mediumImpact();
        });
      }, 900),
    ];

    const tileAnimations = tileProgress.map((progress, index) =>
      Animated.sequence([
        Animated.delay(110 + index * 135),
        Animated.timing(progress, {
          duration: 500,
          easing: Easing.out(Easing.back(1.12)),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );
    const matchAnimation = Animated.sequence([
      Animated.delay(850),
      Animated.timing(matchPulse, {
        duration: 105,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(matchPulse, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);
    const particleAnimation = Animated.timing(particleProgress, {
      duration: 1300,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    const burstAnimation = Animated.sequence([
      Animated.delay(835),
      Animated.timing(burstProgress, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);
    const titleAnimation = Animated.sequence([
      Animated.delay(1080),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          duration: 260,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          friction: 6.5,
          tension: 125,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]);
    const signatureAnimation = Animated.sequence([
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(signatureOpacity, {
          duration: 360,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(signatureTranslateY, {
          duration: 360,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ]);
    const animations = [
      backgroundMotion,
      ...tileAnimations,
      matchAnimation,
      particleAnimation,
      burstAnimation,
      titleAnimation,
      signatureAnimation,
    ];

    animations.forEach((animation) => animation.start());

    return () => {
      soundTimers.forEach(clearTimeout);
      animations.forEach((animation) => animation.stop());
    };
  }, [
    backgroundProgress,
    burstProgress,
    introTimelineStarted,
    matchPulse,
    particleProgress,
    signatureOpacity,
    signatureTranslateY,
    tileProgress,
    titleOpacity,
    titleScale,
  ]);

  useEffect(() => {
    if (
      shouldFinishIntro({
        appReady,
        hasFinished: finishedRef.current,
        minimumElapsed,
      })
    ) {
      finishIntro();
    }
  }, [appReady, finishIntro, minimumElapsed]);

  const tileSize = Math.min(88, Math.max(76, width * 0.235));
  const tileOffset = Math.min(88, Math.max(78, width * 0.25));
  const titleSize = Math.min(43, Math.max(33, width * 0.11));
  const compact = height < 680;
  const backgroundScale = backgroundProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.018, 1],
  });
  const matchScale = matchPulse.interpolate({
    inputRange: [0, 0.35, 0.72, 1],
    outputRange: [1, 1.05, 0.98, 1],
  });
  const burstScale = burstProgress.interpolate({
    inputRange: [0, 0.28, 1],
    outputRange: [0.38, 1, 1.5],
  });
  const burstOpacity = burstProgress.interpolate({
    inputRange: [0, 0.2, 0.58, 1],
    outputRange: [0, 0.94, 0.24, 0],
  });
  const burstCoreScale = burstProgress.interpolate({
    inputRange: [0, 0.12, 0.3, 1],
    outputRange: [0.5, 1.18, 1, 1],
  });
  const burstFlashOpacity = burstProgress.interpolate({
    inputRange: [0, 0.08, 0.2, 0.46, 1],
    outputRange: [0, 0.9, 0.22, 0, 0],
  });

  return (
    <Pressable
      accessibilityLabel="Pular a introdução"
      accessibilityRole="button"
      testID="splash-skip"
      onPress={finishIntro}
      onLayout={handleReactSurfaceExposed}
      style={styles.screen}
    >
      <View pointerEvents="none" style={styles.backgroundBase} />
      <Animated.Image
        testID="intro-background"
        accessibilityIgnoresInvertColors
        onError={revealBackground}
        onLoad={revealBackground}
        resizeMode="cover"
        source={INTRO_BACKGROUND}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: backgroundOpacity,
            transform: [{ scale: backgroundScale }],
          },
        ]}
      />
      <LinearGradient
        colors={[
          'rgba(7, 24, 32, 0.3)',
          'rgba(7, 24, 32, 0.04)',
          'rgba(7, 24, 32, 0.16)',
          'rgba(7, 24, 32, 0.32)',
        ]}
        locations={[0, 0.32, 0.62, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: screenOpacity }]}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.burst,
              { opacity: burstOpacity, transform: [{ scale: burstScale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.burstSecondary,
              { opacity: burstOpacity, transform: [{ scale: burstScale }] },
            ]}
          />
          <View style={styles.particleLayer}>
            {PARTICLES.map((particle, index) => {
              const localDelay = particle.delay;
              const opacity = particleProgress.interpolate({
                inputRange: [0, localDelay, Math.min(1, localDelay + 0.22), 1],
                outputRange: [0, 0, 0.9, 0.25],
              });
              const translateX = particleProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [particle.startX, particle.endX],
              });
              const translateY = particleProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [particle.startY, particle.endY],
              });

              return (
                <Animated.View
                  key={`intro-particle-${index}`}
                  style={[
                    styles.particle,
                    {
                      backgroundColor: particle.color,
                      height: particle.size,
                      opacity,
                      transform: [
                        { translateX },
                        { translateY },
                        { rotate: '45deg' },
                      ],
                      width: particle.size,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={styles.safeArea}
        >
          <View
            style={[styles.content, compact ? styles.contentCompact : null]}
          >
            <Animated.View
              style={[
                styles.tileStage,
                compact ? styles.tileStageCompact : null,
                { transform: [{ scale: matchScale }] },
              ]}
            >
              {INTRO_TILE_SOURCES.map((source, index) => {
                const isLeft = index === 0;
                const isRight = index === 2;
                const finalX = isLeft ? -tileOffset : isRight ? tileOffset : 0;
                const startX = isLeft ? finalX - 76 : isRight ? finalX + 76 : 0;
                const startY = isLeft || isRight ? -78 : -112;
                const progress = tileProgress[index];
                const translateX = progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [startX, finalX],
                });
                const translateY = progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [startY, 0],
                });
                const rotate = progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    isLeft ? '-20deg' : isRight ? '20deg' : '-8deg',
                    '0deg',
                  ],
                });
                const scale = progress.interpolate({
                  inputRange: [0, 0.72, 1],
                  outputRange: [0.72, 1.06, 1],
                });

                return (
                  <Animated.View
                    key={`intro-tile-${index}`}
                    style={[
                      styles.tilePosition,
                      {
                        marginLeft: -tileSize / 2,
                        opacity: introTimelineStarted ? 1 : 0,
                        transform: [
                          { translateX },
                          { translateY },
                          { rotate },
                          { scale },
                        ],
                      },
                    ]}
                  >
                    <IntroTile
                      accessibilityLabel={`Peça ${index + 1} da trinca`}
                      testID={`intro-tile-${index + 1}`}
                      accent={TILE_ACCENT}
                      onAssetReady={() => handleTileAssetReady(index)}
                      size={tileSize}
                      source={source}
                    />
                  </Animated.View>
                );
              })}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.burstCore,
                  {
                    opacity: burstFlashOpacity,
                    transform: [{ scale: burstCoreScale }],
                  },
                ]}
              />
              {BURST_SPARKS.map((spark, index) => {
                const translateX = burstProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, spark.endX],
                });
                const translateY = burstProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, spark.endY],
                });

                return (
                  <Animated.View
                    key={`intro-burst-spark-${index}`}
                    pointerEvents="none"
                    style={[
                      styles.burstSpark,
                      {
                        backgroundColor: spark.color,
                        height: spark.size,
                        opacity: burstFlashOpacity,
                        transform: [
                          { translateX },
                          { translateY },
                          { rotate: '45deg' },
                        ],
                        width: spark.size,
                      },
                    ]}
                  />
                );
              })}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.matchHalo,
                  { opacity: burstOpacity, transform: [{ scale: burstScale }] },
                ]}
              />
            </Animated.View>

            <Animated.View
              accessibilityLabel="TRINCA MANIA"
              accessible
              style={[
                styles.brandBlock,
                { transform: [{ scale: titleScale }], opacity: titleOpacity },
              ]}
            >
              <View style={styles.logoLine}>
                <Text
                  accessible={false}
                  style={[
                    styles.logoWord,
                    styles.logoOutline,
                    { fontSize: titleSize },
                  ]}
                >
                  TRINCA
                </Text>
                <Text
                  adjustsFontSizeToFit
                  accessible={false}
                  numberOfLines={1}
                  style={[
                    styles.logoWord,
                    styles.logoTop,
                    { fontSize: titleSize },
                  ]}
                >
                  TRINCA
                </Text>
              </View>
              <View style={styles.logoLine}>
                <Text
                  accessible={false}
                  style={[
                    styles.logoWord,
                    styles.logoOutline,
                    { fontSize: titleSize * 0.96 },
                  ]}
                >
                  mania
                </Text>
                <Text
                  adjustsFontSizeToFit
                  accessible={false}
                  numberOfLines={1}
                  style={[
                    styles.logoWord,
                    styles.logoBottom,
                    { fontSize: titleSize * 0.96 },
                  ]}
                >
                  mania
                </Text>
              </View>
              <View style={styles.titleUnderline} />
            </Animated.View>

            <Animated.Text
              style={[
                styles.signature,
                {
                  opacity: signatureOpacity,
                  transform: [{ translateY: signatureTranslateY }],
                },
              ]}
            >
              by IGRION
            </Animated.Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundDeep,
  },
  brandBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 32, 0.42)',
    borderColor: 'rgba(255, 211, 90, 0.44)',
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.xs,
    minHeight: 112,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: '#FFD35A',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    width: '100%',
  },
  burst: {
    alignSelf: 'center',
    borderColor: 'rgba(255, 224, 105, 0.82)',
    borderRadius: 160,
    borderWidth: 3,
    height: 240,
    position: 'absolute',
    top: '35%',
    width: 240,
  },
  burstCore: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 211, 90, 0.28)',
    borderColor: 'rgba(255, 250, 207, 0.98)',
    borderRadius: 36,
    borderWidth: 2,
    height: 72,
    position: 'absolute',
    top: 48,
    width: 72,
  },
  burstSecondary: {
    alignSelf: 'center',
    borderColor: 'rgba(255, 236, 145, 0.58)',
    borderRadius: 140,
    borderWidth: 2,
    height: 184,
    position: 'absolute',
    top: '39%',
    width: 184,
  },
  burstSpark: {
    borderRadius: 3,
    left: '50%',
    position: 'absolute',
    top: 84,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  contentCompact: {
    paddingTop: spacing.sm,
  },
  logoBottom: {
    color: '#D765F1',
    textShadowColor: 'rgba(215, 101, 241, 0.35)',
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 7,
  },
  logoLine: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    position: 'relative',
  },
  logoOutline: {
    color: '#3D192B',
    left: 0,
    position: 'absolute',
    right: 0,
    textShadowColor: 'rgba(25, 8, 20, 0.94)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 4,
    top: 2,
  },
  logoTop: {
    color: '#FFD35A',
    textShadowColor: 'rgba(255, 211, 90, 0.34)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 6,
  },
  logoWord: {
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  matchHalo: {
    alignSelf: 'center',
    borderColor: 'rgba(255, 244, 184, 0.86)',
    borderRadius: 120,
    borderWidth: 3,
    height: 140,
    position: 'absolute',
    top: 16,
    width: 140,
  },
  particle: {
    borderRadius: 3,
    left: '50%',
    position: 'absolute',
    top: '50%',
  },
  particleLayer: {
    alignItems: 'center',
    height: 1,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: '42%',
    width: 1,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.backgroundDeep,
    flex: 1,
  },
  signature: {
    color: colors.gold,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginTop: spacing.xs,
  },
  tilePosition: {
    left: '50%',
    position: 'absolute',
    top: 42,
  },
  tileStage: {
    height: 170,
    marginBottom: spacing.sm,
    position: 'relative',
    width: '100%',
  },
  tileStageCompact: {
    height: 148,
  },
  titleUnderline: {
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    height: 3,
    marginTop: spacing.xs,
    opacity: 0.8,
    width: 74,
  },
});
