import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { transformSync } from "esbuild";

const file = existsSync("src/lib/dataset-preparation-environment.ts")
  ? "src/lib/dataset-preparation-environment.ts"
  : "src/lib/dataset-content-environment.ts";
const source = readFileSync(file, "utf8");
const output = transformSync(source, { loader: "ts", format: "cjs" }).code;
function enabled(environment, flag, mode = "production") {
  const compiledModule = { exports: {} };
  runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, process: { env: {
    NEXT_PUBLIC_APP_ENV: environment,
    NEXT_PUBLIC_DATASET_CONTENT_ENABLED: flag,
    NODE_ENV: mode,
  } } });
  const keys = Object.keys(compiledModule.exports).filter(key => key.endsWith("_ENABLED"));
  assert.equal(keys.length, 1);
  return compiledModule.exports[keys[0]];
}

test("production Dataset UI requires its exact coordinated release flag", () => {
  for (const flag of [undefined, "", "false", "TRUE", "1", " true "]) {
    assert.equal(enabled("production", flag), false);
  }
  assert.equal(enabled("production", "true"), true);
  for (const environment of ["preview", "Production", "unknown"]) {
    assert.equal(enabled(environment, "true"), false);
  }
  assert.equal(enabled(undefined, "true"), false);
});

test("the production flag preserves isolated staging and local development behavior", () => {
  for (const environment of ["local", "staging"]) {
    assert.equal(enabled(environment), true);
    assert.equal(enabled(environment, "false"), true);
  }
  assert.equal(enabled(undefined, undefined, "development"), true);
});
