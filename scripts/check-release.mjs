import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";
import { app } from "./deployment-environment.mjs";
import { checkCompiledDashboardGlass } from "./check-compiled-dashboard-glass.mjs";
import { checkCompiledDashboardBrand } from "./check-compiled-dashboard-brand.mjs";

const origin = "http://127.0.0.1:3020";
const browserOrigin = "http://supplier.fixture.test:3020";
let apiOrigin = "http://127.0.0.1";
const requests = [];
const fixture = createServer(async (req, res) => {
  const url = new URL(req.url, apiOrigin);
  const recorded = { method: req.method, path: url.pathname };
  requests.push(recorded);
  res.setHeader("Access-Control-Allow-Origin", browserOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "content-type,authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  res.setHeader("Content-Type", "application/json");
  if (/\/auth\//.test(url.pathname)) {
    if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      recorded.body = JSON.parse(Buffer.concat(chunks).toString());
    }
    res.writeHead(401);
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Fixture credentials rejected",
        },
      })
    );
    return;
  }
  const collections = [
    "datasets",
    "categories",
    "custom-collection-services",
    "data-requirements",
  ];
  const collection = url.pathname.split("/").at(-1);
  if (req.method === "GET" && collections.includes(collection)) {
    const items =
      collection === "categories"
        ? [{ id: "ci-category", name: "CI fixture subject", datasetCount: 1 }]
        : [];
    res.end(
      JSON.stringify({
        success: true,
        data: {
          items,
          total: items.length,
          page: Number(url.searchParams.get("page") || 1),
          pageSize: 100,
        },
      })
    );
    return;
  }
  res.writeHead(404);
  res.end(
    JSON.stringify({
      success: false,
      error: { code: "NOT_FOUND", message: "Fixture route not found" },
    })
  );
});
const env = {
  ...process.env,
  CI: "1",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_APP_ENV: "local",
  NEXT_PUBLIC_SITE_URL: origin,
  NEXT_PUBLIC_USER_APP_URL: origin,
  NEXT_PUBLIC_API_BASE_URL: apiOrigin,
  NEXT_PUBLIC_API_URL: apiOrigin + "/api",
  NODE_OPTIONS: "--max-old-space-size=2048",
};
for (const name of [
  "VERCEL",
  "VERCEL_ENV",
  "ADMIN_API_PROXY_TARGET",
  "NEXT_PUBLIC_MARKETPLACE_URL",
])
  delete env[name];
const children = new Set();
function start(script, args = []) {
  const child = spawn(process.execPath, [script, ...args], {
    env,
    stdio: "inherit",
  });
  children.add(child);
  child.once("exit", () => children.delete(child));
  return child;
}
async function run(script, args = []) {
  const child = start(script, args);
  const [code, signal] = await once(child, "exit");
  assert.equal(code, 0, `${script} failed (${code ?? signal})`);
}
async function waitForServer(child, path) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error("Frontend exited before readiness");
    try {
      const response = await fetch(origin + path, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Frontend did not become ready");
}
let browser;
let page;
const errors = [];
const wrongApi = [];
const apiCalls = [];
const failedRequests = [];
let releaseClientScripts;
const clientScripts = new Promise((resolve) => {
  releaseClientScripts = resolve;
});
try {
  await new Promise((resolve, reject) => {
    fixture.once("error", reject);
    fixture.listen(0, "127.0.0.1", resolve);
  });
  // A fresh fixture origin prevents an earlier build cache from satisfying this run.
  apiOrigin = `http://127.0.0.1:${fixture.address().port}`;
  env.NEXT_PUBLIC_API_BASE_URL = apiOrigin;
  env.NEXT_PUBLIC_API_URL = apiOrigin + "/api";
  await run("node_modules/next/dist/bin/next", ["build"]);
  await run("node_modules/typescript/bin/tsc", ["--noEmit"]);
  const route =
    app === "buyer" ? "/" : app === "supplier" ? "/auth/login" : "/login";
  const server = start("node_modules/next/dist/bin/next", [
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3020",
  ]);
  await waitForServer(server, route);
  const response = await fetch(origin + route);
  assert.equal(response.status, 200);
  if (app === "buyer") {
    const html = await response.text();
    const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
    assert(
      visible.includes("CI fixture subject"),
      "SSR must render fixture API data, not a fallback-only page"
    );
    assert(requests.some((r) => r.path === "/api/v1/marketplace/categories"));
  }
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: [
      "--host-resolver-rules=MAP supplier.fixture.test 127.0.0.1",
      "--no-proxy-server",
    ],
  });
  page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText,
    });
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname.startsWith("/_next/") &&
      route.request().resourceType() === "script"
    ) {
      await clientScripts;
    }
    if (url.origin === apiOrigin)
      apiCalls.push({ path: url.pathname, method: route.request().method() });
    if (![origin, browserOrigin, apiOrigin].includes(url.origin)) {
      if (["fetch", "xhr"].includes(route.request().resourceType()))
        wrongApi.push(url.origin + url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  // Hold client JavaScript to exercise the real server-rendered form before
  // hydration. A slow connection must not let users enter data or submit into
  // controls whose event handlers are not attached yet.
  await page.goto(browserOrigin + route, { waitUntil: "commit" });
  await page.locator('input[type="email"]').waitFor({ state: "visible" });
  assert(await page.locator('input[type="email"]').isDisabled());
  assert(await page.locator('input[type="password"]').isDisabled());
  assert(
    await page
      .getByRole("button", { name: "Sign in", exact: true })
      .isDisabled()
  );
  releaseClientScripts();
  if (app === "buyer")
    await page
      .getByRole("button", { name: "Sign In", exact: true })
      .first()
      .click();
  const loginForm =
    app === "supplier"
      ? page.locator("body")
      : page
          .locator("form")
          .filter({ has: page.locator('input[type="password"]') })
          .first();
  await loginForm.locator('input[type="email"]').fill("fixture@example.test");
  await loginForm
    .locator('input[type="password"]')
    .fill("Fixture-password-123");
  if (app === "supplier")
    await loginForm
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
  else await loginForm.locator('button[type="submit"]').click();
  await page.waitForFunction(() =>
    document.body.innerText.includes("Fixture credentials rejected")
  );
  assert(
    apiCalls.some((r) => r.method === "POST" && r.path.includes("/auth/")),
    "Compiled frontend must send login to the configured API"
  );
  const submitted = requests.filter(
    (r) => r.method === "POST" && r.path.includes("/auth/")
  );
  assert.equal(
    submitted.length,
    1,
    "Login submits exactly once after hydration"
  );
  assert.deepEqual(submitted[0].body, {
    email: "fixture@example.test",
    password: "Fixture-password-123",
  });
  assert.deepEqual(wrongApi, []);
  assert.deepEqual(errors, []);
  console.log(
    `PASS ${app} compiled API routing and failed-login handling${app === "buyer" ? ", plus fixture-backed SSR" : ""}`
  );
  if (app === "supplier") {
    await checkCompiledDashboardGlass({ browser, origin });
    await checkCompiledDashboardBrand({ browser, origin, apiOrigin });
  }
  await browser.close();
  browser = undefined;
  if (app === "admin") {
    env.AUTH_TEST_BASE_URL = origin;
    env.CLARU_TEST_BASE_URL = origin;
    env.CLARU_CSP_TEST_BASE_URL = origin;
    await run("scripts/test-auth-browser.mjs");
    await run("scripts/test-claru-browser.mjs");
    await run("scripts/test-claru-bulk-browser.mjs");
    await run("scripts/test-claru-csp-browser.mjs");
  }
} catch (error) {
  console.error(
    "Release browser diagnostics",
    JSON.stringify({
      message: error.message,
      page: page?.url(),
      visibleText: await page
        ?.locator("body")
        .innerText()
        .catch(() => "unavailable"),
      errors,
      wrongApi,
      apiCalls,
      failedRequests,
      fixtureRequests: requests.map(({ method, path }) => ({ method, path })),
    })
  );
  throw error;
} finally {
  releaseClientScripts();
  await browser?.close();
  for (const child of children) {
    const stopped = once(child, "exit");
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 5000);
    await stopped;
    clearTimeout(timer);
  }
  fixture.closeAllConnections();
  await new Promise((resolve) => fixture.close(resolve));
}
