import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ScreenShell } from '../ScreenShell';

test.each([true, false])(
  'clips decorative panels to their own page and keeps content actionable (scroll=%s)',
  (scroll) => {
    const onPress = jest.fn();
    const screen = render(
      <ScreenShell scroll={scroll}>
        <Pressable accessibilityRole="button" onPress={onPress}>
          <Text>Abrir fase</Text>
        </Pressable>
      </ScreenShell>,
    );
    const root = screen.toJSON();
    if (!root || Array.isArray(root)) throw new Error('Expected screen root');
    const background = root.children?.[0];
    if (!background || typeof background === 'string') {
      throw new Error('Expected decorative background');
    }

    // Adjacent mounted pages must not paint their rotated panels over this page.
    expect(StyleSheet.flatten(background.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      overflow: 'hidden',
    });
    expect(background.props.pointerEvents).toBe('none');
    fireEvent.press(screen.getByRole('button', { name: 'Abrir fase' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  },
);
