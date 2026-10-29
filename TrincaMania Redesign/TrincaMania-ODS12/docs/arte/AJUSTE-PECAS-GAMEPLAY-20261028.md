# Peças da partida sem legendas — 28/10/2026

Solicitação: retirar a legenda das peças e deixar a superfície um pouco mais clara que os desenhos somente durante a partida. Os demais ícones devem manter a aparência existente.

`GameplayTileContext` fica restrito a `GameScreen`. Nesse contexto, `TileIcon` dispensa a faixa com o nome do material e usa o espaço para o pictograma. Tabuleiro, bandeja, voo e fechamento compartilham as superfícies mais claras: plástico `#F09B8F`, papel `#88B8E5`, vidro `#8DD1A0`, metal `#F4D782` e orgânico `#C6A17D`.

A paleta padrão e o comportamento padrão do componente foram preservados. Painel de seleção de fase, tutorial fora da partida, navegação, perfil, loja, recompensas e poderes mantêm seus ícones. Nenhum bitmap foi alterado. As peças misteriosas conservam sua aparência roxa e os nomes acessíveis das peças continuam disponíveis aos leitores de tela.

A alteração não modifica tamanho da peça, área de toque, posicionamento, regras, capacidade da bandeja, progresso ou saves. O tutorial prático inserido na partida acompanha as peças da própria partida. A validação Android permanece separada; não há geração de APK.

Validação e exportação local do simulador seguem o procedimento existente de fonte revisada/commitada. Os testes de escopo verificam simultaneamente o mesmo material dentro e fora do contexto da partida, incluindo a preservação da imagem original.

## Verificações locais

TypeScript, 395 testes de domínio/storage, 148 testes de interface em 30 suítes, duas simulações, guarda ODS12, guarda de assets, consistência do roadmap e formatação aprovados. Lint sem erros, com os três avisos já existentes em GameScreen. O diff não altera nenhum arquivo de imagem. A fonte revisada será usada pelo exportador oficial do site, com `localChanges: false`.
