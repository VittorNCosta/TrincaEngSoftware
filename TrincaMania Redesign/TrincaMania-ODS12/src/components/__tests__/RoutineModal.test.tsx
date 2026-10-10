import { fireEvent, render } from '@testing-library/react-native';
import { RoutineModal } from '../RoutineModal';
import { createInitialDailyCheckInState } from '../../dailyCheckIn/dailyCheckIn';
import { createMissionState } from '../../missions/routineMissions';
import { createInitialDailyChallengeSave } from '../../challenges/dailyChallenge';

const base = {
  visible: true,
  busy: false,
  checkIn: createInitialDailyCheckInState(),
  missions: createMissionState(),
  challenge: createInitialDailyChallengeSave(),
  onClose: jest.fn(),
  onSection: jest.fn(),
  onClaimCheckIn: jest.fn(),
  onClaimMission: jest.fn(),
  onStartChallenge: jest.fn(),
};

test('check-in pode ser resgatado e as outras áreas ficam acessíveis', () => {
  const onClaimCheckIn = jest.fn();
  const onSection = jest.fn();
  const screen = render(
    <RoutineModal
      {...base}
      section="checkin"
      onClaimCheckIn={onClaimCheckIn}
      onSection={onSection}
    />,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Resgatar recompensa' }));
  expect(onClaimCheckIn).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole('tab', { name: 'Missões' }));
  expect(onSection).toHaveBeenCalledWith('missions');
});

test('missão concluída libera exatamente seu botão de resgate', () => {
  const missionState = createMissionState();
  const first = missionState.daily.missions[0];
  missionState.daily.missions[0] = { ...first, progress: first.target };
  const onClaimMission = jest.fn();
  const screen = render(
    <RoutineModal
      {...base}
      section="missions"
      missions={missionState}
      onClaimMission={onClaimMission}
    />,
  );
  fireEvent.press(screen.getAllByRole('button', { name: 'Resgatar +5' })[0]);
  expect(onClaimMission).toHaveBeenCalledWith(first.id);
});

test('desafio diário inicia pelo Perfil', () => {
  const onStartChallenge = jest.fn();
  const screen = render(
    <RoutineModal
      {...base}
      section="challenge"
      onStartChallenge={onStartChallenge}
    />,
  );
  fireEvent.press(
    screen.getByRole('button', { name: 'Jogar desafio de hoje' }),
  );
  expect(onStartChallenge).toHaveBeenCalledTimes(1);
});
