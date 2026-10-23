const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");

const script = resolve(__dirname, "../../../scripts/actions-budget.mjs");

test("piso mensal expira na virada do mes e corta aos 90%", async () => {
  const { floorForMonth, minutesForJob } = await import(pathToFileURL(script).href);
  assert.equal(floorForMonth("2026-09:4204", "2026-09"), 4204);
  assert.equal(floorForMonth("2026-09:4204", "2026-10"), 0);
  assert.equal(
    minutesForJob({
      id: 1,
      started_at: "2026-09-01T00:00:00Z",
      completed_at: "2026-09-01T00:00:01Z",
    }),
    1,
  );
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      GITHUB_REPOSITORY: "owner/repo",
      GH_TOKEN: "test-token",
      ACTIONS_BUDGET_FLOOR: `${new Date().toISOString().slice(0, 7)}:4204`,
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Orcamento mensal atingido/);
});

test("conta todas as tentativas de um run e falha se API nao responder", async () => {
  const { measuredMinutes } = await import(pathToFileURL(script).href);
  const now = new Date("2026-09-01T02:00:00Z");
  const requests = [];
  const request = async (path) => {
    requests.push(path);
    if (path.includes("/actions/runs?"))
      return { total_count: 1, workflow_runs: [{ id: 42 }] };
    return {
      total_count: 2,
      jobs: [
        {
          id: 1,
          started_at: "2026-09-01T00:00:00Z",
          completed_at: "2026-09-01T00:01:00Z",
        },
        {
          id: 2,
          started_at: "2026-09-01T00:10:00Z",
          completed_at: "2026-09-01T00:11:01Z",
        },
      ],
    };
  };
  assert.equal(
    await measuredMinutes(1700, { request, now, month: "2026-09" }),
    3,
  );
  assert.ok(requests.some((path) => path.includes("filter=all")));
  await assert.rejects(
    measuredMinutes(1700, {
      request: async () => {
        throw new Error("API indisponivel");
      },
      now,
      month: "2026-09",
    }),
    /API indisponivel/,
  );
});
