import type { AlertButton } from 'react-native';

// React Native Web's Alert has no browser implementation.
export default {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const text = [title, message].filter(Boolean).join('\n\n');
    const action = buttons?.find((button) => button.style !== 'cancel');
    if (buttons?.some((button) => button.style === 'cancel')) {
      if (window.confirm(text)) action?.onPress?.();
    } else {
      window.alert(text);
      action?.onPress?.();
    }
  },
};
