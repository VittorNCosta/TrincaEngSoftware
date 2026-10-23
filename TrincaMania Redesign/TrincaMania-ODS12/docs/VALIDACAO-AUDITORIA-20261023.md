# Validação da auditoria — 23/10/2026

Branch: `audit/ods12-site-simulador-20261022`. Base revisada: `6ee3ad3c0abcd84b496dac9e34e3f2ae16ab0597`, incluindo as correções locais recuperadas. A auditoria histórica do site lista A01–A25; o aceite consolidado de cada achado e a validação do export estão em `igrion-ODS-site/docs/auditoria/2026-10-23/VALIDACAO.md` na branch homônima.

**Conclusão: não há evidência para declarar todos os achados encerrados.** O código de recuperação, interface e acessibilidade está implementado e passa nas verificações abaixo. Isso não aprova APK, leitor de tela, dispositivo físico nem hosting externo.

## Verificações locais

Node 22.23.2 / npm 10.9.8. Execução sem GitHub Actions.

| Comando                           | Resultado                                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`               | passou                                                                                                                              |
| `npm test`                        | 338/338 passaram; inclui falhas antes/depois dos writes da transação, retomada e idempotência, reset e hash das 103 fases canônicas |
| `npm run test:ui -- --runInBand`  | 70/70 testes, 18 suítes passaram                                                                                                    |
| `npm run test:playthrough`        | 2/2 passaram                                                                                                                        |
| `npm run lint`                    | passou                                                                                                                              |
| `npm run format:check`            | passou antes da inclusão deste relatório; arquivos novos verificados novamente no commit                                            |
| `npm run guarda:ods12`            | passou                                                                                                                              |
| `npm run test:ci`                 | passou localmente; não executa Actions                                                                                              |
| `node scripts/validar-roadmap.js` | passou após incluir CI-41 na tabela Markdown; tarefa continua aberta                                                                |
| `npm audit --json`                | 60 pacotes afetados, 60 high, 2 advisories distintos; não significa 60 falhas independentes                                         |

A guarda de auditoria inicialmente encontrou seis entradas já resolvidas no livro-razão. Foram apenas removidas essas entradas; nenhuma vulnerabilidade nova foi aceita. Permanecem `braces::GHSA-vfj7-8cjw-p6xm` e `node-forge::GHSA-86w9-cpqp-85rv`. Gate verde do livro-razão não significa ausência de vulnerabilidades.

## Pendências

- `npm run valida:assets` falha com quatro PNGs acima de 400 KB e nove referências classificadas como órfãs. Reexecutado com `git archive` do HEAD anterior: mesmas treze mensagens, sem diferença. São dívidas anteriores às correções locais; o teto não foi ampliado e nenhum asset foi apagado para esconder o resultado.
- A05 permanece parcial: atualização compatível de Expo/PostCSS reduz a dívida; os advisories restantes exigem tratamento e revalidação.
- A13 permanece parcial: testes de domínio e falhas de armazenamento não substituem uma carreira completa pela interface em diferentes navegadores/aparelhos.
- A14–A16 permanecem parciais/pendentes: o APK distribuído é anterior ao web, permissões foram reduzidas na configuração do fonte, e há um gate para certificado de release. O APK existente continua com identidade Android Debug. Não foi gerado ou instalado APK nesta validação.
- Aceites manuais de leitor de tela, zoom, viewports menores e dispositivo real continuam separados dos testes automatizados. A tarefa CI-41 não foi marcada como concluída.
- O agregado `validar:local` não está aprovado devido ao gate de assets; o orçamento de bundle Android não foi executado nesta sessão.

Logs completos e backup inicial foram preservados fora dos repositórios em `auditoria/2026-10-23/`. O envio da branch foi solicitado pelo usuário em 23/10; não autoriza merge, publicação ou execução de Actions.
