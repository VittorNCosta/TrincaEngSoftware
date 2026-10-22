import { act, fireEvent, render } from '@testing-library/react-native';
import { SplashIntroScreen } from '../../screens/SplashIntroScreen';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const advance = (milliseconds: number) => {
  act(() => jest.advanceTimersByTime(milliseconds));
};

test('the original intro waits for its artwork and saved progress before leaving', () => {
  const onFinish = jest.fn();
  const screen = render(
    <SplashIntroScreen appReady={false} onFinish={onFinish} />,
  );
  advance(5000);
  expect(onFinish).not.toHaveBeenCalled();

  fireEvent(screen.getByTestId('splash-skip'), 'layout', {});
  fireEvent(screen.getByTestId('intro-background'), 'load');
  for (let index = 1; index <= 3; index += 1) {
    fireEvent(screen.getByTestId(`intro-tile-${index}`), 'load');
  }
  // Readiness crosses separate paint frames before starting the timeline.
  for (let frame = 0; frame < 10; frame += 1) advance(100);
  advance(3000);
  expect(onFinish).not.toHaveBeenCalled();

  screen.rerender(<SplashIntroScreen appReady onFinish={onFinish} />);
  advance(400);
  expect(onFinish).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('splash-skip'));
  advance(5000);
  expect(onFinish).toHaveBeenCalledTimes(1);
  screen.unmount();
});

test('failed images do not trap the player in the intro', () => {
  const onFinish = jest.fn();
  const screen = render(<SplashIntroScreen onFinish={onFinish} />);
  fireEvent(screen.getByTestId('splash-skip'), 'layout', {});
  fireEvent(screen.getByTestId('intro-background'), 'error');
  for (let index = 1; index <= 3; index += 1) {
    fireEvent(screen.getByTestId(`intro-tile-${index}`), 'error');
  }
  for (let frame = 0; frame < 10; frame += 1) advance(100);
  advance(3000);
  advance(400);
  expect(onFinish).toHaveBeenCalledTimes(1);
  screen.unmount();
});
