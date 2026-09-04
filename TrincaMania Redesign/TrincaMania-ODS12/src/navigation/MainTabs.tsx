import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { BottomNavBar, MAIN_TAB_ITEMS } from '../components/BottomNavBar';
import { LevelSelectScreen } from '../screens/LevelSelectScreen';
import { PowersScreen } from '../screens/PowersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { LivesState } from '../storage/livesStorage';
import {
  TrayBoostPurchaseResult,
  TrayBoostState,
} from '../storage/trayBoostStorage';
import {
  ProgressState,
  RestCheckpointRewardResult,
  WorldId,
} from '../types/game';
import { WindowTarget } from '../types/ui';

const MAP_TAB_INDEX = 0;
const PROFILE_TAB_INDEX = MAIN_TAB_ITEMS.findIndex(
  (item) => item.key === 'profile',
);

type MainTabsProps = {
  activeTrayCapacity: number;
  bonusTraySlotRemainingMs: number;
  coinTraySlotRemainingMs: number;
  initialWorldId?: WorldId;
  livesState: LivesState;
  progress: ProgressState;
  trayBoostState: TrayBoostState;
  timeUntilNextLifeMs: number;
  onCoinCounterLayout?: (target: WindowTarget) => void;
  onOpenChapters: () => void;
  onOpenRestCheckpoint: (
    afterLevelId: string,
  ) => Promise<RestCheckpointRewardResult>;
  onOpenSettings: () => void;
  onOpenShop: (worldId?: WorldId) => void;
  onOpenWorldChest: (worldChestId?: string) => void;
  onPurchaseCoinTraySlot: () => Promise<TrayBoostPurchaseResult>;
  onResetProgress: () => void;
  onSelectLevel: (levelId: string) => void;
  onShowTutorial: () => void;
};

/**
 * Abas principais do app: Mapa · Recompensas · Poderes · Perfil.
 * A troca acontece por toque na barra inferior ou por arraste lateral — o
 * ScrollView externo com pagingEnabled arbitra o gesto com a rolagem do mapa.
 */
export function MainTabs({
  activeTrayCapacity,
  bonusTraySlotRemainingMs,
  coinTraySlotRemainingMs,
  initialWorldId,
  livesState,
  progress,
  trayBoostState,
  timeUntilNextLifeMs,
  onCoinCounterLayout,
  onOpenChapters,
  onOpenRestCheckpoint,
  onOpenSettings,
  onOpenShop,
  onOpenWorldChest,
  onPurchaseCoinTraySlot,
  onResetProgress,
  onSelectLevel,
  onShowTutorial,
}: MainTabsProps) {
  const window = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(MAP_TAB_INDEX);
  const [activeIndex, setActiveIndex] = useState(MAP_TAB_INDEX);
  // A largura da página precisa bater com a do pager, senão o pagingEnabled para
  // entre duas abas. O layout real vale mais do que a janela (insets laterais).
  const [pageSize, setPageSize] = useState({
    height: window.height,
    width: window.width,
  });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    if (height <= 0 || width <= 0) {
      return;
    }

    setPageSize((current) =>
      current.height === height && current.width === width
        ? current
        : { height, width },
    );
  }, []);

  const goToTab = useCallback(
    (index: number) => {
      activeIndexRef.current = index;
      setActiveIndex(index);
      pagerRef.current?.scrollTo({ animated: true, x: index * pageSize.width });
    },
    [pageSize.width],
  );

  // Se a largura mudar (rotação, split screen), o pager precisa reencontrar a
  // aba ativa em vez de ficar parado no offset antigo.
  useEffect(() => {
    pagerRef.current?.scrollTo({
      animated: false,
      x: activeIndexRef.current * pageSize.width,
    });
  }, [pageSize.width]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageSize.width <= 0) {
        return;
      }

      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / pageSize.width,
      );

      if (nextIndex === activeIndexRef.current) {
        return;
      }

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    },
    [pageSize.width],
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <ScrollView
        horizontal
        ref={pagerRef}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        <View style={pageSize}>
          <LevelSelectScreen
            activeTrayCapacity={activeTrayCapacity}
            initialWorldId={initialWorldId}
            isActive={activeIndex === MAP_TAB_INDEX}
            livesState={livesState}
            progress={progress}
            timeUntilNextLifeMs={timeUntilNextLifeMs}
            onCoinCounterLayout={onCoinCounterLayout}
            onOpenChapters={onOpenChapters}
            onOpenProfile={() => goToTab(PROFILE_TAB_INDEX)}
            onOpenRestCheckpoint={onOpenRestCheckpoint}
            onOpenSettings={onOpenSettings}
            onOpenShop={onOpenShop}
            onOpenWorldChest={onOpenWorldChest}
            onResetProgress={onResetProgress}
            onSelectLevel={onSelectLevel}
          />
        </View>
        <View style={pageSize}>
          <RewardsScreen
            activeTrayCapacity={activeTrayCapacity}
            bonusTraySlotRemainingMs={bonusTraySlotRemainingMs}
            coinTraySlotRemainingMs={coinTraySlotRemainingMs}
            progress={progress}
            trayBoostState={trayBoostState}
            onOpenSettings={onOpenSettings}
            onOpenWorldChest={onOpenWorldChest}
            onPurchaseCoinTraySlot={onPurchaseCoinTraySlot}
            onShowTutorial={onShowTutorial}
          />
        </View>
        <View style={pageSize}>
          <PowersScreen progress={progress} />
        </View>
        <View style={pageSize}>
          <ProfileScreen progress={progress} />
        </View>
      </ScrollView>

      <BottomNavBar activeIndex={activeIndex} onSelect={goToTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
});
