import { render } from '@testing-library/react-native';

import { Tray } from '../Tray';
import { Tile } from '../../types/game';
import { BASE_TRAY_CAPACITY, COIN_TRAY_SLOT_COST } from '../../storage/trayBoostStorage';

const makeTile = (overrides: Partial<Tile> = {}): Tile => ({
  cardId: 'plastico-residuo-1',
  emoji: '🧴',
  id: 'tray-tile-1',
  kind: 'plastico',
  role: 'residuo',
  x: 0,
  y: 0,
  z: 0,
  ...overrides,
});

describe('Tray', () => {
  it('renderiza sem lançar exceção com peças na capacidade base', () => {
    const tiles: Tile[] = [
      makeTile({ id: 'tray-tile-1' }),
      makeTile({ id: 'tray-tile-2', kind: 'papel', role: 'lixeira', emoji: '📦' }),
    ];

    const { getByText } = render(
      <Tray activeCapacity={BASE_TRAY_CAPACITY} tiles={tiles} />,
    );

    // Com a capacidade base (sem slot de moedas nem slot bônus ativos), os
    // dois encaixes extras aparecem bloqueados com o preço em moedas e o
    // rótulo "Bônus" — dá pra checar isso sem reimplementar a lógica de
    // capacidade do componente.
    expect(getByText(String(COIN_TRAY_SLOT_COST))).toBeTruthy();
    expect(getByText('Bônus')).toBeTruthy();
  });
});
