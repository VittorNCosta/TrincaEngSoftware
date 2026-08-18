// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'dist-test/**',
      'web-build/**',
      'android/**',
      'ios/**',
      // Pasta de terceiros (não é código do jogo, desatada do git).
      'agency-agents-main/**',
    ],
  },
  {
    // Suíte node:test roda em CommonJS puro (require/__dirname), não no
    // ambiente React Native que o resto do config assume.
    files: ['tests/**/*.cjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
