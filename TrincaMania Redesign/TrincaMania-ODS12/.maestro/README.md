# Fluxos E2E (Maestro)

A terceira camada de teste do projeto: o app **instalado**, num Android de
verdade, tocado por fora.

| Camada                    | Onde                                  | O que só ela pega                                         |
| ------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Regra, sem tela           | `tests/*.test.cjs`                    | tabuleiro invencível, economia furada, trava de progresso |
| Fiação entre regra e tela | `src/components/__tests__/*.test.tsx` | tabuleiro válido que a tela não deixa jogar               |
| App instalado             | `.maestro/*.yaml`                     | app que não abre, navegação quebrada, save que não volta  |

## Rodar localmente

Precisa de um emulador ou aparelho conectado (`adb devices`) e do APK
instalado.

```sh
npx expo prebuild --platform android
(cd android && ./gradlew assembleRelease)
adb install -r android/app/build/outputs/apk/release/app-release.apk

curl -Ls "https://get.maestro.mobile.dev" | bash   # ou baixe o release
maestro test .maestro
```

No CI é o workflow `E2E Android`, sob demanda (`workflow_dispatch`) e uma vez
por semana — não em todo push, porque montar o APK e subir o emulador custa
dezenas de minutos de runner.

## O que estes fluxos não fazem

**Não jogam uma fase até vencer.** O tabuleiro é sorteado a cada tentativa, e
um roteiro YAML não tem como descobrir qual peça tocar — descobrir isso é busca,
e busca já existe: `tests/lib/solver.cjs` resolve as 103 fases e os 1000 mapas,
e `src/components/__tests__/playLevelThroughUi.test.tsx` vence uma fase inteira
tocando peça por peça na interface renderizada.

A divisão é essa, e é de propósito: **ganhar a partida** se prova onde a busca
funciona; **o app existir, abrir, navegar e lembrar** se prova onde o app está
instalado.

## Seletores

Os fluxos usam `testID` onde o texto não identifica (`map-level-w1-001`,
`jogar-fase`, `game-board`, `splash-skip`) e texto visível onde ele já é único
e legível (`Som: Ligado`). Rótulo de acessibilidade também serve de seletor no
Android — `Abrir configurações` é o `accessibilityLabel` da engrenagem do mapa
—, o que faz um fluxo quebrar quando alguém remove um rótulo, e isso é bom.
