# QA Android ODS 12 — checkpoint de 10/10/2026

## Ambiente e escopo

- Início: 05:32:59 UTC. Checkpoint inicial: 05:58:28 UTC (25 min 29 s de sessão; inclui investigação do emulador, exploração e correções).
- AVD: `Medium_Phone_API_36.0`, Android 16/API 36, `sdk_gphone64_x86_64`, 1080 × 2400 px, densidade 420 dpi.
- Controle: ADB local (`input tap`, `input swipe`, `keyevent`) e `screencap`/`pull`; coordenadas recalibradas por captura. Áudio e vibração reais não foram medidos.
- APK inicial: `br.com.mhvtech.trincamania` v1.1.0 (versionCode 1), SHA-256 `F48103B8ACEF3BBC18FDB077B0CD362E3DD95F0DDD59FC06026EC9619E6CC373`, anterior às alterações locais.
- O emulador usa `-read-only -no-snapshot-save -no-window -gpu host -feature -Vulkan`; os saves originais do AVD não são gravados. A primeira tentativa com `swiftshader_indirect` falhou no QEMU (`0xc0000005`).
- Repositório: branch `feat/ods12-site-atualizado`, HEAD inicial `93b6a34`. Havia alterações locais anteriores; foram preservadas. Sem push, CI ou publicação.
- Capturas: `D:\ODS12-QA-20261010\evidence\`. APK de QA separado está em preparação em `D:\ODS12-QA-20261010\build\`.

## Achados e correções locais em andamento

1. **Tutorial prático ensina regra errada**: diz “3 peças iguais” na bandeja e após a primeira trinca, embora a regra ativa exija resíduo, lixeira e símbolo do mesmo material. Reproduzido nas capturas 13 e 16. Texto corrigido em `src/screens/game/practicalTutorial.ts`; reteste Android pendente.
2. **Guia inicial repete a mesma frase em quatro páginas** e chama a bandeja de “barra de coleta”. Removido o quadro repetido e corrigido o nome em `src/components/TutorialModal.tsx`; reteste pendente.
3. **Painel da fase mistura inglês e português** (`EASY`) e chama o tabuleiro de “mesa”. Tradução e texto corrigidos em `src/screens/levelSelect/`; reteste pendente.
4. **Diagnóstico usa botões retangulares destoantes**. Estilos e título de compartilhamento ajustados em `src/components/DiagnosticReport.tsx`; reteste pendente.
5. **Modo dev no APK de QA**: habilitação limitada a `EXPO_PUBLIC_E2E=true`, que gera pacote separado `.e2e`, sem tocar no save do app normal. Teste pendente.
6. **Mapa após o primeiro guia** mostrou a fase 1 abaixo da área visível (captura 06); um gesto de rolagem revelou a fase (07). Verificar na versão atualizada antes de alterar a lógica de foco. Após a vitória, o retorno focou a fase 2 corretamente (22).

## Matriz de interações (estado atual)

`PASS` aqui comprova apenas o APK inicial até que haja reteste da versão corrigida. Números de evidência correspondem a PNGs em `D:\ODS12-QA-20261010\evidence\`.

| Tela → estado                  | Elemento                                                      | Ação → esperado                   | Observado                            | Evidência | Situação                          |
| ------------------------------ | ------------------------------------------------------------- | --------------------------------- | ------------------------------------ | --------- | --------------------------------- |
| Abertura → primeiro acesso     | Inicialização                                                 | Abrir app → mapa/guia             | Guia 1/4 abriu após carregamento     | 02        | PASS inicial                      |
| Guia → 1/4                     | Próximo                                                       | Avançar → 2/4                     | 2/4 exibido                          | 03        | PASS inicial                      |
| Guia → 2/4                     | Próximo                                                       | Avançar → 3/4                     | 3/4 exibido                          | 04        | PASS inicial                      |
| Guia → 3/4                     | Próximo                                                       | Avançar → 4/4                     | 4/4 exibido                          | 05        | PASS inicial                      |
| Guia → 4/4                     | Começar                                                       | Fechar → mapa                     | Mapa exibido                         | 06        | PASS inicial                      |
| Guia → reaberto                | Pular                                                         | Fechar → aba anterior             | Retornou aos prêmios                 | 28–29     | PASS inicial                      |
| Mapa → início                  | Foco da fase atual                                            | Fase 1 visível sem gesto          | Fase 1 ficou abaixo do viewport      | 06–07     | FAIL inicial; reteste pendente    |
| Mapa → início                  | Arrastar mapa                                                 | Revelar fase 1                    | Revelou fase 1                       | 07        | PASS inicial                      |
| Mapa → fase 1                  | Nó/Jogar                                                      | Abrir painel                      | Painel aberto                        | 08        | PASS inicial                      |
| Painel → fase 1                | Fechar e reabrir                                              | Voltar ao mapa e reabrir          | Fechou e reabriu                     | 09–10     | PASS inicial                      |
| Painel → fase 1                | Jogar                                                         | Iniciar partida                   | Tutorial prático abriu               | 11        | PASS inicial                      |
| Partida → guia prático         | Começar                                                       | Destacar primeira peça            | Peça correta destacada               | 12        | PASS inicial                      |
| Partida → guia prático         | Peça livre 1                                                  | Enviar à bandeja                  | 1/7; guia da bandeja                 | 13        | PASS inicial                      |
| Partida → guia prático         | Entendi                                                       | Prosseguir ao próximo alvo        | Próxima peça destacada               | 14        | PASS inicial                      |
| Partida → guia prático         | Peças 2 e 3                                                   | Fechar primeiro ciclo             | 0/7; guia de trinca                  | 15–16     | PASS inicial                      |
| Partida → guia prático         | Texto da regra                                                | Explicar resíduo+lixeira+símbolo  | Ensina “3 iguais”                    | 13,16     | FAIL inicial; corrigido em fonte  |
| Partida → guia prático         | Continuar/Jogar                                               | Entrar na partida                 | Partida liberada                     | 17–18     | PASS inicial                      |
| Partida → jogando              | Toque em vazio                                                | Não coletar peça                  | Bandeja e peças inalteradas          | 19        | PASS inicial                      |
| Partida → jogando              | Trinca vermelha                                               | Remover ciclo e liberar bandeja   | 3 peças removidas; 0/7               | 20        | PASS inicial                      |
| Partida → jogando              | Trinca azul                                                   | Concluir fase                     | Vitória e +20 moedas                 | 21        | PASS inicial                      |
| Vitória                        | Mapa                                                          | Voltar e manter progresso         | Fase 2 desbloqueada, 1/10, 20 moedas | 21–22     | PASS inicial                      |
| Mapa                           | Configurações                                                 | Abrir modal                       | Modal abriu                          | 23        | PASS inicial                      |
| Configurações                  | Som                                                           | Alternar → desligado              | Rótulo/estado desligado              | 24        | PASS UI inicial; áudio não medido |
| Configurações                  | Diagnóstico                                                   | Abrir relatório                   | Relatório exibido                    | 25        | PASS inicial                      |
| Configurações → diagnóstico    | Voltar Android                                                | Fechar modal                      | Mapa visível                         | 26        | PASS inicial                      |
| Abas                           | Prêmios                                                       | Abrir                             | Página de prêmios visível            | 27        | PASS inicial                      |
| Prêmios                        | Como jogar                                                    | Reabrir guia                      | Guia 1/4 exibido                     | 28        | PASS inicial                      |
| Configurações                  | Vibração, música, silencioso                                  | Alternar e observar               | Pendente                             | —         | NOT RUN                           |
| Configurações                  | Privacidade                                                   | Abrir link/retornar               | Pendente                             | —         | NOT RUN                           |
| Configurações                  | Copiar, atualizar, compartilhar diagnóstico                   | Operar e conferir                 | Pendente                             | —         | NOT RUN                           |
| Configurações                  | Resetar progresso                                             | Abrir confirmação e cancelar      | Pendente; não confirmar reset        | —         | NOT RUN                           |
| Configurações                  | Modo dev QA                                                   | Ativar/desativar sem alterar save | Build QA pendente                    | —         | BLOCKED temporário                |
| Mapa                           | Setas de mundos, dots, bloqueios                              | Navegar/confirmar travas          | Pendente                             | —         | NOT RUN                           |
| Mapa                           | Vida e moedas +                                               | Abrir ofertas                     | Pendente                             | —         | NOT RUN                           |
| Prêmios                        | Baús, eventos, ranking, bônus de bandeja                      | Abrir/observar estados            | Pendente                             | —         | NOT RUN                           |
| Poderes                        | Abas, itens, compra, bloqueios                                | Navegar/observar                  | Pendente                             | —         | NOT RUN                           |
| Perfil                         | Rotina, estatísticas, capítulos, créditos                     | Navegar/observar                  | Pendente                             | —         | NOT RUN                           |
| Capítulos                      | Lista, seleção, mapa, bloqueios                               | Navegar e testar com QA           | Build QA pendente                    | —         | BLOCKED temporário                |
| Partida                        | Pausa/retomar, reiniciar, voltar, loja, poderes, espaço extra | Executar e conferir               | Pendente                             | —         | NOT RUN                           |
| Partida                        | Erro, bandeja cheia, derrota, retry, próxima fase             | Executar e conferir               | Pendente                             | —         | NOT RUN                           |
| Android                        | Home/reentrada, bloqueio, rotação, persistência               | Executar e conferir               | Pendente                             | —         | NOT RUN                           |
| Acessibilidade                 | Fonte ampliada, leitor de tela, áreas de toque                | Inspeção/teste                    | Pendente                             | —         | NOT RUN                           |
| Rede, áudio, vibração, fluidez | Testes instrumentados                                         | Recursos/medição a verificar      | Pendente                             | —         | NOT RUN                           |

## Próximo bloco

Concluir o build E2E local, instalar no AVD sem desinstalar o app normal, confirmar pacote/versão/hash, repetir o tutorial e o painel de fase; prosseguir pelos menus, capítulos, gameplay e persistência. Atualizar esta matriz a cada bloco com resultado da **build final** separado do APK inicial.
