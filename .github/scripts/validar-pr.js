const { execFileSync } = require("node:child_process");

const WORKFLOWS = [
  ".github/workflows/ci.yml",
  ".github/workflows/seguranca.yml",
];
function avaliar(pr, runs, sha, required = WORKFLOWS) {
  // Aceita REST (workflow) e GraphQL/gh (API histórica dos testes locais).
  const head = pr.head?.sha ?? pr.headRefOid;
  if (head !== sha)
    return {
      estado: "falha",
      motivo: "HEAD local diverge do SHA publicado no PR",
    };
  if (pr.state && pr.state !== "open" && pr.state !== "OPEN")
    return { estado: "falha", motivo: "PR não está aberto" };
  if (
    pr.mergeable === false ||
    pr.mergeable === "CONFLICTING" ||
    pr.mergeable_state === "dirty"
  )
    return { estado: "falha", motivo: "PR tem conflitos" };
  const names = {
    CI: WORKFLOWS[0],
    Seguranca: WORKFLOWS[1],
    "E2E Android": ".github/workflows/e2e.yml",
    Build: ".github/workflows/build.yml",
  };
  const normalized = runs.map((r) => ({
    ...r,
    head_sha: r.head_sha ?? r.headSha,
    id: r.id ?? r.databaseId,
    path: r.path ?? names[r.workflowName] ?? r.workflowName,
  }));
  const latest = new Map();
  for (const run of normalized.filter(
    (r) =>
      r.head_sha === sha &&
      (r.event === "pull_request" ||
        (r.event === "push" && WORKFLOWS.includes(r.path))),
  )) {
    const key = `${run.path}:${run.event}`;
    const previous = latest.get(key);
    if (
      !previous ||
      run.id > previous.id ||
      (run.id === previous.id &&
        (run.run_attempt || 1) > (previous.run_attempt || 1))
    )
      latest.set(key, run);
  }
  let pending =
    pr.mergeable == null ||
    pr.mergeable === "UNKNOWN" ||
    pr.mergeable_state === "unknown";
  for (const run of latest.values()) {
    if (run.status !== "completed") pending = true;
    else if (
      run.conclusion !== "success" &&
      !(
        !required.includes(run.path) &&
        ["skipped", "neutral"].includes(run.conclusion)
      )
    )
      return { estado: "falha", motivo: `${run.path}: ${run.conclusion}` };
  }
  for (const path of required)
    if (!latest.has(`${path}:pull_request`)) pending = true;
  if (Object.hasOwn(pr, "statusCheckRollup")) {
    const checks = pr.statusCheckRollup || [];
    if (!checks.length) pending = true;
    for (const check of checks) {
      if (check.__typename === "StatusContext") {
        if (["ERROR", "FAILURE"].includes(check.state))
          return {
            estado: "falha",
            motivo: `${check.context}: ${check.state}`,
          };
        if (check.state !== "SUCCESS") pending = true;
      } else if (check.status !== "COMPLETED") pending = true;
      else if (!["SUCCESS", "SKIPPED", "NEUTRAL"].includes(check.conclusion))
        return {
          estado: "falha",
          motivo: `${check.name}: ${check.conclusion}`,
        };
    }
  }
  return pending
    ? {
        estado: "pendente",
        motivo:
          "Workflows, checks ou cálculo de conflitos ausentes/em andamento no SHA atual",
      }
    : {
        estado: "sucesso",
        motivo: `Workflows e checks aprovados em ${sha}, sem conflitos`,
      };
}
const gh = (...args) =>
  JSON.parse(
    execFileSync("gh", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }),
  );
async function main(args = process.argv.slice(2)) {
  const numero = args[0];
  if (
    !/^\d+$/.test(numero || "") ||
    args.slice(1).some((arg) => arg !== "--watch")
  )
    throw new Error("Uso: npm run pr:validar -- <numero> [--watch]");
  const repo = gh("repo", "view", "--json", "nameWithOwner").nameWithOwner;
  const base = `repos/${repo}`;
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const filePages = gh(
    "api",
    "--paginate",
    "--slurp",
    `${base}/pulls/${numero}/files?per_page=100`,
  );
  const files = filePages.flat().map((file) => file.filename);
  const required = [...WORKFLOWS];
  if (
    files.some(
      (file) =>
        file === ".github/workflows/e2e.yml" ||
        (file.startsWith("TrincaMania Redesign/TrincaMania-ODS12/") &&
          !file.endsWith(".md") &&
          !file.includes("/docs/")),
    )
  )
    required.push(".github/workflows/e2e.yml");
  const limite = Date.now() + 60 * 60 * 1000;
  while (true) {
    const pr = gh("api", `${base}/pulls/${numero}`);
    pr.statusCheckRollup = gh(
      "pr",
      "view",
      numero,
      "--repo",
      repo,
      "--json",
      "statusCheckRollup",
    ).statusCheckRollup;
    const pages = gh(
      "api",
      "--paginate",
      "--slurp",
      `${base}/actions/runs?head_sha=${sha}&per_page=100`,
    );
    const expected = [...required];
    if (
      !pr.draft &&
      pr.head.repo.full_name === repo &&
      pr.labels.some((label) => label.name === "build:preview")
    )
      expected.push(".github/workflows/build.yml");
    const resultado = avaliar(
      pr,
      pages.flatMap((p) => p.workflow_runs),
      sha,
      expected,
    );
    console.log(resultado.motivo);
    if (resultado.estado === "sucesso") return;
    if (
      resultado.estado === "falha" ||
      !args.includes("--watch") ||
      Date.now() >= limite
    )
      throw new Error("Validação não aprovada");
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
}
module.exports = { avaliar, main };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
