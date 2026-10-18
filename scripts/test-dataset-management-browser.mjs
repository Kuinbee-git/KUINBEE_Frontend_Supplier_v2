import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import {
  DatasetContentPublishBodySchema,
  DatasetContentLifecycleBodySchema,
  DatasetContentVisibilityBodySchema,
  DatasetPublicationReadinessResponseSchema,
  DatasetPublicationResponseSchema,
} from "@kuinbee/dataset-preparation-contracts";

// Real rendered management controls and HTTP, with a synthetic state authority.
// Native backend/provider acceptance is qualified separately on staging.
const id = (n) => "c" + String(n).padStart(24, "0"),
  datasetId = id(1),
  actorId = id(8),
  stamp = "2026-10-18T00:00:00.000Z";
const compiled = await build({
  stdin: {
    contents: `import React from'react';import{createRoot}from'react-dom/client';import{QueryProvider}from'./src/components/QueryProvider';import{ContentDatasetManagement}from'./src/components/datasets/ContentDatasetManagement';import{useAuthStore}from'./src/store/auth.store';useAuthStore.getState().login({id:'${actorId}',email:'fixture@example.test',name:'Fixture',role:'supplier'});createRoot(document.getElementById('root')).render(<React.StrictMode><QueryProvider><ContentDatasetManagement datasetId='${datasetId}' isDark={false}/></QueryProvider></React.StrictMode>);`,
    loader: "jsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  jsx: "automatic",
  format: "iife",
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.NEXT_PUBLIC_APP_ENV": '"local"',
  },
  plugins: [
    {
      name: "next-fixture",
      setup(b) {
        b.onResolve({ filter: /^next\/(link|navigation|image)$/ }, (a) => ({
          path: a.path,
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          loader: "jsx",
          resolveDir: process.cwd(),
          contents:
            a.path === "next/link"
              ? "import React from'react';export default function Link(p){return <a {...p}/>}"
              : a.path === "next/image"
                ? "import React from'react';export default function Image({priority,fill,quality,unoptimized,...p}){return <img {...p}/>}"
                : "export function useRouter(){return{push:()=>{},replace:()=>{}}}export function useSearchParams(){return new URLSearchParams()}export function usePathname(){return location.pathname}",
        }));
      },
    },
  ],
});
let state = {
  datasetId,
  datasetUniqueId: "D0000000100",
  datasetStatus: "VERIFIED",
  verificationStatus: "VERIFIED",
  preparationGeneration: 0,
  workflowRevision: 4,
  activeContentId: null,
  reviewedContentId: id(2),
  publishedContentId: null,
  pricing: {
    id: id(3),
    revision: 0,
    status: "DRAFT",
    isPaid: false,
    price: null,
    currency: "INR",
  },
};
let publication = null,
  visibility = "PUBLIC",
  lose = false,
  foreignAck = false,
  serverError = false,
  mutations = 0,
  replays = 0;
const receipts = new Map(),
  commands = [],
  errors = [];
const rating = {
  id: id(4),
  datasetId,
  contentId: id(2),
  Q: 80,
  L: 100,
  P: 100,
  U: 80,
  F: 80,
  finalScore: "88.00",
  adminId: id(7),
  createdAt: stamp,
  note: null,
  scope: {
    uploadedComponents: ["FULL"],
    representedCollection: "SUPPLIER_DECLARATION",
  },
};
const response = () =>
  DatasetPublicationResponseSchema.parse({
    state,
    publication,
    visibility,
    reviewedAssessment: Object.fromEntries(
      Object.entries(rating).filter(([key]) => key !== "note")
    ),
    publishedAssessment: publication
      ? Object.fromEntries(
          Object.entries(rating).filter(([key]) => key !== "note")
        )
      : null,
  });
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://fixture");
    if (!url.pathname.startsWith("/api/")) {
      res.setHeader(
        "Content-Type",
        url.pathname === "/bundle.js" ? "text/javascript" : "text/html"
      );
      res.end(
        url.pathname === "/bundle.js"
          ? compiled.outputFiles[0].text
          : '<div id="root"></div><script src="/bundle.js"></script>'
      );
      return;
    }
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET") {
      if (url.pathname.endsWith("/publication")) {
        if (serverError) {
          res.writeHead(500);
          res.end(
            JSON.stringify({
              success: false,
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Temporary failure",
              },
            })
          );
          return;
        }
        res.end(
          JSON.stringify({
            success: true,
            data: DatasetPublicationReadinessResponseSchema.parse({
              ...response(),
              contentId: id(2),
              contentGeneration: 5,
              dependencyFingerprint: "a".repeat(64),
              canPublish: state.datasetStatus === "VERIFIED",
              issues: [],
            }),
          })
        );
        return;
      }
      res.writeHead(404);
      res.end(
        JSON.stringify({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Synthetic read fixture unavailable",
          },
        })
      );
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks));
    const action = url.pathname.split("/").at(-1);
    const schema =
      action === "publish"
        ? DatasetContentPublishBodySchema
        : action === "visibility"
          ? DatasetContentVisibilityBodySchema
          : DatasetContentLifecycleBodySchema;
    schema.parse(body);
    commands.push({ action, body });
    const serialized = JSON.stringify({ action, body });
    const prior = receipts.get(body.requestId);
    if (prior) {
      assert.equal(prior.serialized, serialized);
      replays++;
      res.end(JSON.stringify({ success: true, data: prior.result }));
      return;
    }
    assert.equal(body.expectedWorkflowRevision, state.workflowRevision);
    mutations++;
    state = { ...state, workflowRevision: state.workflowRevision + 1 };
    if (action === "publish") {
      assert.equal(body.expectedContentId, id(2));
      state.datasetStatus = "PUBLISHED";
      state.publishedContentId = id(2);
      publication = {
        id: id(5),
        contentId: id(2),
        publishedAt: stamp,
        pricingReference: { id: id(3), revision: 0 },
        pricingAtPublication: { isPaid: false, price: null, currency: "INR" },
        assessmentAtPublicationId: id(4),
        currentAssessmentId: id(4),
      };
    } else {
      assert.equal(body.expectedPublishedContentId, id(2));
      assert.equal(body.expectedPublicationId, id(5));
      if (action === "visibility") visibility = body.visibility;
      else state.datasetStatus = action === "delist" ? "DELISTED" : "ARCHIVED";
    }
    const result = { ...response(), requestId: body.requestId };
    receipts.set(body.requestId, { serialized, result });
    if (lose) {
      lose = false;
      res.destroy();
      return;
    }
    res.end(
      JSON.stringify({
        success: true,
        data: foreignAck
          ? { ...result, publication: { ...result.publication, id: id(99) } }
          : result,
      })
    );
    foreignAck = false;
  } catch (e) {
    errors.push(String(e));
    res.writeHead(500);
    res.end(
      JSON.stringify({
        success: false,
        error: { code: "FIXTURE_ERROR", message: "Fixture rejected request" },
      })
    );
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser, page;
try {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (e) => browserErrors.push(e.message));
  await page.route("**/*", async (route) => {
    assert.equal(
      new URL(route.request().url()).origin,
      origin,
      "No real service may be contacted"
    );
    if (
      lose &&
      route.request().method() === "POST" &&
      new URL(route.request().url()).pathname.endsWith("/publish")
    ) {
      lose = false;
      await route.fetch({ maxRetries: 0 });
      return route.abort("failed");
    }
    return route.continue();
  });
  await page.goto(origin);
  await page
    .getByRole("button", { name: "Publish dataset", exact: true })
    .waitFor();
  assert.equal(mutations, 0, "Opening management must not mutate");
  lose = true;
  await page
    .getByRole("button", { name: "Publish dataset", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm previous action", exact: true })
    .waitFor();
  assert.equal(mutations, 1);
  const first = commands[0];
  await page
    .getByRole("button", { name: "Confirm previous action", exact: true })
    .click({ trial: true });
  await page.reload();
  await page
    .getByRole("button", { name: "Confirm previous action", exact: true })
    .waitFor();
  assert.equal(commands.length, 1, "Reload never retries a write");
  await page
    .getByRole("button", { name: "Confirm previous action", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delist dataset", exact: true })
    .waitFor();
  assert.equal(mutations, 1);
  assert.equal(replays, 1);
  assert.deepEqual(commands[1], first);
  await page.getByLabel("Visibility", { exact: true }).selectOption("PRIVATE");
  assert.equal(mutations, 1, "Selecting visibility does not save");
  foreignAck = true;
  await page
    .getByRole("button", { name: "Save visibility", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm previous action", exact: true })
    .waitFor();
  assert.equal(mutations, 2);
  await page
    .getByRole("button", { name: "Confirm previous action", exact: true })
    .click();
  await page.waitForFunction(
    () => !document.body.textContent.includes("Confirm previous action")
  );
  assert.equal(
    mutations,
    2,
    "An incompatible publication ACK retains the exact command"
  );
  assert.equal(replays, 2);
  await page
    .getByRole("button", { name: "Delist dataset", exact: true })
    .click();
  assert.equal(mutations, 2, "Lifecycle actions require explicit confirmation");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(mutations, 2);
  await page
    .getByRole("button", { name: "Delist dataset", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm delist", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      !document.querySelector("button")?.disabled &&
      document.body.textContent.includes("Your action was saved.")
  );
  assert.equal(mutations, 3);
  assert.equal(state.datasetStatus, "DELISTED");
  await page
    .getByRole("button", { name: "Archive dataset", exact: true })
    .click();
  assert.equal(mutations, 3, "Archive also requires explicit confirmation");
  await page
    .getByRole("button", { name: "Confirm archive", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.body.textContent.includes("Your action was saved.") &&
      !document.body.textContent.includes("Confirm archive")
  );
  assert.equal(state.datasetStatus, "ARCHIVED");
  assert.equal(mutations, 4);
  serverError = true;
  await page.reload();
  await page.getByText("Temporary failure", { exact: true }).waitFor();
  assert.equal(
    commands.length,
    6,
    "Read failure must not call a legacy writer or start a new action"
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(browserErrors, []);
  console.log(
    "PASS Dataset management: read-only opening, explicit publish/visibility/delist, lost-ACK reload and exact replay, foreign publication ACK protection, no fallback on server errors"
  );
} catch (failure) {
  console.error(
    JSON.stringify({
      fixtureErrors: errors,
      commands: commands.map((x) => ({
        action: x.action,
        requestId: x.body.requestId,
      })),
      visible: page ? await page.locator("body").innerText() : null,
      storage: page
        ? await page.evaluate(() =>
            Object.fromEntries(
              Object.keys(sessionStorage).map((k) => [
                k,
                sessionStorage.getItem(k),
              ])
            )
          )
        : null,
    })
  );
  throw failure;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
