import { registerRootComponent } from 'expo';
import { createElement } from 'react';

import App from './App';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// createElement em vez de JSX: este arquivo é .ts (não .tsx), e o `main` do
// package.json aponta pra ele — trocar a extensão mexeria na configuração de
// entrada do Expo à toa.
function Root() {
  return createElement(ErrorBoundary, null, createElement(App));
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
