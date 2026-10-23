// Otimização de produção do Expo SDK 54: remove imports/exports não usados.
// A configuração vale para o build do app e para a medição do orçamento.
// Desative ambas as flags com 0 ao investigar um problema de produção.
// https://docs.expo.dev/guides/tree-shaking/
process.env.EXPO_UNSTABLE_TREE_SHAKING ??= '1';
process.env.EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH ??=
  process.env.EXPO_UNSTABLE_TREE_SHAKING;

// Uma string vazia permite que o Metro elimine o SDK no build sem DSN.
process.env.EXPO_PUBLIC_SENTRY_DSN ??= '';
const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
module.exports = process.env.EXPO_PUBLIC_SENTRY_DSN
  ? getSentryExpoConfig(__dirname)
  : getDefaultConfig(__dirname);
