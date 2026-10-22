import { act, fireEvent, render } from '@testing-library/react-native';
import { ShopScreen } from '../../screens/ShopScreen';
import { createInitialProgress } from '../../storage/progressStorage';
import { createInitialLivesState } from '../../storage/livesStorage';

test('a pending purchase survives leaving and returning without a duplicate charge or stuck controls', async () => {
  let complete!: (purchased: boolean) => void;
  const onPurchasePowerUp = jest.fn(
    () =>
      new Promise<boolean>((resolve) => {
        complete = resolve;
      }),
  );
  const props = {
    progress: { ...createInitialProgress(), coins: 600 },
    livesState: createInitialLivesState(),
    timeUntilNextLifeMs: 0,
    onBack: jest.fn(),
    onPurchasePowerUp,
  };
  const screen = render(<ShopScreen {...props} isActive />);
  fireEvent.press(screen.getByTestId('shop-buy-hint'));
  fireEvent.press(screen.getByTestId('shop-buy-hint'));
  expect(onPurchasePowerUp).toHaveBeenCalledTimes(1);
  expect(onPurchasePowerUp).toHaveBeenCalledWith('hint', false);

  screen.rerender(<ShopScreen {...props} isActive={false} />);
  screen.rerender(<ShopScreen {...props} isActive />);
  await act(async () => {
    complete(true);
  });
  expect(
    screen.getByTestId('shop-buy-hint').props.accessibilityState.disabled,
  ).toBe(false);
  expect(onPurchasePowerUp).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Boa escolha!')).toBeNull();
  screen.unmount();
});
