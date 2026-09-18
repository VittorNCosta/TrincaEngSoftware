const { test } = require("node:test");
const assert = require("node:assert/strict");
const { rastrear, referencias } = require("../rastrear-pr");
function fixture(extra = {}) {
  const pr = {
    number: 3,
    title: "Mudança",
    body: "",
    state: "open",
    base: { ref: "develop" },
    html_url: "https://github.com/a/b/pull/3",
    ...extra,
  };
  const issues = [];
  const calls = [];
  const api = async (method, path, body) => {
    calls.push({ method, path, body });
    if (method === "GET" && path.startsWith("/issues?")) return issues;
    if (method === "GET" && path.startsWith("/labels")) return {};
    if (method === "GET") {
      const issue = issues.find((i) => path === `/issues/${i.number}`);
      if (issue) return issue;
      throw Object.assign(new Error("not found"), { status: 404 });
    }
    if (method === "POST" && path === "/issues") {
      const issue = { ...body, number: 10, state: "open" };
      issues.push(issue);
      return issue;
    }
    if (method === "PATCH" && path === "/pulls/3") Object.assign(pr, body);
    if (method === "PATCH" && path.startsWith("/issues/"))
      Object.assign(
        issues.find((i) => path === `/issues/${i.number}`),
        body,
      );
    return {};
  };
  return { pr, repo: "a/b", api, issues, calls };
}
test("reutiliza issue válida e ignora link de outro repositório", async () => {
  const f = fixture({ body: "Fixes #7" });
  f.issues.push({ number: 7, body: "existente" });
  assert.equal((await rastrear(f)).number, 7);
  assert.equal(f.issues.length, 1);
  assert.deepEqual(
    referencias("Fixes https://github.com/x/y/issues/7", "a/b"),
    [],
  );
});
test("fork, synchronize, edição e reabertura são idempotentes", async () => {
  const f = fixture({ head: { repo: { fork: true } } });
  await rastrear(f);
  f.pr.body = "texto editado";
  await rastrear(f);
  await rastrear(f);
  assert.equal(f.issues.length, 1);
  assert.match(f.pr.body, /issue-rastreada:10/);
});
test("fecha automática apenas no merge na entrega; reabre com PR", async () => {
  const f = fixture();
  await rastrear(f);
  f.pr.state = "closed";
  await rastrear(f);
  assert.equal(f.issues[0].state, "open");
  f.pr.merged = true;
  f.pr.base.ref = "feature";
  await rastrear(f);
  assert.equal(f.issues[0].state, "open");
  f.pr.base.ref = "develop";
  await rastrear(f);
  assert.equal(f.issues[0].state, "closed");
  f.pr.state = "open";
  await rastrear(f);
  assert.equal(f.issues[0].state, "open");
});
test("check não cria issue e rejeita PR sem vínculo", async () => {
  const f = fixture();
  await assert.rejects(rastrear({ ...f, somenteLeitura: true }));
  assert.equal(f.issues.length, 0);
});
