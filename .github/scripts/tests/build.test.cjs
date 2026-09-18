const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { validarBuild } = require("../disparar-build");
test("enfileiramento não é conclusão, commit exato e artefato são obrigatórios", () => {
  const b = { id: "1", gitCommitHash: "abc", status: "IN_QUEUE" };
  assert.equal(validarBuild(b, "abc"), false);
  for (const status of ["ERRORED", "CANCELED", "FINISHED"])
    assert.throws(() => validarBuild({ ...b, status }, "abc"));
  assert.throws(() => validarBuild(b, "outro"));
  assert.equal(
    validarBuild(
      {
        ...b,
        status: "FINISHED",
        artifacts: { buildUrl: "https://example.com/app.aab" },
      },
      "abc",
    ),
    true,
  );
});
test("sem credencial falha antes de checkout ou CLI remoto", () => {
  const result = spawnSync(
    process.execPath,
    [require.resolve("../disparar-build"), "production"],
    { env: { ...process.env, EXPO_TOKEN: "" }, encoding: "utf8", cwd: "/tmp" },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /EXPO_TOKEN ausente/);
});
