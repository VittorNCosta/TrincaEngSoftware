import { AppState, type AppStateStatus } from 'react-native';
import { createAudioPlayer, setIsAudioActiveAsync } from 'expo-audio';
import {
  duckMusic,
  installMusicLifecycle,
  MUSIC_CROSSFADE_MS,
  MUSIC_DUCK_VOLUME,
  MUSIC_GAP_MS,
  MUSIC_VOLUME,
  playMetaMusic,
  playWorldMusic,
  releaseMusicPlayer,
  setMusicEnabled,
  unduckMusic,
} from '../../utils/music';
import { resolveMusicKeyForWorld } from '../../utils/musicRouting';
import { setSoundEnabled } from '../../utils/sounds';

const flush = async () => {
  for (let index = 0; index < 15; index += 1) await Promise.resolve();
};

const players: ReturnType<typeof makePlayer>[] = [];
function makePlayer() {
  let status: (value: { didJustFinish: boolean }) => void = () => undefined;
  const player = {
    playing: false,
    loop: false,
    volume: 0,
    play: jest.fn((): void => {
      player.playing = true;
    }),
    pause: jest.fn((): void => {
      player.playing = false;
    }),
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    subscription: { remove: jest.fn() },
    addListener: jest.fn(
      (event: string, callback: typeof status): { remove: jest.Mock } => {
        status = callback;
        return player.subscription;
      },
    ),
    finish: () => {
      player.playing = false;
      status({ didJustFinish: true });
    },
  };
  return player;
}

let cleanupMusic: () => void;
beforeEach(() => {
  releaseMusicPlayer();
  jest.useFakeTimers();
  players.length = 0;
  jest.mocked(createAudioPlayer).mockImplementation(() => {
    const player = makePlayer();
    players.push(player);
    return player as unknown as ReturnType<typeof createAudioPlayer>;
  });
  cleanupMusic = installMusicLifecycle();
  setMusicEnabled(true);
});
afterEach(() => {
  cleanupMusic();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('menu não reinicia entre abas e troca de mundo faz crossfade com limpeza', async () => {
  playMetaMusic();
  playMetaMusic();
  await flush();
  expect(players).toHaveLength(1);
  jest.advanceTimersByTime(MUSIC_CROSSFADE_MS);
  expect(players[0].volume).toBeCloseTo(MUSIC_VOLUME);
  playWorldMusic(1);
  await flush();
  expect(players).toHaveLength(2);
  expect(players[0].remove).not.toHaveBeenCalled();
  jest.advanceTimersByTime(MUSIC_CROSSFADE_MS);
  expect(players[0].remove).toHaveBeenCalledTimes(1);
  expect(players[0].subscription.remove).toHaveBeenCalledTimes(1);
  expect(players[1].volume).toBeCloseTo(MUSIC_VOLUME);
  // A third target during a transition also releases the outgoing player.
  playWorldMusic(2);
  await flush();
  playWorldMusic(3);
  await flush();
  expect(players[1].remove).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(MUSIC_CROSSFADE_MS);
  expect(players[2].remove).toHaveBeenCalledTimes(1);
  expect(players[3].remove).not.toHaveBeenCalled();
});

test('música e efeitos têm mute independente', async () => {
  playMetaMusic();
  await flush();
  await setSoundEnabled(false);
  expect(players[0].pause).not.toHaveBeenCalled();
  expect(setIsAudioActiveAsync).not.toHaveBeenLastCalledWith(false);
  setMusicEnabled(false);
  expect(players[0].pause).toHaveBeenCalledTimes(1);
  setMusicEnabled(true);
  await flush();
  expect(players).toHaveLength(1);
  expect(players[0].play).toHaveBeenCalledTimes(2);
  await setSoundEnabled(true);
});

test('desligar música durante seek do próximo ciclo impede reprodução tardia', async () => {
  playMetaMusic();
  await flush();
  jest.advanceTimersByTime(MUSIC_CROSSFADE_MS);
  let finishSeek!: () => void;
  players[0].seekTo.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishSeek = resolve;
      }),
  );
  players[0].finish();
  jest.advanceTimersByTime(MUSIC_GAP_MS - 1);
  expect(players[0].seekTo).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(players[0].seekTo).toHaveBeenCalledTimes(1);
  setMusicEnabled(false);
  finishSeek();
  await flush();
  expect(players[0].play).toHaveBeenCalledTimes(1);
});

test('liberar durante carregamento impede criar player depois da desmontagem', async () => {
  playMetaMusic();
  releaseMusicPlayer();
  await flush();
  expect(players).toHaveLength(0);
});

test('segundo plano pausa, retorno retoma e preferência desligada permanece respeitada', async () => {
  let change!: (value: AppStateStatus) => void;
  const remove = jest.fn();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((event, listener) => {
      change = listener;
      return { remove };
    });
  const cleanup = installMusicLifecycle();
  playWorldMusic(1);
  await flush();
  change('background');
  expect(players[0].pause).toHaveBeenCalledTimes(1);
  change('active');
  await flush();
  expect(players[0].play).toHaveBeenCalledTimes(2);
  change('background');
  setMusicEnabled(false);
  change('active');
  await flush();
  expect(players[0].play).toHaveBeenCalledTimes(2);
  cleanup();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(players[0].remove).toHaveBeenCalledTimes(1);
});

test('ativar música com configurações abertas mantém volume reduzido até fechar', async () => {
  setMusicEnabled(false);
  duckMusic();
  playWorldMusic(1);
  await flush();
  expect(players).toHaveLength(0);
  setMusicEnabled(true);
  await flush();
  jest.advanceTimersByTime(MUSIC_CROSSFADE_MS);
  expect(players[0].volume).toBeCloseTo(MUSIC_DUCK_VOLUME);
  unduckMusic();
  jest.advanceTimersByTime(400);
  expect(players[0].volume).toBeCloseTo(MUSIC_VOLUME);
});

test('mundos sem faixa usam a música padrão; capítulos seguem sua família ODS12', () => {
  expect(resolveMusicKeyForWorld(1)).toBe(1);
  expect(resolveMusicKeyForWorld(2)).toBe(2);
  expect(resolveMusicKeyForWorld(3)).toBe(3);
  expect(resolveMusicKeyForWorld(21)).toBe(21);
  for (const id of [4, 5, 6, 7, 8, 9, 10] as const)
    expect(resolveMusicKeyForWorld(id)).toBe('meta');
  expect(resolveMusicKeyForWorld(101)).toBe(1);
  expect(resolveMusicKeyForWorld(103)).toBe(3);
  expect(resolveMusicKeyForWorld(110)).toBe('meta');
});

test('cleanup do App impede que cleanup de uma tela religue música', async () => {
  playWorldMusic(1);
  await flush();
  cleanupMusic();
  playMetaMusic();
  await flush();
  expect(players).toHaveLength(1);
  expect(players[0].remove).toHaveBeenCalledTimes(1);
});

test('reativar durante fade de entrada restaura volume audível', async () => {
  playMetaMusic();
  await flush();
  expect(players[0].volume).toBe(0);
  setMusicEnabled(false);
  setMusicEnabled(true);
  await flush();
  jest.advanceTimersByTime(MUSIC_CROSSFADE_MS);
  expect(players[0].playing).toBe(true);
  expect(players[0].volume).toBeCloseTo(MUSIC_VOLUME);
});
