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
| manual/05 | Derrota real desconta uma vida, reinício preserva 4/5 e recarga real devolve 5/5 após 30 minutos                                           |

O fluxo 05 é manual, fora da suíte normal para não gastar 30 minutos em cada PR:

```sh
maestro test .maestro/manual/05-perder-vida-recarregar.yaml
```

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

Os caminhos do solver e o TypeScript são verificáveis localmente. Esta sessão
não tinha Android/adb/Maestro: **os novos YAMLs ainda precisam executar num
emulador**. Não tratar screenshots previstos como evidência já produzida.
O CI deve publicar JUnit e, nas falhas, screenshots/hierarquia/logs.

Q-17 (#236) tem persistência de desbloqueio, moedas, inventário e vidas coberta
pelos roteiros acima. Ainda faltam execução sobre APK antigo com save legado,
upgrade in-place e interrupção controlada da gravação. Esse ensaio precisa de
um APK antigo assinado com a mesma chave e package `.e2e`; reinstalar com
`clearState` não prova migração e foi deliberadamente evitado como substituto.

Q-18 (#237): screenshots de vitória, progresso reaberto e loja já estão nos
fluxos, mas **não são baseline de regressão visual**. Gerar baseline real após
execução em emulador fixo (Pixel 2, API 35, 1080×1920, escala de fonte 1.0),
revisar imagens e somente então versionar baseline. Repetir cinco vezes antes
de definir tolerância, mascarando apenas relógios/partículas justificadas.
Uma mudança proposital de cor/posição deve produzir diff e falhar o job antes
de habilitar o bloqueio. Não aprovar baseline automaticamente por CI verde.

## Roteiro TalkBack e fontes ampliadas

1. Ativar TalkBack no emulador isolado; percorrer mapa, partida, resultado e loja
   com gestos de próximo/anterior. Confirmar foco único, nome e estado de cada
   fase/peça/botão; modal deve manter foco e devolver ao acionador ao fechar.
2. Concluir uma trinca e uma compra; conferir anúncio de resultado, saldo e
   estoque sem repetir informações a cada frame de animação.
3. Repetir com fonte 1.3 e 2.0; nenhum objetivo/preço/ação pode ser cortado ou
   ficar inacessível. Verificar alvos de pelo menos 48dp e rolagem com TalkBack.
4. Registrar aparelho, versão, escala, percurso, resultado e captura sanitizada.
   Esses passos não foram executados nesta sessão; mantêm-se os testes de
   acessibilidade existentes além das futuras comparações de imagem.
