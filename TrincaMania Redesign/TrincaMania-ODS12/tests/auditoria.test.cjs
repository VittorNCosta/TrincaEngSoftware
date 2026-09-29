const assert = require('node:assert/strict');
const test = require('node:test');

const { coletarAdvisories } = require('../scripts/auditoria.js');

test('chave do GHSA permanece estável quando o npm renumera o advisory', () => {
  const relatorio = (source, ghsa) => ({
    vulnerabilities: {
      'image-size': {
        name: 'image-size',
        severity: 'high',
        via: [
          {
            name: 'image-size',
            source,
            severity: 'high',
            title: 'Parser pode entrar em loop',
            url: `https://github.com/advisories/${ghsa}`,
          },
        ],
      },
    },
  });

  const antes = coletarAdvisories(relatorio(1138808, 'GHSA-w3rx-r6r6-pgpr'));
  const depois = coletarAdvisories(relatorio(1239766, 'GHSA-w3rx-r6r6-pgpr'));
  const novo = coletarAdvisories(relatorio(1239766, 'GHSA-5p2g-fcmc-qvqq'));

  assert.equal(antes[0].chave, depois[0].chave);
  assert.notEqual(depois[0].chave, novo[0].chave);
});
