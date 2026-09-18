const { version } = require('./package.json');

module.exports = ({ config }) => {
  const e2e = process.env.EXPO_PUBLIC_E2E === 'true';
  if (
    e2e &&
    ['preview', 'production'].includes(process.env.EAS_BUILD_PROFILE)
  ) {
    throw new Error('E2E não pode ser ativado em preview/production');
  }
  const sentry = !e2e && Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN);
  if (sentry && (!process.env.SENTRY_ORG || !process.env.SENTRY_PROJECT)) {
    throw new Error(
      'DSN configurado exige SENTRY_ORG e SENTRY_PROJECT para sourcemaps',
    );
  }
  return {
    ...config,
    version,
    name: e2e ? `${config.name} E2E` : config.name,
    android: {
      ...config.android,
      ...(e2e ? { package: 'br.com.mhvtech.trincamania.e2e' } : {}),
    },
    runtimeVersion: { policy: 'fingerprint' },
    updates: {
      ...config.updates,
      enabled: !e2e,
      url: `https://u.expo.dev/${config.extra.eas.projectId}`,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
    plugins: [
      ...(config.plugins || []),
      ...(sentry
        ? [
            [
              '@sentry/react-native/expo',
              {
                organization: process.env.SENTRY_ORG,
                project: process.env.SENTRY_PROJECT,
                url: 'https://sentry.io/',
              },
            ],
          ]
        : []),
    ],
  };
};
