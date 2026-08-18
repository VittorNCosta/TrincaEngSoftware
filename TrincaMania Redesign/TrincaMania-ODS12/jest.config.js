// Config do Jest para os smoke tests de componente (Tray, GameBoard, BoardTile,
// ResultModal). `npm test` continua sendo `node --test tests` — esse arquivo
// só é usado pelo script `test:ui` (`jest`).
//
// Escopo deliberadamente restrito: os arquivos `tests/*.test.cjs` na raiz são
// formato node:test/CommonJS e não podem ser coletados pelo Jest.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src/components/__tests__'],
  testMatch: ['<rootDir>/src/components/__tests__/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
