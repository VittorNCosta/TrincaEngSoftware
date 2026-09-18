const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const app = path.resolve(
  __dirname,
  "../../../TrincaMania Redesign/TrincaMania-ODS12",
);
const configure = require(path.join(app, "app.config"));
const config = require(path.join(app, "app.json")).expo;
function env(values, fn) {
  const old = { ...process.env };
  for (const key of [
    "EXPO_PUBLIC_E2E",
    "EAS_BUILD_PROFILE",
    "EXPO_PUBLIC_SENTRY_DSN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
  ])
    delete process.env[key];
  Object.assign(process.env, values);
  try {
    fn();
  } finally {
    process.env = old;
  }
}
test("OTA usa fingerprint, sem endpoint externo no perfil E2E", () =>
  env({}, () => {
    const result = configure({ config });
    assert.equal(result.runtimeVersion.policy, "fingerprint");
    assert.equal(result.updates.enabled, true);
    env({ EXPO_PUBLIC_E2E: "true" }, () => {
      const isolated = configure({ config });
      assert.equal(isolated.android.package, "br.com.mhvtech.trincamania.e2e");
      assert.equal(isolated.updates.enabled, false);
    });
  }));
test("flag E2E é recusada em build de distribuição", () => {
  for (const profile of ["preview", "production"])
    env({ EXPO_PUBLIC_E2E: "true", EAS_BUILD_PROFILE: profile }, () =>
      assert.throws(() => configure({ config }), /E2E/),
    );
});
test("DSN exige destinos de sourcemap e token nunca é serializado", () => {
  env({ EXPO_PUBLIC_SENTRY_DSN: "https://public@example.invalid/1" }, () =>
    assert.throws(() => configure({ config }), /sourcemaps/),
  );
  env(
    {
      EXPO_PUBLIC_SENTRY_DSN: "https://public@example.invalid/1",
      SENTRY_ORG: "org",
      SENTRY_PROJECT: "project",
      SENTRY_AUTH_TOKEN: "private-token",
    },
    () => {
      const result = configure({ config });
      assert.equal(result.plugins.at(-1)[0], "@sentry/react-native/expo");
      assert.ok(!JSON.stringify(result).includes("private-token"));
    },
  );
});
test("cobertura de produção rejeita queda em cada métrica e aceita igualdade", () => {
  const { compare } = require(path.join(app, "scripts/cobertura"));
  const floor = {
    domain: { lines: 50, branches: 40, functions: 30, statements: 50 },
  };
  const summary = {
    domain: Object.fromEntries(
      Object.entries(floor.domain).map(([k, pct]) => [k, { pct }]),
    ),
  };
  assert.deepEqual(compare(summary, floor), []);
  summary.domain.lines.pct = 49;
  assert.equal(compare(summary, floor).length, 1);
});
