# Instruções específicas de Claude

Leia primeiro [AGENTS.md](../../AGENTS.md), fonte compartilhada de arquitetura, invariantes, verificação, ciclo de PR sem auto-merge e backlog, e [CONTEXT.md](CONTEXT.md). Preserve `.claude` hooks e o registro existente via `npm run estado`/`npm run janela`.

## Roteamento — qual agente usar

Quando houver delegação autorizada e útil, use estas especialidades. Use `Agent` com o
`subagent_type` correspondente.

| Se a tarefa é…                                                           | Agente                  |
| ------------------------------------------------------------------------ | ----------------------- |
| Implementar/alterar componente, tela, hook, storage, áudio, haptics      | `react-native-engineer` |
| Mecânica, economia (moedas/chaves/baús), progressão, balanceamento       | `game-designer`         |
| Revisar diff pronto, auditar drift entre docs e código (somente leitura) | `code-reviewer`         |
| Escrever/atualizar teste, investigar bug reproduzível                    | `qa-engineer`           |
| Sintoma concreto de lentidão/jank/memória (nunca preventivo)             | `performance-engineer`  |
| Revisar interface, feedback, acessibilidade, "sensação" de recompensa    | `ui-ux-engineer`        |

Composição usual: `game-designer` decide o **quê** → `react-native-engineer`
implementa o **como** → `qa-engineer` cobre com teste → `code-reviewer` fecha.
Rodar agentes em paralelo exige **escopos de arquivo disjuntos** — dois
agentes editando o mesmo arquivo conflitam.

Skills: `/code-review` para revisão de correção antes de declarar qualquer
tarefa não trivial concluída; `/security-review` antes de release;
`/simplify` para limpeza de qualidade (não caça bugs).
