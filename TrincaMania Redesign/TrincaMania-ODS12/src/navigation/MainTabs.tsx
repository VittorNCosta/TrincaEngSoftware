import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { useReducedMotion } from '../hooks/useReducedMotion';

import { BottomNavBar, MAIN_TAB_ITEMS } from '../components/BottomNavBar';
import { LevelSelectScreen } from '../screens/LevelSelectScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { MissionsScreen } from '../original/screens/MissionsScreen';
import {
  PowerUpType,
  ProgressState,
  RestCheckpointRewardResult,
  WorldId,
} from '../types/game';
import { PowersScreen } from '../screens/PowersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { LivesState } from '../storage/livesStorage';
import {
  TrayBoostPurchaseResult,
  TrayBoostState,
} from '../storage/trayBoostStorage';
import type { RoutineSection } from '../components/RoutineModal';
import { playMetaMusic } from '../utils/music';
import { WindowTarget } from '../types/ui';

function TabPage({
  active,
  children,
  size,
  name,
}: {
  active: boolean;
  children: ReactNode;
  size: { width: number; height: number };
  name: string;
}) {
  return (
    <View
      ref={(node) => {
        if (Platform.OS === 'web' && node) {
          (node as unknown as HTMLElement).inert = !active;
        }
      }}
      aria-hidden={!active}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      style={[
        size,
        styles.page,
        Platform.OS === 'web' ? styles.webPage : null,
        Platform.OS === 'web' && !active ? styles.hiddenPage : null,
      ]}
      testID={`tab-page-${name}`}
    >
      {children}
    </View>
  );
}

const MAP_TAB_INDEX = 0;
const PROFILE_TAB_INDEX = MAIN_TAB_ITEMS.findIndex(
  (item) => item.key === 'profile',
);

type MainTabsProps = {
  devMode?: boolean;
  activeTrayCapacity: number;
  bonusTraySlotRemainingMs: number;
  coinTraySlotRemainingMs: number;
  initialWorldId?: WorldId;
  livesState: LivesState;
  progress: ProgressState;
  checkInReady?: boolean;
  missionReadyCount?: number;
  challengeDone?: boolean;
  onOpenRoutine?: (section: RoutineSection) => void;
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
  onPurchasePowerUp: (
    power: PowerUpType,
    useImmediately: false,
  ) => Promise<boolean>;
};

/**
 * Mapa · Loja · Missões · Perfil. Browser scenes stay fixed so mouse-wheel
 * input scrolls content without dragging a partially visible adjacent page.
 * Native paging remains available for horizontal touch gestures.
 */
export function MainTabs({
  devMode = false,
  activeTrayCapacity,
  bonusTraySlotRemainingMs,
  coinTraySlotRemainingMs,
  initialWorldId,
  livesState,
  progress,
  checkInReady,
  missionReadyCount,
  challengeDone,
  onOpenRoutine,
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
  onPurchasePowerUp,
}: MainTabsProps) {
  const window = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const pagerRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(MAP_TAB_INDEX);
  const [activeIndex, setActiveIndex] = useState(MAP_TAB_INDEX);
  useEffect(() => {
    if (activeIndex !== MAP_TAB_INDEX) playMetaMusic();
  }, [activeIndex]);
  const [profilePanel, setProfilePanel] = useState<
    'hub' | 'powers' | 'rewards'
  >('hub');
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
      pagerRef.current?.scrollTo({
        animated: Platform.OS !== 'web' && !reducedMotion,
        x: index * pageSize.width,
      });
    },
    [pageSize.width, reducedMotion],
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

  const pages = (
    <>
      <TabPage active={activeIndex === 0} size={pageSize} name="map">
        <LevelSelectScreen
          devMode={devMode}
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
      </TabPage>
      <TabPage active={activeIndex === 1} size={pageSize} name="shop">
        <ShopScreen
          progress={progress}
          livesState={livesState}
          timeUntilNextLifeMs={timeUntilNextLifeMs}
          onBack={() => goToTab(MAP_TAB_INDEX)}
          onPurchasePowerUp={onPurchasePowerUp}
          reserveBottomNavSpace
          isActive={activeIndex === 1}
        />
      </TabPage>
      <TabPage active={activeIndex === 2} size={pageSize} name="missions">
        <MissionsScreen
          progress={progress}
          onClose={() => goToTab(MAP_TAB_INDEX)}
        />
      </TabPage>
      <TabPage active={activeIndex === 3} size={pageSize} name="profile">
        {profilePanel === 'hub' ? (
          <ProfileScreen
            progress={progress}
            checkInReady={checkInReady}
            missionReadyCount={missionReadyCount}
            challengeDone={challengeDone}
            onOpenRoutine={onOpenRoutine}
            onOpenPowers={() => setProfilePanel('powers')}
            onOpenRewards={() => setProfilePanel('rewards')}
            onOpenSettings={onOpenSettings}
            onOpenTutorial={onShowTutorial}
            onOpenMissions={() => goToTab(2)}
            onOpenMap={() => goToTab(MAP_TAB_INDEX)}
            onOpenShop={() => goToTab(1)}
          />
        ) : profilePanel === 'powers' ? (
          <PowersScreen
            progress={progress}
            onClose={() => setProfilePanel('hub')}
          />
        ) : (
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
            onClose={() => setProfilePanel('hub')}
          />
        )}
      </TabPage>
    </>
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {Platform.OS === 'web' ? (
        <View testID="main-tab-scenes" style={styles.pager}>
          {pages}
        </View>
      ) : (
        <ScrollView
          horizontal
          ref={pagerRef}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          pagingEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          style={styles.pager}
        >
          {pages}
        </ScrollView>
      )}
      <BottomNavBar activeIndex={activeIndex} onSelect={goToTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  page: { overflow: 'hidden' },
  webPage: { position: 'absolute', left: 0, top: 0 },
  hiddenPage: { display: 'none' },
});
