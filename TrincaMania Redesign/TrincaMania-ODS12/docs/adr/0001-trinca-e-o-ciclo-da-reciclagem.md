# A trinca é o ciclo da reciclagem, não três peças iguais

O enunciado do trabalho descrevia a trinca como "três itens do mesmo material" — o mesmo
formato do jogo original de frutas, só que repintado. Adotamos em vez disso o ciclo completo
(resíduo + lixeira da cor certa + símbolo do mesmo material), porque é o atrito de precisar
saber *onde descartar* e *o que acontece depois* que carrega o conteúdo de ODS 12. Reconhecer
o material sozinho não ensina descarte.

## Considered Options

`SameMaterialMatchRule` — "três peças quaisquer do mesmo material" — continua implementada e
selecionável em `MatchRuleRegistry`. Foi mantida de propósito: serve para tutorial ou mundos
iniciais, onde cobrar o ciclo inteiro de saída seria cedo demais.

## Consequences

O gerador de níveis passou a consultar a regra de trinca: cada bloco de três posições da ordem
de remoção recebe o ciclo completo de um material, o que mantém toda fase vencível por
construção. Trocar a regra ativa, portanto, muda também como as fases são montadas — não é uma
troca só de pontuação.

A regra do ciclo é substancialmente mais difícil que a original, o que exigiu redimensionar a
bandeja. Ver [ADR 0003](./0003-bandeja-base-de-sete-espacos.md).
