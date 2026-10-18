import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";

// Exercise the real onboarding hook and cookie-authenticated HTTP response.
// Do not seed the auth store: that masked absent identity in Dataset fixtures.
const result = await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import{QueryProvider}from'./src/components/QueryProvider';import{useOnboardingStatus}from'./src/hooks/useOnboardingStatus';import{useAuthStore}from'./src/store/auth.store';function Session(){const status=useOnboardingStatus();const actor=useAuthStore(s=>s.user);return <><output data-actor>{actor?.id??''}</output><output data-email>{actor?.email??''}</output><output data-ready>{String(status.isComplete&&!status.loading&&!status.error)}</output></>}createRoot(document.getElementById('root')).render(<React.StrictMode><QueryProvider><Session/></QueryProvider></React.StrictMode>);`,
    loader: "jsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.NEXT_PUBLIC_APP_ENV": '"local"',
    "process.env.NEXT_PUBLIC_API_BASE_URL": '"http://127.0.0.1:4000"',
  },
});
const identity = {
  id: "c000000000000000000000123",
  email: "current@example.test",
  userType: "SUPPLIER",
  status: "ACTIVE",
  emailVerified: true,
  phone: null,
};
let apiCalls = 0;
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
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith("/onboarding/status")) {
      assert.equal(url.origin, origin);
      return route.continue();
    }
    apiCalls++;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          supplier: identity,
          onboarding: {
            supplierType: "COMPANY",
            nextStep: "DONE",
            steps: {
              supplierTypeSelected: true,
              emailOtpVerified: true,
              individualPan: {
                required: false,
                status: "NOT_STARTED",
                lastAttemptId: null,
                lastErrorCode: null,
              },
              profileCompleted: true,
            },
          },
        },
      }),
    });
  });
  await page.goto(origin);
  await page.waitForFunction(
    () => document.querySelector("[data-ready]")?.textContent === "true"
  );
  assert.equal(await page.locator("[data-actor]").textContent(), identity.id);
  assert.equal(
    await page.locator("[data-email]").textContent(),
    identity.email
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector("[data-ready]")?.textContent === "true"
  );
  assert.equal(await page.locator("[data-actor]").textContent(), identity.id);
  await page.evaluate(() =>
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          user: {
            id: "c000000000000000000000999",
            email: "previous@example.test",
            name: "Previous account",
            role: "supplier",
          },
        },
        version: 0,
      })
    )
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector("[data-ready]")?.textContent === "true"
  );
  assert.equal(await page.locator("[data-actor]").textContent(), identity.id);
  assert.equal(
    await page.locator("[data-email]").textContent(),
    identity.email
  );
  assert.equal(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("auth-storage"))
      )
    ).state.user.name,
    "Supplier"
  );
  assert.ok(apiCalls >= 3);
  assert.deepEqual(errors, []);
  console.log(
    "PASS supplier identity from backend session: cold load, reload, and stale-account replacement"
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
