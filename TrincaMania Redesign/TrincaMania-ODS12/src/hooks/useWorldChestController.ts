import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import {
  addLife,
  getLivesState,
  type LivesState,
} from '../storage/livesStorage';
import { openWorldChest } from '../storage/progressStorage';
import type {
  ProgressState,
  WorldChestOpenMode,
  WorldChestOpenResult,
} from '../types/game';

type WorldChestControllerOptions = {
  progressRef: RefObject<ProgressState>;
  commitProgress: (progress: ProgressState) => Promise<void>;
  setLivesState: Dispatch<SetStateAction<LivesState>>;
  setLivesNow: Dispatch<SetStateAction<number>>;
};

export function useWorldChestController({
  progressRef,
  commitProgress,
  setLivesState,
  setLivesNow,
}: WorldChestControllerOptions) {
  const [activeWorldChestId, setActiveWorldChestId] = useState<
    string | undefined
  >();
  const [worldChestResult, setWorldChestResult] = useState<
    WorldChestOpenResult | undefined
  >();
  const [isOpeningWorldChest, setIsOpeningWorldChest] = useState(false);
  const isOpeningWorldChestRef = useRef(false);
  const showWorldChest = useCallback(
    (worldChestId?: string) => {
      const targetWorldChestId =
        worldChestId ?? progressRef.current.pendingWorldChestIds[0];

      if (!targetWorldChestId) {
        return;
      }

      setWorldChestResult(undefined);
      setActiveWorldChestId(targetWorldChestId);
    },
    [progressRef],
  );

  const closeWorldChest = useCallback(() => {
    setActiveWorldChestId(undefined);
    setWorldChestResult(undefined);
  }, []);

  const handleOpenWorldChest = useCallback(
    async (
      worldChestId: string,
      mode: WorldChestOpenMode,
    ): Promise<WorldChestOpenResult> => {
      if (isOpeningWorldChestRef.current) {
        return (
          worldChestResult ?? {
            keyPurchased: false,
            progress: progressRef.current,
            status: 'unavailable',
            worldChestId,
          }
        );
      }

      isOpeningWorldChestRef.current = true;
      setIsOpeningWorldChest(true);

      try {
        const currentLivesState = await getLivesState();
        setLivesState(currentLivesState);
        setLivesNow(Date.now());

        const openResult = openWorldChest(
          progressRef.current,
          worldChestId,
          mode,
          currentLivesState.currentLives >= currentLivesState.maxLives,
        );

        if (openResult.status !== 'opened') {
          setWorldChestResult(openResult);
          return openResult;
        }

        await commitProgress(openResult.progress);

        if (openResult.reward?.lifeGranted) {
          try {
            const nextLivesState = await addLife();
            setLivesState(nextLivesState);
            setLivesNow(Date.now());
          } catch {
            // Progress is already saved here; do not reopen the chest and risk a duplicate reward.
          }
        }

        setWorldChestResult(openResult);
        return openResult;
      } catch {
        const failedResult: WorldChestOpenResult = {
          keyPurchased: false,
          progress: progressRef.current,
          status: 'unavailable',
          worldChestId,
        };
        setWorldChestResult(failedResult);
        return failedResult;
      } finally {
        isOpeningWorldChestRef.current = false;
        setIsOpeningWorldChest(false);
      }
    },
    [commitProgress, progressRef, setLivesNow, setLivesState, worldChestResult],
  );

  return {
    activeWorldChestId,
    worldChestResult,
    isOpeningWorldChest,
    showWorldChest,
    closeWorldChest,
    handleOpenWorldChest,
  };
}
