// Config do Jest para os smoke tests de componente (Tray, GameBoard, BoardTile,
// ResultModal). Esse arquivo só é usado pelo script `test:ui` (`jest`);
// `npm test` roda a suíte de domínio por `scripts/rodar-testes.js`.
//
// Escopo deliberadamente restrito: os arquivos `tests/*.test.cjs` na raiz são
// formato node:test/CommonJS e não podem ser coletados pelo Jest. É por isso
// que o piso de cobertura (`npm run cobertura`) mede a suíte node:test e não
// este config: as 128 asserções de regra de jogo estão lá, não aqui.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src/components/__tests__'],
  testMatch: ['<rootDir>/src/components/__tests__/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
