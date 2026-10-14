import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TileIcon } from '../components/TileIcon';
import { colors } from '../styles/theme';
import { mediumImpact } from '../utils/haptics';
import { playTileSelectSound, playTripleSounds } from '../utils/sounds';

const INTRO_BACKGROUND = require('../../assets/map/worlds/w01_parque_game.png');
const TRINCAMANIA_ODS_LOGO = require('../../assets/icon.png');
const IGRION_GAMES_LOGO = require('../../assets/igrion-games-cobra-dourada.jpg');
const INTRO_ROLES = ['residuo', 'lixeira', 'simbolo'] as const;
const INTRO_LABELS = [
  'Resíduo de plástico',
  'Lixeira de plástico',
  'Reciclagem de plástico',
];

type SplashIntroScreenProps = {
  appReady?: boolean;
  onFinish: () => void;
};

/** A coreografia de três peças do TrincaMania original, com o ciclo ODS 12. */
export function SplashIntroScreen({
  appReady = true,
  onFinish,
}: SplashIntroScreenProps) {
  const { height, width } = useWindowDimensions();
  const compact = height < 680;
  const tileSize = Math.min(84, Math.max(66, width * 0.22));
  const tileOffset = Math.min(91, Math.max(76, width * 0.25));
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const backgroundScale = useRef(new Animated.Value(1.025)).current;
  const tileProgress = useRef(
    INTRO_ROLES.map(() => new Animated.Value(0)),
  ).current;
  const matchPulse = useRef(new Animated.Value(0)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(0.8)).current;
  const signatureOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const finishIntro = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    Animated.timing(screenOpacity, {
      duration: 260,
      easing: Easing.out(Easing.quad),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinishRef.current();
    });
  }, [screenOpacity]);

  useEffect(() => {
    const visualAnimations = [
      Animated.timing(backgroundScale, {
        duration: 2700,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      ...tileProgress.map((progress, index) =>
        Animated.sequence([
          Animated.delay(110 + index * 135),
          Animated.timing(progress, {
            duration: 500,
            easing: Easing.out(Easing.back(1.12)),
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.sequence([
        Animated.delay(850),
        Animated.timing(matchPulse, {
          duration: 110,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(matchPulse, {
          duration: 220,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(835),
        Animated.timing(burstProgress, {
          duration: 540,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(1080),
        Animated.parallel([
          Animated.timing(brandOpacity, {
            duration: 290,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(brandScale, {
            friction: 6.5,
            tension: 125,
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(1440),
        Animated.timing(signatureOpacity, {
          duration: 360,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ];
    visualAnimations.forEach((animation) => animation.start());
    const soundTimers = [220, 355, 490].map((delay) =>
      setTimeout(() => {
        if (AppState.currentState === 'active') void playTileSelectSound();
      }, delay),
    );
    soundTimers.push(
      setTimeout(() => {
        if (AppState.currentState === 'active') {
          void playTripleSounds();
          mediumImpact();
        }
      }, 900),
    );
    const finishTimer = setTimeout(() => setMinimumElapsed(true), 2700);
    return () => {
      clearTimeout(finishTimer);
      soundTimers.forEach(clearTimeout);
      visualAnimations.forEach((animation) => animation.stop());
    };
  }, [
    backgroundScale,
    brandOpacity,
    brandScale,
    burstProgress,
    matchPulse,
    signatureOpacity,
    tileProgress,
  ]);

  useEffect(() => {
    if (appReady && minimumElapsed) finishIntro();
  }, [appReady, finishIntro, minimumElapsed]);

  const pulseScale = matchPulse.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 1.06, 1],
  });
  const burstScale = burstProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.6],
  });
  const burstOpacity = burstProgress.interpolate({
    inputRange: [0, 0.18, 0.55, 1],
    outputRange: [0, 0.9, 0.38, 0],
  });

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
      <Animated.Image
        accessible={false}
        resizeMode="cover"
        source={INTRO_BACKGROUND}
        style={[
          StyleSheet.absoluteFill,
          {
            width: '100%',
            height: '100%',
            transform: [{ scale: backgroundScale }],
          },
        ]}
      />
      <LinearGradient
        colors={[
          'rgba(7, 24, 32, 0.63)',
          'rgba(7, 24, 32, 0.38)',
          'rgba(7, 24, 32, 0.8)',
        ]}
        locations={[0, 0.42, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', '#000000', '#000000']}
        locations={[0, 0.55, 1]}
        pointerEvents="none"
        style={styles.publisherBackdrop}
      />
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={styles.safeArea}
      >
        <Pressable
          accessibilityLabel="Pular a introdução"
          accessibilityRole="button"
          onPress={finishIntro}
          style={styles.skipButton}
          testID="splash-skip"
        >
          <Text style={styles.skipText}>Pular</Text>
        </Pressable>
        <View style={[styles.content, compact ? styles.contentCompact : null]}>
          <Animated.View
            style={[styles.tileStage, { transform: [{ scale: pulseScale }] }]}
          >
            {INTRO_ROLES.map((role, index) => {
              const isLeft = index === 0;
              const isRight = index === 2;
              const finalX = isLeft ? -tileOffset : isRight ? tileOffset : 0;
              const startX = isLeft ? finalX - 76 : isRight ? finalX + 76 : 0;
              const progress = tileProgress[index];
              const translateX = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [startX, finalX],
              });
              const translateY = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [isLeft || isRight ? -78 : -112, 0],
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
                  accessibilityLabel={INTRO_LABELS[index]}
                  key={role}
                  style={[
                    styles.tile,
                    {
                      width: tileSize,
                      height: tileSize,
                      marginLeft: -tileSize / 2,
                      transform: [
                        { translateX },
                        { translateY },
                        { rotate },
                        { scale },
                      ],
                    },
                  ]}
                >
                  <TileIcon
                    cardId="plastico:residuo:garrafa-pet"
                    fallbackEmoji="Garrafa PET"
                    kind="plastico"
                    role={role}
                    size={tileSize * 0.73}
                  />
                </Animated.View>
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
            style={[
              styles.brand,
              { opacity: brandOpacity, transform: [{ scale: brandScale }] },
            ]}
          >
            <Image
              accessible={false}
              source={TRINCAMANIA_ODS_LOGO}
              style={styles.gameLogo}
            />
            <Text
              style={[
                styles.title,
                { fontSize: Math.min(42, Math.max(31, width * 0.095)) },
              ]}
            >
              Trinca<Text style={styles.titleAccent}>Mania</Text>
            </Text>
            <Text style={styles.odsLabel}>ODS 12 · CONSUMO RESPONSÁVEL</Text>
          </Animated.View>
        </View>
        <Animated.View
          style={[styles.publisher, { opacity: signatureOpacity }]}
        >
          <Image
            accessible
            accessibilityLabel="Igrion Games, cobra dourada"
            resizeMode="contain"
            source={IGRION_GAMES_LOGO}
            style={styles.publisherLogo}
          />
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.backgroundDeep, flex: 1 },
  safeArea: { flex: 1 },
  skipButton: {
    alignSelf: 'flex-end',
    borderColor: '#ffffff7a',
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 20,
    marginTop: 12,
    minHeight: 44,
    minWidth: 72,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  skipText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 64,
  },
  contentCompact: { paddingBottom: 16 },
  tileStage: { height: 154, width: '100%', maxWidth: 390, marginBottom: 8 },
  tile: {
    alignItems: 'center',
    backgroundColor: colors.creamLight,
    borderColor: colors.gold,
    borderRadius: 22,
    borderWidth: 2,
    elevation: 8,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    shadowColor: '#071820',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 12,
    top: 40,
  },
  matchHalo: {
    alignSelf: 'center',
    borderColor: '#ffed9e',
    borderRadius: 90,
    borderWidth: 4,
    height: 140,
    position: 'absolute',
    top: 10,
    width: 140,
  },
  brand: { alignItems: 'center', width: '100%' },
  gameLogo: { borderRadius: 24, height: 120, width: 120 },
  title: {
    color: '#fff9e8',
    fontWeight: '900',
    letterSpacing: -1.7,
    marginTop: 12,
    textAlign: 'center',
    textShadowColor: '#071820b3',
    textShadowOffset: { height: 3, width: 0 },
    textShadowRadius: 12,
  },
  titleAccent: { color: colors.gold },
  odsLabel: {
    color: '#e1f1dc',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginTop: 8,
    textAlign: 'center',
  },
  publisherBackdrop: {
    bottom: 0,
    height: 200,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  publisher: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  publisherLogo: { height: 86, width: 172 },
});
