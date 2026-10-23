# Site ODS 12 e jogo no PC — entrega local de 07/10/2026

A sessão interrompida pelo reinício do notebook foi retomada. O projeto irmão
`/home/vittor/personal-project/igrion-ODS-site` contém o site Astro e o mesmo
TrincaMania em Expo Web. A entrega local foi preservada; hospedagem HTTPS, QR
público, integração e aceite na feira continuam pendentes (CI-40).

## Usar agora

No diretório `igrion-ODS-site`, execute `npm run dev:pc` e abra
<http://localhost:4321/jogar/?modo=teste>. O script inicia Astro na porta 4321 e
Metro/Expo Web na 8081; alterações recarregam o site e o aplicativo. Use Node
22.23.2 ou outra versão que atenda simultaneamente `>=22.19.0 <23`. Encerre os
processos com Ctrl+C. O README do projeto contém a preparação com `npm ci`.

Para usar a exportação pronta, execute `npm run feira` e abra
<http://localhost:4322/jogar/?modo=feira>. Para atualizar essa exportação após
alterações no jogo, execute `npm run build:feira` antes. O build é exclusivamente
local: exporta Expo Web, copia o APK já existente, verifica o site e gera `dist/`.

O repositório do site agora inclui a exportação do jogo, o APK aprovado e seus
metadados. Para publicar essa versão, clone somente `igrion-ODS-site`, execute
`npm ci` e `npm run build`, e publique toda a pasta `dist/` na raiz da hospedagem.
Esse comando não precisa da pasta do aplicativo nem do APK de origem; verifica
o SHA-256 do APK versionado antes do build. `build:feira` permanece como o
comando de atualização da exportação a partir do aplicativo.

O pacote portátil está em:

- Linux/WSL: `/home/vittor/personal-project/apks/igrion-ODS-feira-20261007/igrion-ODS-feira-20261007.zip`.
- Windows: `C:\Users\Vittor Costa\Downloads\igrion-ODS-feira-20261007.zip`.
- Pasta já extraída: `C:\Users\Vittor Costa\Downloads\igrion-ODS-feira`.

Extraia **toda a pasta**, mantenha Node instalado e execute `iniciar-feira.cmd`
no Windows ou `sh iniciar-feira.sh` no Linux. Não abra o HTML por `file://`.
Não é preciso instalar npm/dependências no computador da feira. O servidor do
pacote usa apenas APIs do Node e todos os assets são locais. O runtime portátil
já tinha sido exercitado no Windows com Node 24.15.0 na sessão anterior; o
ambiente de desenvolvimento do aplicativo permanece em Node 22.

## Conteúdo e isolamento

O projeto preserva a identidade visual do `igrion-site` (referência `8f53dd3`)
e usa as ilustrações ODS 12 existentes: página inicial, demonstração do ciclo,
página `/baixar/` e página `/jogar/`. O original permanece preservado.

O modo **Feira** usa storage em memória. **Novo visitante** pede confirmação e
substitui o iframe, reiniciando progresso, vidas, itens, preferências, tutorial
e caches. Cancelar mantém a sessão atual. O modo **Testes no PC** persiste no
navegador sob `@trinca-web-test/`; visitas à feira não alteram essas chaves.
Nenhum desses modos acessa o save Android. O override de desenvolvimento
continua em memória; a exportação da feira é produção, sem perfil E2E.

No aplicativo, foram acrescentados adapters específicos de web para storage,
alertas e erros globais, além das dependências compatíveis com Expo Web. Os
arquivos nativos continuam encaminhando para AsyncStorage/Alert originais.
As filas de progresso, `mutateLives`, o storage separado dos capítulos e as 103
fases canônicas foram preservados. Não houve edição de `src/data/levels.ts`.

## APK e integridade

O download usa o APK **já validado**, versão 1.1.0, fonte `7461c48`. Ele não
contém as adaptações web desta entrega e não foi reconstruído ou instalado
nesta retomada. O relatório Android original fica em
`/home/vittor/personal-project/apks/TrincaMania-v1.1.0-7461c48-20261007/ENTREGA-APK-20261007.txt`.

| Artefato                             | Tamanho em bytes | SHA-256                                                            |
| ------------------------------------ | ---------------: | ------------------------------------------------------------------ |
| APK `TrincaMania-v1.1.0-7461c48.apk` |       89.145.787 | `f48103b8acef3bbc18fdb077b0cd362e3dd95f0ddd59fc06026ec9619e6cc373` |
| ZIP `igrion-ODS-feira-20261007.zip`  |       66.820.909 | `07a99625413caf5a00dc924f97d86ad4b591b07d7d95df9efbd3046bd981d6a8` |

Após o reinício, a checagem de integridade do ZIP passou. Depois do ajuste
para build independente, o pacote foi atualizado, comparado arquivo a arquivo
com o novo `dist/` e copiado novamente para Downloads do Windows. O download local tem MIME Android, tamanho
correto e SHA-256 conferido pelo teste do navegador. Os metadados públicos
ficam em `dist/entrega.json`.

## Verificações e evidências

Os resultados anteriores abaixo foram recuperados do registro da sessão, e
continuam aplicáveis ao código do aplicativo, que não recebeu novas alterações
nesta retomada. O registro recuperado e as novas evidências ficam em
`/home/vittor/personal-project/apks/igrion-ODS-feira-20261007/evidencias/`.

| Comando/verificação                              | Resultado local                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck` (aplicativo)                 | Passou                                                                                                                     |
| `npm test` (aplicativo)                          | 255/255; inclui os três testes novos de isolamento web                                                                     |
| `npm run test:ui -- --runInBand` (aplicativo)    | 56/56, 15 suítes                                                                                                           |
| `npm run test:playthrough` (aplicativo)          | 2/2; campanha de 103 fases e 1.000 mapas de capítulos                                                                      |
| `npm run lint` (aplicativo)                      | Zero erros; três avisos em `GameScreen.tsx` (linhas 841, 874 e 2197)                                                       |
| `npm run guarda:ods12` e `npm run valida:assets` | Passaram                                                                                                                   |
| `npm run build:feira` (site)                     | Expo Web e Astro passaram; pacote já preservado                                                                            |
| `npm run test:config` (site)                     | 2/2: configuração de origem e decodificação do QR                                                                          |
| `npm run test:e2e` (site)                        | 10/10 na retomada: desktop e perfil mobile Chromium; site, acessibilidade das páginas, download, jogo offline e isolamento |

Na retomada, a jornada de jogo foi ampliada para vitória pelas três trincas,
desbloqueio da fase seguinte, derrota por bandeja cheia, perda de uma vida e
retry. Todos os movimentos usam a interface real. O teste bloqueia conexões
externas e verifica ausência de erros de página. Também observa reprodução
bem-sucedida de áudio pelo navegador após interação, sem simular o áudio.
Isso não substitui a avaliação humana do som ou da interface no PC da feira.

A rodada final passou em 1,1 minuto, com código de saída zero. O log está em
`evidencias/e2e-final.log`; as capturas de início, instalação, vitória, derrota
e nova tentativa estão em `evidencias/capturas/`. A verificação anterior que
parou no botão Mapa mobile foi resolvida com rolagem do iframe no teste; a
interface do aplicativo não precisou ser alterada. A abertura do desenvolvimento
Astro/Metro foi conferida novamente (splash, tutorial e mapa), com evidência em
`evidencias/dev-pc-retomada.txt` e `evidencias/desenvolvimento-pc.png`.

Neste WSL, as bibliotecas do Chromium foram extraídas localmente, sem instalar
pacotes do sistema. O comando da rodada final no diretório do site foi:

```sh
LD_LIBRARY_PATH=/home/vittor/.cache/trinca-playwright-libs/extracted/usr/lib/x86_64-linux-gnu npm run test:e2e
```

A primeira checagem de formatação havia falhado apenas no Markdown do roadmap.
O registro CI-40 foi adicionado à tabela dos dois espelhos e o script de issues
foi regenerado localmente. O script gerado **não foi executado**. Formatação e
consistência do roadmap foram verificadas novamente após esses ajustes.

## Pendências e limites

- Definir a origem HTTPS pública em `SITE_URL`, gerar novamente o pacote e
  publicar somente quando houver autorização. Sem domínio, o site informa a
  pendência do QR e não inventa um destino. A geração local já foi testada por
  decodificação; o QR definitivo deve apontar para `/baixar/`.
- Confirmar que a hospedagem aceita o APK de aproximadamente 85 MiB e publicar
  o conteúdo completo de `dist/` na raiz. Validar o download e escanear o QR
  final com outro aparelho.
- Aceitar visualmente a experiência, tela cheia, mouse/toque e som no PC real
  da feira, com a rede desligada. O perfil mobile automatizado usa Chromium;
  Safari/iPhone físico não foi validado.
- VIS-02, piloto de arte A-04 e aceites Android anteriores continuam pendentes.
  Esta entrega não avança VIS-03/VIS-04 nem comprova aprovação visual Android.
- Até a entrega local inicial não houve commit ou push. O envio ao Git foi
  autorizado depois, na mesma sessão, conforme o registro abaixo. Hospedagem,
  PR, escrita em issues, GitHub Actions, novo APK e instalação não fazem parte
  dessa autorização. CI-40 permanece aberta até integração e aceites.

## Autorização de envio ao Git (07/10/2026)

O usuário pediu “consegue subir tudo isso no git?” e informou que testou o site
e que “parece ok”. Isso autoriza os commits e os envios desta entrega. O bloqueio
permanente de GitHub Actions foi preservado: a branch de trabalho do aplicativo
não corresponde aos gatilhos de push dos workflows e o novo site não contém
workflows. Nenhum PR foi aberto, pois isso acionaria as verificações remotas.

Destinos preparados:

- Aplicativo: `VittorNCosta/TrincaEngSoftware`, branch
  `feat/site-ods12-simulador-pc`, sem integração em `develop` ou `main`.
- Site independente: `VittorNCosta/igrion-ODS-site`, privado como `igrion-site`,
  branch inicial `main`. Exportação Expo Web e APK incluídos como arquivos
  normais do Git; `dist/`, dependências, resultados de testes e `.env` excluídos.

Configuração para hospedagem estática: Node 22.23.2, build `npm run build`,
saída `dist`. Definir `SITE_URL` com a origem HTTPS definitiva gera o QR para
`/baixar/` e o sitemap. O jogo é executado pelo navegador em `/jogar/`; Metro
fica restrito ao desenvolvimento local. Hospedagem precisa aceitar o APK de
aproximadamente 85 MiB. O aceite informado pelo usuário diz respeito ao site
no PC e não resolve VIS-02 ou os aceites de arte Android.

Verificação do build independente: passou tanto com caminhos de origem
inexistentes quanto em uma cópia limpa contendo apenas os arquivos staged,
com `npm ci` e `npm run build`, sem projeto irmão ou APK de origem. Astro
reportou zero erros, avisos e hints. O cenário de APK divergente também foi
exercitado nessa cópia: o build foi interrompido com saída 1 antes de gerar o
site, e o arquivo de metadados foi restaurado. Logs em
`evidencias/build-site-independente.log`, `evidencias/clone-site-independente.log`
e `evidencias/build-clone-site.log`.

Após esse ajuste, os 10 testes de navegador passaram novamente em 1,6 minuto,
incluindo desktop e mobile; código de saída zero. Log:
`evidencias/e2e-site-git.log`. A formatação e a consistência do roadmap passaram;
as evidências de domínio/UI/playthrough anteriores foram reutilizadas porque
o código do aplicativo permaneceu idêntico ao já verificado.
