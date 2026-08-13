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
