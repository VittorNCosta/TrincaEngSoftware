import { Modal } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { GameDialogs } from '../../screens/game/GameDialogs';

const baseProps = () => ({
  practicalTutorialPopupStep: undefined,
  advancePracticalTutorialPopup: jest.fn(),
  isMagicTripleRescueVisible: false,
  dismissMagicTripleRescue: jest.fn(),
  useFreeMagicTripleRescue: jest.fn(async () => {}),
  isBonusSlotConfirmVisible: false,
  isBonusSlotProcessingRef: { current: false },
  setIsBonusSlotConfirmVisible: jest.fn(),
  isBonusSlotProcessing: false,
  confirmBonusTraySlot: jest.fn(async () => {}),
  pendingPowerPurchase: undefined,
  isPowerPurchaseProcessingRef: { current: false },
  setPendingPowerPurchase: jest.fn(),
  pendingPowerPurchaseCost: 100,
  coins: 100,
  pendingPowerUnavailableMessage: undefined,
  pendingPowerHasEnoughCoins: true,
  isPowerPurchaseProcessing: false,
  pendingPowerCanUseImmediately: true,
  confirmPendingPowerPurchase: jest.fn(async () => {}),
});

test('tutorial e resgate encaminham ações para o controlador da partida', () => {
  const props = baseProps();
  const screen = render(
    <GameDialogs {...props} practicalTutorialPopupStep="intro" />,
  );
  fireEvent.press(screen.getByTestId('tutorial-pratico-avancar'));
  expect(props.advancePracticalTutorialPopup).toHaveBeenCalledTimes(1);
  screen.rerender(<GameDialogs {...props} isMagicTripleRescueVisible />);
  fireEvent.press(screen.getByRole('button', { name: 'Usar grátis' }));
  expect(props.useFreeMagicTripleRescue).toHaveBeenCalledTimes(1);
});

test('fechamento nativo do bônus respeita a trava atual mesmo antes do próximo render', () => {
  const props = baseProps();
  const screen = render(<GameDialogs {...props} isBonusSlotConfirmVisible />);
  const modal = screen
    .UNSAFE_getAllByType(Modal)
    .find((node) => node.props.statusBarTranslucent && node.props.visible)!;
  props.isBonusSlotProcessingRef.current = true;
  fireEvent(modal, 'requestClose');
  expect(props.setIsBonusSlotConfirmVisible).not.toHaveBeenCalled();
  props.isBonusSlotProcessingRef.current = false;
  fireEvent(modal, 'requestClose');
  expect(props.setIsBonusSlotConfirmVisible).toHaveBeenCalledWith(false);
  screen.rerender(
    <GameDialogs {...props} isBonusSlotConfirmVisible isBonusSlotProcessing />,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Liberando…' }));
  expect(props.confirmBonusTraySlot).not.toHaveBeenCalled();
});

test('compra bloqueada mantém o diálogo e impede confirmação com saldo insuficiente', () => {
  const props = baseProps();
  const screen = render(
    <GameDialogs
      {...props}
      pendingPowerPurchase="undo"
      pendingPowerHasEnoughCoins={false}
    />,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Comprar e usar' }));
  expect(props.confirmPendingPowerPurchase).not.toHaveBeenCalled();
  const modal = screen
    .UNSAFE_getAllByType(Modal)
    .find((node) => node.props.statusBarTranslucent && node.props.visible)!;
  props.isPowerPurchaseProcessingRef.current = true;
  fireEvent(modal, 'requestClose');
  expect(props.setPendingPowerPurchase).not.toHaveBeenCalled();
  props.isPowerPurchaseProcessingRef.current = false;
  fireEvent(modal, 'requestClose');
  expect(props.setPendingPowerPurchase).toHaveBeenCalledWith(undefined);
  screen.rerender(
    <GameDialogs
      {...props}
      pendingPowerPurchase="undo"
      pendingPowerCanUseImmediately={false}
      pendingPowerUnavailableMessage="Sem jogada para desfazer."
    />,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Comprar' }));
  expect(props.confirmPendingPowerPurchase).toHaveBeenCalledTimes(1);
});
