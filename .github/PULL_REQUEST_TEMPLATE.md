## O que muda e por que

<!-- Uma ou duas frases. Se resolve uma issue do roadmap, referencie o id
     (ex.: G-11) e feche com "Closes #123". -->

## Como testar

<!-- Passos manuais, se houver algum alem do que o CI ja cobre. -->

## Checklist

- [ ] `npm run typecheck` e `npm test` passam localmente
- [ ] Se mexeu em `src/data/levels.ts`: o hash de
      `tests/levelComposition.test.cjs` foi recalculado de proposito
- [ ] Conteudo novo/editado (fase, mundo, texto, asset) fica dentro do
      universo ODS 12 - sem vocabulario de fantasia generica (ver `CLAUDE.md`)
- [ ] Commits seguem Conventional Commits (`commitlint` roda no `commit-msg`)
