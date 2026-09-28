import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '../PrimaryButton';

test.each(['regular', 'compact', 'small'] as const)(
  'botão %s mantém nome acessível e alvo de pelo menos 48dp',
  (size) => {
    const onPress = jest.fn();
    const screen = render(
      <PrimaryButton size={size} title="Abrir mapa" onPress={onPress}>
        <Text>Ícone</Text>
      </PrimaryButton>,
    );
    const button = screen.getByRole('button', { name: 'Abrir mapa' });

    expect(
      StyleSheet.flatten(button.props.style).minHeight,
    ).toBeGreaterThanOrEqual(48);
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  },
);
