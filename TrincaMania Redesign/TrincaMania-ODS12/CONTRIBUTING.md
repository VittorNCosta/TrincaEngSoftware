# Contribuindo com o TrincaMania

## Setup

```
npm install
npm start
```

## Validar antes de publicar e acompanhar o PR

```
npm run validar:local
```

Use a versão de Node indicada pelo projeto (Node 20, no mínimo 20.19.4).
O comando executa lint, formato, tipagem, guardas, testes de domínio com cobertura,
testes de componentes, playthrough, auditoria e sincronismo da coluna Codex.
Qualquer falha interrompe a sequência com código diferente de zero.

Depois de commit e push, acompanhe o PR:

```sh
npm run pr:validar -- 225 --watch
```

Troque `225` pelo número do PR. Requer `gh` autenticado. O monitor é somente
leitura e valida CI e Segurança no **SHA do HEAD local**, sem aproveitar sucesso
de outro commit. Verifica também conflitos e outros checks do PR. Sem `--watch`,
faz uma consulta; com essa opção, aguarda por até 30 minutos. Códigos de saída:
`0` aprovado, `1` falha ou erro de consulta, `2` pendente ou prazo esgotado.

Se houver falha, consulte `gh run view <id> --log-failed`, corrija sua causa,
execute a validação local, faça commit/push e rode o monitor novamente. Esse é o
ciclo de correção seguido pelo agente conforme o `AGENTS.md` da raiz. O script
não altera código nem faz merge automaticamente. Reduzir o piso de cobertura,
aceitar vulnerabilidade nova ou remover um check não é corrigir sua causa.

CI e Segurança rodam em pushes e PRs para qualquer branch. O Scorecard publica
somente na branch padrão, conforme a restrição da própria action; nas branches
de trabalho esse job aparece como ignorado, enquanto as outras verificações
continuam obrigatórias. Resultado verde significa aprovação dos checks
configurados, não ausência de toda dívida de segurança: os advisories previamente
aceitos continuam registrados em `scripts/auditoria-baseline.json`.

A revisão de dependências requer o Dependency Graph habilitado em Settings >
Advanced Security. Ele e os alertas do Dependabot estão habilitados neste
repositório. O build EAS permanece sob demanda: a checagem do token roda na raiz
do workspace, antes do checkout, e informa quando `EXPO_TOKEN` está ausente.

`npm test` usa `scripts/rodar-testes.js` para enumerar `tests/*.test.cjs` sem
depender da expansão de glob pelo shell. Os testes de composição e progressão
protegem o conteúdo canônico atual. Se uma mudança intencional de conteúdo
invalidar um contrato, revise o cenário e a asserção correspondente; não apague
uma proteção só para obter verde.

## Onde entender o domínio antes de mexer

- [`CONTEXT.md`](CONTEXT.md) — glossário do domínio (Material, Papel, Carta, Peça,
  Variante, Resíduo, Lixeira, Símbolo, Ciclo, Trinca, Tabuleiro, Bandeja), com termos a
  evitar por conceito. Vinculante: não invente sinônimo novo para algo que já tem nome
  ali.
- [`docs/adr/`](docs/adr) — decisões arquiteturais registradas (por que a trinca é o
  ciclo da reciclagem, por que o domínio fica atrás de uma fachada, por que a bandeja
  tem base de sete espaços).
- [`CLAUDE.md`](CLAUDE.md) — regras específicas para sessões do Claude Code neste
  projeto (inclui o estado atual do rebrand para ODS 12).

## Arquitetura, em uma frase

UI (`src/screens`, `src/components`) → `src/domain/recycling` (regras de material,
ciclo, trinca) e `src/storage` (AsyncStorage, sempre atrás de um módulo por
responsabilidade). O domínio nunca importa de UI — mantenha essa direção.
