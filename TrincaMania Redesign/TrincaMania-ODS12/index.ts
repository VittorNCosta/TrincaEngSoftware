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
// Expo substitui esta variável na exportação; sem DSN o ramo inteiro é removido.
const RootWithReporting = process.env.EXPO_PUBLIC_SENTRY_DSN
  ? // Carregamento condicional permite eliminar o SDK quando não há DSN.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./src/observability/sentry').withErrorReporting(Root)
  : Root;
registerRootComponent(RootWithReporting);
