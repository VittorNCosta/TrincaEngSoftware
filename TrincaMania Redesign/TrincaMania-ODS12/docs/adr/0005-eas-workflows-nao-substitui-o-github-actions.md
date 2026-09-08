# EAS Workflows fica de fora por enquanto — o `eas-cli` direto já cobre o que ele daria (CI-23)

O roadmap (CI-23) pedia para avaliar EAS Workflows (`.eas/workflows/`) como
"alternativa nativa ao GitHub Actions no lado mobile". A decisão, depois de
ler a documentação e o material oficial da Expo: **não adotar agora**. O
pipeline continua inteiro em `.github/workflows/` (`ci.yml`, `seguranca.yml`,
`release.yml`, `build.yml`, `e2e.yml`), chamando `eas-cli` direto onde precisa
de EAS (hoje só `eas build`, via `.github/scripts/disparar-build.js`).

## O que é

EAS Workflows é YAML em `.eas/workflows/`, com jobs pré-empacotados (build,
submit, update, rodar Maestro, notificar Slack) mais um job genérico para
comando arbitrário, disparado por `eas workflow:run` ou por um app do GitHub
nos mesmos eventos que o Actions já escuta (push, PR). O próprio material da
Expo o descreve como complemento ao GitHub Actions, não substituto: a
recomendação oficial é lint/teste geral continuar no Actions e o EAS entrar só
na parte de build/assinatura/submissão mobile.

## Considered Options

**Migrar tudo para `.eas/workflows/`** — descartado. Perderia o que já existe
e funciona: `guarda:ods12`, `valida:assets`, `cobertura`, `orcamento:bundle`
(Q-10), `gitleaks`, CodeQL, `dependency-review`, SBOM (SEC-09), Scorecard
(SEC-10) — nenhum é um job pré-empacotado do EAS, todos rodariam do mesmo
jeito de hoje, como comando arbitrário num job genérico. Trocaria um
orquestrador testado e gratuito (Actions, minuto livre em repositório
público) por outro pago e com quota mensal (free tier: 60 min de computação e
15 builds Android/mês), sem ganhar nada em troca nesses jobs.

**Rodar os dois em paralelo** (Actions para lint/teste/segurança, EAS
Workflows só para build/submit/update) — descartado por agora, não para
sempre. O ganho seria os jobs pré-empacotados de build/submit/update, mas
`disparar-build.js` já invoca `eas-cli` direto de dentro do Actions
(`npx eas-cli build --non-interactive --no-wait`) — o mesmo comando que o job
pré-empacotado do EAS Workflows executaria por baixo. Não há capacidade nova
aqui, só uma segunda linguagem de YAML e um segundo lugar para olhar quando
algo quebra, em troca de sintaxe mais curta em um deploy que já é confiável.

**Não adotar, manter `eas-cli` direto no Actions** — opção adotada. Um
orquestrador só, gratuito neste repositório público, com todo o histórico de
decisão já documentado nos comentários de cada workflow (por que não usar a
action de terceiro do Expo, por que `--no-wait`, por que path filters em vez
de `paths:`). Continua não fechado — CI-20/21/22 (Submit, `--auto-submit`,
Update/OTA) seguem em aberto, e quando forem implementados entram como mais
um `run: npx eas-cli ...` num job existente, não como motivo para abrir um
segundo sistema.

## Consequences

Nenhum arquivo novo em `.eas/`. Se um dia surgir uma dor concreta que o Actions
não resolve bem — por exemplo, credencial de assinatura Android/iOS que o EAS
Workflows gerencia nativamente e o Actions só consegue via segredo copiado à
mão — vale reabrir esta avaliação com esse caso específico em mãos, não
preventivamente. Até lá, `eas-cli` chamado direto dos jobs existentes é a
via.
