import { fireEvent, render } from '@testing-library/react-native';
import { Modal } from 'react-native';

import { WorldChestModal } from '../WorldChestModal';
import {
  createInitialProgress,
  getBonusWorldChestId,
} from '../../storage/progressStorage';
import type { WorldChestOpenResult } from '../../types/game';

// Keep the reveal's real Modal boundary and close contract, without its animation.
// The parent state/effect, purchase action and visibility remain real.
jest.mock('../ChestOpeningModal', () => {
  const { Modal, Pressable, Text } = jest.requireActual('react-native');
  return {
    ChestOpeningModal: ({
      visible,
      onClose,
    }: {
      visible: boolean;
      onClose: () => void;
    }) => (
      <Modal
        accessibilityLabel="Recompensa do baú"
        visible={visible}
        onRequestClose={onClose}
      >
        <Pressable accessibilityRole="button" onPress={onClose}>
          <Text>Coletar recompensa</Text>
        </Pressable>
      </Modal>
    ),
  };
});

it.each(['coletar', 'voltar'] as const)(
  'substitui o baú pela revelação e encaminha fechamento por %s',
  (closeAction) => {
    const worldChestId = getBonusWorldChestId();
    const progress = {
      ...createInitialProgress(),
      coins: 150,
      claimedWorldChestIds: [worldChestId],
      itemCounts: { hint: 1, shuffle: 1, undo: 1 },
    };
    const opened: WorldChestOpenResult = {
      keyPurchased: false,
      progress,
      status: 'opened',
      worldChestId,
      reward: {
        coins: 150,
        itemCounts: { hint: 1, shuffle: 1, undo: 1 },
        lifeGranted: false,
      },
    };
    const props = {
      coins: 0,
      keys: 1,
      isOpening: false,
      visible: true,
      worldChestId,
      onBuyAndOpen: jest.fn(),
      onClose: jest.fn(),
      onOpenWithKey: jest.fn(),
    };
    const screen = render(<WorldChestModal {...props} />);
    const visibleModals = () =>
      screen.UNSAFE_getAllByType(Modal).filter((node) => node.props.visible);

    expect(visibleModals()).toHaveLength(1);
    expect(visibleModals()[0].props.accessibilityLabel).toBe('Baú Especial');
    fireEvent.press(screen.getByRole('button', { name: 'Abrir com 1 chave' }));
    expect(props.onOpenWithKey).toHaveBeenCalledTimes(1);
    expect(props.onBuyAndOpen).not.toHaveBeenCalled();

    screen.rerender(<WorldChestModal {...props} isOpening />);
    expect(visibleModals()).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: 'Abrir com 1 chave' }),
    ).toBeNull();

    screen.rerender(<WorldChestModal {...props} keys={0} result={opened} />);
    expect(visibleModals()).toHaveLength(1);
    expect(visibleModals()[0].props.accessibilityLabel).toBe(
      'Recompensa do baú',
    );
    expect(
      screen
        .UNSAFE_getAllByType(Modal)
        .find((node) => node.props.accessibilityLabel === 'Baú Especial')?.props
        .visible,
    ).toBe(false);
    expect(screen.queryByRole('button', { name: 'Fechar' })).toBeNull();
    expect(props.onClose).not.toHaveBeenCalled();

    // An unrelated parent update must not expose a second modal behind the reward.
    screen.rerender(
      <WorldChestModal {...props} coins={150} keys={0} result={opened} />,
    );
    expect(visibleModals()).toHaveLength(1);
    expect(visibleModals()[0].props.accessibilityLabel).toBe(
      'Recompensa do baú',
    );
    if (closeAction === 'coletar') {
      fireEvent.press(
        screen.getByRole('button', { name: 'Coletar recompensa' }),
      );
    } else {
      fireEvent(visibleModals()[0], 'requestClose');
    }
    expect(props.onClose).toHaveBeenCalledTimes(1);

    // Simulate the owner honoring onClose, without re-opening the same reward.
    screen.rerender(
      <WorldChestModal {...props} result={opened} visible={false} />,
    );
    expect(visibleModals()).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'Coletar recompensa' }),
    ).toBeNull();
    expect(props.onOpenWithKey).toHaveBeenCalledTimes(1);
  },
);
