# A bandeja base tem 7 espaços, não 5

Com "três peças iguais", qualquer peça do material fechava a trinca. No ciclo é preciso o papel
exato, e existe um terço da oferta de cada papel — a bandeja enche antes de o jogador conseguir
reunir resíduo, lixeira e símbolo. Medindo 609 partidas por configuração com um jogador
heurístico, a regra do ciclo custa cerca de dois espaços de bandeja: 45% de vitória com bandeja
9 reproduz os 49% da bandeja 7 sob a regra original. Subimos `BASE_TRAY_CAPACITY` de 5 para 7 e
`MAX_TRAY_CAPACITY` de 7 para 9.

| bandeja | três iguais | ciclo |
| ------- | ----------- | ----- |
| 5       | 8%          | 4%    |
| 7       | 49%         | 15%   |
| 9       | 96%         | 45%   |

## Considered Options

Reduzir a quantidade de materiais por fase, ou agrupar os ciclos mais perto na ordem de
remoção, também aliviariam a pressão — mas mexem no desenho das 203 fases e o efeito é difícil
de prever. A capacidade da bandeja é um número só, com efeito medido.

## Consequences

Os dois espaços compráveis continuam sendo os dois últimos, então a economia de moedas
(`COIN_TRAY_SLOT_COST`) não muda. `getTraySlotStatus` deixou de fixar o índice 5 como o slot
pago e passou a derivá-lo de `BASE_TRAY_CAPACITY`.

A bandeja agora desenha 9 slots numa linha — cerca de 33 dp cada num aparelho de 360 dp. Os
slots usam `flex: 1`, então se redividem sozinhos, mas o aperto vale ser conferido no APK.
