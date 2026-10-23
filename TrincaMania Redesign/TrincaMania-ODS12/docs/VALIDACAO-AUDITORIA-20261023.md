# Validação e correções da auditoria — 23/10/2026

Branch: `audit/ods12-site-simulador-20261022`. Base anterior: `584b7db64baa95b9beff151638c7ddfea428d506`. A matriz A01–A25, os resultados dos navegadores e a proveniência do export ficam em `igrion-ODS-site/docs/auditoria/2026-10-23/VALIDACAO.md`, na branch homônima.

As correções locais não encerram os aceites de execução Android e leitor de tela. As seções iniciais registram a primeira rodada; a retomada ao final atualiza seus resultados. Houve compilação local de APK na retomada, sem instalação, merge, publicação, sincronização de issues ou execução de Actions.

## Correções adicionais

- `braces@3.0.3`: limite de profundidade no parser e guarda iterativa de AST em compile/expand/stringify, incluindo ciclos e tamanho excessivo.
- `node-forge@1.4.0`: rejeição de extensões em DigestAlgorithm de assinaturas RSA PKCS#1 v1.5; formatos válidos com e sem NULL continuam aceitos.
- As mitigações são patches locais temporários em `scripts/security-patches.json`, aplicados pelo postinstall. Versões e hashes de todos os arquivos são conferidos antes da primeira escrita; a instalação falha em caso de divergência. A auditoria verifica novamente os hashes sem modificar arquivos. Testes cobrem aplicação repetida, divergência, entradas profundas/cíclicas e assinaturas válidas/inválidas. Isso não representa uma correção publicada pelos fornecedores nem elimina os avisos de npm audit.
- Quatro PNGs foram dimensionados conforme o maior tamanho de renderização e densidade 3×: 6.054.875 para 101.859 bytes (98,3% de redução). A arte foi preservada. Três arquivos sem referências foram arquivados em `docs/arte/arquivo-auditoria-20261023/assets`, com a galeria histórica ajustada.
- A guarda de assets passa a reconhecer referências no App.tsx e variantes de densidade; o teste de regressão continua rejeitando um arquivo realmente sem uso. Nenhum limite foi aumentado.
- Importações SVG nativas carregam somente as primitivas utilizadas; a web mantém a entrada pública DOM. Os caminhos internos dependem da versão fixada 15.12.1 e devem ser revistos ao atualizar react-native-svg. O teste do mapa consulta a mesma classe Path usada pelo componente e mantém todas as asserções de estrelas e geometria.
- A loja usa texto mais escuro e tamanho mínimo maior, sem reduzir a opacidade de todo o cartão indisponível. O aceite axe dos estados exercitados é registrado na branch do site.
- O gate de APK confere certificado aprovado, pacote, versão, SDK mínimo/alvo, ausência de debug e permissões bloqueadas no manifesto efetivo. Build de feira exige APK e web com o mesmo SHA. O gate é somente leitura e não cria uma identidade de assinatura.

## Verificações locais

Node 22.23.2 / npm 10.9.8. A validação agregada executa formatação, lint, tipos, domínio, automação local, componentes, playthrough, guardas, assets, auditoria, cobertura e orçamento Android. Os pisos de cobertura e o teto do bundle foram mantidos.

| Verificação     | Resultado                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Domínio         | 344 testes; inclui regressões de segurança, assets, release e transações recuperáveis              |
| Componentes     | 70 testes em 18 suítes                                                                             |
| Automação local | 25 testes, sem executar Actions                                                                    |
| Playthrough     | 2 testes: 103 fases canônicas e simulação de 1.000 fases                                           |
| Assets          | 195 arquivos, aproximadamente 43,2 MB; zero arquivos acima do limite e zero órfãos                 |
| Bundle Android  | 2,63 MiB, abaixo do teto original de 2,72 MiB                                                      |
| Auditoria npm   | 60 pacotes afetados por 2 advisories únicos; as mitigações locais não alteram o relatório upstream |

A execução completa de `npm run validar:local` passou, incluindo cobertura e sincronização do roadmap. A redução de 2,73 para 2,63 MiB corrige o orçamento sem elevar o teto. Lint conserva três avisos preexistentes de dependências de hooks em GameScreen; os testes de componentes também emitem avisos preexistentes de atualizações assíncronas fora de act. Esses avisos não foram ocultados.

## Aceites abertos

- A05: acompanhar versões corrigidas upstream de [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) e [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), substituir os patches temporários e repetir a validação. Entradas do livro-razão não foram ampliadas.
- A13: domínio e compra/persistência pela interface não comprovam uma carreira inteira jogada por UI em todos os motores e aparelhos.
- A14–A16: falta APK atualizado com chave de release autorizada e validação de instalação/migração. O APK distribuído continua anterior ao web, assinado com Android Debug e explicitamente identificado como tal. Não existe autorização para inventar uma nova identidade de release.
- VIS-02, zoom/fontes ampliadas, TalkBack/leitor de tela e testes em aparelho continuam manuais; VIS-03/VIS-04 não avançaram.
- A17/A19: o usuário confirmou em 23/10 que a entrega é local/offline. Hospedagem pública e domínio não fazem parte deste aceite; o QR público fica sem configuração.

A tarefa CI-41 permanece aberta. O usuário autorizou correções e push das branches em 23/10. Logs completos, imagens originais e evidências intermediárias foram preservados fora dos repositórios em `auditoria/2026-10-23/correcoes/`.

## Retomada de 23/10 — entrega acadêmica local

O usuário confirmou que o aplicativo é apenas para a faculdade, sem distribuição de produção. O gate padrão continua rejeitando Android Debug. A opção explícita `--academic-local` exige o SHA-256 exato do certificado do APK anterior (`ACADEMIC_CERT_SHA256`), verifica pacote, versão, SDKs, depuração e permissões com os mesmos critérios do gate de release. Não foi criada nem publicada uma chave nova. Preservar o certificado permite uma atualização compatível; a migração efetiva de saves ainda exige teste Android.

O diálogo “Pilha Misteriosa” recebeu nome acessível, título, fechamento pelo sistema e rolagem para conteúdo ampliado. Sua regressão de componente passou; a suíte agora possui 71 testes em 19 suítes.

A consulta atual ao npm reporta um único advisory distinto, `node-forge::GHSA-86w9-cpqp-85rv`, propagado a 22 pacotes. A entrada de braces foi retirada do livro-razão porque não é mais reportada pelo registry; a mitigação local e seus testes foram preservados. Nenhuma vulnerabilidade nova foi aceita. A matriz e a triagem ficam em [DEPENDENCIAS-AUDITORIA-20261023.md](DEPENDENCIAS-AUDITORIA-20261023.md). O saldo anterior de 2 advisories/60 pacotes acima é histórico.

A compilação Android local concluiu `:app:assembleRelease` com os quatro ABIs e o certificado histórico. A inspeção do artefato confirmou pacote `br.com.mhvtech.trincamania`, versão 1.1.0, minSdk 24, targetSdk 36 e ausência das seis permissões bloqueadas. O validador passou a reconhecer tanto `sdkVersion` quanto `minSdkVersion` emitidos por versões de aapt/aapt2; sete regressões do gate conferem os limites e as duas políticas de assinatura. Nenhum APK foi instalado. O pacote final e sua proveniência ficam no relatório consolidado do site.

Na retomada, domínio passou com 346 testes após a regressão adicional de aapt2; automação local 25, UI 71 em 19 suítes, dois playthroughs, guardas e assets passaram. A execução agregada parou na entrada obsoleta de braces no livro-razão; após removê-la, auditoria, cobertura, orçamento de 2,63 MiB e sincronização dos 198 modelos foram executados separadamente e passaram. Isso não é apresentado como uma execução agregada única posterior à correção.
