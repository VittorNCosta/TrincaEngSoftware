# Contribuindo com o TrincaMania

## Setup

```
npm install
npm start
```

## Antes de commitar

```
npm run typecheck
npm test
```

O CI (`.github/workflows/ci.yml`, na raiz do repositório) roda os dois em todo push/PR
para `develop`/`main` — rodar local primeiro evita surpresa lá.

`npm test` roda `node --test tests` (a suíte inteira, 117+ casos). Um teste específico,
`tests/levelComposition.test.cjs` → "as 203 fases canonicas continuam byte-identicas",
trava um hash sha256 do conteúdo de `src/data/levels.ts` de propósito: se você mudar
título, dificuldade ou peça de qualquer uma das 203 fases canônicas, esse teste
**deve** quebrar. Confirme que a mudança foi intencional e depois recalcule o hash
(`sha256(JSON.stringify(LEVELS))`) e atualize o literal esperado nesse arquivo — não
ignore nem apague a asserção.

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
