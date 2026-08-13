# A regra do jogo mora em `src/domain/recycling`, atrás de uma fachada

Toda a lógica de jogo saiu de `src/utils/gameLogic.ts` para `src/domain/recycling` (value
objects, políticas e serviços), e `gameLogic.ts` virou uma camada anticorrupção que apenas
reexporta a assinatura que a apresentação já conhecia. A alternativa era apontar as telas
direto para o domínio, o que significaria reescrever cerca de 150 KB de UI que não tem teste
de interface para sustentar o refactor.

## Consequences

`gameLogic.ts` parece um arquivo morto de reexports e vai tentar alguém a "limpar" — ele é
deliberado. Código novo deve importar de `src/domain/recycling`; a fachada existe só para a UI
herdada, e encolhe conforme as telas forem migrando.

O domínio não importa nada de React, Expo ou storage. É isso que permite testá-lo com
`node --test` sem runner de UI.
