# Segurança do APK e validação dinâmica

Estado em 18/09/2026: infraestrutura local e fixtures preparadas; não houve análise de APK real nem validação em aparelho. Não concluir SEC-20/SEC-21 com base apenas no verde das fixtures.

## MobSF estático (SEC-20)

Execute `Segurança APK (MobSF estático)` manualmente com o ID de um workflow Build manual **preview concluído** deste repositório. O downloader rejeita execução falha, PR, workflow diferente, APK ausente ou ambíguo. `scan_apk.py` confere commit, status FINISHED e SHA256 com `build-manifest.json` antes de iniciar. A produção entrega AAB: gere um APK preview verificável para esta análise; não renomeie AAB.

A imagem MobSF 4.5.2 Linux/amd64 é fixada em `opensecurity/mobile-security-framework-mobsf@sha256:b1af0d8ed4efad948cd7d74ac3657feb4e8b47a63907b6215454e01b50606181`. O pull usa o registro; o container que recebe APK roda com `--network none`, sem portas publicadas, sem capacidades e sem montagem do workspace. API e APK só circulam dentro do container. A chave efêmera passa por arquivo temporário modo 0600; saídas do processo não são publicadas porque o startup pode imprimir credenciais. O container e relatório bruto temporário são removidos ao final. Não se usa mobsf.live, VirusTotal nem outro serviço público.

O único artifact publicado, por sete dias, é `mobsf-summary.json`: SHA256, commit, build ID, imagem, permissões, severidade/área e fingerprint dos achados. Ele omite strings, URLs, código descompilado e credenciais. O relatório bruto permanece privado e temporário; se precisar inspecioná-lo para triagem, rode em máquina de segurança controlada e não o anexe a issue pública. O workflow exige environment `mobile-security`; configure seus responsáveis e restrições conforme a política do repositório antes de usar.

Política: novos altos/críticos ficam bloqueados até classificação. Confirmados bloqueiam release; falso positivo ou risco temporariamente aceito exige entrada revisada em `.github/security/mobsf-exceptions.json` com `id` do fingerprint, `apk_sha256`, `owner`, `reason`, `review` (referência à decisão) e `expires` ISO, máximo 90 dias. Exceção expirada, de outro APK ou incompleta falha. Não aceitar blanket baseline. Mudança no conteúdo do achado produz outro fingerprint. Achados menores precisam de triagem contextual, mesmo quando o gate passa.

Revisão humana obrigatória: justificar permissões no manifesto final (plugins podem acrescentá-las), componentes exportados/intent filters, debug, backup/data extraction rules e network security config. `app.json` sozinho não representa o manifesto final. Gate verde significa apenas que os checks automatizados aplicáveis passaram; não é certificação de segurança nem análise dinâmica.

Comando local, na raiz:

```sh
python3 .github/security/scan_apk.py --apk /caminho/app.apk --manifest /caminho/build-manifest.json --commit SHA_COMPLETO --exceptions .github/security/mobsf-exceptions.json --output /caminho/saida-privada
```

Scanner indisponível, API com erro, timeout, formato incompleto, package/hash divergente retornam erro. Fixtures sintéticas não contêm APK vulnerável nem dados reais: `python3 -m unittest discover -s .github/security/tests -v` cobre normal, alto conhecido, certificado alto, exceção válida/expirada e relatório ausente/inválido.

## Roteiro dinâmico MASVS/MASTG (SEC-21)

Provisionamento pendente: VM/runner **efêmero**, sem contas pessoais, secrets de produção ou acesso à rede corporativa, label `mobile-security-isolated`; Android SDK/adb e emulador AOSP dedicado. Crie AVD limpo, sem conta Google, com snapshot descartável, serial `emulator-5554`, e confirme `adb -s emulator-5554 shell getprop ro.kernel.qemu` = `1`. Use somente dados sintéticos. Registre imagem/API Android, ferramentas, commit e hash APK. Destrua VM/AVD ao terminar; o job não limpa dados de aparelho pessoal.

O job manual `Segurança Android (verificações dinâmicas parciais)` roda somente na branch padrão e nesse runner. Valida o APK/manifesto, confirma emulador, instala, inicia e verifica flags/permissões instaladas. A saída marca `security_validation_complete: false` e enumera inspeções ainda pendentes; não é um gate completo de release. Sem runner/adb/APK, o roteiro não está executado. Sem agendamento semanal até que o runner isolado esteja provisionado.

Execute e registre as seguintes verificações humanas no mesmo APK:

| Área MASVS | Procedimento reproduzível                                                                                                                                                                                       | Evidência sanitizada e decisão                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STORAGE    | Jogar fase, mudar configurações, reiniciar e inspecionar arquivos internos com ferramentas do emulador de laboratório; comparar diretórios antes/depois. Não enfraquecer build de release para permitir run-as. | Lista de chaves/classes de dados, sem valores pessoais; confirmar somente progresso/settings locais, sem credenciais. Se acesso não for possível, registrar não executado.        |
| Logs       | Limpar logcat no emulador descartável; abrir app, jogar, provocar erro controlado, reiniciar e coletar logcat filtrado pelo processo.                                                                           | Revisar tokens, IDs pessoais, e-mails, caminhos e stacks; publicar apenas contagens e exemplos redigidos. Teste unitário de redaction não prova ausência de vazamento no binário. |
| Backup     | Inspecionar flags e regras do APK; testar exportação/restauração suportada pela versão Android em snapshot isolado. `adb backup` indisponível não equivale a backup seguro.                                     | API Android, ferramenta, resultado e dados elegíveis. ALLOW_BACKUP requer decisão documentada sobre progresso e futuras informações sensíveis.                                    |
| NETWORK    | Capturar tráfego no gateway isolado/proxy controlado enquanto joga, abre configurações e força erro; repetir offline.                                                                                           | Destinos/protocolos e finalidade, sem payload/segredo. Investigar conexões inesperadas; ausência em busca estática não prova ausência de tráfego dos SDKs.                        |
| PLATFORM   | Inspecionar permissões e componentes exportados; negar/revogar permissões e tentar intents explícitas de outro app de teste no laboratório.                                                                     | Cenário, resultado e componentes acessíveis; distinguir launcher legítimo de superfície indevida.                                                                                 |

Maestro cobre fluxos funcionais e não é DAST de segurança. MobSF deste pipeline é estático. DAST HTTP/API fica **condicional** à existência futura de backend e URL de homologação autorizada; não criar servidor para satisfazer scanner.

Fontes consultadas: [MobSF v4.5.2](https://github.com/MobSF/Mobile-Security-Framework-MobSF/tree/v4.5.2), [API estática](https://github.com/MobSF/Mobile-Security-Framework-MobSF/blob/v4.5.2/mobsf/MobSF/views/api/api_static_analysis.py), [schema do relatório](https://github.com/MobSF/Mobile-Security-Framework-MobSF/blob/v4.5.2/mobsf/StaticAnalyzer/views/android/db_interaction.py), [OWASP MASTG — testes](https://mas.owasp.org/MASTG/tests/).
