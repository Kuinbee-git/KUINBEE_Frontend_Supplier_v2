import test from "node:test";
import assert from "node:assert/strict";
import {
  deploymentContext,
  checkWorkflowRun,
  waitForRequiredCheck,
  repository,
} from "./check-github-release.mjs";
const sha = "a".repeat(40),
  branch = "infra/fixture";
const [owner, slug] = repository.split("/");
const env = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_SHA: sha,
  VERCEL_GIT_COMMIT_REF: branch,
  VERCEL_GIT_REPO_OWNER: owner,
  VERCEL_GIT_REPO_SLUG: slug,
};
const run = {
  id: 1,
  path: ".github/workflows/frontend-ci.yml",
  head_sha: sha,
  head_branch: branch,
  event: "push",
  repository: { full_name: repository },
  head_repository: { full_name: repository },
  status: "completed",
  conclusion: "success",
  run_attempt: 1,
};
const body = (...runs) => ({ workflow_runs: runs });
const context = { sha, branch };

test("local and GitHub fixture builds make no release-status request", async () => {
  assert.equal(deploymentContext({}), null);
  assert.throws(
    () => deploymentContext({ ...env, VERCEL_ENV: undefined }),
    /environment/
  );
  assert.equal(deploymentContext({ ...env, VERCEL_ENV: "development" }), null);
  const result = await waitForRequiredCheck(
    { CI: "1" },
    {
      fetch: () => {
        throw new Error("unexpected network");
      },
    }
  );
  assert.equal(result.state, "local");
});
for (const target of ["production", "preview"])
  test(`${target} requires exact hosted identity`, () => {
    const current = { ...env, VERCEL_ENV: target };
    assert.deepEqual(deploymentContext(current), context);
    for (const field of [
      "VERCEL_GIT_COMMIT_SHA",
      "VERCEL_GIT_COMMIT_REF",
      "VERCEL_GIT_REPO_OWNER",
      "VERCEL_GIT_REPO_SLUG",
    ]) {
      assert.throws(() =>
        deploymentContext({ ...current, [field]: undefined })
      );
    }
    assert.throws(() =>
      deploymentContext({ ...current, VERCEL_GIT_COMMIT_SHA: "main" })
    );
  });
test("only the same commit, workflow, branch and repository can pass", () => {
  assert.equal(checkWorkflowRun(body(run), context).state, "success");
  for (const changed of [
    { head_sha: "b".repeat(40) },
    { head_branch: "main" },
    { event: "pull_request" },
    { path: ".github/workflows/other.yml" },
    { repository: { full_name: "other/repo" } },
    { head_repository: { full_name: "fork/repo" } },
  ]) {
    assert.equal(
      checkWorkflowRun(body({ ...run, ...changed }), context).state,
      "pending"
    );
  }
  assert.throws(() => checkWorkflowRun({}, context), /Malformed/);
});
for (const conclusion of [
  "failure",
  "cancelled",
  "timed_out",
  "skipped",
  "neutral",
  null,
])
  test(`completed ${conclusion} cannot release`, () => {
    assert.throws(
      () => checkWorkflowRun(body({ ...run, conclusion }), context),
      /did not pass/
    );
  });
test("an older success cannot mask a new pending or failed run", () => {
  assert.equal(
    checkWorkflowRun(
      body(run, { ...run, id: 2, status: "in_progress", conclusion: null }),
      context
    ).state,
    "pending"
  );
  assert.throws(
    () =>
      checkWorkflowRun(
        body({ ...run, id: 2, conclusion: "failure" }, run),
        context
      ),
    /did not pass/
  );
});
test("polling waits for the exact CI run and then succeeds", async () => {
  let calls = 0,
    time = 0;
  const result = await waitForRequiredCheck(env, {
    fetch: async (url) => {
      assert.equal(url.origin, "https://api.github.com");
      assert.equal(url.searchParams.get("head_sha"), sha);
      return {
        ok: true,
        json: async () => (++calls === 1 ? body() : body(run)),
      };
    },
    now: () => time,
    sleep: async (ms) => {
      time += ms;
    },
    pollMs: 10,
    timeoutMs: 100,
  });
  assert.equal(calls, 2);
  assert.equal(result.state, "success");
});
test("unavailable status, malformed responses, and deadlines fail closed", async () => {
  for (const status of [401, 403, 429, 500])
    await assert.rejects(
      waitForRequiredCheck(env, { fetch: async () => ({ ok: false, status }) }),
      /release is held/
    );
  await assert.rejects(
    waitForRequiredCheck(env, {
      fetch: async () => {
        throw new Error("offline");
      },
    }),
    /offline/
  );
  let time = 0;
  await assert.rejects(
    waitForRequiredCheck(env, {
      fetch: async () => ({ ok: true, json: async () => body() }),
      now: () => time,
      sleep: async (ms) => {
        time += ms;
      },
      pollMs: 10,
      timeoutMs: 20,
    }),
    /deadline/
  );
});
