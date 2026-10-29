# Plano de integração dos assets redesenhados do TrincaMania ODS 12

Data: 27/10/2026. A integração descrita neste documento é futura. A entrega atual publica as correções locais do jogo e do site, o simulador web atualizado e este plano. Os novos desenhos do ZIP ainda não foram aplicados.

**Retomada em 28/10/2026:** integração implementada localmente a pedido do usuário. Estado, inventário, prévia, verificações e pendências em [ENTREGA-ASSETS-20261028.md](ENTREGA-ASSETS-20261028.md). As seções abaixo preservam o planejamento e a autorização da rodada original; a integração atual não inclui publicação.

## 1. Origem, decisões e escopo

- Pacote escolhido: `TrincaMania_ODS12_Icones_Redesenhados(1).zip`, na pasta Downloads do Windows.
- Tamanho: 47.709.411 bytes.
- SHA-256: `655d462eb01807fb21f07cbd6dfc9bf0bcf76265b8785cdf56b4acdf8aac0aa8`.
- Raiz interna: `ODS12_ICONES_REDESENHADOS/`.
- Inventário: 442 arquivos de arte, incluindo variantes e aliases; 90 resíduos, cinco lixeiras, cinco símbolos, cinco bases por material e ícones do jogo e do site. O arquivo completo contém 470 entradas.
- Fontes de conferência: `INVENTARIO.json`, `INVENTARIO.csv`, `LEIA-ME.txt`, `NAV_ICON_METRICS.json`, `INTEGRACAO/` e `REVISAO_VISUAL/` dentro do ZIP.

O usuário escolheu publicar agora **as correções existentes e o plano**, deixando a integração dos desenhos para uma etapa posterior. Para essa etapa, escolheu **a paleta por material do ZIP**, substituindo as superfícies neutras atualmente implementadas. Essa escolha não aplica os fundos antecipadamente.

A autorização de 27/10/2026 permite commitar e enviar as alterações desta rodada às branches próprias do jogo e do site. Não inclui merge nas principais, abertura de PR, execução de GitHub Actions ou geração/instalação de APK. Os testes e builds desta entrega são locais.

Preservar as 103 fases canônicas, os 1.000 mapas de capítulos, os identificadores das cartas, as regras das trincas e os saves. Preservar mapas, cenários, personagens, marcas e a base dos pedestais. Não reintroduzir os pontos de descanso nem o baú do mundo bônus por causa de imagens presentes no pacote.

## 2. Inventário e importação dos arquivos

Antes de alterar o jogo, verificar o SHA-256 do ZIP e conferir todos os arquivos que serão usados contra o inventário. Registrar uma tabela de integração com origem, destino, consumidor, dimensão, tamanho, SHA-256 e situação: integrado, substituído por equivalente ou não utilizado com justificativa.

| Família no ZIP                                              | Destino e tratamento                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01_JOGO/assets/residuos/`                                  | Substituir os 90 PNGs correspondentes em `assets/residuos/`, preservando os caminhos e o vínculo de cada resíduo ao material e mundo.                                                                               |
| Demais arquivos de `01_JOGO/assets/`                        | Substituir somente recursos com consumidor existente; conferir perfil, poderes, recompensas, tutoriais, loja e navegação. Preservar as variantes de escala usadas pelo React Native.                                |
| `03_ICONES_EXPORTADOS/COLETA_SELETIVA/`                     | Vincular os dez PNGs individuais de lixeiras e símbolos ao jogo por um registro tipado, com `require` literal para material e papel. Copiar os PNGs utilizados para `assets/ui/recycling/`.                         |
| `03_ICONES_EXPORTADOS/UI_ODS/` e `UI_ORIGINAL_ADAPTADA/`    | Portar a geometria dos SVGs verdadeiros para os componentes correspondentes, preservando as interfaces e os estados. Usar a família de cada componente; não importar simultaneamente os aliases PNG sem consumidor. |
| `03_ICONES_EXPORTADOS/ESTRELAS/`, `NAVEGACAO/` e `PODERES/` | Atualizar os respectivos componentes, preservando estados conquistado/não conquistado, orientação, preços e ações.                                                                                                  |
| `02_SITE/public/images/`                                    | Atualizar os recursos correspondentes do site. Usar um único formato por consumidor; os SVGs de coleta seletiva contêm PNG incorporado e podem preservar as URLs existentes.                                        |
| `02_SITE/EXPORTADOS/`                                       | Vincular os SVGs de Instagram e TikTok ao componente de redes sociais, preservando nomes acessíveis, links e foco.                                                                                                  |
| `04_BASES_DAS_PECAS/` e `INTEGRACAO/`                       | Implementar a paleta no desenho nativo das peças. Não importar PNGs/SVGs das bases como camadas adicionais desnecessárias.                                                                                          |
| `REVISAO_VISUAL/` e catálogo                                | Usar como referência de conferência, nunca como sprites de execução.                                                                                                                                                |

O jogo possui atualmente 155 dos 157 caminhos entregues em `01_JOGO/`. Os dois caminhos adicionais são PNGs irmãos de recursos WebP de loja e tutorial: não adicioná-los automaticamente. Preservar um único recurso efetivamente usado por consumidor.

Os novos desenhos de lixeiras e símbolos não aparecerão apenas copiando o diretório de exportação: hoje os componentes desenham essas artes em código. A integração deve trocar o consumidor para a imagem correspondente e preservar o tratamento acessível.

### Peso, transparência e resolução

- Conferir proporção, canal alpha, limites visíveis e margens usando alpha maior que 8, como no inventário.
- Manter os objetos recortados; não inserir fundo branco ou dourado dentro dos PNGs.
- Preferir os recursos `optimized` já consumidos pelo aplicativo. Não copiar fontes grandes ou aliases sem uso para a pasta de execução.
- Nove arquivos de arte do pacote excedem 400 KiB. Quando utilizados, gerar versões de execução com até 512 px no maior lado, preservando proporção e transparência, e otimizar até o orçamento existente. Os originais continuam preservados no pacote de origem.
- Não aumentar o teto da guarda de assets para acomodar a importação. Atualizar o livro-razão somente após conferir referências e reduções reais.

## 3. Identificação das trincas e integração visual

### Paleta aprovada para a integração futura

| Material | Identificação | Superfície | Borda     | Profundidade |
| -------- | ------------- | ---------- | --------- | ------------ |
| Plástico | `#D6321E`     | `#EA7565`  | `#9C2114` | `#6A180F`    |
| Papel    | `#0B5FBF`     | `#5C9ED8`  | `#08428A` | `#05285C`    |
| Vidro    | `#1E9E4A`     | `#60BE79`  | `#136D31` | `#0C4920`    |
| Metal    | `#F2B705`     | `#E7C448`  | `#8B6200` | `#5C4100`    |
| Orgânico | `#7A4A21`     | `#AF8053`  | `#5B3517` | `#3B220E`    |

Centralizar a paleta usando o `MaterialType` existente; adaptar o código de referência do ZIP sem criar um segundo tipo de material. Usar os valores de sombra interna fornecidos pelo pacote. Não alterar o token global de dourado usado por moedas e recompensas.

Resíduo, lixeira e símbolo do mesmo material devem usar a mesma superfície, borda e profundidade. Compartilhar a seleção entre tabuleiro, bandeja, animação de voo, tutorial e efeito de fechamento da trinca. A superfície interna de `TileIcon` deve acompanhar a peça, evitando uma placa neutra ou amarela sobre o fundo novo.

Preservar a identificação curta do material como apoio à cor. Conferir o contraste do texto da faixa, usando tinta clara ou escura conforme o material. Preservar a aparência física dos resíduos: papel natural e metal prateado continuam reconhecíveis, com o selo de identificação fornecido nos desenhos.

Peças bloqueadas mantêm a cor e o pictograma do material: indicar bloqueio pelo cadeado e pelo escurecimento da base, sem véu sobre a arte. Peças mistério não recebem a paleta nem o desenho do material enquanto estiverem ocultas. Manter a aparência roxa do estado misterioso e não revelar seu material por borda, faixa ou texto.

Não alterar hitboxes, coordenadas, elevação, capacidade da bandeja, ações dos poderes ou regras de pareamento. Preservar a ordem de fechamento resíduo + lixeira + símbolo conforme a regra ativa.

### Navegação, interface e site

Atualizar `NAV_ICON_METRICS` com os dados entregues. Manter a fórmula que apoia a borda inferior visível dos ícones sobre os pedestais, incluindo a correção horizontal pelo centro de massa alpha. A base gráfica do menu continua original.

| Ícone   | Dimensões | Altura visível | Centro X | Base visível | Altura exibida |
| ------- | --------- | -------------- | -------- | ------------ | -------------- |
| Mapa    | 256 × 234 | 230            | 130,3697 | 232          | 40             |
| Loja    | 256 × 256 | 239            | 134,8296 | 251          | 36             |
| Missões | 256 × 256 | 242            | 132,6775 | 250          | 36             |
| Perfil  | 256 × 256 | 228            | 127,7088 | 246          | 36             |

Preservar as interfaces de `TileIcon`, `GameIcon`, `PowerIcon` e estrelas, incluindo tamanho, tom, estado e nome. O registro de novas imagens é interno; não há nova API pública nem migração de storage.

No site, conferir a página inicial, a página de ícones, o tutorial, os materiais e as redes sociais. Valores como preço, moedas, vidas e disponibilidade continuam renderizados pelo aplicativo, sem números fixos embutidos nas imagens.

## 4. Validação e critérios de aceite

### Integração futura dos desenhos

- Conferir a presença e o pareamento dos 90 resíduos e dos 15 casos material/papel.
- Revisar as artes em 24, 32 e 40 px, sobre cenários claros e escuros e em modo cinza; cor, forma, pictograma e identificação textual devem se complementar.
- Conferir transparência, contorno, margens, ausência de cortes e distinção entre amarelo do metal, marrom do orgânico e dourado das moedas.
- Conferir peças livres, bloqueadas, misteriosas, reveladas, destacadas, em movimento e na bandeja; fechar trincas e acionar os três poderes.
- Conferir perfil, loja, recompensas, tutoriais, estrelas conquistadas/não conquistadas e estados dos controles.
- Conferir os quatro ícones inferiores em todas as abas e em larguras de 360, 390 e 480 px, mantendo a mesma linha de apoio.
- Registrar capturas comparativas no navegador, em desktop e celular. Não apresentar testes automatizados como aceite visual Android.

Executar localmente os checks do jogo previstos em `AGENTS.md`: TypeScript, testes de domínio/storage, UI, simulação, lint e formatação; executar também a guarda ODS12 e a validação de assets. Inspecionar os scripts antes de executá-los para confirmar que não disparam CI remoto.

No site, validar configuração, integridade da exportação e transação de atualização; executar o build local e os testes de navegação pertinentes sobre o jogo exportado. Ajustar somente as asserções afetadas pelos novos rótulos, preservando a cobertura dos fluxos.

O aceite exige regras e saves preservados, cinco materiais distinguíveis, ausência de imagens quebradas, coerência entre site e jogo e aprovação visual do usuário. A aprovação Android exige validação específica posterior; esta entrega não gera APK.

## 5. Publicação das correções atuais e deste plano

Esta rodada inclui poderes sem cartão branco, cabeçalho transparente, identificação das trincas na paleta neutra atual, alinhamento dos ícones inferiores, novo painel da fase, retirada do baú bônus e dos pontos de descanso, e ampliação do simulador no site.

1. Revisar as alterações dos dois checkouts e salvar este plano. Atualizar os dois espelhos do roadmap e regenerar o script de issues, sem executá-lo.
2. Executar as verificações locais pertinentes e registrar os resultados. Não incluir ZIPs, credenciais, caches ou evidências temporárias no commit.
3. Criar primeiro o commit do jogo, com mensagem Conventional Commits e `[skip ci]`, incluindo todas as alterações revisadas desta rodada e este documento. A fonte precisa estar limpa antes da exportação.
4. No site, executar o exportador existente com `GAME_PROJECT_PATH` apontando para o aplicativo revisado e `GAME_SOURCE_SHA` igual ao SHA completo desse commit. O exportador usa fonte arquivada e instalação isolada, atualiza os hashes e faz a troca transacional do simulador.
5. Confirmar o manifesto do site com o novo commit e `localChanges: false`; executar build e verificações sobre a exportação. Preservar o simulador original e o APK histórico.
6. Criar o commit do site, incluindo a ampliação da área e o novo simulador com seus metadados. Publicar sem force-push nas branches abaixo.

| Repositório                      | Branch de publicação                    |
| -------------------------------- | --------------------------------------- |
| `VittorNCosta/TrincaEngSoftware` | `fix/poderes-fundos-materiais-20261027` |
| `VittorNCosta/igrion-ODS-site`   | `fix/simulador-area-maior-20261027`     |

Conferir os SHAs no remoto e fornecer os links das branches e deste plano. O envio das branches não é merge nem publicação em produção. A restrição de GitHub Actions continua vigente: não abrir PR nem disparar workflows; o push fica restrito às branches próprias e os commits usam `[skip ci]`.

A futura integração dos assets deve partir das correções publicadas, em uma branch própria. Se houver regressão, reverter os commits específicos da integração e regenerar o simulador a partir da fonte corrigida, preservando histórico e saves.

## 6. Verificações da fonte nesta entrega

Executadas localmente em 27/10/2026 antes do commit da fonte:

- `npm test`: 395 testes aprovados.
- `npm run test:ui -- --runInBand`: 132 testes em 29 suítes aprovados.
- `npm run test:playthrough`: duas simulações aprovadas, cobrindo campanha e os 1.000 mapas de capítulos.
- `npm run typecheck` e `npm run format:check`: aprovados.
- `npm run lint`: sem erros; três avisos existentes em `GameScreen.tsx`.
- `npm run guarda:ods12`: nenhuma regressão e nenhuma pendência conhecida.
- `npm run valida:assets`: 255 arquivos, 48,3 MB, nenhum órfão ou arquivo acima de 400 KiB.
- `git diff --check`: aprovado.

As conferências visuais anteriores desta rodada cobriram desktop e celular, os cinco materiais, rótulos sem corte, cores preservadas nas peças bloqueadas e aparência consistente na bandeja. A retirada dos descansos foi conferida nos 11 mundos e nos dez capítulos. A exportação e a publicação dos dois repositórios seguem a sequência da seção 5; o manifesto versionado do site identificará o commit completo efetivamente exportado.
