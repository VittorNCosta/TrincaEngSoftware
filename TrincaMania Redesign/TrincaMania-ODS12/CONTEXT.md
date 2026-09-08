# Reciclagem

O contexto do TrincaMania na versão ODS 12 (Consumo e Produção Responsáveis). Modela o que o
jogador aprende jogando: reconhecer o material de um resíduo, saber em qual lixeira ele vai e
o que acontece com ele depois.

## Language

### O que é uma peça

**Material**:
Tipo de resíduo reciclável — plástico, papel, vidro, metal ou orgânico. É o material que
decide com quem uma peça combina, e sua cor é a cor oficial da lixeira (CONAMA 275/2001).
_Avoid_: espécie, tipo, categoria, fruta

**Papel**:
A posição de uma carta dentro do ciclo: resíduo, lixeira ou símbolo.
_Avoid_: função, estágio, etapa

**Carta**:
Entrada do catálogo, identificada por material, papel e variante. Define a arte e o
significado; não tem posição.
_Avoid_: item, figura

**Peça**:
Uma carta posicionada — no tabuleiro ou na bandeja —, com coordenadas e camada.
_Avoid_: bloco, ficha, tile

**Variante**:
Alternativa visual dentro do mesmo material e papel. Garrafa PET, sacola e copo são variantes
do resíduo de plástico. Não afeta o pareamento: é o que ensina que objetos diferentes
pertencem ao mesmo material.
_Avoid_: skin, versão

### Os três papéis

**Resíduo**:
O papel do objeto descartado — o que o jogador precisa classificar.
_Avoid_: lixo, item descartado

**Lixeira**:
O papel do destino correto, identificado pela cor da coleta seletiva.
_Avoid_: contêiner, cesto, caçamba

**Símbolo**:
O papel do resultado — o material efetivamente reciclado ou compostado. No texto exibido ao
jogador ele aparece como "Reciclagem"; em código e em conversa, o termo é símbolo.
_Avoid_: resultado, fim

### A jogada

**Ciclo**:
A sequência resíduo → lixeira → símbolo de um mesmo material. É o que o jogo ensina e o que
uma trinca precisa reunir.
_Avoid_: sequência, fluxo, cadeia

**Trinca**:
As três peças que fecham um ciclo completo e saem da bandeja juntas.
_Avoid_: trio, combinação, par

**Regra de trinca**:
A política que decide o que fecha uma trinca. O jogo roda no ciclo da reciclagem; "três do
mesmo material" existe como alternativa selecionável.
_Avoid_: regra do jogo, condição de match

### O cenário

**Tabuleiro**:
O empilhado de peças de uma fase. Uma peça só é jogável quando nenhuma outra a cobre.
_Avoid_: mesa, grid

**Bandeja**:
Onde as peças recolhidas do tabuleiro esperam até fecharem uma trinca. Enchê-la é a condição
de derrota.
_Avoid_: barra, mão, inventário

**Peça mistério**:
Peça que esconde qual carta é até ficar descoberta.
_Avoid_: peça oculta, carta virada

**Ordem de remoção**:
Uma ordem de retirada das peças comprovadamente jogável, usada para distribuir as cartas de
modo que a fase seja sempre vencível.
_Avoid_: solução, gabarito

## Mundos

Vocabulário dos 10 mundos da campanha + o mundo bônus (`src/data/worlds.ts`). Os mundos 1–8 e
o bônus tiveram o nome convertido do tema de fantasia original (auditoria de 2026-08-13); os
mundos 9 e 10 nasceram já dentro do tema, no resize da campanha de 2026-09-03 (ver `CLAUDE.md`).
Cada entrada é o que o mundo representa na cadeia da reciclagem — nunca reintroduza o nome de
fantasia entre parênteses.

**Mundo 1 — Parque da Coleta Seletiva**:
A coleta seletiva na fonte — o ponto de partida do ciclo, onde o resíduo é separado por
material.
_Avoid_: Bosque das Trincas

**Mundo 2 — Vale da Reciclagem**:
A reciclagem propriamente dita: o processo que transforma o resíduo separado em matéria-prima.
_Avoid_: Vales Montanhosos

**Mundo 3 — Central de Materiais**:
A triagem dos recicláveis por material antes de seguirem para o beneficiamento.
_Avoid_: Ruínas de Cristal

**Mundo 4 — Viveiro Comunitário**:
O reaproveitamento comunitário do que já foi reciclado ou compostado.
_Avoid_: Praia dos Tesouros

**Mundo 5 — Usina de Compostagem**:
O destino do orgânico: virar composto em vez de aterro.
_Avoid_: Vulcão Doce

**Mundo 6 — Cooperativa dos Catadores**:
Os catadores de materiais recicláveis, elo humano da cadeia entre a coleta e a indústria.
_Avoid_: Cidade das Estrelas

**Mundo 7 — Rota da Logística Reversa**:
O retorno do produto ou da embalagem ao fabricante depois de usado.
_Avoid_: Neve Cristalina

**Mundo 8 — Fórum da Economia Circular**:
O conceito guarda-chuva que fecha o ciclo: nada é descartado, tudo volta a ser insumo.
_Avoid_: Reino Celestial

**Mundo 9 — Distrito da Reindustrialização**:
O material reciclado virando matéria-prima industrial de novo — o ciclo fechado voltando à
fábrica. Sem nome de fantasia anterior (mundo criado no resize de 2026-09-03).

**Mundo 10 — Cúpula da Reciclagem Global**:
A escala internacional do tema: acordos e cooperação global em torno do ODS 12. Sem nome de
fantasia anterior (mundo criado no resize de 2026-09-03).

**Bônus — Jardim Renascido**:
Mundo secreto, desbloqueado à parte da campanha principal: a natureza se recuperando quando o
ciclo se fecha.
_Avoid_: Reino Açucarado
