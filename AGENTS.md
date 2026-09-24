# TrincaMania — instruções compartilhadas

O aplicativo fica em `TrincaMania Redesign/TrincaMania-ODS12`. Caminhos de código abaixo são relativos a essa pasta; execute os comandos nela. Use Node `>=22.13.0 <23`, conforme `package.json`. Leia também os ADRs em `docs/adr/`.

Delegue quando autorizado e houver subtarefa independente útil. Defina dono e arquivos permitidos antes de trabalho paralelo; escopos de edição devem ser disjuntos. Revisão é somente leitura. Herde modelo/esforço da sessão e respeite o limite de agentes autorizado. Perfis e exemplos: [guia local](TrincaMania%20Redesign/TrincaMania-ODS12/docs/AGENTES-CODEX.md).

Jogo estilo mahjong (React Native/Expo) sobre coleta seletiva. O jogador fecha
"trincas" (resíduo → lixeira → símbolo de reciclagem) do mesmo material
(plástico, papel, vidro, metal, orgânico — cores CONAMA 275/2001). Leia
[CONTEXT.md](TrincaMania%20Redesign/TrincaMania-ODS12/CONTEXT.md) antes de nomear qualquer coisa nova: é o glossário do domínio
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
montanha/cristal/doce do jogo original, exceto o piloto `assets/map/worlds/w01_parque_game.png` do Mundo 1. A pendência inclui os 10 capítulos novos de `src/data/chapters.ts` (que reaproveitam os
mesmos PNGs como placeholder). Reformar essa arte exige ilustração nova
(fora do alcance de edição de código/texto); não tente gerar PNG de jogo via
código. Marcadores de coleta e ciclo usam `RecyclingMarkerArt` (SVG); as chaves atuais são `collection-cart` e `recycling-cycle`. Os fundos de mundo continuam pendentes de arte nova.

**Contexto histórico — resize da campanha (2026-09-03)**: a campanha foi
reestruturada de 203 fases (8 mundos × 25 + bônus 21 × 3) para 103 fases (10
mundos × 10 + bônus 21 × 3), na branch `feat/campanha-10x10`. Isso quebrou de
propósito o invariante #4 antigo (as 203 fases congeladas) — o hash de
`tests/levelComposition.test.cjs` foi recalculado sobre o novo conjunto de 103. Save de jogador com progresso no esquema antigo não quebra: como os ids
`wN-001`…`wN-010` são idênticos entre os dois esquemas,
`detectDroppedCampaignProgress`/`CampaignResizeNoticeModal`
(`src/storage/progressStorage.ts`, `src/components/CampaignResizeNoticeModal.tsx`)
avisam o jogador uma única vez quando o `normalizeProgress` descarta silenciosamente
fase que não existe mais (posição 11–25 de um mundo antigo) — moedas, chaves e
itens nunca são afetados por essa filtragem. Ver `tests/progressMigration.test.cjs`.

**Modo Dev**: o desbloqueio usa override em memória (`App.tsx`, `MainTabs`/`ChaptersScreen`) e não escreve no save. Nunca converta esse override em mutação persistida do progresso real. Capítulos são conteúdo pós-campanha: acesso normal após as 100 fases principais; o modo dev é exceção temporária.

## Invariantes que já quebraram — nunca reintroduza

1. **Progresso** só é gravado por `commitProgress` / `commitChapterProgress` (fila serializada em `src/hooks/useProgressPersistence.ts`, com guarda de geração). Chamar `saveProgress` direto já apagou progresso de jogador.
2. **Vidas** só mudam por `mutateLives` (`src/storage/livesStorage.ts`). Chamada direta a `saveLivesState` já perdeu vida premiada.
3. **Campanha e capítulos têm storages separados.** `normalizeProgress` descarta ids `chNN-NNN` **em silêncio** — nunca passe id de capítulo ao storage da campanha.
4. **As 103 fases canônicas de `src/data/levels.ts` são congeladas.** Existe teste travando o hash de `JSON.stringify(LEVELS)`. Se mexer no arquivo, prove que a saída não mudou. (Eram 203 antes do resize de 2026-09-03 — o número muda se a campanha for reestruturada de novo, o mecanismo de trava não.)
5. **Guarda de idempotência vai depois do `await`**, lendo o ref atual — antes do `await` abre janela de duplo toque.
6. **`tileCount` sempre múltiplo de 3.** Senão sobra ciclo pela metade e a fase fica invencível.
7. Parâmetro declarado no tipo mas **não desestruturado** já virou bug real (`activeTrayCapacity`). Se declarou, use.

## Arquitetura

- **Regra de jogo**: `src/domain/recycling/` — `services/`, `policies/`, `value-objects/`. É aqui que lógica nova entra.
- **`src/utils/gameLogic.ts` é fachada anticorrupção** ([ADR 0002](TrincaMania%20Redesign/TrincaMania-ODS12/docs/adr/0002-dominio-atras-de-uma-fachada.md)), não a casa da lógica. Código novo importa do domínio direto.
- **Persistência**: `src/storage/*.ts`, um arquivo por domínio.
- **Apresentação**: `src/screens/`, `src/components/`. `GameScreen.tsx` já tem ~3000 linhas — não deixe crescer com lógica que pertence ao domínio.

Duas trilhas de conteúdo, não confunda:

- **Campanha** — 103 fases em `src/data/levels.ts` (mundos 1–10 × 10 + bônus 21 × 3). Tabuleiro varia a cada tentativa.
- **Capítulos** — 1000 mapas em 10 capítulos de 100, procedurais em `src/data/chapters.ts`. Tabuleiro determinístico por id na primeira montagem (o jogador reencontra a fase que largou); só o _retry_ re-sorteia. Identidade visual derivada por hash em `src/data/chapterVisualIdentity.ts`.

## Verificação (sempre antes de reportar terminado)

```
npm run typecheck
npm test   # domínio/storage: node:test em tests/*.test.cjs
npm run test:ui -- --runInBand # componentes: Jest + Testing Library
npm run test:playthrough # simulação de campanha/capítulos, não UI em aparelho
npm run lint
npm run format:check
```

Quem lista os arquivos é o Node, não o shell nem o runner: `node --test tests`
só funciona até o Node 21 (do 22 em diante o diretório vira `MODULE_NOT_FOUND`)
e `node --test tests/*.test.cjs` depende do shell expandir o glob, o que o cmd
e o PowerShell não fazem. Teste novo em `tests/` só precisa terminar em
`.test.cjs` para entrar na rodada.

`tests/levelComposition.test.cjs` trava um hash sha256 do JSON das 103 fases
canônicas (`as 103 fases canonicas continuam byte-identicas`). Qualquer edição
de conteúdo em `src/data/levels.ts` quebra esse hash **de propósito** — é uma
trava de integridade, não um bug. Depois de confirmar que a mudança é
intencional, recalcule `sha256(JSON.stringify(LEVELS))` e atualize o literal
esperado nesse teste; não ignore nem delete a asserção.

Outros arquivos de referência úteis: `docs/adr/` (decisões arquiteturais),
`src/domain/recycling/` (regras de material/ciclo/trinca, o núcleo que já é
100% ODS12 e não deveria precisar mudar por causa de tema).

## Concluir um PR

1. Leia os checks e logs do PR antes de alterar código. Se a base avançou,
   integre-a preservando o trabalho de ambos os lados e regenere os artefatos.
2. Corrija a causa da falha e execute `npm run validar:local`. Não reduza pisos,
   aceite vulnerabilidades novas ou desative verificações para obter verde.
3. Faça commit e push na branch do PR. Execute
   `npm run pr:validar -- <numero> --watch` e acompanhe o resultado do SHA enviado.
4. Se falhar, leia os logs indicados, corrija, valide e repita commit/push/check.
   Não peça nova autorização para essas correções já solicitadas pelo usuário.
5. Só reporte conclusão após CI e Segurança passarem no SHA atual, sem conflitos
   nem outros checks falhando. Informe o SHA e o link do PR. Se houver bloqueio
   externo sem solução autorizada, reporte o bloqueio e os checks pendentes;
   não declare sucesso. Não faça merge nem publique releases por conta própria.

O monitor é somente leitura: não faz correções cegas, reruns nem merge. A análise
e a correção cabem ao agente neste ciclo. Trabalho de infraestrutura novo deve
ser registrado no roadmap e nas issues, seguindo o mecanismo existente.

## Roadmap e issues

Roadmap define escopo e prioridade; merge validado comprova conclusão. Antes de reconciliar, proponha alteração revisável em `docs/roadmap/roadmap.html` e `docs/ROADMAP-JOGO-COMPLETO.md` com a evidência de conclusão. Issue fechada com roadmap pendente é conflito a investigar, nunca razão automática para reabrir. PR abandonado não conclui tarefa. Issues automáticas sem ID de roadmap ficam fora do sincronizador.

Registre trabalho novo nos dois espelhos e regenere `scripts/criar-issues-roadmap.sh` com `node scripts/gerar-issues-roadmap.js`; não execute o script de criação inicial sobre backlog existente. `node scripts/sincronizar-issues.js` apenas relata; escrita requer autorização da sessão e integração confiável da alteração. Não publique comentários ou mensagens por inferência.


# Instruções para agentes

## Entrega de tarefas e issues

Ao concluir uma tarefa ou issue neste repositório:

1. Trabalhe em um branch próprio baseado na branch de destino atual; nunca faça push direto para `develop` ou `main`.
2. Revise o diff e os arquivos que serão publicados. Inclua apenas as mudanças da tarefa; deixe de fora arquivos locais, credenciais, cobertura e artefatos não relacionados.
3. Faça as verificações previstas pelas instruções do projeto e crie um commit com mensagem Conventional Commits.
4. Depois de concluir a implementação e as verificações, publique o branch em `origin` sem pedir confirmação adicional. O push inicia as verificações configuradas em `.github/workflows/ci.yml`.
5. Quando a sessão também autorizar a criação de pull requests, abra ou atualize um para `develop` e vincule a issue com `Closes #<n>`. A issue só deve ser considerada concluída depois do merge.

Se a tarefa estiver incompleta, bloqueada, ou as verificações falharem, não a apresente como concluída. Se não for possível publicar por conflito ou falha de autenticação, mantenha o commit local e informe o impedimento.
