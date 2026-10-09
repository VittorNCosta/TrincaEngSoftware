# Auditoria ODS 12 — 09/10/2026

**Entrega PARCIAL.** Site e demonstração foram executados e melhorados localmente. Regras e componentes compartilhados do aplicativo foram corrigidos e testados; sua execução Android permanece **BLOCKED** por boot incompleto do emulador sem KVM. Aparelho físico e leitor de tela real **NOT RUN**. Não há aprovação nativa nem publicação.

## Situação e escopo aprovado

| Produto           | O que foi executado                                                                       | Resultado / limite                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site              | Astro, rotas `/`, `/baixar/`, `/jogar/`; desktop, celular, tablet e landscape em Chromium | Build e inspeção de 21 documentos PASS; suíte integrada final **PASS**. Nenhum P0/P1 reproduzível conhecido em aberto nas jornadas web verificadas.                                                  |
| Demonstração      | Mesmo jogo exportado por Expo Web/RNWeb, dentro do iframe `/jogar/app/`                   | Tutorial, partida, vitória/derrota/retry, configurações, abas, capítulos, loja, modo feira/teste e recuperação de falha exercitados. Retestes específicos PASS; suite final conforme tabela técnica. |
| Aplicativo mobile | TypeScript, regras, componentes e build Android local                                     | 279 testes de regras e 79 de interface PASS. APK: **PASS — compilação e assinatura; UI BLOCKED**. Instalação e interação nativa BLOCKED.                                                             |

“Emulador” no site é uma **demonstração web**, não um Android emulado. O miniciclo educativo da homepage é um componente separado. Android Emulator foi tentado como ambiente de QA nativo e não concluiu boot.

## Localização, versões e preservação

- Site: `/home/vittor/personal-project/igrion-ODS-site`, branch `main`, HEAD `46f285e`; Astro 7.3.5, Tailwind 4.3.3, TypeScript 5.9.3, Playwright 1.63.0.
- Aplicativo: `/home/vittor/personal-project/TrincaEngSoftware/TrincaMania Redesign/TrincaMania-ODS12`, repositório `TrincaEngSoftware`, branch `feat/site-ods12-simulador-pc`, HEAD `650e8bb`; Expo 54.0.37, RN 0.81.5, React 19.1, RNWeb 0.21, AsyncStorage 2.2.0, expo-audio 1.1.1. Node 22.23.2/npm 10.9.8, Ubuntu 24.04 WSL.
- Os HEADs identificam a base; alterações da auditoria prontas para commits locais. Status, branches, commits e diffs iniciais/finais ficam nesta pasta. Não foram executados Actions, merge, rebase, reset, push, publicação ou deploy.
- Cinco arquivos do site já tinham mudanças: MatchDemo, interactions.ts, global.css, interactions.css e site.spec.ts. Snapshot `original-site/` e diff inicial preservados. Essas melhorias prévias não são atribuídas à auditoria. `entregas-sites/` já era não versionado no repositório do aplicativo.
- Testes usaram contextos novos, modo feira em memória e namespace `@trinca-web-test/`; cenários adversos verificaram sentinel fora desse namespace. AVD novo com userdata isolado. Saves do usuário não foram usados como fixtures.
- Regras, campanha de 103 fases, 1.000 mapas extras e assets canônicos preservados. `levels.ts`, `chapters.ts` e ambos os lockfiles continuam byte a byte iguais ao HEAD; hashes em [preservation.json](/home/vittor/personal-project/apks/ods12-auditoria-20261009/preservation.json). Guarda ODS 12 PASS, sem regressão de vocabulário.
- Foram lidos AGENTS/CLAUDE/CONTEXT, README, ADRs, scripts, testes e workflows. A identidade atual do app é **TileClear - ODS12** pela decisão L14; o site ainda usa TrincaMania. Essa divergência foi registrada, sem renomear o produto durante QA.

## Workflow e melhorias implementadas

Descoberta → baseline → auditoria/inventário → priorização → lotes de implementação → verificações → inspeção visual → regressão → entrega. Halley inspecionou persistência/build; Nash progresso e segurança/desempenho; Mill UI/acessibilidade/inventário; Boole ambiente nativo e estados adversos. Arquivos compartilhados foram coordenados e o bundle funcional final congelado.

| Lote                                  | Problema e alteração                                                                                                                                                                                                                         | Fluxos afetados / validação                                                                                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistência de preferências e boosts | Leituras antigas sobrescreviam mutações; alterações simultâneas perdiam campos; erro de I/O no boost podia parecer save vazio. Serialização, versões de cache e propagação de erro corrigidas.                                               | Som/vibração/modo silencioso, compra de espaço. Testes com concorrência e falhas; reabertura real das preferências no navegador.                                      |
| Recompensas de capítulos              | Conclusão era salva sem aplicar moedas com segurança entre dois domínios de save. Journal com epoch/recibo recupera transação interrompida e evita duplicação; reset e hidratação respeitam geração.                                         | Vitória de capítulo, retry após I/O, fechamento/reset concorrente. Regressões de armazenamento/hook PASS; ganho real em UI rara não inferido desses testes.           |
| Ciclo de partida                      | Ações assíncronas podiam atualizar rodada encerrada; cronômetro perdia frações e contava interrupções; seek pendente podia tocar após mute. Guards de geração/montagem, bloqueio de retry, relógio monotônico ativo e cancelamento de áudio. | Retry, saída, diálogos, mute e background previsto. Componentes/lógica PASS; comportamento Android em interrupções continua BLOCKED.                                  |
| Abas e teclado                        | Medida de largura errada cortava Poderes/Perfil; conteúdo invisível seguia na ordem de foco. Largura medida, abas inativas inert/ocultas e rolagem focalizável.                                                                              | Quatro abas; Tab/PageDown produziu rolagem 220px/82px no reteste de 320×390.                                                                                          |
| Acessibilidade dos controles          | Diálogos sem nome, backdrop interativo sem nome, peças distinguíveis apenas por arte/cor; diálogos de baú simultâneos. Nomes, estados, material/papel das peças e apenas um modal por etapa. Mistério continua oculto.                       | Configurações/tutoriais/resultado/baús; foco real/Escape/restauração web e regressões de componente. Escape também fecha recompensa do descanso.                      |
| Direção visual                        | Contraste fraco em botões, seleção, fase atual e textos da loja; título de configurações quebrava a 320px. Paleta escurecida preservando identidade, menos glow, retirada opacidade global e título compacto.                                | Mapas, tutorial, configurações, poderes, loja, fase e recompensa. Capturas e axe por estado; chip continua indicando quantidade completa onde o título do baú trunca. |
| Movimento e clareza                   | Preferência por movimento reduzido ignorada em destaque/tutorial e transição de abas; texto de trinca/bandeja ambíguo. Hook de preferência, menos animação nesses componentes e instruções do ciclo do mesmo material.                       | Tutorial, tabuleiro e navegação. Cobertura parcial da preferência; outras animações permanecem pendentes.                                                             |
| Integração do site                    | Trocar modo descartava sessão sem confirmação; falha de recurso deixava tela sem recuperação. Confirmação, status de carregamento, timeout/retry e handshake que valida origem, fonte e sessão.                                              | Feira/teste, cancelamento e retry. Recurso abortado e handshake falso exercitados. Tela cheia sincroniza o rótulo; falha tem orientação.                              |
| Empacotamento                         | Export interrompido podia remover a demonstração válida; origem local podia gerar QR público enganoso. Export em staging com rollback e validação de URLs privadas/locais.                                                                   | Build/QR; testes de sucesso/falha preservam export anterior. QR público N/A sem domínio escolhido.                                                                    |

Não se fez reescrita de regras nem novas funcionalidades para preencher a matriz. Falhas anteriores e tentativas de coleta/testes continuam arquivadas, inclusive as falhas de seletor, fixture e timeout corrigidas no roteiro final.

## Auditoria, cobertura e resultados

Inventário: **40 superfícies**, três rotas do site, telas por estado do app, 14 declarações Modal e alertas. [screen-inventory.md](/home/vittor/personal-project/apks/ods12-auditoria-20261009/screen-inventory.md) explica acesso e variantes. [coverage-matrix.csv](/home/vittor/personal-project/apks/ods12-auditoria-20261009/coverage-matrix.csv) contém **953 registros**: BLOCKED=171, FAIL=105, N/A=6, NOT RUN=378, PASS=293. Essas contagens incluem baseline, retestes e ambientes pendentes; FAIL histórico não significa defeito ainda aberto nem a razão PASS/total representa qualidade.

[findings.md](/home/vittor/personal-project/apks/ods12-auditoria-20261009/findings.md) e [findings.json](/home/vittor/personal-project/apks/ods12-auditoria-20261009/findings.json) registram origem, problema, reprodução, esperado, evidência, impacto/prioridade, correção, aceite e validação por achado. Não houve sessão com usuário real. Avaliação visual é inspeção técnica/heurística apoiada por capturas; leitor de tela real e audição humana não foram executados.

| Camada / comando                                          | Antes                                                                       | Depois / evidência                                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Site `npm run test:config`                                | 2 PASS                                                                      | 4 PASS — config e export atômico; `after-site-config.log`                                                             |
| Site `npm run build:feira` (Astro check + build + export) | Build site PASS, 0 erros/avisos, 3 hints                                    | Build integrado **PASS**, 53.78s — `release-integrated-build.log/json`                                                |
| Site `npm run test:e2e -- --workers=1`                    | 10 PASS após biblioteca do browser; primeira execução bloqueada pelo loader | **PASS** — 18 testes, zero fail/flaky/skip; 238.18s — `release-site-e2e.log/json`, artefatos `release-e2e/`           |
| App `npm test`                                            | 255 PASS                                                                    | **279 PASS**, `after-app-domain.log`                                                                                  |
| App `npm run test:ui -- --runInBand`                      | 15 suites / 56 PASS                                                         | **21 suites / 79 PASS**, `release-app-ui.log`; falha intermediária de expectativa antiga de branding resolvida        |
| App `npm run typecheck`                                   | PASS                                                                        | PASS — `release-app-typecheck.log`, 29,50s                                                                            |
| App `npm run lint`                                        | PASS / 3 avisos                                                             | PASS / mesmos 3 avisos — `release-app-lint.log`                                                                       |
| App `npm run format:check`                                | PASS                                                                        | PASS — `release-app-format.log`; docs finais: release-final-docs.log/json                                             |
| App `npm run test:playthrough`                            | 2 PASS                                                                      | 2 PASS: solvabilidade das **103 fases e 1.000 mapas** — `after-app-playthrough.log`; não são 1.103 partidas de UI     |
| App `npm run valida:assets` / guarda ODS12                | —                                                                           | PASS — `after-app-assets.log`, `preservation.json`                                                                    |
| Retestes adversos web                                     | Erro de hidratação/nome/contraste; Escape descanso FAIL                     | 9 jornadas no coletor + reteste descanso/baú PASS; `after-adverse/final-rerun/` e `after-adverse/release-rest-chest/` |
| Teclado Powers/Profile/restEscape                         | Corte/foco de conteúdo oculto; scrollable-region-focusable                  | 6 verificações PASS — `after-keyboard-final/STATUS.md` e `results.json`                                               |
| Android instalação/interação                              | BLOCKED                                                                     | BLOCKED — boot incompleto; `native/BASELINE-BLOCKED.txt`                                                              |
| Aparelho físico, TalkBack, fontes nativas                 | NOT RUN                                                                     | NOT RUN — roteiro no inventário                                                                                       |

A suíte web abrange miniciclo/teclado, download e SHA, servidor, offline com recursos externos bloqueados, tutorial prático, vitória/desbloqueio, derrota/consumo de vida/retry, som com playback resolvido, isolamento, confirmação de modo/visitante, falha/retry, abas/foco, preferências e compra persistente. Fixtures respeitam o requisito real de 100 fases para capítulos. Esperas observam estados e efeitos. Fluxos longos têm timeout de 120s e fila única para não competir com Gradle; não foram suprimidas assertions para tornar testes verdes. Cliques force existentes no tutorial/peças pulsantes permanecem documentados e limitam o que se conclui sobre geometria de toque.

## Inspeção visual e acessibilidade

[Galeria antes/depois](/home/vittor/personal-project/apks/ods12-auditoria-20261009/visual-before-after.html), com PNGs originais. Baseline e final das rotas: 3 × 7 viewports (320×568, 390×844, 768×1024, 1024×768, 1440×1000, 1920×1080 e 844×390); sem overflow horizontal, pageerror ou violações axe nessas 21 páginas. Estados internos: 44 capturas, 11 estados × 4 viewports; 36 sem violações axe, oito de foco em Poderes/Perfil motivaram o último lote e receberam reteste específico. Esse reteste comprovou WCAG A/AA sem violações nas duas abas a 320px; não é nova coleta de 44 cenários.

Revisão manual do responsável: configurações/título compacto/ações, abas Poderes/Perfil, loja, tutorial em landscape, seleção de fase a 320px, recompensa do baú e página inicial desktop. [visual-review.md](/home/vittor/personal-project/apks/ods12-auditoria-20261009/visual-review.md) registra limites e pendências; vitória, derrota e falha recuperável também foram inspecionadas na suíte final. A estrutura e arte existentes foram mantidas. Nome do material/papel não depende de cor; misteriosas não expõem conteúdo oculto. Áreas de toque e nomes melhorados nos controles afetados.

Axe integral da rota direta Expo ainda tem avisos **moderados de landmarks/heading/region**; não foi anunciado como limpo. Tab, trap de diálogos, Escape e restauração foram exercitados no browser; isso não comprova TalkBack. O teste “equivalente a 200%” reduziu viewport a 640×450; **não substitui zoom real nem aumento de fonte do sistema**. Esses testes permanecem NOT RUN. Som/vibração em hardware não foram aprovados por promessa de playback.

## Desempenho e estabilidade

[performance.md](/home/vittor/personal-project/apks/ods12-auditoria-20261009/performance.md) e [performance.json](/home/vittor/personal-project/apks/ods12-auditoria-20261009/performance.json) apresentam navegações pareadas e intercaladas sobre baseline preservado e pacote final, contextos novos/HTTP cache desabilitado, cinco amostras por rota e abertura de mapa. Os hashes do bundle e do APK da coleta final são conferidos em [build-manifest.json](/home/vittor/personal-project/apks/ods12-auditoria-20261009/build-manifest.json). Medições intermediárias ficam em `intermediate-perf/` e não aprovam o artefato final.

Amostras locais têm ruído de CPU; não há alegação de FPS, ganho causal de velocidade, memória móvel ou uso prolongado sem medição. A exportação ganhou proteção contra interrupção; testes de concorrência, reset e reentrada demonstram estabilidade dos fluxos delimitados. Soak prolongado e rede instável nativa NOT RUN.

## Segurança, privacidade e pendências concretas

[security-dependencies.md](/home/vittor/personal-project/apks/ods12-auditoria-20261009/security-dependencies.md): npm audit do site sem avisos; app com 38 entradas (1 crítica, 24 altas, 13 moderadas), incluindo ferramentas transitivas. Não se demonstrou P1 alcançável no runtime release, e não foi aplicado npm audit fix com major/downgrade. **Pendência P2**: atualização compatível com validação própria; criticidade do registry não foi minimizada.

Outras pendências: feedback de falha ao salvar preferências; sanitização Sentry por allowlist se DSN for habilitado; revisão das permissões e política OTA do APK; identidade TrincaMania/TileClear; landmarks da exportação direta; movimento reduzido em outras animações; “EASY” e título truncado da recompensa (quantidade integral está no chip). Nenhum vazamento real foi demonstrado. Não foram enviados eventos Sentry, mensagens a terceiros, secrets ou updates.

O Android Emulator 37.2.12/API34 x86_64, AVD isolado 540×1170, sem `/dev/kvm`, permaneceu com `sys.boot_completed` vazio após cerca de 16min, screenshot preta e UIAutomator exit137/ANR do sistema. Não houve instalação/abertura do APK; isso não é falha observada do app. AVD existente foi preservado. `native/BASELINE-BLOCKED.txt` registra a tentativa e encerramento dos processos próprios. [native/FINAL-LIMITS.md](/home/vittor/personal-project/apks/ods12-auditoria-20261009/native/FINAL-LIMITS.md) atualiza o estado do novo APK e corrige a atribuição da decisão de encerramento.

Roteiro de aceite nativo: instalar APK pelo hash em aparelho/AVD acelerado e limpo; primeiro acesso/tutorial; vitória/derrota/vidas/retry; navegação e loja/baús; voltar/gestos/áreas seguras; Home e retorno, bloquear/desbloquear, interromper áudio; cronômetro durante pausas; encerrar/reabrir e conferir estado previsto; TalkBack/fontScale1.3/2.0; som e vibração audíveis. Registrar resultados separadamente para emulador e físico. Firefox/WebKit, zoom real, drag/pointercancel e estados raros sem evidência permanecem NOT RUN na matriz. Idioma configurável, login, formulários/teclado virtual e rede de gameplay que não existem: N/A, sem criar funcionalidades.

## Builds e reprodução

- APK testável: [TileClear-ODS12-1.1.0-650e8bb-audit.apk](/home/vittor/personal-project/apks/ods12-auditoria-20261009/builds/TileClear-ODS12-1.1.0-650e8bb-audit.apk). Base `650e8bb` + alterações locais; versão Android 1.1.0/code1. Manifesto, assinatura e hashes em [build-manifest.json](/home/vittor/personal-project/apks/ods12-auditoria-20261009/build-manifest.json) e `builds/*-evidence/renewed-freeze/`. Assinatura Android Debug v2, para testes locais; não implica aprovação de distribuição e a UI nativa continua BLOCKED.
- Pacote offline: [ODS12-feira-20261009-audit.zip](/home/vittor/personal-project/apks/ods12-auditoria-20261009/builds/ODS12-feira-20261009-audit.zip), cópia integral de `igrion-ODS-site/dist/`, com servidor Node e inicializadores. Integridade: 171 arquivos iguais ao dist; seis recursos HTTP do ZIP extraído PASS ([package-smoke.json](/home/vittor/personal-project/apks/ods12-auditoria-20261009/package-smoke.json)). APK distribuído preserva nome de URL compatível `TrincaMania-ODS12.apk`; hash deve ser idêntico ao APK auditado. Sem domínio público, QR N/A por decisão correta; não foi inventada URL.

No diretório do app:

```sh
npm run typecheck
npm test
npm run test:ui -- --runInBand
npm run lint
npm run format:check
npm run test:playthrough
npm run valida:assets
node scripts/guarda-ods12.js
```

No diretório do site, com dependências locais presentes:

```sh
APK_PATH=/home/vittor/personal-project/apks/ods12-auditoria-20261009/builds/TileClear-ODS12-1.1.0-650e8bb-audit.apk APK_VERSION=1.1.0 npm run build:feira
LD_LIBRARY_PATH=/home/vittor/.cache/trinca-playwright-libs/extracted/usr/lib/x86_64-linux-gnu npm run test:e2e -- --workers=1
npm run test:config
npm run feira
```

O cache de bibliotecas acima é específico deste ambiente Linux; em máquina com dependências do Chromium instaladas, basta o comando Playwright. Para executar o pacote extraído, `node serve.mjs` ou inicializador correspondente; abrir `http://localhost:4322/jogar/?modo=feira`. Não usar `file://`. Roteiros extras são `inspect-browser.mjs`, `inspect-flows.mjs`, `after-keyboard-final.mjs`, `after-adverse/release-rest-chest/audit.mjs` e `performance.mjs` nesta pasta; usam portas e armazenamento isolados.

## Critérios de conclusão

Descoberta dos três produtos e inventário PASS. Implementação local e verificações delimitadas conforme tabela. Não há P0/P1 conhecido aberto nas jornadas web efetivamente aprovadas; cobertura total de estados raros não é presumida. **Critério obrigatório de execução nativa BLOCKED**, por isso entrega global PARCIAL. Os 40 itens foram registrados na matriz, inclusive NOT RUN e N/A. Nenhuma issue humana/VIS foi fechada ou promovida automaticamente. Alterações prontas para revisão local; commits autorizados, sem push ou publicação.

Reteste final solicitado em 2026-10-09: `npm run test:config` PASS (4 verificações); Playwright com `LD_LIBRARY_PATH=/home/vittor/.cache/trinca-playwright-libs/extracted/usr/lib/x86_64-linux-gnu` PASS (18/18, desktop e viewport móvel); app PASS (`npm test`, 21 suítes/79 testes de UI, playthrough de 103 fases e 1.000 mapas, typecheck, lint e format check). Lint mantém três avisos de dependências de efeitos em `GameScreen.tsx`. Android nativo segue BLOCKED: AVD sem KVM não concluiu boot e `adb` não está instalado.

Atualizado em 2026-10-09T17:12:38.321290+00:00. Evidências de baseline/falhas permanecem arquivadas para comparação.
