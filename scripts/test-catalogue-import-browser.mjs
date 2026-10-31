import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { build } from "esbuild";
import { chromium } from "playwright";
import {
  CatalogueImportBatchResponseSchema,
  CatalogueImportProgressResponseSchema,
  CatalogueImportUploadBodySchema,
  CatalogueImportReviseBodySchema,
  CatalogueImportCommitBodySchema,
  CatalogueEntryPatchBodySchema,
  DatasetPreparationCapacityUpdateBodySchema,
} from "@kuinbee/dataset-preparation-contracts";
const administrative =
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
    .name === "admin";
const client = administrative
  ? `import{adminCatalogueApi}from'./src/services/catalogue-imports.service';const api=adminCatalogueApi('supplier-test');`
  : `import{supplierCatalogueApi as api}from'./src/lib/api/catalogue-imports';`;
const fixtureBundle = await build({
  stdin: {
    contents: `import React from'react';import{createRoot}from'react-dom/client';import{CatalogueImportWorkspace}from'./src/components/catalogue/CatalogueImportWorkspace';import{CatalogueEntryPanel}from'./src/components/catalogue/CatalogueEntryPanel';${client}const root=createRoot(document.getElementById('root'));root.render(location.pathname.endsWith('/entry')?<CatalogueEntryPanel api={api} draftId={'c'+'2'.repeat(24)} generation={7}/>:<CatalogueImportWorkspace api={api} ownerLabel="Synthetic supplier catalogue" storageKey="fixture-catalogue" canManageCapacity={${administrative}}/>);`,
    loader: "jsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  plugins: [
    {
      name: "catalogue-fixture-link",
      setup(builder) {
        builder.onResolve({ filter: /^next\/link$/ }, () => ({
          path: "next/link",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            "import React from 'react';export default function Link(props){return <a {...props}/>}",
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
  write: false,
  format: "iife",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.NEXT_PUBLIC_APP_ENV": '"local"',
    "process.env.NEXT_PUBLIC_API_BASE_URL": '""',
    "process.env.NEXT_PUBLIC_API_URL": '"/api"',
    "process.env.NEXT_PUBLIC_API_TIMEOUT_MS": '"20000"',
    "process.env.NEXT_PUBLIC_UPLOAD_TIMEOUT_MS": '"60000"',
    "process.env.NEXT_PUBLIC_DATASET_CATALOGUE_IMPORT_ENABLED": '"true"',
  },
});
const javascript = fixtureBundle.outputFiles[0].text;
const server = createServer((req, res) => {
  res.setHeader(
    "content-type",
    req.url === "/fixture.js" ? "text/javascript" : "text/html"
  );
  res.end(
    req.url === "/fixture.js"
      ? javascript
      : '<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;font:16px sans-serif}button,input,select,textarea{font:inherit;max-width:100%}p,h1,h2,h3{overflow-wrap:anywhere}div,section,article{min-width:0}#root{padding:12px}article{margin:10px 0;padding:12px;border:1px solid #ccc}label{display:block;margin:8px 0}button{padding:8px;margin:4px}dl{margin:8px 0}dd{margin:4px 0}details{max-width:100%}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'
  );
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
});
const origin = `http://127.0.0.1:${server.address().port}`;
const apiBase = administrative
  ? "/api/v2/admin/suppliers/supplier-test"
  : "/api/v2/supplier/dataset-drafts";
const batchId = "c" + "1".repeat(24),
  draftId = "c" + "2".repeat(24),
  rowId = "c" + "3".repeat(24);
const now = "2026-10-31T00:00:00.000Z";
function batch(overrides = {}) {
  return CatalogueImportBatchResponseSchema.parse({
    id: batchId,
    ownerId: "supplier-test",
    actorId: "actor-test",
    administrative,
    version: "private-catalogue-v1",
    mode: "CREATE_MISSING",
    unmatchedExistingDrafts: 0,
    status: "READY",
    revision: 0,
    fingerprint: "a".repeat(64),
    createdAt: now,
    expiresAt: "2026-11-30T00:00:00.000Z",
    counts: {
      total: 1,
      creates: 1,
      bindings: 0,
      updates: 0,
      unchanged: 0,
      applied: 0,
      skipped: 0,
      invalid: 0,
      conflicts: 0,
      failed: 0,
      warnings: 1,
      excluded: 0,
    },
    rows: [
      {
        id: rowId,
        rowNumber: 2,
        catalogueIdentifier: "ARK-0001",
        title: "مجموعة عربية",
        operation: "CREATE",
        status: "PENDING",
        excluded: false,
        draftId: null,
        expectedGeneration: null,
        expectedCatalogueRevision: null,
        changes: [{ field: "title", before: null, after: "مجموعة عربية" }],
        warnings: ["File-format metadata is unconfirmed."],
        errors: [],
      },
    ],
    ...overrides,
  });
}
let passed = 0;
async function scenario(name, fn) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const fixture = {
    current: batch(),
    commands: [],
    loseCommit: false,
    badPreview: false,
    forbidPreview: false,
    capacity: {
      limit: 1000,
      used: 50,
      remaining: 950,
      generation: 1,
      override: 1000,
    },
  };
  await page.route("**/api/v2/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname,
      method = route.request().method();
    const reply = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(
          status < 400
            ? { success: true, data }
            : { success: false, error: data }
        ),
      });
    try {
      if (!path.startsWith(apiBase))
        throw new Error("Wrong owner API path " + path);
      if (path.endsWith("/capacity")) {
        if (method === "GET" && fixture.capacityFailure)
          return reply(
            {
              code: "SERVICE_UNAVAILABLE",
              message: "Allowance could not be loaded. Try refreshing.",
            },
            503
          );
        if (method === "PATCH") {
          const body = DatasetPreparationCapacityUpdateBodySchema.parse(
            route.request().postDataJSON()
          );
          fixture.commands.push({ method, path, body });
          fixture.capacity = {
            ...fixture.capacity,
            limit: body.limitOverride ?? 50,
            remaining: Math.max(0, (body.limitOverride ?? 50) - 50),
            override: body.limitOverride,
            generation: 2,
          };
        }
        return reply(fixture.capacity);
      }
      if (
        path.endsWith("/catalogue-entry") ||
        path.includes("/catalogue-entries/")
      ) {
        if (method === "GET")
          return reply(
            { code: "NOT_FOUND", message: "No catalogue entry yet" },
            404
          );
        const body = CatalogueEntryPatchBodySchema.parse(
          route.request().postDataJSON()
        );
        fixture.commands.push({ method, path, body });
        return reply({
          draftId,
          catalogueIdentifier: body.catalogueIdentifier,
          revision: 0,
          declaredFormats: body.declaredFormats ?? { state: "UNCONFIRMED" },
          updatedAt: now,
        });
      }
      if (path.endsWith("/catalogue-imports/draft-candidates"))
        return reply({
          items: [
            {
              id: draftId,
              title: "Existing collection",
              generation: 7,
              catalogueIdentifier: null,
              catalogueRevision: null,
            },
          ],
          page: 1,
          limit: 50,
          total: 1,
        });
      if (path.endsWith("/template") || path.endsWith("/report"))
        return reply({
          version: "private-catalogue-v1",
          instructions: [
            "Lists use semicolon separation.",
            "Allowed values for modalities: TABULAR;AUDIO;IMAGE;VIDEO;TEXT;SENSOR;CAD",
          ],
          fields: [
            {
              field: "catalogueIdentifier",
              required: true,
              help: "Your stable collection identifier.",
            },
            { field: "title", required: true, help: "The collection name." },
            {
              field: "modalities",
              required: false,
              help: "Optional semicolon-separated data types.",
            },
          ],
          lookups: {
            categories: [{ id: "category-example", name: "Example subject" }],
            sources: [],
          },
          files: [
            {
              name: "catalogue.csv",
              mimeType: "text/csv",
              contentBase64: Buffer.from(
                "catalogueIdentifier,title\nARK-0001,Test"
              ).toString("base64"),
            },
          ],
        });
      if (path.endsWith("/catalogue-imports") && method === "GET") {
        const summary = { ...fixture.current };
        delete summary.rows;
        return reply({ items: [summary] });
      }
      if (path.endsWith("/catalogue-imports") && method === "POST") {
        const body = CatalogueImportUploadBodySchema.parse(
          route.request().postDataJSON()
        );
        fixture.commands.push({ method, path, body });
        if (fixture.forbidPreview)
          return reply(
            { code: "FORBIDDEN", message: "Import permission required" },
            403
          );
        if (fixture.badPreview)
          return reply({ ...fixture.current, publish: true });
        return reply(fixture.current);
      }
      if (path.endsWith("/preview")) {
        const body = CatalogueImportReviseBodySchema.parse(
          route.request().postDataJSON()
        );
        fixture.commands.push({ method, path, body });
        const choice = body.rows[0];
        fixture.current = batch({
          revision: 1,
          fingerprint: "b".repeat(64),
          rows: [
            {
              ...fixture.current.rows[0],
              operation: "BIND_EXISTING",
              draftId: choice.draftId ?? null,
              expectedGeneration: 7,
              excluded: choice.excluded ?? false,
            },
          ],
        });
        return reply(fixture.current);
      }
      if (path.endsWith("/progress")) {
        fixture.progressRequests = (fixture.progressRequests ?? 0) + 1;
        fixture.current = batch({
          ...fixture.current,
          status: "COMPLETED",
          counts: { ...fixture.current.counts, applied: 1 },
          rows: [{ ...fixture.current.rows[0], status: "APPLIED", draftId }],
        });
        return reply(
          CatalogueImportProgressResponseSchema.parse({
            ...fixture.current,
            rows: fixture.current.rows.map((row) => ({
              id: row.id,
              status: row.status,
              draftId: row.draftId,
              errors: row.errors,
            })),
          })
        );
      }
      if (path.endsWith("/commit")) {
        const body = CatalogueImportCommitBodySchema.parse(
          route.request().postDataJSON()
        );
        fixture.commands.push({ method, path, body });
        fixture.current = batch({
          ...fixture.current,
          status: "COMPLETED",
          counts: { ...fixture.current.counts, applied: 1 },
          rows: [{ ...fixture.current.rows[0], status: "APPLIED", draftId }],
        });
        if (fixture.runAsync)
          fixture.current = batch({
            ...fixture.current,
            status: "RUNNING",
            counts: { ...fixture.current.counts, applied: 0 },
            rows: [
              { ...fixture.current.rows[0], status: "PENDING", draftId: null },
            ],
          });
        if (fixture.loseCommit) {
          fixture.loseCommit = false;
          return route.abort("failed");
        }
        return reply(fixture.current);
      }
      if (path.endsWith("/cancel")) {
        const body = route.request().postDataJSON();
        fixture.commands.push({ method, path, body });
        fixture.current = { ...fixture.current, status: "CANCELLED" };
        return reply(fixture.current);
      }
      if (path.endsWith("/" + batchId)) return reply(fixture.current);
      throw new Error("Unexpected request " + method + " " + path);
    } catch (e) {
      errors.push(method + " " + path + ": " + e.message);
      return reply({ code: "FIXTURE_ERROR", message: e.message }, 500);
    }
  });
  try {
    await fn(page, fixture);
    assert.deepEqual(errors, [], name);
    passed++;
    console.log("PASS " + name);
  } catch (error) {
    console.error("Browser fixture failure", name, {
      errors,
      body: await page.locator("body").innerText(),
      overflow: await page.evaluate(() =>
        [...document.querySelectorAll("*")]
          .map((e) => ({
            tag: e.tagName,
            cls: e.className,
            width: e.getBoundingClientRect().width,
            right: e.getBoundingClientRect().right,
          }))
          .filter((e) => e.right > window.innerWidth + 1)
          .slice(0, 10)
      ),
    });
    throw error;
  } finally {
    await page.close();
  }
}
async function upload(page) {
  await page.getByLabel("Catalogue file", { exact: true }).setInputFiles({
    name: "catalogue.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("catalogueIdentifier,title\nARK-0001,مجموعة عربية"),
  });
  await page
    .getByRole("button", { name: "Validate and preview", exact: true })
    .click();
}
try {
  await scenario(
    "allowance failures stop loading and recover through the shared refresh control",
    async (page, fixture) => {
      fixture.capacityFailure = true;
      await page.goto(origin + "/import");
      await page.getByText("Allowance unavailable", { exact: true }).waitFor();
      assert.equal(
        await page.getByText("Loading allowance…", { exact: true }).count(),
        0
      );
      fixture.capacityFailure = false;
      await page
        .getByRole("button", { name: "Refresh allowance", exact: true })
        .click();
      await page.getByText("50", { exact: true }).waitFor();
      assert.equal(
        await page.getByText("Allowance unavailable", { exact: true }).count(),
        0
      );
      assert.equal(fixture.commands.length, 0);
    }
  );
  await scenario(
    "template walkthrough explains the format and field mapping without saving drafts",
    async (page, fixture) => {
      await page.goto(origin + "/import");
      assert.equal(
        await page
          .getByRole("list", { name: "Catalogue import steps" })
          .locator("li")
          .count(),
        3
      );
      await page
        .getByRole("heading", { name: "Use the provided Excel or CSV format" })
        .waitFor();
      await page
        .getByRole("button", { name: "Get CSV templates", exact: true })
        .click();
      await page.getByText("Template ready.", { exact: false }).waitFor();
      const download = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download catalogue.csv", exact: true })
        .click();
      assert.equal((await download).suggestedFilename(), "catalogue.csv");
      await page
        .getByText("Field dictionary and required columns", { exact: true })
        .click();
      await page
        .getByRole("rowheader", { name: "catalogueIdentifier", exact: true })
        .waitFor();
      await page.getByText("Template instructions", { exact: true }).click();
      await page
        .getByText("Allowed values for modalities:", { exact: false })
        .waitFor();
      await page.getByText("Category and source IDs", { exact: true }).click();
      await page.getByText("Example subject", { exact: true }).waitFor();
      assert.equal(
        fixture.commands.length,
        0,
        "Template help and downloads do not save or submit anything"
      );
    }
  );
  await scenario(
    "active imports poll compact results without downloading metadata previews again",
    async (page, fixture) => {
      fixture.runAsync = true;
      await page.goto(origin + "/import");
      await upload(page);
      await page
        .getByRole("heading", { name: "2. Review catalogue" })
        .waitFor();
      await page
        .getByRole("button", { name: "Save private drafts", exact: true })
        .click();
      await page
        .getByText("completed · revision 0", { exact: false })
        .waitFor();
      assert.ok(fixture.progressRequests > 0);
      assert.equal(
        fixture.commands.filter((command) => command.path.endsWith("/commit"))
          .length,
        1
      );
    }
  );
  await scenario(
    "preview preserves Arabic identifiers, accepts unknown formats, and has no draft mutation",
    async (page, f) => {
      await page.goto(origin + "/import");
      await upload(page);
      await page
        .getByRole("heading", { name: "2. Review catalogue" })
        .waitFor();
      assert.equal(f.commands.length, 1);
      assert.equal(f.commands[0].body.mode, "CREATE_MISSING");
      assert.match(
        Buffer.from(
          f.commands[0].body.files[0].contentBase64,
          "base64"
        ).toString(),
        /مجموعة عربية/
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Save private drafts", exact: true })
          .isEnabled(),
        true
      );
      assert.equal(
        await page
          .getByText("File-format metadata is unconfirmed.", { exact: true })
          .count(),
        1
      );
      await page.getByText("Review 1 field changes", { exact: true }).click();
      assert.equal(
        (await page
          .getByText("Import: مجموعة عربية", { exact: true })
          .count()) > 0,
        true
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        ),
        true
      );
    }
  );
  await scenario(
    "explicit draft matching revises preview and commits its exact revision",
    async (page, f) => {
      await page.goto(origin + "/import");
      await upload(page);
      await page
        .getByRole("button", { name: "Find drafts", exact: true })
        .click();
      await page
        .getByLabel("Match this identifier to an existing draft")
        .click();
      await page.getByRole("option", { name: /^Existing collection/ }).click();
      assert.equal(
        await page
          .getByRole("button", { name: "Save private drafts", exact: true })
          .isDisabled(),
        true
      );
      await page
        .getByRole("button", { name: "Update preview", exact: true })
        .click();
      await page.getByText("revision 1", { exact: false }).waitFor();
      await page
        .getByRole("button", { name: "Save private drafts", exact: true })
        .click();
      await page
        .getByText("completed · revision 1", { exact: false })
        .waitFor();
      const revise = f.commands.find((c) => c.path.endsWith("/preview"));
      assert.equal(revise.body.rows[0].draftId, draftId);
      const commit = f.commands.find((c) => c.path.endsWith("/commit"));
      assert.equal(commit.body.expectedRevision, 1);
      assert.equal(commit.body.fingerprint, "b".repeat(64));
      assert.ok(
        f.commands.every((c) => !/(submit|publish|pricing|grant)/.test(c.path))
      );
    }
  );
  await scenario(
    "lost commit acknowledgement survives reload and retries the same request",
    async (page, f) => {
      f.loseCommit = true;
      await page.goto(origin + "/import");
      await upload(page);
      await page
        .getByRole("button", { name: "Save private drafts", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Retry previous request" })
        .waitFor();
      const original = f.commands.find((c) => c.path.endsWith("/commit")).body;
      await page.reload();
      await page
        .getByRole("button", { name: "Retry previous request" })
        .click();
      await page
        .getByText("completed · revision 0", { exact: false })
        .waitFor();
      // Reload can display the completed batch before the replay response arrives.
      await page.waitForFunction(
        () => sessionStorage.getItem("fixture-catalogue") === null
      );
      const commits = f.commands.filter((c) => c.path.endsWith("/commit"));
      assert.equal(commits.length, 2);
      assert.deepEqual(commits[1].body, original);
      assert.equal(
        await page.evaluate(() => sessionStorage.getItem("fixture-catalogue")),
        null
      );
    }
  );
  await scenario(
    "unverified server response cannot enable saving and retains the original preview request",
    async (page, f) => {
      f.badPreview = true;
      await page.goto(origin + "/import");
      await upload(page);
      await page
        .getByRole("button", { name: "Retry previous request" })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Save private drafts", exact: true })
          .count(),
        0
      );
      f.badPreview = false;
      await page
        .getByRole("button", { name: "Retry previous request" })
        .click();
      await page
        .getByRole("button", { name: "Save private drafts", exact: true })
        .waitFor();
      assert.equal(f.commands[0].body.requestId, f.commands[1].body.requestId);
    }
  );
  await scenario(
    "permission rejection reports error without trapping the user in uncertain retry",
    async (page, f) => {
      f.forbidPreview = true;
      await page.goto(origin + "/import");
      await upload(page);
      await page
        .getByRole("alert")
        .filter({ hasText: "Import permission required" })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Retry previous request" })
          .count(),
        0
      );
      f.forbidPreview = false;
      await page
        .getByRole("button", { name: "Validate and preview", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Save private drafts", exact: true })
        .waitFor();
    }
  );
  await scenario(
    "row errors disable commit and row exclusion needs a revised preview",
    async (page, f) => {
      f.current = batch({
        status: "NEEDS_CORRECTION",
        counts: { ...batch().counts, invalid: 1 },
        rows: [
          {
            ...batch().rows[0],
            status: "INVALID",
            errors: ["Unknown category."],
          },
        ],
      });
      await page.goto(origin + "/import");
      await upload(page);
      assert.equal(
        await page
          .getByRole("button", { name: "Save private drafts", exact: true })
          .isDisabled(),
        true
      );
      await page.getByLabel("Exclude from this batch").check();
      await page
        .getByRole("button", { name: "Update preview", exact: true })
        .click();
      await page.getByText("revision 1", { exact: false }).waitFor();
      assert.equal(
        f.commands.find((c) => c.path.endsWith("/preview")).body.rows[0]
          .excluded,
        true
      );
    }
  );
  await scenario(
    "unmatched saved drafts require reconciliation or explicit reviewed acknowledgement",
    async (page, f) => {
      f.current = batch({ unmatchedExistingDrafts: 50 });
      await page.goto(origin + "/import");
      await upload(page);
      await page
        .getByRole("heading", { name: "2. Review catalogue" })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Save private drafts", exact: true })
          .isDisabled(),
        true
      );
      await page
        .getByLabel("I have reviewed the unmatched drafts.", { exact: false })
        .check();
      await page
        .getByRole("button", { name: "Save private drafts", exact: true })
        .click();
      await page
        .getByText("completed · revision 0", { exact: false })
        .waitFor();
      assert.equal(
        f.commands.find((c) => c.path.endsWith("/commit")).body
          .acknowledgeUnmatchedDrafts,
        true
      );
    }
  );
  await scenario(
    "private catalogue entry saves unconfirmed formats without invented values",
    async (page, f) => {
      await page.goto(origin + "/entry");
      await page
        .getByLabel("Catalogue identifier", { exact: true })
        .fill("ARK-0009");
      await page
        .getByRole("button", {
          name: "Save private catalogue details",
          exact: true,
        })
        .click();
      await page
        .getByText("Private catalogue details saved.", { exact: true })
        .waitFor();
      const body = f.commands[0].body;
      assert.equal(body.expectedGeneration, 7);
      assert.equal(body.expectedRevision, null);
      assert.deepEqual(body.declaredFormats, { state: "UNCONFIRMED" });
      assert.ok(!("license" in body) && !("isPaid" in body));
    }
  );
  if (administrative)
    await scenario(
      "admin capacity changes use a reason and exact generation",
      async (page, f) => {
        await page.goto(origin + "/import");
        await page.getByLabel("Supplier allowance override").fill("1500");
        await page
          .getByLabel("Reason for allowance change")
          .fill("Catalogue growth request");
        await page
          .getByRole("button", { name: "Save allowance", exact: true })
          .click();
        await page
          .getByText("Saved preparation allowance updated.", { exact: true })
          .waitFor();
        assert.deepEqual(
          { ...f.commands[0].body, requestId: "retained" },
          {
            requestId: "retained",
            expectedGeneration: 1,
            limitOverride: 1500,
            reason: "Catalogue growth request",
          }
        );
      }
    );
  console.log(
    `PASS ${passed} ${administrative ? "admin" : "supplier"} private catalogue browser scenarios`
  );
} finally {
  await browser.close();
  server.close();
  await once(server, "close");
}
