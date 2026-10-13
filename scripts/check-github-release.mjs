import { pathToFileURL } from "node:url";

export const repository = "Kuinbee-git/KUINBEE_Frontend_Supplier_v2";
const workflow = ".github/workflows/frontend-ci.yml";

export function deploymentContext(env) {
  if (env.VERCEL !== "1") return null;
  if (env.VERCEL_ENV === "development") return null;
  if (!["production", "preview"].includes(env.VERCEL_ENV))
    throw new Error("Hosted release environment is missing or unsupported.");
  const sha = env.VERCEL_GIT_COMMIT_SHA;
  const branch = env.VERCEL_GIT_COMMIT_REF;
  if (!/^[a-f0-9]{40}$/i.test(sha ?? "") || !branch) {
    throw new Error("Hosted release requires an exact Git commit and branch.");
  }
  if (
    `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}` !== repository
  ) {
    throw new Error(
      "Hosted release repository does not match this application."
    );
  }
  return { sha, branch };
}

export function checkWorkflowRun(body, { sha, branch }) {
  if (!Array.isArray(body?.workflow_runs))
    throw new Error("Malformed GitHub workflow response.");
  const matches = body.workflow_runs
    .filter(
      (run) =>
        run.path === workflow &&
        run.head_sha === sha &&
        run.head_branch === branch &&
        run.event === "push" &&
        run.repository?.full_name === repository &&
        run.head_repository?.full_name === repository
    )
    .sort((a, b) => b.id - a.id);
  const latest = matches[0];
  if (!latest || latest.status !== "completed") return { state: "pending" };
  if (latest.conclusion !== "success") {
    throw new Error(
      `Required frontend CI did not pass (${latest.conclusion ?? "unknown"}); run ${latest.id}.`
    );
  }
  return { state: "success", runId: latest.id, attempt: latest.run_attempt };
}

export async function waitForRequiredCheck(env = process.env, options = {}) {
  const context = deploymentContext(env);
  if (!context) return { state: "local" };
  const request = options.fetch ?? fetch;
  const sleep =
    options.sleep ??
    ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? 15 * 60_000;
  const pollMs = options.pollMs ?? 60_000;
  const deadline = now() + timeoutMs;
  const url = new URL(
    `https://api.github.com/repos/${repository}/actions/runs`
  );
  url.searchParams.set("head_sha", context.sha);
  url.searchParams.set("event", "push");
  url.searchParams.set("per_page", "100");
  while (now() < deadline) {
    const response = await request(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "kuinbee-release-check",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(
        `Cannot verify required GitHub CI (HTTP ${response.status}); release is held.`
      );
    const result = checkWorkflowRun(await response.json(), context);
    if (result.state === "success") {
      console.log(
        `Required frontend CI passed for ${context.sha}: run ${result.runId}, attempt ${result.attempt}.`
      );
      return result;
    }
    console.log(`Waiting for required frontend CI on ${context.sha}.`);
    await sleep(pollMs);
  }
  throw new Error(
    "Required frontend CI did not finish before the release-check deadline."
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  waitForRequiredCheck().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
