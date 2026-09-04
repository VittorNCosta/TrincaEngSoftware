#!/usr/bin/env node
/**
 * Dispara um build no EAS e publica o link no resumo do job.
 *
 * Por que um script e nao tres linhas de `run:` no YAML: a parte chata e
 * achar a URL do build na saida do CLI, e isso em shell vira um `grep -oE`
 * ilegivel dentro de uma string YAML — onde nada e testavel e um erro de
 * aspas so aparece no CI.
 *
 * `--no-wait` de proposito. Esperar o build custa 15 a 30 min de runner do
 * GitHub para ficar olhando uma fila que nao e nossa; o link resolve. Quem
 * quiser o resultado acompanha no expo.dev.
 *
 * Nao usa `expo/expo-github-action`: o que ela faz de essencial e exportar o
 * EXPO_TOKEN, que o `env:` ja faz. Uma action a menos e uma dependencia de
 * terceiro a menos com acesso ao token (ver CI-05).
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const PERFIS = new Set(["development", "preview", "production"]);
const perfil = process.argv[2];

if (!PERFIS.has(perfil)) {
  console.error(
    `perfil invalido: ${perfil || "(vazio)"}. Use um de: ${[...PERFIS].join(", ")}.`,
  );
  process.exit(1);
}

if (!process.env.EXPO_TOKEN) {
  console.error(
    "EXPO_TOKEN ausente. O job de checagem deveria ter pulado este passo.",
  );
  process.exit(1);
}

// `^16` acompanha o `cli.version: ">= 16.0.0"` do eas.json sem deixar o major
// solto: subir de major e uma decisao, nao algo que o CI faz sozinho num
// domingo.
const { status, stdout } = spawnSync(
  "npx",
  [
    "--yes",
    "eas-cli@^16",
    "build",
    "--platform",
    "android",
    "--profile",
    perfil,
    "--non-interactive",
    "--no-wait",
  ],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);

process.stdout.write(stdout ?? "");

if (status !== 0) {
  process.exit(status ?? 1);
}

const url = (stdout ?? "").match(
  /https:\/\/expo\.dev\/\S*builds\/[0-9a-f-]+/i,
)?.[0];
const destino = process.env.GITHUB_STEP_SUMMARY;

if (destino) {
  const linhas = [
    `## Build \`${perfil}\` na fila`,
    "",
    url
      ? `[Acompanhar no expo.dev](${url})`
      : "O build foi enfileirado, mas o link nao apareceu na saida do CLI. Veja a lista em expo.dev.",
    "",
    "Enfileirado com `--no-wait`: este job termina aqui, o build segue no EAS.",
  ];
  fs.appendFileSync(destino, `${linhas.join("\n")}\n`);
}

console.log(
  url
    ? `build enfileirado: ${url}`
    : "build enfileirado (link nao encontrado na saida)",
);
