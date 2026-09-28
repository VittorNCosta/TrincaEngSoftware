# E2E Android

Os fluxos completos usam o aplicativo **isolado** `br.com.mhvtech.trincamania.e2e`.
`EXPO_PUBLIC_E2E=true` fixa somente a semente do tabuleiro (`123456789`);
vitória, compras, perda de vida, recompensa e persistência seguem o código real.
`app.config.js` recusa essa flag em production/preview. Nunca instale uma fixture
sobre o aplicativo de um jogador.

```sh
EXPO_PUBLIC_E2E=true npx expo prebuild --platform android
(cd android && EXPO_PUBLIC_E2E=true ./gradlew assembleRelease)
adb install -r android/app/build/outputs/apk/release/app-release.apk
node scripts/gerar-fluxos-e2e.cjs --check
maestro test -e APP_ID=br.com.mhvtech.trincamania.e2e .maestro
```

| Fluxo     | Verificação                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 01        | Instalação limpa, tutorial e entrada na fase                                                                                               |
| 02        | Preferência de som sobrevive a encerramento do processo                                                                                    |
| 03        | Vitória por toques reais; fase seguinte desbloqueada após reabrir                                                                          |
| 04        | Cinco vitórias geram pelo menos 50 moedas; compra de Voltar desconta exatamente 45 e acrescenta 1 ao estoque; ambos sobrevivem ao reinício |
| 05        | Navegação por recompensas, configurações, poderes e perfil com labels obrigatórios e capturas                                              |
| manual/05 | Derrota real desconta uma vida, reinício preserva 4/5 e recarga real devolve 5/5 após 30 minutos                                           |

O fluxo `manual/05` é separado da suíte normal para não gastar 30 minutos em cada PR:

```sh
maestro test .maestro/manual/05-perder-vida-recarregar.yaml
# Ou no GitHub Actions, na branch que contém esta versão do workflow:
gh workflow run e2e.yml --ref test/q18-visual-regression -f suite=lives
```

O input `suite=full` executa as cinco jornadas comuns. `suite=lives` executa
apenas perda, reinício e recarga real. `suite=baseline` executa as cinco jornadas
cinco vezes no mesmo APK e publica as capturas para revisão e calibração.
`suite=accessibility` repete vitória, compra e navegação com fontes 1.3 e 2.0,
reabrindo o app com cada escala. As asserções verificam que textos e ações
continuam disponíveis; as capturas ficam separadas por escala e jornada para
revisão de cortes e sobreposições. Essas capturas não são comparadas à baseline
de fonte 1.0.
Os grupos de concorrência são separados. PRs percorrem as cinco jornadas e
comparam todas as nove telas, incluindo resultado, loja e abas.

Os subfluxos de vitória/derrota são gerados com o solver existente, que verifica
cada jogada pela regra de domínio. O gerador também exige que as três primeiras
jogadas sigam os alvos do tutorial real. Não há botão secreto para ganhar nem
escrita de saldo artificial. Mudanças intencionais na geração pedem regenerar
`node scripts/gerar-fluxos-e2e.cjs` e revisar os YAMLs; `--check` detecta drift.
O smoke 01/02 pode rodar no pacote normal passando `-e APP_ID=br.com.mhvtech.trincamania`.
Os fluxos completos exigem o pacote de teste.

Usamos `copyTextFrom` e `maestro.copiedText` para comparar os valores reais da
loja, conforme a [referência Maestro](https://docs.maestro.dev/reference/commands-available/copytextfrom).
A descoberta de subfluxos fica restrita em `config.yaml`, conforme a
[configuração de workspace](https://docs.maestro.dev/maestro-flows/workspace-management/project-configuration).

## Evidência e limites atuais

Os caminhos do solver e o TypeScript são verificáveis localmente; a execução
Android acontece no GitHub Actions. Conferir o JUnit da execução correspondente
ao SHA do PR #302 para cada jornada. O workflow publica capturas explícitas
em sucesso/falha e diagnóstico completo quando falha. Capturas são evidências
de execução, não aprovação automática de arte ou baseline visual.

Q-17 (#236) tem persistência de desbloqueio, moedas, inventário e vidas coberta
pelos roteiros acima. Ainda faltam execução sobre APK antigo com save legado,
upgrade in-place e interrupção controlada da gravação. Esse ensaio precisa de
um APK antigo assinado com a mesma chave e package `.e2e`; reinstalar com
`clearState` não prova migração e foi deliberadamente evitado como substituto.

Q-18 (#237) usa emulador API 34 com viewport 320×640, densidade 160 dpi e escala
de fonte 1.0. O APK E2E fixa a semente do tabuleiro e pausa apenas animações
cosméticas nas capturas (pulso de peça/nó, oscilação de marcador e confete).
A comparação ignora os 24 pixels superiores do relógio do sistema e apenas os
dígitos variáveis do cronômetro na vitória e do saldo na loja. O diff mostra
as máscaras em azul. O restante da tela continua sujeito a comparação exata.

Para criar ou revisar uma baseline, rode `suite=baseline` na branch com o código
que será testado, revise as cinco capturas de cada tela e calibre a tolerância
pela maior variação legítima. Copie apenas capturas aprovadas para
`tests/visual/android-api34-320x640-font1/` e ajuste `config.json` no mesmo PR.
O job comum nunca atualiza a baseline. Se uma mudança for intencional, anexe
captura e diff na revisão antes de substituir a imagem versionada. Uma mudança
proposital de cor/posição precisa falhar no comparador.

O gate `npm run test:visual -- smoke|full|calibration capturas baseline diffs`
exige o número previsto de capturas de cada jornada e gera
`diff.png`/`report.json` por tela. A baseline Android está versionada; rodar
`suite=baseline` prova a repetibilidade das cinco capturas independentes.
Os artefatos do workflow preservam capturas e diffs em sucesso e falha. A suíte
visual do CI cobre o viewport fixo acima; para reproduzir no Galaxy S25 Ultra,
instale o APK E2E e execute os mesmos fluxos Maestro com o telefone conectado.

## Comparador visual local

Após obter e revisar uma baseline Android real, execute na pasta do aplicativo:

```sh
node scripts/comparar-visual.js baseline/mapa.png artifacts/mapa.png artifacts/diff-mapa 0 0
```

Os dois últimos argumentos são obrigatórios: diferença máxima por canal RGBA
(inteiro 0–254) e fração máxima de pixels alterados (0 inclusive até 1 exclusive).
`0 0` exige identidade; por exemplo, `3 0.001` tolera diferenças de até 3 unidades
por canal e até 0,1% de pixels acima desse limite. Esse exemplo não é um piso
aprovado para Android: calibrar após as cinco repetições e revisão descritas acima.
A comparação é por bytes RGBA, sem correção gamma, redimensionamento ou
supressão automática de antialiasing. Use o mesmo aparelho/configuração de captura.

A saída contém `diff.png` (mudanças em vermelho, contexto cinza) e `report.json`
com dimensões, tolerância, contagem e SHA256 das duas imagens. Use diretório novo
por execução e anexe ambos os arquivos ao diagnóstico/artefato do job. Código de
saída 0 indica aprovação, 1 regressão e 2 erro de entrada/configuração; baseline
ausente, PNG inválido e dimensões distintas nunca aprovam. O comando não cria nem
atualiza baseline. Uma mudança em baseline deve ser revisada em PR.

`.github/scripts/tests/visual.test.cjs` usa imagens sintéticas temporárias para
provar detecção de mudança, limite de tolerância, emissão de diff e falhas de
entrada. Entra em `npm run test:ci`; não constitui baseline ou aceite do Android.
O codec `pngjs` é dependência apenas de desenvolvimento, sem import no aplicativo.

## Roteiro TalkBack e fontes ampliadas

1. Ativar TalkBack no emulador isolado; percorrer mapa, partida, resultado e loja
   com gestos de próximo/anterior. Confirmar foco único, nome e estado de cada
   fase/peça/botão; modal deve manter foco e devolver ao acionador ao fechar.
2. Concluir uma trinca e uma compra; conferir anúncio de resultado, saldo e
   estoque sem repetir informações a cada frame de animação.
3. Repetir com fonte 1.3 e 2.0; nenhum objetivo/preço/ação pode ser cortado ou
   ficar inacessível. Executar também `suite=accessibility` para conferir as
   jornadas sem leitor de tela. Verificar alvos de pelo menos 48dp e rolagem
   com TalkBack.
4. Registrar aparelho, versão, escala, percurso, resultado e captura sanitizada.
   Esses passos não foram executados nesta sessão; mantêm-se os testes de
   acessibilidade existentes além das futuras comparações de imagem.
