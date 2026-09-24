const test = require('node:test');
const assert = require('node:assert/strict');
const { toMarkdown } = require('../scripts/lib/roadmap');

test('formata as tags conhecidas do roadmap como Markdown', () => {
  assert.equal(
    toMarkdown('<b>Importante</b><br><code>fase</code> e <i>mundo</i>'),
    '**Importante**\n`fase` e *mundo*',
  );
});

test('não cria HTML executável em títulos ou detalhes da issue', () => {
  assert.equal(
    toMarkdown('<scr<script>ipt>&lt;img src=x onerror=alert(1)&gt;'),
    '&lt;scr&lt;script&gt;ipt&gt;&lt;img src=x onerror=alert(1)&gt;',
  );
});
