# Desenvolvimento e entrega

O aplicativo e seus scripts ficam em `TrincaMania Redesign/TrincaMania-ODS12`.
Execute os comandos npm nessa pasta. Consulte `CONTEXT.md`, `docs/adr/` e
`CLAUDE.md` do aplicativo para as regras de domínio; confira instruções antigas
contra o código e os scripts atuais antes de aplicá-las.

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
