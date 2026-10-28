# Integração local dos assets redesenhados — 28/10/2026

Continuação autorizada do [plano de 27/10](PLANO-INTEGRACAO-ASSETS-REDESENHADOS-20261027.md). Implementação disponível na fonte e em uma prévia local do simulador. Aceite visual do usuário, validação Android e exportação oficial de fonte commitada continuam pendentes.

## Autorização de envio — continuação de 28/10/2026

Após revisar a entrega local, o usuário solicitou: “após a implementação suba no site ODS 12 e seu simulador, e suba tudo no remoto”. Esta instrução autoriza registrar os commits do jogo/site, exportar o simulador da fonte limpa e enviar as branches próprias aos remotos. Commits usam `[skip ci]`; GitHub Actions, merge nas branches principais e geração/instalação de APK continuam fora desta entrega. O estado local descrito abaixo registra a validação anterior ao envio; SHAs e resultado da exportação oficial serão registrados no site consumidor.

## Implementação

- ZIP conferido pelo SHA-256 `655d462eb01807fb21f07cbd6dfc9bf0bcf76265b8785cdf56b4acdf8aac0aa8`; os 442 arquivos de arte conferem com o inventário de origem.
- 90 resíduos substituídos nos mesmos caminhos. Lixeiras e símbolos passam a usar os dez PNGs em `assets/ui/recycling`, com registro tipado e `require` literal em `src/data/recyclingVisualAssets.ts`.
- Superfície, borda, profundidade e sombra interna por material centralizadas em `src/styles/materialTilePalette.ts`, usando o `MaterialType` do domínio. Aplicação no tabuleiro, bandeja, voo e fechamento; tutorial reutiliza os componentes reais. Faixa textual preservada. Peças misteriosas continuam roxas, sem arte, texto ou superfície que revelem o material; bloqueio mantém pictograma e cor.
- Geometria dos controles vetoriais portada para `redesignedIconGeometry.json` e renderizada com primitivas SVG por `RedesignedIcon.tsx`. Famílias ODS e adaptada, setas, estrelas e poder estrela vinculados aos consumidores existentes. Gradientes têm identificadores por instância; offsets decimais normalizados para compatibilidade nativa. Interfaces e wrappers de estado/tamanho/tom preservados.
- Artes de navegação, perfil, poderes, recompensas e recursos de apoio atualizadas. Métricas alpha dos quatro ícones inferiores atualizadas; fórmula de apoio e pedestal original preservados.
- Site: dez SVGs de coleta seletiva, resíduo de plástico e SVGs das redes atualizados. URLs, links, foco e nomes acessíveis preservados. CSS das redes acompanha a troca de SVG inline por imagem.
- Sete recursos usados acima de 400 KiB receberam versões de execução com até 512 px, proporção e transparência preservadas. Orçamento e baseline não foram ampliados. PNGs otimizados com paleta de 256 cores; WebP com qualidade 90 e alpha preservado. Originais permanecem no ZIP.

A [tabela de integração](integracao-assets-20261028.json) registra origem, destino, consumidores, dimensões, bytes, hashes e justificativas dos 442 arquivos: 287 integrados, dez substituídos por desenho nativo equivalente e 145 não utilizados. Não foram importados PNGs irmãos de WebP, aliases sem consumidor, sprites de catálogo ou bases raster adicionais. O desenho de descanso do pacote foi dispensado.

As 103 fases, os 1.000 mapas de capítulos, ids das cartas, domínio, persistência, economia, cenários e regras não foram alterados. Descansos e baú bônus não foram reintroduzidos.

## Validação local

- Node `v22.23.2`; RTK indisponível, usados os comandos originais, conforme `RTK.md`.
- `npm test`: 395 aprovados.
- `npm run test:ui -- --runInBand`: 143 aprovados em 30 suítes; inclui os 15 casos material/papel, sigilo da peça misteriosa nos cinco materiais e renderização dos vetores sem avisos de gradiente.
- `npm run test:playthrough`: duas simulações aprovadas, incluindo os 1.000 mapas.
- TypeScript e formatação aprovados. Lint sem erros; os três avisos em `GameScreen.tsx` já constam da entrega de 27/10.
- Guarda ODS12 sem regressões; assets: 265 arquivos, 51,4 MB, zero órfãos ou excessos acima de 400 KiB.
- Site: nove testes de configuração/integridade/transação/servidor aprovados; build Astro aprovado sem diagnósticos.
- Prévia: 18 testes de site/host aprovados em desktop/celular; 40 testes de fronteiras dos dez mundos e dos dez capítulos aprovados, incluindo verificação de saves inalterados.

`game.spec.ts`: tutorial, demonstrações dos três poderes e isolamento do modo de testes passaram em desktop/celular. A seleção de mundo desse teste ainda pressupunha setas que o mapa atual não expõe; o teste foi adaptado aos links públicos por mundo, preservando o acesso à fase 100, ao bônus e ao mapa `ch10-100`, além da comparação integral do save. Esses dois casos passaram após a correção. O acesso a “Como jogar” usa agora a aba “Perfil”.

Permanecem quatro falhas E2E de áudio: dois testes em desktop/celular, nas asserções iniciais de reprodução por `HTMLMediaElement`, antes das interações com peças. Os mesmos dois testes falharam também no desktop da exportação anterior, baseada no commit completo `0c7a2a35fee68ce1e37ae1cf0fabff77276a5e8a`, servida na porta 4334. A comparação sustenta que essas falhas já existem sem a integração. Não foi alterado código ou asset de áudio, nem removida qualquer asserção. A suíte E2E completa não está verde. [Resumo e falhas comparadas](evidencias-assets-20261028/validacao-local.txt).

## Prévia e evidências

Site: `http://127.0.0.1:4333/`. Simulador: `http://127.0.0.1:4333/jogar/?modo=dev`. Prancha: `http://127.0.0.1:4333/asset-review.html`.

Diretório local do site: `.cache/assets-preview-20261028/`. Reinício: `node .cache/assets-preview-20261028/serve-preview.mjs`, executado na raiz de `site-ods`.

O manifesto `preview-manifest.json` identifica a prévia como `previewOnly: true`, `localChanges: true`, baseada no HEAD `0c7a2a3` com alterações locais, e registra os hashes dos arquivos exportados. A prévia não se apresenta como build oficial de fonte limpa. A guarda transacional existente permanece intacta; o simulador versionado anterior e seu manifesto não foram substituídos nesta integração. Alterações locais anteriores no checkout do site foram preservadas.

[Capturas](evidencias-assets-20261028/) cobrem tutorial, mapa e partida em 360, 390, 480 e 1440 px; as quatro abas inferiores em 360, 390 e 480 px; referência dos 15 casos em 24/32/40 px, cenários claros/escuros e cinza. Capturas anteriores em 390/1440 px permitem comparar tutorial e mapa; tabuleiros de partida são sorteados e não representam posições idênticas. A prancha é referência de leitura, não captura do componente nativo.

Branches locais: jogo `feat/assets-redesenhados-20261028`; site `feat/assets-site-20261028`. Sem commit, push, PR, CI remoto, novo APK ou instalação. Para publicar a exportação oficial será necessário registrar a fonte revisada e executar o exportador existente com seu SHA completo. Aceite visual Android permanece pendente.
