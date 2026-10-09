import { createAudioPlayer } from 'expo-audio';
import {
  playTapSound,
  releaseSoundPlayers,
  setSoundEnabled,
} from '../../utils/sounds';

const flush = async () => {
  for (let index = 0; index < 12; index++) await Promise.resolve();
};

describe('áudio durante operações pendentes', () => {
  beforeEach(async () => {
    releaseSoundPlayers();
    jest.spyOn(Date, 'now').mockReturnValue(100000);
    await setSoundEnabled(true);
  });
  afterEach(() => {
    releaseSoundPlayers();
    jest.restoreAllMocks();
  });
  it('silenciar enquanto seekTo está pendente impede play posterior', async () => {
    let finish!: () => void;
    const player = {
      pause: jest.fn(),
      play: jest.fn(),
      remove: jest.fn(),
      volume: 1,
      seekTo: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      ),
    };
    (createAudioPlayer as jest.Mock).mockReturnValueOnce(player);
    playTapSound();
    await flush();
    await setSoundEnabled(false);
    finish();
    await flush();
    expect(player.play).not.toHaveBeenCalled();
  });
  it('liberar um player durante seekTo impede reprodução do objeto removido', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(200000);
    let finish!: () => void;
    const player = {
      pause: jest.fn(),
      play: jest.fn(),
      remove: jest.fn(),
      volume: 1,
      seekTo: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      ),
    };
    (createAudioPlayer as jest.Mock).mockReturnValueOnce(player);
    playTapSound();
    await flush();
    releaseSoundPlayers();
    finish();
    await flush();
    expect(player.remove).toHaveBeenCalled();
    expect(player.play).not.toHaveBeenCalled();
  });
});
