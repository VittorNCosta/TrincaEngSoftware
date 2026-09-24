# TrincaMania

Jogo estilo mahjong (React Native / Expo) sobre coleta seletiva, feito em
torno do ODS 12 (Consumo e Produção Responsáveis) da ONU. O jogador fecha
"trincas" — resíduo → lixeira → símbolo de reciclagem, do mesmo material —
usando as cores oficiais da coleta seletiva (CONAMA 275/2001): plástico,
papel, vidro, metal e orgânico.

Duas trilhas de conteúdo:

- **Campanha** — 103 fases fixas (10 mundos × 10 + bônus), tabuleiro
  sorteado a cada tentativa.
- **Capítulos** — 1000 mapas proceduais em 10 capítulos de 100, tabuleiro
  determinístico por id (quem larga uma fase reencontra o mesmo tabuleiro
  ao voltar; só o _retry_ sorteia de novo).

O projeto está em redesign: a versão original era ambientada num universo de
fantasia genérica (reino, floresta encantada, doces...) e vem sendo
convertida por completo para o tema de reciclagem — ver a nota de contexto
histórico em [`CLAUDE.md`](CLAUDE.md) para o estado atual da migração.

## Rodando localmente

Pré-requisito: Node na versão do [`.nvmrc`](.nvmrc) (`nvm use`).

```
npm install
npm start
```

Abre o Metro/Expo Dev Tools; roda no Android, iOS ou navegador
(`npm run android`, `npm run ios`, `npm run web`) a partir dali.

Para gerar um `.apk` de release localmente (build nativo com Gradle, sem
depender da nuvem do EAS), veja [`COMO_GERAR_APK.md`](COMO_GERAR_APK.md).

## Antes de abrir um PR

```
npm run typecheck
npm test
```

O hook de `pre-push` já roda o `typecheck`; o CI (`.github/workflows/ci.yml`,
na raiz do repositório) roda a lista completa — lint, typecheck, testes,
testes de UI e o playthrough simulado — em jobs paralelos a cada push/PR.
Detalhe de `npm test` e por que o teste de composição das fases trava um
hash: ver [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Onde entender o projeto antes de mexer

| Arquivo                                                  | Para quê                                                                                                                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`CONTEXT.md`](CONTEXT.md)                               | Glossário do domínio (Material, Papel, Carta, Trinca, Tabuleiro...) com termos a evitar por conceito. Vinculante.                                                                                                     |
| [`CLAUDE.md`](CLAUDE.md)                                 | Regras permanentes do projeto (tema ODS 12, invariantes que já quebraram, arquitetura) e roteamento de agentes para sessões do Claude Code.                                                                           |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                     | Setup, checklist de antes de commitar, ponteiros de arquitetura.                                                                                                                                                      |
| [`docs/adr/`](docs/adr)                                  | Decisões arquiteturais registradas (por que a trinca é o ciclo da reciclagem, por que o domínio fica atrás de uma fachada, por que a bandeja tem base de sete espaços).                                               |
| [`docs/roadmap/roadmap.html`](docs/roadmap/roadmap.html) | Roadmap do redesign — fonte única de verdade das tarefas pendentes/feitas; `docs/ROADMAP-JOGO-COMPLETO.md` é o espelho em markdown e as issues do GitHub são geradas a partir dele (`scripts/sincronizar-issues.js`). |

## Arquitetura, em uma frase

UI (`src/screens`, `src/components`) → `src/domain/recycling` (regras de
material, ciclo, trinca) e `src/storage` (AsyncStorage, um módulo por
domínio, sempre atrás de mutators específicos — nunca grava direto). O
domínio nunca importa de UI.

## Scripts úteis

| Comando                           | O que faz                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run typecheck`               | `tsc --noEmit`                                                                       |
| `npm test`                        | Suíte inteira em `tests/*.test.cjs`, resolvida pelo Node (`scripts/rodar-testes.js`) |
| `npm run test:ui`                 | Testes de componente (Jest)                                                          |
| `npm run test:playthrough`        | Simula uma campanha completa do início ao fim                                        |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                    |
| `npm run guarda:ods12`            | Varre o repositório atrás de vocabulário de fantasia fora do tema                    |
| `npm run valida:assets`           | Confere tamanho, duplicata e nome dos assets em `assets/`                            |
| `npm run auditoria`               | Auditoria de dependências contra o livro-razão de advisories conhecidos              |
