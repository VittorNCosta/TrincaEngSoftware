const { spawnSync, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const crypto = require("node:crypto");
const PERFIS = new Set(["development", "preview"]);
function validarBuild(build, sha) {
  if (!build?.id) throw new Error("EAS não retornou ID de build");
  if (build.gitCommitHash !== sha)
    throw new Error("Commit do build diverge do commit solicitado");
  if (["ERRORED", "CANCELED"].includes(build.status))
    throw new Error(`Build ${build.id}: ${build.status}`);
  if (build.status === "FINISHED" && !build.artifacts?.buildUrl)
    throw new Error("Build concluído sem artefato");
  return build.status === "FINISHED";
}
function eas(args) {
  const result = spawnSync(
    "npx",
    ["--yes", "eas-cli@16.32.0", ...args, "--json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], timeout: 180000 },
  );
  if (result.status !== 0 || result.error)
    throw new Error(
      `EAS CLI falhou (${result.status ?? result.error?.message})`,
    );
  return JSON.parse(result.stdout);
}
async function main() {
  const perfil = process.argv[2];
  if (!PERFIS.has(perfil)) throw new Error("Perfil inválido");
  if (!process.env.EXPO_TOKEN)
    throw new Error("EXPO_TOKEN ausente: build não executado");
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (process.env.BUILD_SHA && process.env.BUILD_SHA !== sha)
    throw new Error("Checkout diverge do SHA solicitado");
  const manifestPath = "build-manifest.json";
  // Reexecucao do mesmo commit reutiliza o build EAS em vez de consumir outra cota.
  const matches = eas([
    "build:list",
    "--platform",
    "android",
    "--build-profile",
    perfil,
    "--git-commit-hash",
    sha,
    "--limit",
    "50",
    "--non-interactive",
  ]);
  const previous = matches.find((item) => item.gitCommitHash === sha);
  let build = previous
    ? eas(["build:view", previous.id])
    : eas([
        "build",
        "--platform",
        "android",
        "--profile",
        perfil,
        "--non-interactive",
        "--no-wait",
      ])[0];
  if (!build?.id) throw new Error("EAS não retornou ID");
  const manifest = {
    version: require(`${process.cwd()}/package.json`).version,
    commit: sha,
    profile: perfil,
    id: build.id,
    url: `https://expo.dev/accounts/${build.project?.ownerAccount?.name || "unknown"}/projects/${build.project?.slug || "unknown"}/builds/${build.id}`,
    status: build.status,
  };
  const save = () => {
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  };
  save();
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `Build EAS: ${build.id}\nCommit: ${sha}\n[Resultado](${manifest.url})\n`,
    );
  const deadline = Date.now() + 55 * 60 * 1000;
  while (!validarBuild(build, sha)) {
    if (Date.now() >= deadline)
      throw new Error(`Timeout aguardando EAS ${build.id}`);
    await new Promise((resolve) => setTimeout(resolve, 20000));
    build = eas(["build:view", build.id]);
  }
  const artifact = "app.apk";
  execFileSync(
    "curl",
    [
      "--fail",
      "--location",
      "--max-time",
      "300",
      "--output",
      artifact,
      build.artifacts.buildUrl,
    ],
    { stdio: "inherit" },
  );
  manifest.status = build.status;
  manifest.artifact = artifact;
  manifest.sha256 = crypto
    .createHash("sha256")
    .update(fs.readFileSync(artifact))
    .digest("hex");
  save();
  console.log(`Build ${build.id} concluído: ${manifest.sha256}`);
}
module.exports = { validarBuild };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
