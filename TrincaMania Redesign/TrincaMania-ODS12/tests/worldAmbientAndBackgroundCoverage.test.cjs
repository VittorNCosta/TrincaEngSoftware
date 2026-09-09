const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

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

/**
 * C-27: quando o Mundo 9/10 foram adicionados no resize 203→103, dois mapas
 * paralelos por `worldId` precisaram de entrada nova — `AMBIENT_BY_WORLD_ID`
 * (`src/utils/sounds.ts`) e o `switch` de `getGameBackground`
 * (`src/screens/GameScreen.tsx`) — e nenhum dos dois avisa em compilação se
 * um mundo futuro ficar de fora: o primeiro cai em silêncio
 * (`playAmbientForWorld` chama `stopAmbientPlayback()` quando não acha
 * chave), o segundo cai no `default` (fundo do Mundo 1, floresta-fantasma
 * atrás de outro tema). Este arquivo tranca os dois contra `WORLDS`.
 */

// `sounds.ts` importa `expo-audio` (módulo nativo) só para tocar áudio de
// verdade — a leitura de `AMBIENT_BY_WORLD_ID` é síncrona e pura, então o
// mock só precisa existir para o import no topo do arquivo não quebrar.
const audioPlayerStub = {
  pause() {},
  play() {},
  release() {},
  remove() {},
  seekTo() {},
  volume: 1,
};

const expoAudioId = require.resolve('expo-audio');
require.cache[expoAudioId] = {
  id: expoAudioId,
  filename: expoAudioId,
  loaded: true,
  children: [],
  paths: [],
  exports: {
    createAudioPlayer: () => ({ ...audioPlayerStub }),
    setIsAudioActiveAsync: async () => undefined,
  },
};

// `sounds.ts` -> `settingsStorage.ts` -> AsyncStorage. Nunca é de fato lido
// neste teste (só chamamos a leitura pura de `getAmbientKeyForWorld`), mas o
// import no topo do arquivo precisa resolver.
const asyncStorageId =
  require.resolve('@react-native-async-storage/async-storage');
require.cache[asyncStorageId] = {
  id: asyncStorageId,
  filename: asyncStorageId,
  loaded: true,
  children: [],
  paths: [],
  exports: {
    __esModule: true,
    default: { getItem: async () => null, setItem: async () => undefined },
  },
};

// `sounds.ts` também faz `require('*.mp3'/'*.wav')` no topo do arquivo, só
// para obter o identificador de asset que o Metro resolveria em build real —
// aqui não interessa o conteúdo, só não quebrar o require.
require.extensions['.mp3'] = (module) => {
  module.exports = 'mock-audio-source';
};
require.extensions['.wav'] = (module) => {
  module.exports = 'mock-audio-source';
};

const { WORLDS } = require('../src/data/worlds.ts');
const {
  getAmbientExpectedFiles,
  getAmbientKeyForWorld,
} = require('../src/utils/sounds.ts');

const BONUS_WORLD_ID = 21;
const mainWorldIds = WORLDS.map(({ id }) => id).filter(
  (id) => id !== BONUS_WORLD_ID,
);

test('todo mundo numerado (1-10) tem ambiente sonoro mapeado e válido', () => {
  const knownAmbientKeys = new Set(
    getAmbientExpectedFiles().map(({ key }) => key),
  );
  assert.ok(
    knownAmbientKeys.size > 0,
    'getAmbientExpectedFiles não deveria vir vazio',
  );
  assert.ok(
    mainWorldIds.length >= 10,
    'esperava pelo menos os 10 mundos numerados em WORLDS',
  );

  mainWorldIds.forEach((worldId) => {
    const ambientKey = getAmbientKeyForWorld(worldId);
    assert.ok(
      ambientKey !== undefined,
      `Mundo ${worldId} sem ambiente sonoro — jogador cai em silêncio (playAmbientForWorld chama stopAmbientPlayback)`,
    );
    assert.ok(
      knownAmbientKeys.has(ambientKey),
      `Mundo ${worldId} aponta para chave de ambiente desconhecida: ${ambientKey}`,
    );
  });
});

// O Mundo 21 (bônus) nunca teve ambiente próprio — não existe chave "sweet"
// em `AmbientKey`, e é assim desde antes do resize 203→103. Não é lacuna do
// C-27 (que é sobre mundo *novo* cair em silêncio sem ninguém perceber);
// travar aqui documenta que é opção conhecida, não esquecimento.
test('Mundo bônus (21) permanece deliberadamente sem ambiente sonoro próprio', () => {
  assert.equal(getAmbientKeyForWorld(BONUS_WORLD_ID), undefined);
});

// S-15: o C-27 já garante que todo mundo aponta para *alguma* chave conhecida.
// Estes quatro fecham o resto do contrato do bloco S: a chave tem áudio de
// fato, nenhuma trilha registrada fica sem dono, os mundos 1-8 não repetem
// ambiente, e a `AmbientKey` não volta ao vocabulário de fantasia do L-01/S-11.

test('S-15: todo mundo numerado (1-10) aponta para um ambiente com áudio resolvido', () => {
  const configByKey = new Map(
    getAmbientExpectedFiles().map(({ key, file, ready }) => [
      key,
      { file, ready },
    ]),
  );

  mainWorldIds.forEach((worldId) => {
    const ambientKey = getAmbientKeyForWorld(worldId);
    const config = configByKey.get(ambientKey);
    assert.ok(
      config,
      `Mundo ${worldId} aponta para chave sem config: ${ambientKey}`,
    );
    assert.ok(
      config.ready,
      `Mundo ${worldId} -> ${ambientKey} (${config.file}) sem source resolvido: a chave existe mas o jogador ouve silêncio`,
    );
  });
});

test('S-15: nenhuma trilha de ambiente registrada fica sem um mundo que a use', () => {
  const usedKeys = new Set(
    mainWorldIds.map((worldId) => getAmbientKeyForWorld(worldId)),
  );
  const orphans = getAmbientExpectedFiles()
    .map(({ key }) => key)
    .filter((key) => !usedKeys.has(key));

  assert.deepEqual(
    orphans,
    [],
    `Ambiente(s) em AMBIENT_CONFIGS sem nenhum mundo apontando: ${orphans.join(', ')}`,
  );
});

test('S-15: mundos 1-8 têm ambientes distintos entre si', () => {
  // 9 e 10 reaproveitam de propósito (usina/forum) até S-13 gerar trilha
  // própria; 1-8 já são 1:1 e devem continuar assim depois do S-13.
  const keys = [1, 2, 3, 4, 5, 6, 7, 8].map((worldId) =>
    getAmbientKeyForWorld(worldId),
  );

  assert.equal(
    new Set(keys).size,
    keys.length,
    `ambientes repetidos em 1-8: ${keys.join(', ')}`,
  );
});

test('S-15: AmbientKey não regride ao vocabulário de fantasia (L-01/S-11)', () => {
  const FANTASIA = [
    'beach',
    'celestial',
    'crystal',
    'forest',
    'mountain',
    'snow',
    'stars',
    'sweet',
    'volcano',
  ];
  const regressoes = getAmbientExpectedFiles()
    .map(({ key }) => key)
    .filter((key) => FANTASIA.includes(key));

  assert.deepEqual(
    regressoes,
    [],
    `AmbientKey voltou a nomes do jogo de fantasia: ${regressoes.join(', ')}`,
  );
});

test('getGameBackground (GameScreen.tsx) cobre todo mundo em WORLDS com um case explícito', () => {
  const gameScreenSource = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'screens', 'GameScreen.tsx'),
    'utf8',
  );
  const functionMatch = gameScreenSource.match(
    /const getGameBackground = \(worldId: WorldId\) => \{([\s\S]*?)\n};/,
  );

  assert.ok(
    functionMatch,
    'não encontrou a função getGameBackground em GameScreen.tsx — teste desatualizado?',
  );

  const functionBody = functionMatch[1];
  assert.ok(
    /default:/.test(functionBody),
    'esperava um default: de segurança em getGameBackground',
  );

  const coveredWorldIds = new Set(
    Array.from(functionBody.matchAll(/case (\d+):/g), (match) =>
      Number(match[1]),
    ),
  );
  assert.ok(
    coveredWorldIds.size > 0,
    'não encontrou nenhum case numérico — regex desatualizada?',
  );

  const allWorldIds = WORLDS.map(({ id }) => id);
  const missingWorldIds = allWorldIds.filter(
    (worldId) => !coveredWorldIds.has(worldId),
  );

  assert.deepEqual(
    missingWorldIds,
    [],
    `Mundo(s) ${missingWorldIds.join(', ')} sem case explícito em getGameBackground — cai no default (fundo do Mundo 1)`,
  );
});
