const { test } = require("node:test");
const assert = require("node:assert/strict");
const { avaliar } = require("../validar-pr");
const pr = { head: { sha: "abc" }, state: "open", mergeable: true };
const runs = ["ci", "seguranca"].map((name, i) => ({
  id: i + 1,
  path: `.github/workflows/${name}.yml`,
  event: "pull_request",
  head_sha: "abc",
  status: "completed",
  conclusion: "success",
}));
test("aprova somente os dois workflows no SHA atual", () =>
  assert.equal(avaliar(pr, runs, "abc").estado, "sucesso"));
test("rejeita SHA divergente e conflito", () => {
  assert.equal(avaliar(pr, runs, "antigo").estado, "falha");
  assert.equal(
    avaliar({ ...pr, mergeable: false }, runs, "abc").estado,
    "falha",
  );
});
test("aguarda ausentes, SHA antigo, push e execução pendente", () => {
  for (const list of [
    [],
    runs.slice(1),
    runs.map((r) => ({ ...r, head_sha: "antigo" })),
    runs.map((r) => ({ ...r, event: "push" })),
    runs.map((r) => ({ ...r, status: "queued" })),
  ])
    assert.equal(avaliar(pr, list, "abc").estado, "pendente");
});
test("falha, cancelamento, skipped e resultado anterior verde não aprovam", () => {
  for (const conclusion of [
    "failure",
    "cancelled",
    "skipped",
    "timed_out",
    "neutral",
  ])
    assert.equal(
      avaliar(pr, [...runs, { ...runs[0], id: 99, conclusion }], "abc").estado,
      "falha",
    );
});

test("E2E aplicável ausente/pendente aguarda e falha impede aprovação", () => {
  const path = ".github/workflows/e2e.yml";
  const required = [...runs.map((run) => run.path), path];
  assert.equal(avaliar(pr, runs, "abc", required).estado, "pendente");
  const e2e = { ...runs[0], path, id: 3, status: "in_progress" };
  assert.equal(avaliar(pr, [...runs, e2e], "abc", required).estado, "pendente");
  assert.equal(
    avaliar(
      pr,
      [...runs, { ...e2e, status: "completed", conclusion: "failure" }],
      "abc",
    ).estado,
    "falha",
  );
});
