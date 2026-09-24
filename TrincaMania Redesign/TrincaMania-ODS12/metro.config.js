// Uma string vazia permite que o Metro elimine o SDK no build sem DSN.
process.env.EXPO_PUBLIC_SENTRY_DSN ??= '';
const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
module.exports = process.env.EXPO_PUBLIC_SENTRY_DSN
  ? getSentryExpoConfig(__dirname)
  : getDefaultConfig(__dirname);
