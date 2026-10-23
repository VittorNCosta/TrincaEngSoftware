# Continuidade no WSL — 13/10/2026

A versão de desenvolvimento mais recente está em `feat/ods12-site-atualizado`.
Ela reúne o simulador web, tutorial adaptado à reciclagem, fases apoiadas na trilha,
ícones do original e navegação inferior. `develop` continua sendo a base de integração.
Não houve novo APK nesta rodada; o APK distribuído pelo site é o aprovado anteriormente.

Clone ao lado dos outros projetos para manter os caminhos padrão:

```bash
mkdir -p ~/igrion
cd ~/igrion
git clone --branch feat/ods12-site-atualizado https://github.com/VittorNCosta/TrincaEngSoftware.git TrincaEngSoftware-ods12-port
git clone https://github.com/mateusHegeto10/TrincaMania.git TrincaMania
git clone https://github.com/VittorNCosta/igrion-ODS-site.git igrion-ODS-site
git clone https://github.com/VittorNCosta/igrion-site.git igrion-site
git clone https://github.com/VittorNCosta/igrion-hosted-site.git igrion-hosted-site
```

Os repositórios privados exigem autenticação no GitHub. Use o sistema de arquivos
Linux (`~/igrion`) para trabalhar com Node e tmux. Instale dependências pelo lockfile
com `npm ci` no aplicativo e em cada site em que for trabalhar; `node_modules` é local.

Para aplicativo ODS e site ODS, use Node 22.23.x. O site Astro original tem `.nvmrc`
próprio; respeite a versão de cada projeto. A raiz do site publicado também utiliza
Python 3 nos scripts de preparação de conteúdo.

O site ODS funciona a partir de sua exportação versionada, sem compilar o aplicativo:

```bash
cd ~/igrion/igrion-ODS-site
npm ci
npm run build
npm run feira
```

Abra a URL informada pelo servidor. Em outro painel do tmux, rode o aplicativo:

```bash
cd "$HOME/igrion/TrincaEngSoftware-ods12-port/TrincaMania Redesign/TrincaMania-ODS12"
npm ci
npm run web
```

`npm run build:latest` no site ODS reexporta os dois simuladores a partir das branches
registradas em `src/data/simulators.json`. Ele precisa das dependências dos dois jogos;
a primeira preparação do cache do original usa `npm ci`.

Testes e builds continuam locais. GitHub Actions permanece bloqueado pela instrução
do projeto; os commits de sincronização utilizam `[skip ci]`. Não iniciar workflows,
releases nem builds Android por conta própria.
