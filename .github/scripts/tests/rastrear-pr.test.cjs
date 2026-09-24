const { test } = require("node:test");
const assert = require("node:assert/strict");
const { rastrear, referencias, fechamentos } = require("../rastrear-pr");
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
      if (issue) return structuredClone(issue);
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

test("fecha apenas issues explicitamente declaradas após merge em qualquer base", async () => {
  const f = fixture({
    base: { ref: "feat/campanha-10x10" },
    body: "Closes #38, #165 and https://github.com/a/b/issues/166\nRefs #226",
  });
  f.issues.push(
    { number: 38, state: "open" },
    { number: 165, state: "open" },
    { number: 166, state: "open" },
    { number: 226, state: "open" },
  );

  await rastrear(f);
  assert.deepEqual(
    f.issues.map(({ number, state }) => [number, state]),
    [
      [38, "open"],
      [165, "open"],
      [166, "open"],
      [226, "open"],
    ],
  );

  f.pr.state = "closed";
  await rastrear(f);
  assert.deepEqual(
    f.issues.map(({ number, state }) => [number, state]),
    [
      [38, "open"],
      [165, "open"],
      [166, "open"],
      [226, "open"],
    ],
  );

  f.pr.merged = true;
  await rastrear(f);
  assert.deepEqual(
    f.issues.map(({ number, state }) => [number, state]),
    [
      [38, "closed"],
      [165, "closed"],
      [166, "closed"],
      [226, "open"],
    ],
  );
});

test("ignora PRs, issues de outro repositório e repetição do fechamento", async () => {
  const f = fixture({
    base: { ref: "feature" },
    body: "Fixes #38 and https://github.com/other/repo/issues/165",
  });
  f.issues.push(
    {
      number: 38,
      state: "open",
      pull_request: { url: "https://api/pulls/38" },
    },
    { number: 165, state: "open" },
  );
  assert.deepEqual(fechamentos(f.pr.body, f.repo), [38]);
  f.pr.state = "closed";
  f.pr.merged = true;
  await rastrear(f);
  assert.deepEqual(
    f.issues.map(({ number, state }) => [number, state]),
    [
      [38, "open"],
      [165, "open"],
    ],
  );

  const repetido = fixture({
    body: "Fixes #77",
    state: "closed",
    merged: true,
  });
  repetido.issues.push({ number: 77, state: "open" });
  await rastrear(repetido);
  await rastrear(repetido);
  assert.equal(repetido.issues[0].state, "closed");
  assert.equal(
    repetido.calls.filter(
      ({ method, path }) => method === "PATCH" && path === "/issues/77",
    ).length,
    1,
  );
});
test("check não cria issue e rejeita PR sem vínculo", async () => {
  const f = fixture();
  await assert.rejects(rastrear({ ...f, somenteLeitura: true }));
  assert.equal(f.issues.length, 0);

  const fechamento = fixture({
    body: "Closes #77",
    state: "closed",
    merged: true,
  });
  fechamento.issues.push({ number: 77, state: "open" });
  await rastrear({ ...fechamento, somenteLeitura: true });
  assert.equal(fechamento.issues[0].state, "open");
});

test("Refs reutiliza issue sem prometer fechamento automático", () => {
  assert.deepEqual(referencias("Refs #226", "a/b"), [226]);
});
