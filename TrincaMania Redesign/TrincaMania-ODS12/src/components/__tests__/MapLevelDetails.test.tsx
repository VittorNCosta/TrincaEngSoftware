import { fireEvent, render } from '@testing-library/react-native';

import { MapLevelDetails } from '../MapLevelDetails';
import { LEVELS } from '../../data/levels';

test('o painel atualizado apresenta a fase ODS12 e mantém o bloqueio ao jogar', () => {
  const onPlay = jest.fn();
  const level = LEVELS[0];
  const screen = render(
    <MapLevelDetails level={level} stars={2} locked={false} onPlay={onPlay} />,
  );
  expect(screen.getByText(level.title)).toBeTruthy();
  expect(screen.getByText(level.objectiveText)).toBeTruthy();
  expect(screen.getByLabelText('2 de 3 estrelas')).toBeTruthy();
  expect(screen.getByText('Possíveis materiais')).toBeTruthy();
  fireEvent.press(screen.getByTestId('jogar-fase'));
  expect(onPlay).toHaveBeenCalledTimes(1);

  screen.rerender(
    <MapLevelDetails level={level} stars={2} locked onPlay={onPlay} />,
  );
  expect(screen.getByRole('button', { name: 'Bloqueada' })).toBeDisabled();
  fireEvent.press(screen.getByTestId('jogar-fase'));
  expect(onPlay).toHaveBeenCalledTimes(1);
});
