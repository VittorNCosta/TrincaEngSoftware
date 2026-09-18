import { RestStopMapMarker } from '../RestStopMapMarker';
import { ShopMapMarker } from '../ShopMapMarker';
import { WorldPortalMapMarker } from '../WorldPortalMapMarker';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { RecyclingMarkerArt } from '../RecyclingMarkerArt';

test('vector artwork respects explicit marker dimensions instead of filling its container', () => {
  const screen = render(
    <RecyclingMarkerArt kind="rest" style={{ width: 76, height: 76 }} />,
  );
  const root = screen.toJSON();
  if (!root || Array.isArray(root)) throw new Error('Expected SVG root');
  expect(StyleSheet.flatten(root.props.style)).toMatchObject({
    width: 76,
    height: 76,
  });
});

test('portal artwork fills its icon disc when dimensions are not specified', () => {
  const screen = render(<RecyclingMarkerArt kind="portal" />);
  const root = screen.toJSON();
  if (!root || Array.isArray(root)) throw new Error('Expected SVG root');
  expect(StyleSheet.flatten(root.props.style)).toMatchObject({
    width: '100%',
    height: '100%',
  });
  expect(root.props.accessible).toBe(false);
});

test('rest, shop and portal keep named actionable controls around decorative artwork', () => {
  const rest = jest.fn();
  const shop = jest.fn();
  const portal = jest.fn();
  const screen = render(
    <>
      <RestStopMapMarker
        afterLevelLabel="Fase 5"
        locked={false}
        selected={false}
        onPress={rest}
      />
      <ShopMapMarker
        afterLevelLabel="Fase 5"
        locked={false}
        selected={false}
        onPress={shop}
      />
      <WorldPortalMapMarker
        worldLabel="Vale da Reciclagem"
        locked={false}
        selected={false}
        onPress={portal}
      />
    </>,
  );
  fireEvent.press(
    screen.getByRole('button', { name: 'Ponto de descanso, Descanso' }),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Loja, Descanso' }));
  fireEvent.press(
    screen.getByRole('button', { name: 'Portal para Vale da Reciclagem' }),
  );
  expect(rest).toHaveBeenCalledTimes(1);
  expect(shop).toHaveBeenCalledTimes(1);
  expect(portal).toHaveBeenCalledTimes(1);
});
