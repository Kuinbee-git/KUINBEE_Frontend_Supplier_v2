import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { DatasetSupplierProposalsResponseSchema } from "@kuinbee/dataset-preparation-contracts";

// Exercise the real onboarding hook and cookie-authenticated HTTP response.
// Do not seed the auth store: that masked absent identity in Dataset fixtures.
const result = await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import{QueryProvider}from'./src/components/QueryProvider';import{useOnboardingStatus}from'./src/hooks/useOnboardingStatus';import{useAuthStore}from'./src/store/auth.store';import Overview from'./src/app/dashboard/page';function Session(){const status=useOnboardingStatus();const actor=useAuthStore(s=>s.user);return <><output data-actor>{actor?.id??''}</output><output data-email>{actor?.email??''}</output><output data-ready>{String(status.isComplete&&!status.loading&&!status.error)}</output></>}createRoot(document.getElementById('root')).render(<React.StrictMode><QueryProvider><Session/><Overview/></QueryProvider></React.StrictMode>);`,
    loader: "jsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  plugins: [
    {
      name: "dashboard-next-fixture",
      setup(b) {
        b.onResolve({ filter: /^next\/(link|image)$/ }, (a) => ({
          path: a.path,
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          loader: "jsx",
          resolveDir: process.cwd(),
          contents:
            a.path === "next/link"
              ? "import React from'react';export default function Link(p){return <a {...p}/>}"
              : "import React from'react';export default function Image({priority,fill,quality,unoptimized,...p}){return <img {...p}/>}",
        }));
      },
    },
  ],
  define: {
    "process.env": JSON.stringify({
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_ENV: "local",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:4000",
    }),
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
const id = (n) => "c" + String(n).padStart(24, "0");
const stamp = "2026-10-18T00:00:00.000Z";
const inventory = DatasetSupplierProposalsResponseSchema.parse({
  page: 1,
  pageSize: 4,
  total: 2,
  summary: {
    total: 1,
    byVerificationStatus: {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      RESUBMITTED: 0,
      VERIFIED: 1,
      REJECTED: 0,
    },
  },
  items: [
    {
      id: id(1),
      datasetUniqueId: "D0000000100",
      title: "Current draft fixture",
      status: "SUBMITTED",
      verificationStatus: "PENDING",
      primaryCategory: null,
      createdAt: stamp,
      updatedAt: stamp,
      material: {
        representation: "CONTENT",
        activeContentId: id(3),
        reviewedContentId: null,
        publishedContentId: null,
        uploadChoice: "FULL_ONLY",
        workflowRevision: 0,
      },
    },
    {
      id: id(2),
      datasetUniqueId: "D0000000101",
      title: "Current published fixture",
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      primaryCategory: null,
      createdAt: stamp,
      updatedAt: stamp,
      material: {
        representation: "CONTENT",
        activeContentId: null,
        reviewedContentId: id(4),
        publishedContentId: id(4),
        uploadChoice: "FULL_ONLY",
        workflowRevision: 3,
      },
    },
  ],
});
let apiCalls = 0,
  inventoryReads = 0,
  mutations = 0;
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
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("Fixture browser error:", e.message);
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname.startsWith("/api/") &&
      route.request().method() === "OPTIONS"
    )
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Headers": "content-type,accept",
          "Access-Control-Allow-Methods": "GET",
        },
      });
    if (url.pathname.startsWith("/api/")) {
      if (route.request().method() !== "GET") mutations++;
      assert.equal(
        route.request().method(),
        "GET",
        "Opening the supplier workspace is read-only"
      );
      let data;
      if (url.pathname === "/api/v2/supplier/dataset-proposals") {
        assert.equal(url.searchParams.get("scope"), "ALL");
        inventoryReads++;
        data = inventory;
      } else if (url.pathname === "/api/v1/supplier/datasets")
        data = { items: [], total: 1, page: 1, pageSize: 1 };
      else if (url.pathname === "/api/v1/supplier/onboarding/profile")
        data = { profile: { isOfflineContractDone: true } };
      if (data)
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data }),
        });
    }
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
  await page.getByRole("link", { name: /Current draft fixture/ }).waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: /Current draft fixture/ })
      .getAttribute("href"),
    "/dashboard/datasets/drafts/" + id(1)
  );
  assert.equal(
    await page
      .getByRole("link", { name: /Current published fixture/ })
      .getAttribute("href"),
    "/dashboard/my-datasets/" + id(2)
  );
  await page
    .getByRole("link", { name: /Current draft fixture/ })
    .getByText("Draft", { exact: true })
    .waitFor();
  await page
    .getByRole("link", { name: /Current published fixture/ })
    .getByText("Published", { exact: true })
    .waitFor();
  assert.equal(
    await page
      .locator("dl")
      .filter({ has: page.getByText("Total proposals", { exact: true }) })
      .locator("dd")
      .innerText(),
    "2"
  );
  assert.equal(
    await page.getByText("Loading recent proposals", { exact: true }).count(),
    0,
    "StrictMode must not strand an acknowledged overview in Loading"
  );
  assert.ok(inventoryReads >= 3);
  assert.equal(mutations, 0);
  console.log(
    "PASS overview under StrictMode: canonical proposal totals, draft/published links, completed loading and no writes across cold load, reload and account replacement"
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
