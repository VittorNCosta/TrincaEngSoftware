import { fireEvent, render } from '@testing-library/react-native';
import { Modal } from 'react-native';
import { SettingsModal } from '../SettingsModal';
import { TutorialModal } from '../TutorialModal';
import { NoLivesModal } from '../NoLivesModal';
import { MysteryTutorialModal } from '../MysteryTutorialModal';
import { CampaignResizeNoticeModal } from '../CampaignResizeNoticeModal';

it('nomeia configurações, omite o fundo dos controles acessíveis e mantém fechamento explícito', () => {
  const onClose = jest.fn();
  const screen = render(
    <SettingsModal
      visible
      settings={{ soundEnabled: true, hapticsEnabled: true }}
      onClose={onClose}
      onEnableSilentMode={jest.fn()}
      onResetProgress={jest.fn()}
      onToggleHaptics={jest.fn()}
      onToggleSound={jest.fn()}
      onUnlockAllForDevMode={jest.fn()}
    />,
  );
  expect(screen.UNSAFE_getByType(Modal).props.accessibilityLabel).toBe(
    'Configurações',
  );
  expect(
    screen.getByRole('button', { name: 'Som: Ligado, Efeitos sonoros' }),
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: '' })).toBeNull();
  expect(screen.getByText('TileClear - ODS12')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Fechar configurações' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('nomeia tutorial e permite fechar por Escape/Voltar, reiniciando a próxima leitura', () => {
  const onFinish = jest.fn();
  const screen = render(<TutorialModal visible onFinish={onFinish} />);
  expect(screen.UNSAFE_getByType(Modal).props.accessibilityLabel).toBe(
    'Como jogar',
  );
  fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(onFinish).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Escolha peças livres')).toBeTruthy();
});

it.each([
  ['Sem vidas', NoLivesModal],
  ['Peças mistério', MysteryTutorialModal],
  ['Atualização da campanha', CampaignResizeNoticeModal],
] as const)(
  'nomeia %s e encaminha Escape/Voltar para fechar',
  (name, Component) => {
    const onClose = jest.fn();
    const screen = render(
      <Component visible onClose={onClose} timeUntilNextLifeMs={60000} />,
    );
    const modal = screen.UNSAFE_getByType(Modal);
    expect(modal.props.accessibilityLabel).toBe(name);
    fireEvent(modal, 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(1);
  },
);
