# Correções de interação e acessibilidade — 22/10/2026

Fonte: branch isolada `audit/ods12-site-simulador-20261022`, base `6ee3ad3`. Este documento descreve alterações no simulador; o host/export e a validação integrada são coordenados na auditoria do site. Nenhum export minificado foi editado.

## Alterações

- **Prática do tutorial:** inicia manualmente. O antigo avanço automático a cada 2,2 segundos removia a peça que o usuário estava prestes a pressionar; o trace móvel serial registrou detach de `board-tile-cycle-0` durante scroll e ausência do evento final de clique. Agora a demonstração automática exige acionamento explícito, desativa peças/poderes enquanto avança e permite voltar à prática manual. Rever reinicia em modo manual; movimento reduzido não oferece autoplay.
- **Alvos estáveis:** PrimaryButton usa opacidade durante pressão, sem escala da própria área clicável. Painel de seleção usa fade breve com cancelamento na desmontagem, sem deslocamento vertical. São medidas de estabilidade; os traces de Jogar registraram tentativa correta e permanência no mapa, mas não provam qual subsistema perdeu o press. Não se afirma causa exclusiva nem aprovação E2E sem repetição integrada.
- **Contraste:** faixa Jogar do nó do mapa passa de rosa claro para `#B52656`, com texto branco. A geometria e identidade dos nós permanecem.
- **Semântica:** navegação usa botões com `aria-pressed` no web, removendo `aria-selected` incompatível com button. Slots informativos da bandeja usam papel de imagem com nome; não recebem estado disabled de uma ação inexistente. Slots compráveis continuam botões. Texto minúsculo Bônus é representado por + com nome acessível completo.
- **Diálogos:** os dois tutoriais recebem nome acessível no Modal real. O Modal do React Native Web instalado já implementa confinamento de Tab e restauração para o elemento anterior, quando ainda montado; não se duplicou essa lógica.
- **Estrutura e foco:** tela principal possui landmark main e título h1 acessível; mudança de tela move foco para esse título se não houver diálogo. O título é visualmente oculto, sem ocupar área do tabuleiro. Template `public/index.html` declara `pt-BR` desde o HTML inicial e fornece indicação de foco visível. O template é suportado pelo `webTemplate.js` do Expo CLI instalado.
- **Telas estreitas:** abaixo de 480 px a identificação da fase ocupa linha própria, em vez de disputar largura entre três ações e os contadores. Subtítulo aceita quebra e fonte 10 px. Poderes usam largura 64 px e legenda 9 px para comportar Misturar. A altura extra deve ser conferida nos viewports reais após export.

## Integração de persistência e host

App utiliza `recoverProgress` antes de habilitar o jogo, `commitChapterCompletion` para conclusão de capítulo e `resetProgress` para o reset recuperável. Implementação das transações pertence à frente de domínio. Falha de recuperação/reset mostra erro com tentativa de recuperação; não libera silenciosamente um progresso inicial. `connectWebHost` recebe ready somente após carregamento sem erro e estado de sessão ativa durante game. Implementação do protocolo pertence à frente do host.

## Validação e limites

Teste de regressão adicionado em `TutorialDemoStage.test.tsx`: avançar o relógio sete segundos conserva o alvo manual; pressioná-lo avança normalmente. Os testes existentes cobrem ciclo, bandeja, poderes, replay e biblioteca manual.

Revisão visual, axe, navegação por teclado e E2E devem usar export produzido destas fontes reconciliadas. Pontos obrigatórios: HUD em 320/390/480 px, landscape, bandeja e poderes, foco ao abrir/fechar tutorial e ao voltar ao mapa, clique/tap Jogar após scroll e após vitória. O resultado anterior (23 passaram/3 falharam) é da versão auditada, não valida estas mudanças. Nenhuma conclusão de aprovação visual é inferida só de propriedades de estilo.

Não foram alterados conteúdo das 103 fases, saves por mudanças de UI, assets artísticos, configurações Android ou screenshots históricos.

Verificação local: `npm run test:ui -- --runInBand src/components/__tests__/TutorialDemoStage.test.tsx` passou com 7/7 testes. ESLint dos arquivos editados teve zero erros; três avisos preexistentes de dependências/cleanup em GameScreen permanecem. O aviso de import não usado introduzido na integração App foi removido. Typecheck inicial encontrou somente o serviço webHostBridge ainda em criação pela frente host; requer repetição após disponibilidade.

## Revisão posterior

- Reset secundário (rotina, missões, desafio, vidas, bônus de bandeja, resgate e flags dos tutoriais) agora integra `resetOtherDomains`, aguardado dentro do journal antes de limpar a intenção. Usa `allSettled` e propaga falha depois que todos os writes terminaram. Recuperação é sequenciada antes de ler demais domínios no boot, evitando reaplicar snapshots anteriores à recuperação.
- Claims de rotina verificam geração depois de awaits para não reaplicar recompensa/estado de uma geração anterior ao reset. Erros específicos de armazenamento são exibidos na tela de recuperação e comunicados ao host por `error`.
- Mock React Native do harness App passou a declarar Platform.OS android, correspondente ao ambiente nativo simulado; nenhuma assertion removida. `node --test tests/appProgressCommit.test.cjs`: 7/7 passaram.
- Autoplay também volta ao modo manual quando a preferência de movimento reduzido é ativada durante execução; teste adicional cobre esse evento e retomada por toque.

Resultado final dos testes locais de TutorialDemoStage: **9/9 passaram**, incluindo os três cenários temporais (manual estável, autoplay explícito/cancelamento e mudança de preferência).
