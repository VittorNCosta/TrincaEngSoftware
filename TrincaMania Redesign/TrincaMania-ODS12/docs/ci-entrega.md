# Validação e entrega

O runtime é Node 22.23.2 (`nvm install && nvm use`), com npm 10.9.8. Engines,
Actions e perfis EAS usam Node 22. O lock continua sendo a fonte da instalação.

## Antes de entregar um PR

1. Execute `npm run validar:local`. A sequência inclui formato, lint, typecheck,
   testes de domínio/CI/UI, guardas, auditoria, cobertura e export Android.
2. Envie o commit e execute `npm run pr:validar -- NUMERO --watch`.
3. Corrija cada falha e repita no novo SHA. O monitor não faz merge. Ele recusa
   SHA divergente, conflitos, falha, cancelamento, execução ignorada e ausência
   de CI/Segurança e de E2E quando o diff o exige. Outros workflows de PR
   encontrados também precisam passar. `--watch` aguarda até uma hora, consultando a cada 15 segundos.

CI e Segurança atendem PRs para qualquer branch. Scorecard roda somente na
branch padrão. A cobertura publica relatórios de produção separados para
`.ts` (domínio, dados, storage, hooks e utilitários) e `.tsx` (UI, incluindo
`App.tsx`). `c8 --all` inclui fontes `.ts` nunca carregadas; Jest coleta também
UI nunca montada. Testes e scripts ficam fora do numerador/denominador.

O loader de cobertura gera source maps inline antes de `_compile`, inclusive
quando os testes usam seus próprios hooks TypeScript. Não se contam linhas do
JS transpilado como se fossem TS. Os relatórios JSON, texto e LCOV ficam em
`coverage/domain` e `coverage/ui`; no CI são retidos por 14 dias. O teste de regressão em `.github/scripts/tests/coverage.test.cjs` executa um
projeto temporário: 300 linhas novas apenas no teste mantêm os totais idênticos;
adicionar uma fonte TS nunca executada aumenta o denominador e reduz a
porcentagem. Ele também confere que as localizações do relatório ficam nas linhas
TS originais, sem helpers CommonJS. O script valida a presença de toda fonte
esperada no relatório, impedindo que uma configuração de descoberta exclua telas
silenciosamente.

O piso antigo
Node 20 (87,77% linhas, 88,73% ramos, 88,11% funções) permanece intacto em
`scripts/cobertura-legado-node20.json`. Ele incluía testes, portanto não é
comparável ao novo denominador. Na rodada final de 18/09/2026, passaram 222
asserções de domínio e 22 de UI (11 suítes). O denominador contém 58 fontes TS
e 58 fontes TSX; o piso inicial medido foi:

| Escopo     | Linhas | Ramos  | Funções | Statements |
| ---------- | ------ | ------ | ------- | ---------- |
| Domínio/TS | 74,18% | 84,24% | 76,20%  | 74,18%     |
| UI/TSX     | 23,03% | 26,62% | 24,36%  | 22,97%     |

Esses números expõem lacunas reais nas fontes não exercitadas. Não representam
85% de cobertura de produção. O novo piso tem metodologia e runtime
explícitos, só sobe por padrão e exige opção explícita para uma redução.

## Uma issue por PR

`Rastreabilidade / Issue vinculada` executa apenas código confiável da base em
`pull_request_target`. O token de escrita nunca instala nem executa código do
PR, incluindo forks. Reutiliza referências de fechamento válidas no mesmo
repositório; na ausência delas, cria a issue com marcador persistente por PR.
Listagem paginada e concorrência serial por PR evitam duplicatas. Edições e
reaberturas recuperam a mesma issue. A tarefa automática só fecha no merge em
`develop`; fechar o PR sem merge não conclui trabalho.

`CI / Rastreabilidade da integração` verifica o vínculo com token de leitura.
O job Release chama o workflow reutilizável com a mesma chave de concorrência para PRs criados pelo
`GITHUB_TOKEN`, cujos eventos não disparam outros workflows. Esses PRs ainda
precisam dos checks reais antes de integração; o monitor não aprova ausência.
Configure os checks exigidos na proteção da branch depois da primeira execução.

## Release e build EAS

Release Please usa outputs prefixados pelo caminho do app e chama o workflow
reutilizável Build após gerar o SBOM. O checkout usa o SHA exato do release.
Não há outro gatilho por tag competindo com essa chamada. O script grava o ID
na release antes de aguardar e reutiliza esse ID em reexecuções; se a gravação
foi interrompida, consulta builds do mesmo SHA/perfil no EAS.

Sem `EXPO_TOKEN`, o job falha claramente antes de checkout. O build é acompanhado
até `FINISHED` (limite 55 minutos); falha, cancelamento, SHA divergente ou ausência
de artefato não são sucesso. A release recebe `sbom.cdx.json`,
`build-manifest.json` (versão, tag, commit, ID, URL, arquivo e SHA-256) e o AAB.
Preview manual/rotulado recebe APK e manifesto como artefato de Actions.

`auto_submit` é falso por padrão e existe somente na execução manual. Ativá-lo
exige perfil production e solicita envio ao perfil Submit production, configurado
para faixa interna em rascunho. Exige credencial Google Play previamente cadastrada
no EAS; sucesso do build não afirma aprovação/publicação da submissão.

## OTA e sourcemaps

Os perfis EAS usam canais `preview` e `production`. A política de runtime
`fingerprint` impede aplicar JS a um binário com dependências nativas diferentes.
A mudança inicial exige novo binário. O workflow EAS Update é somente manual,
exige SHA completo, canal e confirmação explícita de publicação. Configure
aprovação obrigatória nos environments `updates-preview` e `updates-production`
antes de habilitar credenciais. Não há publicação em push ou merge.

O export padrão passou de 2.620.795 para 2.694.183 bytes (aproximadamente 2,57 MiB) com
OTA, Clipboard e novos recursos. O teto foi recalculado com a mesma margem de
1% (2,60 MiB), sem desativar a checagem. O SDK Sentry havia elevado o bundle a
3,89 MiB; o carregamento condicional remove esse custo do build sem DSN. Um build
com Sentry habilitado deve ser medido separadamente antes de distribuir.

O Sentry é opcional: sem `EXPO_PUBLIC_SENTRY_DSN`, não inicia o SDK. Quando ativado,
configure `SENTRY_ORG`, `SENTRY_PROJECT` e `SENTRY_AUTH_TOKEN` no ambiente de build
EAS; somente o DSN é público. O plugin e o Metro geram/uploadam sourcemaps. OTA
faz upload do diretório `dist` depois do update e reprova se o upload falhar.
Mantenha as mesmas variáveis de DSN/organização/projeto nos environments de
Actions e EAS. Tokens nunca entram no app config, JS ou git.

A configuração inicial envia somente erros JS com stack: não usa tracing,
profiling, sessões, replay, breadcrumbs, usuário, requisição ou contexto livre;
mensagens são substituídas por texto neutro. Crash nativo está desativado nessa
configuração inicial. Validar simbolicação real no Sentry ainda exige um build
com credenciais e um erro controlado no ambiente de teste.

## E2E Android

PR com mudança relevante roda smoke; documentação Markdown/docs não monta APK.
Manual/semanal roda toda a suíte. O pacote isolado `.e2e` usa seed determinística;
ativar a flag em perfil preview/production falha. E2E desativa OTA e Sentry.
JUnit sobe em sucesso/falha (14 dias), diagnóstico só em falha (7 dias). A duração
aparece no resumo; não há retries de teste que escondam falhas.

## Evidências externas ainda necessárias

Execuções reais de PR de documentação/código/fork/bot, branch protection, build
Android/emulador, EAS, Google Play e simbolicação Sentry dependem da integração
na base e de credenciais/infraestrutura. Configuração e testes locais não
substituem essas evidências; não fechar issues que ainda as exigem.

Referências: [Release Please](https://github.com/googleapis/release-please-action),
[EAS CLI](https://docs.expo.dev/eas/cli/),
[runtime](https://docs.expo.dev/eas-update/runtime-versions/),
[Sentry no Expo](https://docs.expo.dev/guides/using-sentry/).
