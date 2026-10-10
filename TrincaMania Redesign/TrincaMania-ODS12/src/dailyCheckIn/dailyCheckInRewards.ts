import { DailyCheckInDay, DailyCheckInReward } from './dailyCheckInTypes';

/** Same seven-day economy as the reference app; powers are available immediately here. */
export const resolveDailyCheckInReward = (
  day: DailyCheckInDay,
): DailyCheckInReward => {
  switch (day) {
    case 1:
      return {
        kind: 'coins',
        amount: 10,
        label: '+10 moedas',
        title: 'Boas-vindas',
      };
    case 2:
      return { kind: 'life', amount: 1, label: '+1 vida', title: 'Vida extra' };
    case 3:
      return {
        kind: 'power',
        amount: 1,
        powerType: 'hint',
        label: 'Trinca Mágica ×1',
        title: 'Trinca Mágica',
      };
    case 4:
      return {
        kind: 'coins',
        amount: 20,
        label: '+20 moedas',
        title: 'Moedas',
      };
    case 5:
      return {
        kind: 'power',
        amount: 1,
        powerType: 'undo',
        label: 'Voltar Jogada ×1',
        title: 'Voltar Jogada',
      };
    case 6:
      return {
        kind: 'power',
        amount: 1,
        powerType: 'shuffle',
        label: 'Embaralhar ×1',
        title: 'Embaralhar',
      };
    case 7:
      return {
        kind: 'coins',
        amount: 50,
        label: '+50 moedas',
        title: 'Baú semanal',
      };
  }
};
