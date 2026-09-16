# RTK — comandos para agentes

Use [RTK](https://github.com/rtk-ai/rtk) para reduzir a saída dos comandos
enviada ao contexto do agente. É uma ferramenta local de desenvolvimento.

Prefira os wrappers suportados pelo RTK. Para comandos sem wrapper, ou quando
precisar da saída completa para diagnosticar um erro, use `rtk proxy <comando>`.
Comandos internos do shell, como `cd` e os cmdlets do PowerShell, continuam
sendo executados diretamente. Se RTK não estiver instalado, use os comandos
originais e informe que a instalação está descrita no `README.md` da raiz.
Não ignore erros nem trate uma saída resumida como prova de sucesso: confira
também o código de saída.

Na raiz do repositório:

```sh
rtk git status
rtk git diff
rtk git log -5
```

Para verificar o aplicativo:

```sh
cd "TrincaMania Redesign/TrincaMania-ODS12"
rtk npm run typecheck
rtk proxy npm test
```

Use `npm test` com o diretório de testes definido no `package.json`, sem
substituí-lo por um glob (compatibilidade com Windows).

Diagnóstico do RTK:

```sh
rtk --version
rtk gain
rtk gain --history
rtk proxy git diff
```

O prefixo é explícito: estes arquivos não instalam um hook automático.
