import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStorageQueue } from '../storage/storageQueue';
import { getLocalDateKey } from '../dailyCheckIn/dailyCheckIn';

export type MissionKind = 'levels' | 'triples' | 'stars';
export type Mission = {
  id: string;
  kind: MissionKind;
  title: string;
  target: number;
  progress: number;
  rewardCoins: number;
  claimed: boolean;
};
export type MissionCycle = { id: string; missions: Mission[] };
export type MissionState = {
  version: 1;
  latestDay: string;
  daily: MissionCycle;
  weekly: MissionCycle;
  processedEventIds: string[];
};
export type MissionEvent = { id: string; kind: MissionKind; value: number };

const KEY = '@trinca-mania/routine-missions-v1';
const queue = createStorageQueue();
const weekId = (date: Date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return getLocalDateKey(monday);
};
const makeCycle = (id: string, weekly: boolean): MissionCycle => ({
  id,
  missions: (['levels', 'triples', 'stars'] as const).map((kind) => {
    const target = weekly
      ? { levels: 5, triples: 20, stars: 12 }[kind]
      : { levels: 1, triples: 3, stars: 2 }[kind];
    const title = {
      levels: `Conclua ${target} ${target === 1 ? 'fase ou mapa' : 'fases ou mapas'}`,
      triples: `Forme ${target} trincas naturais`,
      stars: `Ganhe ${target} estrelas em fases ou mapas`,
    }[kind];
    return {
      id: `${weekly ? 'weekly' : 'daily'}:${id}:${kind}`,
      kind,
      title,
      target,
      progress: 0,
      rewardCoins: weekly ? 15 : 5,
      claimed: false,
    };
  }),
});

export const createMissionState = (date = new Date()): MissionState => {
  const day = getLocalDateKey(date);
  return {
    version: 1,
    latestDay: day,
    daily: makeCycle(day, false),
    weekly: makeCycle(weekId(date), true),
    processedEventIds: [],
  };
};

export const syncMissionState = (
  state: MissionState,
  date = new Date(),
): MissionState => {
  const day = getLocalDateKey(date);
  if (day < state.latestDay) return state;
  const week = weekId(date);
  return {
    ...state,
    latestDay: day,
    daily: state.daily.id === day ? state.daily : makeCycle(day, false),
    weekly: state.weekly.id === week ? state.weekly : makeCycle(week, true),
  };
};

export const applyMissionEvent = (
  state: MissionState,
  event: MissionEvent,
): MissionState => {
  if (
    !event.id ||
    state.processedEventIds.includes(event.id) ||
    !Number.isFinite(event.value) ||
    event.value <= 0
  )
    return state;
  const update = (cycle: MissionCycle): MissionCycle => ({
    ...cycle,
    missions: cycle.missions.map((mission) =>
      mission.kind === event.kind && !mission.claimed
        ? {
            ...mission,
            progress: Math.min(
              mission.target,
              mission.progress + Math.floor(event.value),
            ),
          }
        : mission,
    ),
  });
  return {
    ...state,
    daily: update(state.daily),
    weekly: update(state.weekly),
    processedEventIds: [...state.processedEventIds, event.id].slice(-512),
  };
};

const validCycle = (cycle: unknown): cycle is MissionCycle =>
  !!cycle &&
  typeof cycle === 'object' &&
  typeof (cycle as MissionCycle).id === 'string' &&
  Array.isArray((cycle as MissionCycle).missions) &&
  (cycle as MissionCycle).missions.length === 3;

const read = async (): Promise<MissionState> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return createMissionState();
    const parsed = JSON.parse(raw) as MissionState;
    if (
      parsed.version !== 1 ||
      !validCycle(parsed.daily) ||
      !validCycle(parsed.weekly) ||
      typeof parsed.latestDay !== 'string'
    )
      return createMissionState();
    return {
      ...parsed,
      processedEventIds: Array.isArray(parsed.processedEventIds)
        ? parsed.processedEventIds
            .filter((id): id is string => typeof id === 'string')
            .slice(-512)
        : [],
    };
  } catch {
    return createMissionState();
  }
};
const write = async (state: MissionState) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
  return state;
};
export const loadMissionState = () =>
  queue(async () => {
    const original = await read();
    const current = syncMissionState(original);
    if (current !== original) await write(current);
    return current;
  });
export const recordMissionEvent = (event: MissionEvent) =>
  queue(async () =>
    write(applyMissionEvent(syncMissionState(await read()), event)),
  );
export const markMissionClaimed = (missionId: string) =>
  queue(async () => {
    const current = syncMissionState(await read());
    const update = (cycle: MissionCycle): MissionCycle => ({
      ...cycle,
      missions: cycle.missions.map((mission) =>
        mission.id === missionId && mission.progress >= mission.target
          ? { ...mission, claimed: true }
          : mission,
      ),
    });
    return write({
      ...current,
      daily: update(current.daily),
      weekly: update(current.weekly),
    });
  });
export const resetMissionState = () => queue(() => write(createMissionState()));
