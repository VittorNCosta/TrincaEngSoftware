import { RestStopMapMarker } from '../RestStopMapMarker';
import { ShopMapMarker } from '../ShopMapMarker';
import { WorldPortalMapMarker } from '../WorldPortalMapMarker';
import { fireEvent, render } from '@testing-library/react-native';
import { Image, StyleSheet } from 'react-native';
import { RecyclingMarkerArt } from '../RecyclingMarkerArt';

test('PNG artwork fits the marker instead of retaining its intrinsic dimensions', () => {
  const screen = render(
    <RecyclingMarkerArt kind="rest" style={{ width: 76, height: 76 }} />,
  );
  const root = screen.toJSON();
  if (!root || Array.isArray(root)) throw new Error('Expected marker root');
  expect(StyleSheet.flatten(root.props.style)).toMatchObject({
    width: 76,
    height: 76,
  });
  const image = screen.UNSAFE_getByType(Image);
  expect(image.props.resizeMode).toBe('contain');
  expect(StyleSheet.flatten(image.props.style)).toMatchObject({
    width: '100%',
    height: '100%',
  });
});

test('portal artwork fills its icon disc when dimensions are not specified', () => {
  const screen = render(<RecyclingMarkerArt kind="portal" />);
  const root = screen.toJSON();
  if (!root || Array.isArray(root)) throw new Error('Expected marker root');
  expect(StyleSheet.flatten(root.props.style)).toMatchObject({
    width: '100%',
    height: '100%',
  });
  expect(root.props.accessible).toBe(false);
});

test('portal preserves the smaller centered artwork inside its disc', () => {
  const screen = render(
    <RecyclingMarkerArt
      kind="portal"
      style={{ width: 34, height: 34 }}
      imageStyle={{ width: 28, height: 28 }}
    />,
  );
  expect(
    StyleSheet.flatten(screen.UNSAFE_getByType(Image).props.style),
  ).toMatchObject({ width: 28, height: 28 });
});

test('locked shop uses the closed recycling kiosk and still explains its unlock', () => {
  const onPress = jest.fn();
  const screen = render(
    <ShopMapMarker
      afterLevelLabel="15"
      locked
      selected={false}
      onPress={onPress}
    />,
  );
  expect(screen.UNSAFE_getByType(Image).props.source).toEqual(
    require('../../../assets/ui/visuais/shop_locked.png'),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Loja, Após 15' }));
  expect(onPress).toHaveBeenCalledTimes(1);
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
