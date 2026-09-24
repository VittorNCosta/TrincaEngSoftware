# A campanha vira 10 mundos × 10 fases, não 8 mundos × 25

Até 2026-09-03 a campanha principal tinha 203 fases (8 mundos × 25 + bônus de
3), e nem todo mundo nascia do mesmo jeito: os mundos 1–3 eram 25 fases
autorais cada, os mundos 4–8 já vinham de `GENERATED_WORLD_CONFIGS`. A meta do
redesign é um jogo publicável na Play Store com 10 mapas, cada um com arte,
som e identidade próprios — 8 mundos com produção desigual (parte autoral,
parte gerada) não casava com produzir 10 identidades visuais completas de
forma uniforme. Reestruturamos para 10 mundos × 10 fases — 100 fases
canônicas mais 3 do bônus, totalizando 103 —, todos gerados proceduralmente
por `GENERATED_WORLD_CONFIGS`, e passamos a tratar os Capítulos (10 capítulos
× 100 mapas, já procedurais e determinísticos por id) como a trilha que
absorve o conteúdo de volume/replay — ver `docs/ROADMAP-JOGO-COMPLETO.md`,
seção "Decisões que originaram este plano".

## Considered Options

Manter as 203 fases fixas foi descartado: exigiria produzir e manter arte e
som dedicados para uma campanha do tamanho de "quase infinita" sem de fato
ser infinita, e a linha entre "campanha curada" e "conteúdo de volume" ficava
borrada — os mundos 4–8 já eram gerados, então parte da campanha já se
comportava como os Capítulos sem ser tratada como tal. A alternativa adotada
separa as duas trilhas por papel: Campanha é a experiência curada e finita
(10 mundos, cada um com identidade visual/sonora própria), Capítulos é o modo
de volume/replay, procedural e sem limite de conteúdo novo por mundo.

## Consequences

Quebrou de propósito o invariante #4 do `CLAUDE.md` (o hash sha256 travado de
`tests/levelComposition.test.cjs` sobre as fases canônicas) — recalculado
sobre as 103 fases novas (C-19). Exigiu atualizar seis arquivos de teste que
dependiam da contagem/numeração antiga (C-20 a C-23, entre outros) e migrar o
save de quem já jogava; a migração acabou sendo um não-evento, porque os ids
`wN-001`…`wN-010` são idênticos nos dois esquemas — só somem, em silêncio, as
posições 11–25 de um mundo antigo, avisadas uma única vez por
`detectDroppedCampaignProgress` + `CampaignResizeNoticeModal` (C-25). Moedas,
chaves e itens nunca são afetados por essa filtragem.

Os mundos 9 e 10 (novos) reaproveitam trilha sonora e arte de mapa dos mundos
2/3 e 3/6/8 respectivamente — não há asset novo gerado para eles ainda. É o
mesmo gap já documentado no `CLAUDE.md` para os Capítulos, agora também para
esses dois mundos; fica para os blocos A/S do roadmap.

O destino final dos Capítulos (mantê-los como modo infinito pós-campanha,
escondê-los do menu, ou remover o código) segue em aberto — rastreado como
C-30. Esta decisão de reestruturar a campanha não decide isso; só libera os
Capítulos para carregar esse papel quando a decisão de C-30 for tomada.
