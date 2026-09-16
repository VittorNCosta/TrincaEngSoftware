# TrincaEngSoftware

O aplicativo React Native/Expo está em
[`TrincaMania Redesign/TrincaMania-ODS12`](TrincaMania%20Redesign/TrincaMania-ODS12/README.md).

## RTK no desenvolvimento

O [RTK](https://github.com/rtk-ai/rtk) resume a saída de comandos para reduzir
o contexto consumido por agentes de IA. Sua instalação é opcional para rodar
o aplicativo e não altera suas dependências npm.

Instale o executável na máquina de cada desenvolvedor:

```powershell
# Windows
winget install --id rtk-ai.rtk --exact
```

```sh
# macOS / Homebrew
brew install rtk

# Alternativa com Rust/Cargo, incluindo Linux
cargo install --git https://github.com/rtk-ai/rtk
```

Confira a instalação em um terminal com `rtk` no PATH:

```sh
rtk --version
rtk gain
rtk git status
```

Integração validada com RTK `0.45.0`. O projeto já inclui `AGENTS.md`,
`CLAUDE.md` e [`RTK.md`](RTK.md) na raiz; não é necessário executar `rtk init`
novamente. Os agentes devem ler essas instruções e usar o prefixo `rtk`
explicitamente. Para sessões iniciadas no diretório do aplicativo, mantenha
também as instruções da raiz no contexto.

Consulte [`RTK.md`](RTK.md) para exemplos de verificação do projeto e acesso
à saída completa. `rtk gain` mostra as estimativas locais de economia de saída,
não uma medição da redução da fatura do provedor de IA.
