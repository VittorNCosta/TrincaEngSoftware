import { fireEvent, render } from '@testing-library/react-native';
import { Modal } from 'react-native';

import { MysteryTutorialModal } from '../MysteryTutorialModal';

test('a explicação das peças mistério tem título e pode ser fechada pelo botão ou pelo sistema', () => {
  const close = jest.fn();
  const screen = render(<MysteryTutorialModal visible onClose={close} />);
  expect(screen.getByRole('header', { name: 'Pilha Misteriosa' })).toBeTruthy();
  const modal = screen.UNSAFE_getByType(Modal);
  expect(modal.props.accessibilityLabel).toBe('Pilha Misteriosa');
  fireEvent.press(screen.getByRole('button', { name: 'Entendi' }));
  fireEvent(modal, 'requestClose');
  expect(close).toHaveBeenCalledTimes(2);
});
