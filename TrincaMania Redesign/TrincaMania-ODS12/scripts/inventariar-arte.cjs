// Inventário local: decodifica PNGs, resolve referências e prepara uma galeria.
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { PNG } = require('pngjs');
const ts = require('typescript');
const prettier = require('prettier');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/arte');
const relative = (file) => path.relative(root, file).split(path.sep).join('/');
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );

require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
require.extensions['.png'] = (module, filename) => {
  module.exports = filename;
};

const { WORLDS } = require('../src/data/worlds.ts');
const {
  WORLD_VISUAL_ASSETS,
  getWorldVisualAssets,
} = require('../src/data/worldVisualAssets.ts');
const references = new Map();
const missing = [];
const record = (file, source) => {
  if (!fs.existsSync(file))
    missing.push({ arquivo: relative(file), origem: source });
  if (!references.has(file)) references.set(file, new Set());
  references.get(file).add(source);
};
for (const file of [
  ...walk(path.join(root, 'src')),
  path.join(root, 'App.tsx'),
]) {
  if (!/\.(?:tsx?|jsx?)$/.test(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (match[1].includes('assets/'))
      record(path.resolve(path.dirname(file), match[1]), relative(file));
  }
}
const configAssets = (value) => {
  if (typeof value === 'string' && /^\.?\/?assets\//.test(value))
    record(path.resolve(root, value), 'app.json');
  else if (value && typeof value === 'object')
    Object.values(value).forEach(configAssets);
};
configAssets(JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')));

const assets = walk(path.join(root, 'assets'))
  .filter((file) => path.basename(file) !== 'README.md')
  .sort()
  .map((file) => {
    const bytes = fs.readFileSync(file);
    const entry = {
      arquivo: relative(file),
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      referencias: [...(references.get(file) || [])].sort(),
    };
    if (file.endsWith('.png')) {
      const image = PNG.sync.read(bytes, { checkCRC: true });
      let transparent = 0;
      for (let index = 3; index < image.data.length; index += 4)
        if (image.data[index] < 255) transparent++;
      Object.assign(entry, {
        largura: image.width,
        altura: image.height,
        pixelsComTransparencia: transparent,
        pngDecodificado: true,
      });
    }
    return entry;
  });
const byFile = new Map(assets.map((asset) => [asset.arquivo, asset]));
const interfaceResolutions = [
  { arquivo: 'assets/icon.png', largura: 1024, altura: 1024 },
  { arquivo: 'assets/adaptive-icon.png', largura: 1024, altura: 1024 },
  ...assets
    .filter(
      (asset) =>
        asset.arquivo.startsWith('assets/ui/visuais/') &&
        !asset.arquivo.endsWith('/splash.png'),
    )
    .map((asset) => ({ arquivo: asset.arquivo, largura: 320, altura: 320 })),
];
const worlds = WORLDS.map((world) => {
  const visual = getWorldVisualAssets(world.id);
  return {
    id: world.id,
    nome: world.name,
    registroProprio: Object.hasOwn(WORLD_VISUAL_ASSETS, world.id),
    placeholder:
      world.id === 21
        ? 'Família do Viveiro (mundo 4); A-24a/b pendentes.'
        : null,
    fundos: ['map', 'game'].map((role) => {
      const asset = byFile.get(relative(visual[role]));
      return {
        papel: role,
        ...asset,
        atendeResolucao1080x1920:
          asset.largura === 1080 && asset.altura === 1920,
      };
    }),
  };
});
const report = {
  data: new Date().toISOString(),
  branch: 'develop',
  limiteBytes: 400 * 1024,
  criterioResolucaoFundos: { largura: 1080, altura: 1920 },
  resumo: {
    arquivos: assets.length,
    pngs: assets.filter((asset) => asset.pngDecodificado).length,
    bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    residuos: assets.filter((asset) =>
      asset.arquivo.startsWith('assets/residuos/'),
    ).length,
    fundosProprios: worlds
      .filter((world) => world.registroProprio)
      .flatMap((world) => world.fundos).length,
    acimaDoLimite: assets
      .filter((asset) => asset.bytes > 400 * 1024)
      .map((asset) => asset.arquivo),
    orfaos: assets
      .filter((asset) => !asset.referencias.length)
      .map((asset) => asset.arquivo),
    referenciasAusentes: missing,
    interfaceForaDaResolucao: interfaceResolutions
      .filter((expected) => {
        const asset = byFile.get(expected.arquivo);
        return (
          asset?.largura !== expected.largura ||
          asset?.altura !== expected.altura
        );
      })
      .map((expected) => ({
        arquivo: expected.arquivo,
        esperado: { largura: expected.largura, altura: expected.altura },
        encontrado: {
          largura: byFile.get(expected.arquivo)?.largura,
          altura: byFile.get(expected.arquivo)?.altura,
        },
      })),
    fundosAbaixoDaEspecificacao: worlds
      .filter((world) => world.registroProprio)
      .flatMap((world) => world.fundos)
      .filter((asset) => !asset.atendeResolucao1080x1920)
      .map((asset) => asset.arquivo),
  },
  limites: [
    'Referências literais e configuração comprovam registro, não visibilidade em todos os estados do Android.',
    'Decodificação e tamanho não comprovam contraste 3:1, recorte, estilo, direitos de uso ou aprovação humana.',
    'As imagens de recompensa antigas precisam de revisão de conteúdo ODS12; o baú de mundo ainda exibe gemas.',
    'shop_locked.png mede 300×300; os marcadores de mapa têm especificação de 320×320. A splash mede 720×1280, sem resolução específica de splash fixada na art bible.',
    'A-04 e VIS-02 permanecem aguardando aprovação visual explícita; A-24a/b não foram geradas.',
  ],
  mundos: worlds,
  assets,
};
const figure = (asset) =>
  `<figure><img loading="lazy" src="../../${escape(asset.arquivo)}" alt="${escape(asset.arquivo)}"><figcaption>${escape(asset.arquivo)}<br>${asset.largura} × ${asset.altura} · ${(asset.bytes / 1024).toFixed(1)} KiB</figcaption></figure>`;
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>TrincaEng — auditoria de arte</title><style>body{font:16px system-ui;margin:24px;background:#eaf3eb;color:#153c29}h1,h2{line-height:1.2}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}figure{margin:0;padding:12px;background:white;border-radius:12px;overflow-wrap:anywhere}img{display:block;max-width:100%;height:350px;object-fit:contain;background:repeating-conic-gradient(#ddd 0% 25%,#fff 0% 50%) 0/20px 20px}figcaption{font-size:13px;padding-top:8px}.warning{background:#fff3cb;padding:16px;border-radius:8px}summary{cursor:pointer}</style><h1>Mapas e assets — 06/10/2026</h1><p>${report.resumo.fundosProprios} fundos próprios; ${report.resumo.pngs} PNGs decodificados; ${report.resumo.orfaos.length} órfãos; ${report.resumo.acimaDoLimite.length} acima do teto.</p><div class="warning"><strong>Revisão técnica local; aprovação Android pendente.</strong><ul>${report.limites.map((item) => `<li>${escape(item)}</li>`).join('')}</ul><p>Os 20 fundos existentes estão abaixo da resolução 1080 × 1920 prevista na art bible.</p></div>${worlds.map((world) => `<h2>Mundo ${world.id} — ${escape(world.nome)}</h2>${world.placeholder ? `<p>${escape(world.placeholder)}</p>` : ''}<div class="grid">${world.fundos.map(figure).join('')}</div>`).join('')}<h2>Demais imagens registradas</h2><details><summary>Abrir galeria de resíduos, marcadores e interface</summary><div class="grid">${assets
  .filter(
    (asset) =>
      asset.pngDecodificado && !asset.arquivo.startsWith('assets/map/worlds/'),
  )
  .map(figure)
  .join('')}</div></details></html>`;
async function writeInventory() {
  const [json, gallery] = await Promise.all([
    prettier.format(JSON.stringify(report), { parser: 'json' }),
    prettier.format(html, { parser: 'html' }),
  ]);
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'inventario-20261006.json'), json);
  fs.writeFileSync(path.join(output, 'galeria-20261006.html'), gallery);
  console.log(JSON.stringify(report.resumo, null, 2));
  if (
    missing.length ||
    report.resumo.orfaos.length ||
    report.resumo.acimaDoLimite.length
  )
    process.exitCode = 1;
}

writeInventory().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
