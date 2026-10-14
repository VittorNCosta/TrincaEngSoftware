import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { TutorialDemoStage } from '../TutorialDemoStage';
import { TutorialModal } from '../TutorialModal';

test('a demonstração forma o ciclo do plástico, libera a bandeja e pode ser revista', async () => {
  const screen = render(<TutorialDemoStage kind="cycle" />);

  for (let index = 0; index < 3; index += 1) {
    fireEvent.press(screen.getByTestId(`board-tile-cycle-${index}`));
  }

  await waitFor(() =>
    expect(
      screen.getByText('Trinca formada! A bandeja ficou livre.'),
    ).toBeTruthy(),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Rever demonstração' }));

  expect(
    screen.getByText('Toque nas peças para formar o ciclo do plástico.'),
  ).toBeTruthy();
  expect(screen.getByTestId('board-tile-cycle-0')).toBeTruthy();
});

test('o guia mostra a trinca e o alerta da bandeja antes de começar', async () => {
  const finish = jest.fn();
  const screen = render(<TutorialModal onFinish={finish} visible />);
  await act(async () => {
    await Promise.resolve();
  });

  expect(screen.getByText('Escolha peças livres')).toBeTruthy();
  fireEvent.press(screen.getByText('Próximo'));
  expect(screen.getByTestId('board-tile-cycle-0')).toBeTruthy();
  fireEvent.press(screen.getByText('Próximo'));
  expect(screen.getByText('6/7 espaços ocupados')).toBeTruthy();
  fireEvent.press(screen.getByText('Próximo'));
  expect(screen.getByText('Use itens de apoio')).toBeTruthy();
  fireEvent.press(screen.getByText('Começar'));

  expect(finish).toHaveBeenCalledTimes(1);
});

test('Como jogar permite rever uma demonstração e os itens de apoio', async () => {
  const finish = jest.fn();
  const screen = render(
    <TutorialModal mode="manual" onFinish={finish} visible />,
  );
  await act(async () => {
    await Promise.resolve();
  });

  fireEvent.press(screen.getByRole('button', { name: 'Ciclo da reciclagem' }));
  expect(screen.getByTestId('board-tile-cycle-0')).toBeTruthy();
  fireEvent.press(screen.getByText('Voltar aos tutoriais'));
  fireEvent.press(screen.getByRole('button', { name: 'Misturar peças' }));
  expect(
    screen.getByText(
      'Reorganiza as peças restantes. Use quando estiver difícil encontrar uma jogada.',
    ),
  ).toBeTruthy();
  fireEvent.press(screen.getByText('Fechar'));

  expect(finish).toHaveBeenCalledTimes(1);
});

test.each([
  [
    'hint',
    'Testar Trinca automática',
    'Trinca formada! A bandeja ficou livre.',
  ],
  ['undo', 'Testar Voltar jogada', 'A peça voltou ao tabuleiro.'],
  ['shuffle', 'Testar Misturar peças', 'As peças foram reorganizadas.'],
] as const)(
  'a demonstração de %s responde ao toque e pode ser revista',
  async (kind, label, message) => {
    const screen = render(<TutorialDemoStage kind={kind} />);
    await act(async () => {
      await Promise.resolve();
    });
    if (kind !== 'shuffle')
      fireEvent.press(screen.getByTestId('board-tile-cycle-0'));
    fireEvent.press(screen.getByRole('button', { name: label }));
    expect(screen.getByText(message)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Rever demonstração' }));
    expect(screen.getByTestId('board-tile-cycle-0')).toBeTruthy();
  },
);
