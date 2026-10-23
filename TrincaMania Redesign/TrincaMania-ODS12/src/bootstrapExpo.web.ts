// expo-audio usa globalThis.expo durante a avaliação do módulo. Tornamos a
// inicialização explícita antes de importar App, inclusive com tree shaking.
import { installExpoGlobalPolyfill } from 'expo-modules-core/src/polyfill/dangerous-internal';

installExpoGlobalPolyfill();
