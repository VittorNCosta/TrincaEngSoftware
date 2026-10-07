import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createInitialDailyCheckInState,
  normalizeDailyCheckInState,
} from '../dailyCheckIn/dailyCheckIn';
import {
  DAILY_CHECK_IN_STORAGE_KEY,
  DailyCheckInState,
} from '../dailyCheckIn/dailyCheckInTypes';
import { createStorageQueue } from './storageQueue';

export { DAILY_CHECK_IN_STORAGE_KEY };
const dailyCheckInStorageQueue = createStorageQueue();

const readDailyCheckInState = async (): Promise<DailyCheckInState> => {
  try {
    const raw = await AsyncStorage.getItem(DAILY_CHECK_IN_STORAGE_KEY);
    if (!raw) return createInitialDailyCheckInState();
    return normalizeDailyCheckInState(JSON.parse(raw));
  } catch {
    return createInitialDailyCheckInState();
  }
};

export const loadDailyCheckInState = (): Promise<DailyCheckInState> =>
  dailyCheckInStorageQueue(readDailyCheckInState);

export const saveDailyCheckInState = (state: DailyCheckInState) =>
  dailyCheckInStorageQueue(async () => {
    await AsyncStorage.setItem(
      DAILY_CHECK_IN_STORAGE_KEY,
      JSON.stringify(normalizeDailyCheckInState(state)),
    );
  });

export const resetDailyCheckInState = () =>
  dailyCheckInStorageQueue(async () => {
    const initialState = createInitialDailyCheckInState();
    await AsyncStorage.setItem(
      DAILY_CHECK_IN_STORAGE_KEY,
      JSON.stringify(initialState),
    );
    return initialState;
  });
