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

## Workflow obrigatório: sempre agente/skill, nunca inline às cegas

- **Pesquisa/exploração de código** (mapear onde algo é usado, auditar tema
  visual, achar todas as ocorrências de um padrão): use o agente `Explore`
  antes de editar. Não confie em uma única busca — o projeto tem dois
  registros paralelos de fase (`WORLDS`/`LEVELS`, 203 fases canônicas via
  `LevelSelectScreen`, e `CHAPTERS`, 1000 mapas via `ChaptersScreen`) e é fácil
  editar um e esquecer o outro.
  - Exceção explícita: pesquisa que exige RODAR código para responder (ex.:
    "esse solver realmente resolve as 1000 fases?", "quanto tempo isso
    leva?") não delega para `Explore` — ele não tem Bash/execução. Nesse
    caso, prototipar inline com o Bash tool é o caminho certo; só a busca
    puramente navegacional (grep/leitura, sem rodar nada) tem que ir para o
    `Explore`.
- **Reescrita de conteúdo em massa** (título de fase, texto de tela, mais de
  ~5 arquivos): delegue a um agente `general-purpose` com instruções
  explícitas (mapeamento exato de troca, arquivos, o que NÃO tocar) em vez de
  editar tudo inline — mantém o contexto principal livre e permite rodar
  typecheck/testes de forma isolada antes de reportar.
- **Antes de declarar QUALQUER tarefa não trivial concluída**: rode a skill
  `code-review` (ou `simplify` para limpeza). Isso é um passo obrigatório do
  checklist de fechamento, não uma sugestão condicionada a "se sobrar tempo"
  — typecheck e testes verdes não substituem essa revisão. (Gap admitido:
  na sessão de 2026-08-15 que criou o Modo Dev e a simulação de partida
  completa, esse passo foi pulado — não repetir.)
- Isso vale para qualquer chat futuro neste projeto — não é preciso o usuário
  pedir de novo para usar agente/skill; é o padrão de trabalho aqui.
- **O que isso NÃO significa**: não existe aqui um "Orchestrator" nem
  agentes especialistas fictícios (UI Agent, Economy Agent, Audio Agent,
  QA Agent, Security Agent...) — o catálogo real de agentes deste ambiente é
  fixo (`Explore`, `general-purpose`, `Plan`, `claude-code-guide` e o
  genérico `claude`), e skills vêm de um catálogo do usuário, não algo que se
  cria por projeto sob demanda. Um pipeline obrigatório de
  auditoria→skills→agentes→implementação→QA→code-review→regressão para
  TODA tarefa (inclusive "corrigir um typo") foi proposto e rejeitado em
  2026-08-15 por custo/latência desproporcional — a escala do pipeline deve
  seguir a escala real da tarefa.

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
