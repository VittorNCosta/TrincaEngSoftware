# TrincaMania — ODS 12

Jogo estilo mahjong (React Native/Expo) sobre coleta seletiva. O jogador fecha
"trincas" (resíduo → lixeira → símbolo de reciclagem) do mesmo material
(plástico, papel, vidro, metal, orgânico — cores CONAMA 275/2001). Leia
`CONTEXT.md` antes de nomear qualquer coisa nova: é o glossário do domínio
(Material, Papel, Carta, Peça, Variante, Resíduo, Lixeira, Símbolo, Ciclo,
Trinca, Tabuleiro, Bandeja) com uma lista explícita de termos a evitar por
conceito. Trate esse arquivo como a fonte de verdade de vocabulário.

## Regra permanente: este projeto é ODS 12, sem exceção

Todo conteúdo novo ou editado — nome de fase, de mundo, de capítulo, texto de
objetivo, item de loja, conquista, tutorial — precisa nascer dentro do universo
de reciclagem/consumo responsável. Nunca reintroduza vocabulário de fantasia
genérica (reino, castelo, dragão, cristal mágico, doce/açúcar, pirata/tesouro,
anjo/celestial) nem o tema de frutas do jogo original pré-redesign. Se
encontrar sobra desse tipo em qualquer arquivo (string, nome de asset, nome de
variável), trate como bug de conteúdo e sinalize ou corrija.

**Contexto histórico**: em 2026-08-13 foi feita uma auditoria completa do
projeto e corrigidos os nomes dos 8 mundos canônicos + mundo bônus (antes:
Bosque das Trincas, Vales Montanhosos, Ruínas de Cristal, Praia dos Tesouros,
Vulcão Doce, Cidade das Estrelas, Neve Cristalina, Reino Celestial, Reino
Açucarado — 100% fantasia) e os ~203 títulos individuais de fase em
`src/data/levels.ts`. Antes de assumir que uma tela/asset/texto ainda está no
tema antigo, verifique o estado atual do arquivo — não confie em memória de
uma auditoria antiga.

**Gap conhecido e ainda aberto**: os PNGs de fundo de mapa
(`assets/map/*.png`, mapeados em `src/data/campaignMapAssets.ts` e
`src/data/worldMapConfigs.ts`) continuam sendo os mesmos de floresta/
montanha/cristal/doce do jogo original — não há arte nova gerada, e isso
inclui os 10 capítulos novos de `src/data/chapters.ts` (que reaproveitam os
mesmos PNGs como placeholder). Reformar essa arte exige ilustração nova
(fora do alcance de edição de código/texto); não tente gerar PNG de jogo via
código. Marcadores pontuais ainda com arte antiga:
`src/components/ForestRestMapMarker.tsx` (`forest_rest_cart.png`) e o layout
`BOSQUE_MAP_CONFIG` do Mundo 1 em `src/data/worldMapConfigs.ts`.

**Gap conhecido — "Modo Dev" (2026-08-15)**: `unlockAllLevelsForDevMode`
(`src/storage/progressStorage.ts`) e `unlockAllChapterMapsForDevMode`
(`src/storage/chapterProgressStorage.ts`), acionados pelo botão em
Configurações (só visível com `__DEV__`), **escrevem direto no save real**
(`levelStars`, `unlockedLevelIds`, `mapStars`) em vez de um override efêmero
não persistido. Funciona para destravar fases e testar, mas não é
reversível automaticamente — sair do modo dev não restaura o progresso real
anterior; só "Resetar progresso" limpa. Se algum dia importar ter um
`effectiveUnlocked = devMode ? true : normalUnlockRule` que não contamina o
save, isso exige reescrever a leitura de desbloqueio em
`LevelSelectScreen`/`ChaptersScreen`, não só a escrita — avaliar custo antes
de assumir que é troca simples.

## Roteamento — qual agente usar

Delegue por padrão quando a tarefa cair numa destas faixas. Use `Agent` com o
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

## Invariantes que já quebraram — nunca reintroduza

1. **Progresso** só é gravado por `commitProgress` / `commitChapterProgress` (fila serializada em `App.tsx`, com guarda de geração). Chamar `saveProgress` direto já apagou progresso de jogador.
2. **Vidas** só mudam por `mutateLives` (`src/storage/livesStorage.ts`). Chamada direta a `saveLivesState` já perdeu vida premiada.
3. **Campanha e capítulos têm storages separados.** `normalizeProgress` descarta ids `chNN-NNN` **em silêncio** — nunca passe id de capítulo ao storage da campanha.
4. **As 203 fases canônicas de `src/data/levels.ts` são congeladas.** Existe teste travando o hash de `JSON.stringify(LEVELS)`. Se mexer no arquivo, prove que a saída não mudou.
5. **Guarda de idempotência vai depois do `await`**, lendo o ref atual — antes do `await` abre janela de duplo toque.
6. **`tileCount` sempre múltiplo de 3.** Senão sobra ciclo pela metade e a fase fica invencível.
7. Parâmetro declarado no tipo mas **não desestruturado** já virou bug real (`activeTrayCapacity`). Se declarou, use.

## Arquitetura

- **Regra de jogo**: `src/domain/recycling/` — `services/`, `policies/`, `value-objects/`. É aqui que lógica nova entra.
- **`src/utils/gameLogic.ts` é fachada anticorrupção** ([ADR 0002](docs/adr/0002-dominio-atras-de-uma-fachada.md)), não a casa da lógica. Código novo importa do domínio direto.
- **Persistência**: `src/storage/*.ts`, um arquivo por domínio.
- **Apresentação**: `src/screens/`, `src/components/`. `GameScreen.tsx` já tem ~3000 linhas — não deixe crescer com lógica que pertence ao domínio.

Duas trilhas de conteúdo, não confunda:

- **Campanha** — 203 fases em `src/data/levels.ts` (mundos 1–8 × 25 + bônus 21 × 3). Tabuleiro varia a cada tentativa.
- **Capítulos** — 1000 mapas em 10 capítulos de 100, procedurais em `src/data/chapters.ts`. Tabuleiro determinístico por id na primeira montagem (o jogador reencontra a fase que largou); só o _retry_ re-sorteia. Identidade visual derivada por hash em `src/data/chapterVisualIdentity.ts`.

## Verificação (sempre antes de reportar terminado)

```
npm run typecheck
npm test   # node --test tests — passar o diretório, não um glob: glob citado não expande no cmd/PowerShell, e sem aspas também não expande fora do bash
```

`tests/levelComposition.test.cjs` trava um hash sha256 do JSON das 203 fases
canônicas (`as 203 fases canonicas continuam byte-identicas`). Qualquer edição
de conteúdo em `src/data/levels.ts` quebra esse hash **de propósito** — é uma
trava de integridade, não um bug. Depois de confirmar que a mudança é
intencional, recalcule `sha256(JSON.stringify(LEVELS))` e atualize o literal
esperado nesse teste; não ignore nem delete a asserção.

Outros arquivos de referência úteis: `docs/adr/` (decisões arquiteturais),
`src/domain/recycling/` (regras de material/ciclo/trinca, o núcleo que já é
100% ODS12 e não deveria precisar mudar por causa de tema).
