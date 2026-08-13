import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { lightImpact, mediumImpact } from '../utils/haptics';

const igrionLogo = require('../../assets/igrion-logo.png');

type SplashIntroScreenProps = {
  onFinish: () => void;
};

type IntroParticle = {
  color: string;
  delay: number;
  rotate: string;
  size: number;
  x: number;
  y: number;
};

const INTRO_PARTICLES: IntroParticle[] = [
  { color: '#FFD35A', delay: 0, rotate: '18deg', size: 10, x: -138, y: -194 },
  { color: '#42E5A7', delay: 0.1, rotate: '-18deg', size: 8, x: 128, y: -166 },
  { color: '#FF6D9E', delay: 0.18, rotate: '45deg', size: 9, x: -152, y: 86 },
  { color: '#8FD8FF', delay: 0.26, rotate: '-45deg', size: 7, x: 148, y: 116 },
  { color: '#FFF4B8', delay: 0.32, rotate: '10deg', size: 6, x: -72, y: 184 },
  { color: '#C8B8FF', delay: 0.22, rotate: '-10deg', size: 8, x: 76, y: -218 },
];

export function SplashIntroScreen({ onFinish }: SplashIntroScreenProps) {
  const { height, width } = useWindowDimensions();
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const finishedRef = useRef(false);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.84)).current;
  const logoShine = useRef(new Animated.Value(0)).current;
  const presenterOpacity = useRef(new Animated.Value(0)).current;
  const presenterTranslateY = useRef(new Animated.Value(14)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.9)).current;
  const titleGlow = useRef(new Animated.Value(0)).current;
  const particleFloat = useRef(new Animated.Value(0)).current;
  const finalFlash = useRef(new Animated.Value(0)).current;
  const launchOpacity = useRef(new Animated.Value(0)).current;

  const finishIntro = useCallback(
    (withImpact = true) => {
      if (finishedRef.current) {
        return;
      }

      finishedRef.current = true;

      if (withImpact) {
        mediumImpact();
      }

      Animated.timing(screenOpacity, {
        duration: 300,
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onFinish();
        }
      });
    },
    [onFinish, screenOpacity],
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const addTimer = (callback: () => void, delay: number) => {
      const timer = setTimeout(callback, delay);
      timers.push(timer);
    };

    const logoAnimation = Animated.sequence([
      Animated.delay(170),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          duration: 480,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          friction: 7,
          tension: 90,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]);
    const logoShineAnimation = Animated.sequence([
      Animated.delay(650),
      Animated.timing(logoShine, {
        duration: 760,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);
    const copyAnimation = Animated.parallel([
      Animated.sequence([
        Animated.delay(980),
        Animated.parallel([
          Animated.timing(presenterOpacity, {
            duration: 360,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(presenterTranslateY, {
            duration: 360,
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(1480),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            duration: 330,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(titleScale, {
            friction: 5,
            tension: 150,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(titleGlow, {
            duration: 760,
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(2100),
        Animated.timing(launchOpacity, {
          duration: 420,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]);
    const particleAnimation = Animated.timing(particleFloat, {
      duration: 3350,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    const finalFlashAnimation = Animated.sequence([
      Animated.delay(2540),
      Animated.timing(finalFlash, {
        duration: 240,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(finalFlash, {
        duration: 460,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    logoAnimation.start();
    logoShineAnimation.start();
    copyAnimation.start();
    particleAnimation.start();
    finalFlashAnimation.start();

    addTimer(() => lightImpact(), 360);
    addTimer(() => lightImpact(), 1580);
    addTimer(() => finishIntro(true), 3400);

    return () => {
      timers.forEach(clearTimeout);
      logoAnimation.stop();
      logoShineAnimation.stop();
      copyAnimation.stop();
      particleAnimation.stop();
      finalFlashAnimation.stop();
    };
  }, [
    finalFlash,
    finishIntro,
    launchOpacity,
    logoOpacity,
    logoScale,
    logoShine,
    particleFloat,
    presenterOpacity,
    presenterTranslateY,
    titleGlow,
    titleOpacity,
    titleScale,
  ]);

  const logoWidth = Math.min(width * 0.68, 292);
  const titleWidth = Math.min(width * 0.86, 360);
  const shineTranslate = logoShine.interpolate({
    inputRange: [0, 1],
    outputRange: [-logoWidth * 0.72, logoWidth * 0.82],
  });
  const titleGlowScale = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.18],
  });
  const titleGlowOpacity = titleGlow.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.55, 0.22],
  });
  const finalFlashOpacity = finalFlash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.36],
  });

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
      <Pressable accessibilityRole="button" onPress={() => finishIntro(true)} style={styles.skipLayer}>
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <View style={styles.topWash} />
          <View style={styles.centerGlow} />
          <View style={styles.bottomShade} />
          <View style={styles.diagonalPanel} />
          <View style={[styles.glowRing, styles.glowRingTop]} />
          <View style={[styles.glowRing, styles.glowRingBottom]} />
          <Animated.View style={[styles.finalFlash, { opacity: finalFlashOpacity }]} />
          <View style={styles.particleLayer}>
            {INTRO_PARTICLES.map((particle, index) => {
              const opacity = particleFloat.interpolate({
                inputRange: [0, particle.delay, Math.min(1, particle.delay + 0.24), 1],
                outputRange: [0, 0, 0.78, 0.34],
              });
              const translateY = particleFloat.interpolate({
                inputRange: [0, 1],
                outputRange: [particle.y + 24, particle.y - 18],
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
                        { translateX: particle.x },
                        { translateY },
                        { rotate: particle.rotate },
                      ],
                      width: particle.size,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
          <View style={[styles.centerStage, height < 760 ? styles.centerStageCompact : null]}>
            <Animated.View
              style={[
                styles.logoStage,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <View accessibilityLabel="Logo IGRION" style={[styles.logoFrame, { width: logoWidth }]}>
                {logoLoadFailed ? (
                  <Text style={styles.logoFallback}>IGRION</Text>
                ) : (
                  <Image
                    resizeMode="contain"
                    source={igrionLogo}
                    style={styles.logoImage}
                    onError={() => setLogoLoadFailed(true)}
                  />
                )}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.logoShine,
                    {
                      transform: [{ translateX: shineTranslate }, { rotate: '-18deg' }],
                    },
                  ]}
                />
              </View>
            </Animated.View>

            <Animated.Text
              style={[
                styles.presenter,
                {
                  opacity: presenterOpacity,
                  transform: [{ translateY: presenterTranslateY }],
                },
              ]}
            >
              apresenta
            </Animated.Text>

            <View style={[styles.titleStage, { width: titleWidth }]}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.titleGlow,
                  {
                    opacity: titleGlowOpacity,
                    transform: [{ scale: titleGlowScale }],
                  },
                ]}
              />
              <Animated.Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[
                  styles.gameTitle,
                  {
                    opacity: titleOpacity,
                    transform: [{ scale: titleScale }],
                  },
                ]}
              >
                TRINCA MANIA
              </Animated.Text>
            </View>
          </View>

          <Animated.View style={[styles.launchBlock, { opacity: launchOpacity }]}>
            <View style={styles.launchTrack}>
              <View style={styles.launchFill} />
            </View>
          </Animated.View>
        </SafeAreaView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomShade: {
    backgroundColor: '#050711',
    bottom: -80,
    height: 300,
    left: 0,
    opacity: 0.9,
    position: 'absolute',
    right: 0,
  },
  centerGlow: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 211, 90, 0.18)',
    borderRadius: radii.pill,
    height: 260,
    position: 'absolute',
    top: '31%',
    width: 260,
  },
  centerStage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  centerStageCompact: {
    paddingTop: spacing.md,
  },
  diagonalPanel: {
    backgroundColor: '#5968FF',
    height: 170,
    left: -42,
    opacity: 0.12,
    position: 'absolute',
    right: -42,
    top: '39%',
    transform: [{ rotate: '-12deg' }],
  },
  finalFlash: {
    backgroundColor: '#FFF4B8',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  gameTitle: {
    color: colors.primary,
    fontSize: 37,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 212, 71, 0.52)',
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 12,
  },
  glowRing: {
    borderColor: 'rgba(255, 212, 71, 0.18)',
    borderRadius: 220,
    borderWidth: 2,
    height: 300,
    position: 'absolute',
    width: 300,
  },
  glowRingBottom: {
    bottom: -130,
    right: -104,
  },
  glowRingTop: {
    left: -128,
    top: 70,
  },
  launchBlock: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  launchFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: '100%',
    width: '72%',
  },
  launchTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 211, 90, 0.28)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 6,
    overflow: 'hidden',
    width: 92,
  },
  logoFallback: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xxl,
    fontWeight: '900',
    letterSpacing: 0,
  },
  logoFrame: {
    alignItems: 'center',
    aspectRatio: 2.05,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 244, 184, 0.28)',
    borderRadius: radii.card,
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    height: '100%',
    width: '100%',
  },
  logoShine: {
    backgroundColor: 'rgba(255, 255, 255, 0.44)',
    bottom: -28,
    position: 'absolute',
    top: -28,
    width: 34,
  },
  logoStage: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 212, 71, 0.24)',
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card,
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
    top: '50%',
    width: 1,
  },
  presenter: {
    color: colors.surfaceTint,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: spacing.xl,
    opacity: 0.86,
    textTransform: 'uppercase',
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#08051B',
    flex: 1,
  },
  skipLayer: {
    flex: 1,
  },
  titleGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.52)',
    borderRadius: radii.pill,
    height: 82,
    position: 'absolute',
    width: '100%',
  },
  titleStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 74,
  },
  topWash: {
    backgroundColor: '#1B1E58',
    height: 360,
    left: -40,
    opacity: 0.9,
    position: 'absolute',
    right: -40,
    top: -120,
    transform: [{ rotate: '-8deg' }],
  },
});
