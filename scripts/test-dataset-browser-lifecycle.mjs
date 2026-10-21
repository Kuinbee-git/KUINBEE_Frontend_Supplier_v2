import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { chromium, firefox, webkit } from "playwright";
import { installDatasetReadDiagnostics, classifyDatasetBrowserErrors } from "./dataset-browser-lifecycle.mjs";

const origin = "http://127.0.0.1:12345";
const url = origin + "/api/v2/supplier/dataset-drafts/c000000000000000000000001/files-context";
const error = { at: 10000, stack: `Fetch API cannot load ${url} due to access control checks.\n at fetch` };
const failure = { at: 10000, documentId: "old", url, method: "GET", aborted: true };
const classify = (change = {}) => classifyDatasetBrowserErrors({ engine: "webkit", origin,
  errors: [error], readFailures: [failure], transitions: [], ...change });
test("only a correlated rejected read with an aborted signal is expected", () => {
  assert.equal(classify().expectedCancellations.length, 1);
  assert.deepEqual(classify().unexpected, []);
});
test("a rejected read from the exact navigating document needs its recorded transition", () => {
  const change = { readFailures: [{ ...failure, aborted: false }] };
  assert.equal(classify(change).unexpected.length, 1);
  assert.equal(classify({ ...change, transitions: [{ fromDocument: "old", startedAt: 9990, completedAt: 10010 }] }).unexpected.length, 0);
  assert.equal(classify({ ...change, transitions: [{ fromDocument: "other", startedAt: 9990, completedAt: 10010 }] }).unexpected.length, 1);
});
for (const [name, change] of [
  ["unpaired access-control error", { readFailures: [] }],
  ["cancelled write", { readFailures: [{ ...failure, method: "POST" }] }],
  ["unrelated old cancellation", { readFailures: [{ ...failure, at: 7000 }] }],
  ["different endpoint", { readFailures: [{ ...failure, url: url + "/other" }] }],
  ["external origin", { origin: "http://127.0.0.1:12346" }],
  ["ordinary application exception", { errors: [{ ...error, stack: "Error: owned canary\n at application" }] }],
  ["different engine diagnostic", { engine: "firefox" }],
]) test(name + " remains fatal", () => assert.equal(classify(change).unexpected.length, 1));

test("native instrumentation preserves unhandled fetch rejections and application exceptions", async () => {
  const engine = process.env.DATASET_BROWSER_ENGINE ?? "chromium";
  assert(["chromium", "firefox", "webkit"].includes(engine));
  const server = createServer((req, res) => {
    if (req.url === "/fail") { res.destroy(); return; }
    if (req.url === "/hold") { setTimeout(() => res.end("{}"), 100); return; }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><body>Owned browser guard canary</body></html>");
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await ({ chromium, firefox, webkit })[engine].launch();
    const page = await browser.newPage();
    page.on("pageerror", () => {}); // Intentional canaries belong only to this isolated page.
    await page.addInitScript(installDatasetReadDiagnostics);
    await page.addInitScript(() => {
      window.canary = { errors: [], unhandled: [] };
      addEventListener("error", e => window.canary.errors.push(e.message));
      addEventListener("unhandledrejection", e => window.canary.unhandled.push(String(e.reason)));
    });
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.evaluate(() => { void fetch("/fail"); });
    await page.waitForFunction(() => window.canary.unhandled.length === 1);
    await page.evaluate(() => { setTimeout(() => { throw new Error("Owned application guard canary"); }, 0); });
    await page.waitForFunction(() => window.canary.errors.some(e => e.includes("Owned application guard canary")));
    await page.evaluate(async () => {
      const controller = new AbortController();
      const read = fetch("/hold", { signal: controller.signal });
      controller.abort();
      await read.catch(() => {});
    });
    assert.equal(await page.evaluate(() => window.canary.unhandled.length), 1,
      "Observing a caught abort must not create an unhandled rejection");
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
