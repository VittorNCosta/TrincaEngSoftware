const fs = require("node:fs");

function referencias(body, repo) {
  const numeros = new Set();
  for (const match of (body || "").matchAll(
    /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?|references?|tarefa:)\s+(?:#(\d+)|https:\/\/github\.com\/([^/]+\/[^/]+)\/issues\/(\d+))/gi,
  )) {
    if (match[1]) numeros.add(Number(match[1]));
    else if (match[2].toLowerCase() === repo.toLowerCase())
      numeros.add(Number(match[3]));
  }
  for (const match of (body || "").matchAll(/<!-- issue-rastreada:(\d+) -->/g))
    numeros.add(Number(match[1]));
  return [...numeros];
}
async function rastrear({
  pr,
  repo,
  api,
  entrega = "develop",
  somenteLeitura = false,
}) {
  const marker = `<!-- tarefa-pr:${pr.number} -->`;
  let issue;
  for (const number of referencias(pr.body, repo)) {
    try {
      const existente = await api("GET", `/issues/${number}`);
      if (!existente.pull_request) {
        issue = existente;
        break;
      }
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }
  // Listagem paginada evita depender do índice de busca, eventualmente consistente.
  let automatica;
  for (let page = 1; ; page++) {
    const issues = await api(
      "GET",
      `/issues?state=all&per_page=100&page=${page}`,
    );
    automatica = issues.find(
      (item) => !item.pull_request && item.body?.includes(marker),
    );
    if (automatica || issues.length < 100) break;
  }
  issue ||= automatica;
  if (pr.state === "closed") {
    if (!somenteLeitura && pr.merged && pr.base.ref === entrega && automatica)
      await api("PATCH", `/issues/${automatica.number}`, {
        state: "closed",
        state_reason: "completed",
      });
    return issue;
  }
  if (somenteLeitura) {
    if (!issue) throw new Error(`PR #${pr.number} sem issue válida`);
    return issue;
  }
  if (!issue) {
    try {
      await api("GET", "/labels/tarefa-automatica");
    } catch (error) {
      if (error.status !== 404) throw error;
      try {
        await api("POST", "/labels", {
          name: "tarefa-automatica",
          color: "1B7FBD",
          description: "Rastreabilidade automática de PR",
        });
      } catch (creationError) {
        if (creationError.status !== 422) throw creationError;
      }
    }
    issue = await api("POST", "/issues", {
      title: `PR #${pr.number}: ${pr.title}`.slice(0, 256),
      body: `${marker}\n\nTarefa de integração para ${pr.html_url}.\n\n${pr.body || "Sem contexto adicional no PR."}`,
      labels: ["tarefa-automatica"],
    });
  }
  if (issue.number === automatica?.number && issue.state === "closed")
    await api("PATCH", `/issues/${issue.number}`, { state: "open" });
  // Não usar keyword de fechamento: entrega é validada acima, inclusive se a branch padrão mudar.
  const vinculo = `<!-- issue-rastreada:${issue.number} -->`;
  if (!(pr.body || "").includes(vinculo))
    await api("PATCH", `/pulls/${pr.number}`, {
      body: `${pr.body || ""}\n\n${vinculo}\nTarefa: #${issue.number}`,
    });
  return issue;
}
async function main() {
  const event = JSON.parse(
    fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"),
  );
  const repo = process.env.GITHUB_REPOSITORY;
  const api = async (method, path, body) => {
    const response = await fetch(
      `https://api.github.com/repos/${repo}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${process.env.GH_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    if (!response.ok) {
      const error = new Error(`GitHub ${method} ${path}: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  };
  // Recarrega metadados: eventos enfileirados não devem sobrescrever edição posterior.
  const pr = await api(
    "GET",
    `/pulls/${process.env.PR_NUMBER || event.pull_request.number}`,
  );
  const issue = await rastrear({
    pr,
    repo,
    api,
    somenteLeitura: process.argv.includes("--check"),
  });
  console.log(
    issue
      ? `PR #${pr.number} → issue #${issue.number}`
      : "PR fechado sem tarefa automática",
  );
}
module.exports = { referencias, rastrear };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
