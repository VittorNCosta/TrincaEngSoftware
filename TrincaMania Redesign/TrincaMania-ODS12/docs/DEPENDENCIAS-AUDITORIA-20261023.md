# Dependências — triagem da auditoria em 23/10/2026

Escopo A05: matriz de versões compatíveis e triagem individual, sem `npm audit fix --force` ou migração de SDK para fabricar um resultado limpo. Node 22.23.2, npm 10.9.8, instalação determinada pelo package-lock.json.

| Família             | Versão instalada | Decisão                                                                                                                                                                                                             |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo / React Native | 54.0.38 / 0.81.5 | Preservar SDK 54 e versões compatíveis do Expo; validar tipos, domínio, UI, export web e bundle Android.                                                                                                            |
| React / React DOM   | 19.1.0 / 19.1.0  | Manter alinhados à matriz do SDK.                                                                                                                                                                                   |
| Metro               | 0.83.8           | Overrides coordenados; export e orçamento validam a resolução.                                                                                                                                                      |
| PostCSS             | 8.5.31           | Override compatível já aplicado; instalação isolada pelo lock.                                                                                                                                                      |
| braces              | 3.0.3            | Advisory GHSA-vfj7-8cjw-p6xm deixou de ser reportado nesta consulta. Limites de profundidade, tamanho e ciclos permanecem como defesa local, com testes.                                                            |
| node-forge          | 1.4.0            | GHSA-86w9-cpqp-85rv continua alto no relatório upstream. Mitigação local rejeita DigestAlgorithm RSA malformado e preserva assinaturas válidas; aplicada no postinstall com verificação estrita de versão e hashes. |

A consulta atual contém **1 advisory único e 22 pacotes afetados**, pois o npm também conta os caminhos transitivos. Isso não significa 22 falhas independentes. O [advisory node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv) não oferece versão corrigida na consulta. Os patches não alteram o resultado de npm audit nem equivalem a uma versão corrigida pelo fornecedor.

Risco residual: patch temporário mantido pelo projeto, dependente da versão/hash exatos. Uma mudança inesperada falha na instalação e no gate de auditoria. Remover o patch somente após versão upstream corrigida, revisão da resolução e repetição das regressões de segurança/exportação. A guarda continua reprovando advisory novo alto/crítico e entradas obsoletas no livro-razão.

O artefato JSON completo e os logs desta rodada permanecem no diretório local de evidências `auditoria/2026-10-23/fechamento/`. A matriz A01–A25 do site é o registro consolidado dos aceites; esta triagem não constitui aprovação de release de produção.
