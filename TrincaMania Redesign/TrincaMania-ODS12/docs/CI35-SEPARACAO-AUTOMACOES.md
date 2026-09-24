# CI-35 — separação das automações da campanha

Preparação local em 18/09/2026 sobre `origin/develop` em `678e256d3557aa385e4e1402212594d18615ebad`, comparada com campanha em `21da6aff9ba65b023db8257dfb10b9f1f00479fe` e alterações locais ainda não commitadas. Não houve commit, push, PR, merge ou execução remota. Esta fatia não conclui CI-35.

## Fatia preparada

- Dependabot npm/actions, sem dependência da campanha.
- Rastreabilidade por issue, com código confiável da base no pull_request_target e testes próprios.
- Gitleaks, dependency-review, CodeQL e Scorecard do workflow Segurança; auditoria npm ainda excluída desta primeira fatia porque seu baseline precisa corresponder ao lock da base.
- Workflow independente que testa rastreabilidade sem instalar dependências do aplicativo.
- Filtros do CI básico cobrem qualquer branch e alvo de PR, inclusive feat/campanha-10x10.
- Correção preexistente `c1e3b6554449f3b9383b55b045979c9a9f060128`: alinha somente três campos de package.json ao lock já presente (Expo, jest-expo e @types/jest). Não altera lock/runtime instalado.

`src/`, `App.tsx`, `assets/` e `tests/` do aplicativo permanecem byte a byte na base develop. Não foi copiado o package/lock em movimento da sessão atual nem AGENTS.md que descreve a campanha nova.

## Dependências para as próximas fatias

| Automação      | Arquivos/configuração necessários                                                                                                                | Separação                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI expandido   | scripts/rodar-testes.js, guarda-ods12.js, valida-assets.js, cobertura.js/lib, orcamento-bundle.js; package scripts; baselines; Node; lint/format | Portar scripts independentemente e recalcular evidência na campanha antiga. Não copiar baseline de assets/ODS/cobertura da branch atual: arquivos e cobertura diferem.                                            |
| Auditoria npm  | scripts/auditoria.js e auditoria-baseline.json, package script                                                                                   | Executar contra o lock de develop e revisar diferenças; não aceitar silenciosamente novos advisories.                                                                                                             |
| Roadmap/issues | scripts/lib/roadmap.js, validar-roadmap.js, sincronizar-issues.js, HTML/Markdown e gerador                                                       | Roadmap inclui campanha; decidir manter plano completo como documentação sem marcar a campanha implementada nessa branch, ou separar dados. Sincronização de escrita continua bloqueada sem integração confiável. |
| Release/build  | release-please-config.json, .release-please-manifest.json, scripts/disparar-build.js, app.config.js, eas.json, package version/Node, EXPO_TOKEN  | Portar configuração de versão mínima; não copiar app.config atual com Sentry/EAS Update/E2E sem respectivas dependências. Validar tag/SHA/artefato e aprovação antes de submit.                                   |
| E2E            | .maestro, testIDs nas telas/componentes, app.config/eas perfil .e2e, src/testing/e2eProfile.ts, seed e geração de fluxos                         | Parte dos testIDs e fluxos foi construída sobre telas reestruturadas; adaptar hunks ao UI de develop sem resize/novas regras. Exige APK/emulador próprio.                                                         |
| Sentry/OTA     | index.ts, observability, app.config, expo-updates/@sentry, sourcemaps e credenciais                                                              | Mudança de runtime opt-in independente, mas deve ser PR separado dos agendamentos.                                                                                                                                |
| MobSF/dinâmica | .github/security, workflows dedicados, Build verificável, APK preview, runner isolado                                                            | Depende da fatia build; não adicionar workflow que baixa artifact ainda inexistente.                                                                                                                              |

Depois de revisar/commitar esta fatia, abrir PR para develop e validar os checks no SHA do PR. Usar G-09/G-10/SEC-03 para branch protection e ativação. Após merge, confirmar os arquivos na branch padrão, executar workflows manuais e guardar URLs/resultados da primeira execução agendada; não simular essa evidência. Dependabot e cron dependem da branch padrão, não de estarem apenas nesta worktree.

Validação local: 4/4 testes de rastreabilidade, actionlint dos novos workflows, manifesto e lock coerentes e diff sem arquivos da campanha. CI do aplicativo e scanners remotos não executados nesta worktree.
