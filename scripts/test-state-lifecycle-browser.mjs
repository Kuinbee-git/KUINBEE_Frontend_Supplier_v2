import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";

const entry = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useSessionDraft} from './src/hooks/useSessionDraft';
import {QueryProvider} from './src/components/QueryProvider'; import {useComponentRequest} from './src/hooks/useComponentRequest';
const empty = () => ({clientRequestId:'',title:''});
window.fixture={view:'draft',id:'first',enabled:true}; window.calls=[];
function Draft() {
  const snapshot=useSessionDraft('fixture-draft',7200000,empty);
  const [form,setForm]=useState(null);
  if(!form && snapshot) setForm(snapshot.data);
  return <><input aria-label="Draft title" disabled={!form} value={form?.title??''} onChange={event=>setForm({...form,title:event.target.value})}/><output data-request-id>{form?.clientRequestId}</output><output data-restored>{String(snapshot?.restored)}</output></>;
}
function RequestForm({id,enabled}) {
 const [value,setValue]=useState('');const [loading,setLoading]=useState(false);
 const load=async()=>{window.calls.push(['load',id]);setLoading(true);await Promise.resolve();setValue('Loaded '+id);setLoading(false);};
 useComponentRequest(load,[id],enabled);
 return <><input aria-label="Request value" value={value} onChange={event=>setValue(event.target.value)}/><button onClick={load}>Refresh</button><output data-loading>{String(loading)}</output></>;
}
const root=createRoot(document.getElementById('root'));
function App(){return <QueryProvider>{window.fixture.view==='draft'?<Draft/>:window.fixture.view==='request'?<RequestForm id={window.fixture.id} enabled={window.fixture.enabled}/>:null}</QueryProvider>;}
window.renderFixture=patch=>{Object.assign(window.fixture,patch);root.render(<React.StrictMode><App/></React.StrictMode>);};
window.renderFixture({});
`;
const result = await build({
  stdin: { contents: entry, loader: "jsx", resolveDir: process.cwd() },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
});
const server = createServer((req, res) => {
  res.setHeader(
    "Content-Type",
    req.url === "/bundle.js" ? "text/javascript" : "text/html"
  );
  res.end(
    req.url === "/bundle.js"
      ? result.outputFiles[0].text
      : '<div id="root"></div><script src="/bundle.js"></script>'
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) => {
    assert.equal(new URL(route.request().url()).origin, origin);
    return route.continue();
  });
  await page.goto(origin);
  await page.waitForFunction(
    () => document.querySelector("[data-request-id]")?.textContent
  );
  const first = await page.locator("[data-request-id]").textContent();
  assert.match(first, /^[0-9a-f-]{36}$/);
  await page.getByLabel("Draft title").fill("Unsaved edits");
  await page.evaluate(() => window.renderFixture({}));
  assert.equal(
    await page.getByLabel("Draft title").inputValue(),
    "Unsaved edits"
  );
  assert.equal(await page.locator("[data-request-id]").textContent(), first);
  await page.evaluate(() =>
    sessionStorage.setItem(
      "fixture-draft",
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        data: { clientRequestId: "existing-id", title: "Saved draft" },
      })
    )
  );
  await page.reload();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-request-id]")?.textContent === "existing-id"
  );
  assert.equal(
    await page.getByLabel("Draft title").inputValue(),
    "Saved draft"
  );
  assert.equal(await page.locator("[data-restored]").textContent(), "true");
  for (const invalid of ["expired", "malformed", "wrong-version"]) {
    await page.evaluate(
      (kind) =>
        sessionStorage.setItem(
          "fixture-draft",
          kind === "malformed"
            ? "{broken"
            : JSON.stringify({
                version: kind === "wrong-version" ? 2 : 1,
                savedAt: Date.now() - 10800000,
                data: { clientRequestId: "old-id", title: "Old" },
              })
        ),
      invalid
    );
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector("[data-request-id]")?.textContent
    );
    assert.equal(await page.getByLabel("Draft title").inputValue(), "");
    assert.equal(await page.locator("[data-restored]").textContent(), "false");
    assert.notEqual(
      await page.locator("[data-request-id]").textContent(),
      "old-id"
    );
  }
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector("[data-request-id]")?.textContent
  );
  await page.getByLabel("Draft title").fill("Storage is optional");
  assert.equal(
    await page.getByLabel("Draft title").inputValue(),
    "Storage is optional"
  );
  console.log(
    "PASS draft hydration preserves request identity/edits, restores valid drafts, expires invalid drafts, and tolerates blocked storage under StrictMode"
  );
  await page.evaluate(() => window.renderFixture({ view: "request" }));
  await page.waitForFunction(
    () => document.querySelector("input")?.value === "Loaded first"
  );
  const loaded = await page.evaluate(() => window.calls.length);
  assert.equal(
    loaded,
    1,
    "StrictMode does not duplicate the in-flight request"
  );
  await page.getByLabel("Request value").fill("Local edit");
  await page.evaluate(() => {
    window.renderFixture({});
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
  });
  assert.equal(
    await page.getByLabel("Request value").inputValue(),
    "Local edit"
  );
  assert.equal(await page.evaluate(() => window.calls.length), loaded);
  await page.evaluate(() => window.renderFixture({ id: "second" }));
  await page.waitForFunction(
    () => document.querySelector("input")?.value === "Loaded second"
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.waitForFunction(() => window.calls.length === 3);
  await page.evaluate(() => window.renderFixture({ id: "first" }));
  await page.waitForFunction(
    () => document.querySelector("input")?.value === "Loaded first"
  );
  await page.evaluate(() => window.renderFixture({ view: "none" }));
  await page.locator("input").waitFor({ state: "hidden" });
  await page.evaluate(() =>
    window.renderFixture({ view: "request", enabled: false })
  );
  assert.equal(await page.getByLabel("Request value").inputValue(), "");
  const before = await page.evaluate(() => window.calls.length);
  await page.evaluate(() => window.renderFixture({ enabled: true }));
  await page.waitForFunction(
    () => document.querySelector("input")?.value === "Loaded first"
  );
  assert.equal(await page.evaluate(() => window.calls.length), before + 1);
  console.log(
    "PASS request lifecycle loads once, preserves edits on rerender/focus/reconnect, reloads on input/explicit refresh/remount, and honors disabled state"
  );
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
