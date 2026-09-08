const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

/**
 * Q-06: o alvo de toque minimo de 44px (WCAG 2.5.5 / Material) ja existia
 * como numero solto em alguns lugares — `minimumTouchSize: 44` no config do
 * mapa segmentado, `TILE_SIZE = 52` na peca do tabuleiro — mas nenhum teste
 * travava esse numero. Um `minimumTouchSize` ou `TILE_SIZE` menor passava
 * silencioso: nenhum typecheck, nenhum teste, nada acusava a regressao.
 *
 * Este arquivo trava as duas superficies de toque mais usadas do jogo: a
 * peca do tabuleiro (a jogada em si) e o no do mapa da campanha (a navegacao
 * pra abrir uma fase) — nas 10 fases do unico mundo hoje em modo `segmented`
 * (os outros nove ainda sao `legacy`, ver CLAUDE.md).
 */

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const {
  TILE_SIZE,
} = require('../src/domain/recycling/services/BoardService.ts');
const { WORLD_MAP_CONFIGS } = require('../src/data/worldMapConfigs.ts');
const {
  createCampaignMapTransform,
  getCampaignMapEntityFrames,
} = require('../src/utils/campaignMapLayout.ts');

const TOQUE_MINIMO = 44;

test('a peca do tabuleiro (TILE_SIZE) atinge o alvo minimo de 44px', () => {
  assert.ok(
    TILE_SIZE >= TOQUE_MINIMO,
    `TILE_SIZE (${TILE_SIZE}) caiu abaixo do minimo de ${TOQUE_MINIMO}px — a peca do tabuleiro e o alvo de toque mais frequente do jogo inteiro.`,
  );
});

test('todo mundo em modo segmented declara levelNodeSize >= 44px de largura e altura', () => {
  // Este e o alvo de toque que de fato chega na tela: `LevelSelectScreen`
  // posiciona o wrapper do no com `levelNodeSize` (nao com `frames.touch` —
  // essa segunda medida existe em `campaignMapLayout.ts` mas nenhum renderer
  // a consome hoje) e so depois aplica `transform: scale` pra caber no
  // aparelho. `transform` no React Native e so visual: nao encolhe a area de
  // toque, que continua sendo a caixa de layout pre-transform. Por isso o
  // alvo real e `levelNodeSize`, nao o tamanho visual reduzido na tela.
  Object.values(WORLD_MAP_CONFIGS)
    .filter((config) => config.mode === 'segmented')
    .forEach((config) => {
      assert.ok(
        config.levelNodeSize.width >= TOQUE_MINIMO &&
          config.levelNodeSize.height >= TOQUE_MINIMO,
        `mundo ${config.worldId}: levelNodeSize ${config.levelNodeSize.width}x${config.levelNodeSize.height} abaixo de ${TOQUE_MINIMO}px`,
      );
    });
});

test('todo mundo em modo segmented declara minimumTouchSize >= 44px', () => {
  const mundosSegmentados = Object.values(WORLD_MAP_CONFIGS).filter(
    (config) => config.mode === 'segmented',
  );

  // Hoje so o Mundo 1 (Parque) e segmented — os demais sao legacy (ver
  // CLAUDE.md, "worldMapConfigs.ts"). Esta asserção existe pra nunca deixar
  // essa lista ficar vazia em silêncio: se um dia ninguém migrar mais nenhum
  // mundo pra segmented, o teste abaixo (`assert.ok`) passaria vazio e essa
  // cobertura pararia de significar algo sem que ninguém notasse.
  assert.ok(
    mundosSegmentados.length > 0,
    'nenhum mundo em modo segmented encontrado — confira se WORLD_MAP_CONFIGS mudou de forma',
  );

  mundosSegmentados.forEach((config) => {
    assert.ok(
      config.minimumTouchSize >= TOQUE_MINIMO,
      `mundo ${config.worldId}: minimumTouchSize (${config.minimumTouchSize}) abaixo de ${TOQUE_MINIMO}px`,
    );
  });
});

test('todo no de fase e marco do Mundo 1 mede >= 44px de alvo de toque, nas tres larguras alvo', () => {
  const parque = WORLD_MAP_CONFIGS[1];

  assert.equal(parque.mode, 'segmented');

  [360, 392, 412].forEach((width) => {
    const transform = createCampaignMapTransform(parque, width);

    parque.levelAnchors.forEach((anchor) => {
      const frames = getCampaignMapEntityFrames(
        anchor.point,
        parque.levelNodeSize,
        parque.levelNodeOrigin,
        transform,
        parque.minimumTouchSize,
      );

      assert.ok(
        frames.touch.width >= TOQUE_MINIMO &&
          frames.touch.height >= TOQUE_MINIMO,
        `no da fase ${anchor.levelId} em ${width}px: alvo de toque ${frames.touch.width}x${frames.touch.height} abaixo de ${TOQUE_MINIMO}px`,
      );
    });

    parque.landmarks.forEach((landmark) => {
      const frames = getCampaignMapEntityFrames(
        landmark.point,
        landmark.visualSize,
        landmark.origin,
        transform,
        parque.minimumTouchSize,
      );

      assert.ok(
        frames.touch.width >= TOQUE_MINIMO &&
          frames.touch.height >= TOQUE_MINIMO,
        `marco ${landmark.visualKey} em ${width}px: alvo de toque ${frames.touch.width}x${frames.touch.height} abaixo de ${TOQUE_MINIMO}px`,
      );
    });
  });
});
