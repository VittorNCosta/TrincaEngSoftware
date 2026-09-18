import { configureRemoteErrorReporter } from '../../observability/errorReporter';
import * as Clipboard from 'expo-clipboard';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import { DiagnosticReport } from '../DiagnosticReport';
import { ErrorBoundary } from '../ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));

test('report sharing is user initiated and does not write player storage', async () => {
  const share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: Share.sharedAction });
  const screen = render(<DiagnosticReport />);
  expect(share).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Compartilhar relatório'));
  await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  share.mockRestore();
});

test('render failure shows local report without attempting a save', () => {
  const remote = jest.fn();
  configureRemoteErrorReporter(remote);
  const output = jest.spyOn(console, 'error').mockImplementation(() => {});
  const Broken = (): never => {
    throw new Error('render fixture');
  };
  const screen = render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  );
  expect(screen.getByText('Algo deu errado')).toBeTruthy();
  expect(remote).toHaveBeenCalledTimes(1);
  configureRemoteErrorReporter();
  expect(screen.getAllByText(/render fixture/).length).toBeGreaterThan(0);
  expect(screen.getByText('Compartilhar relatório')).toBeTruthy();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  output.mockRestore();
});

test('copy button copies the displayed report only after a tap', async () => {
  const screen = render(<DiagnosticReport />);
  expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Copiar relatório'));
  await waitFor(() =>
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1),
  );
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
