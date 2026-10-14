import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import {
  DatasetPreparationCreateBodySchema,
  DatasetPreparationPatchBodySchema,
} from "@kuinbee/dataset-preparation-contracts";

const require = createRequire(import.meta.url);
const postcss = require(
  require.resolve("postcss", {
    paths: [require.resolve("@tailwindcss/postcss")],
  })
);
const tailwind = require("@tailwindcss/postcss");
const globals = await readFile("src/app/globals.css", "utf8");
const dashboard = await readFile("src/app/dashboard/dashboard.css", "utf8");
const css =
  (
    await postcss([tailwind({ base: process.cwd() })]).process(globals, {
      from: resolve("src/app/globals.css"),
    })
  ).css +
  "\n" +
  dashboard;
const entry = [
  "import React from 'react'; import {createRoot} from 'react-dom/client';",
  "import {QueryProvider} from './src/components/QueryProvider';",
  "import CreateDatasetPage from './src/app/dashboard/datasets/create/page';",
  "import ProposalsPage from './src/app/dashboard/datasets/page';",
  "import DraftProposalPage from './src/app/dashboard/datasets/drafts/[draftId]/page';",
  "import OldDraftListPage from './src/app/dashboard/datasets/prepare/page';",
  "import OldDraftPage from './src/app/dashboard/datasets/prepare/[draftId]/page';",
  "import {DatasetPreparationScreen} from './src/components/datasets/preparation/DatasetPreparationScreen';",
  "import {DATASET_PREPARATION_ENABLED} from './src/lib/dataset-preparation-environment';",
  "import {preparationApi} from './src/lib/api/dataset-preparations';",
  "import {DatasetPreparationMetadataSchema} from '@kuinbee/dataset-preparation-contracts';",
  "window.runtimeContract = {partial:DatasetPreparationMetadataSchema.safeParse({title:'Partial'}).success, forged:DatasetPreparationMetadataSchema.safeParse({title:'Bad',scanPassed:true}).success};",
  "window.tryProductionWrite=async()=>{try{await preparationApi.create({requestId:crypto.randomUUID(),metadata:{title:'Blocked'}});}catch(e){return e.code;}};",
  "const root=createRoot(document.getElementById('root')); let mount=0;",
  "function render(view){root.render(<React.StrictMode><QueryProvider>{view}</QueryProvider></React.StrictMode>)}",
  "window.showEditor=(id)=>{mount++;window.history.replaceState(window.history.state,'',id?'/dashboard/datasets/drafts/'+id:'/dashboard/datasets/create');render(DATASET_PREPARATION_ENABLED?<DatasetPreparationScreen key={mount} draftId={id}/>:<CreateDatasetPage/>);};",
  "window.showRoute=async()=>{const path=window.location.pathname;const tail=path.split('/').at(-1);try{let view;if(path==='/dashboard/datasets')view=<ProposalsPage/>;else if(path==='/dashboard/datasets/create')view=<CreateDatasetPage/>;else if(path==='/dashboard/datasets/prepare')view=OldDraftListPage();else if(path.startsWith('/dashboard/datasets/prepare/'))view=await OldDraftPage({params:Promise.resolve({draftId:tail})});else if(path.startsWith('/dashboard/datasets/drafts/'))view=await DraftProposalPage({params:Promise.resolve({draftId:tail})});else throw {notFound:true};render(view)}catch(error){if(error.redirect)window.location.replace(error.redirect);else if(error.notFound)render(<h1>Not found</h1>);else throw error}};",
  "window.showRoute();",
].join("\n");
const mockedNext = {
  name: "fixture-next",
  setup(builder) {
    builder.onResolve({ filter: /^next\/(link|navigation)$/ }, (args) => ({
      path: args.path,
      namespace: "fixture",
    }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
      contents:
        args.path === "next/link"
          ? "import React from 'react'; export default function Link(props){return <a {...props}/>}"
          : "export function useRouter(){return {push:url=>window.location.assign(url),replace:url=>window.location.replace(url),back:()=>window.history.back()}}; export function useSearchParams(){return new URLSearchParams(window.location.search)}; export function notFound(){throw {notFound:true}}; export function redirect(url){throw {redirect:url}};",
      loader: "jsx",
      resolveDir: process.cwd(),
    }));
  },
};
async function bundle(environment) {
  const result = await build({
    stdin: { contents: entry, loader: "jsx", resolveDir: process.cwd() },
    plugins: [mockedNext],
    bundle: true,
    write: false,
    metafile: true,
    format: "iife",
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"development"',
      "process.env.NEXT_PUBLIC_APP_ENV": JSON.stringify(environment),
    },
  });
  assert(
    Object.keys(result.metafile.inputs).some((path) =>
      path.includes(
        "node_modules/@kuinbee/dataset-preparation-contracts/index.js"
      )
    )
  );
  assert(
    !Object.keys(result.metafile.inputs).some((path) =>
      path.includes("../backend")
    ),
    "Browser must not import sibling backend files"
  );
  return result.outputFiles[0].text;
}
const scripts = {
  local: await bundle("local"),
  production: await bundle("production"),
};
const cuid = (n) => "c" + String(n).padStart(24, "0");
const categories = Array.from({ length: 113 }, (_, index) => ({
  id: cuid(index + 1000),
  name: "Subject " + (index + 1),
}));
const sources = Array.from({ length: 42 }, (_, index) => ({
  id: cuid(index + 5000),
  name: "Source " + (index + 1),
}));
const drafts = new Map();
const replays = new Map();
const requests = [];
const flags = {
  acknowledgement: "",
  newerDuringAck: false,
  failRead: "",
  blockedNetworkRequestId: "",
};
let sequence = 1;
function copy(value) {
  return structuredClone(value);
}
function dto(metadata, id, generation = 0) {
  return {
    contractVersion: 1,
    id,
    generation,
    metadata,
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: new Date(Date.UTC(2026, 9, 14, 0, 0, generation)).toISOString(),
    readiness: {
      canSubmit: false,
      issues: [
        {
          code: "FILES_NOT_ENABLED",
          message:
            "File upload and required file checks are not available in this testing release.",
        },
        {
          code: "SUBMISSION_NOT_ENABLED",
          message: "Admin submission is unavailable in this testing release.",
        },
      ],
    },
  };
}
function mutate(id, changes) {
  const current = drafts.get(id);
  const next = dto(
    { ...current.metadata, ...changes },
    id,
    current.generation + 1
  );
  drafts.set(id, next);
  return next;
}
function json(res, status, value) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
}
const fixtureErrors = [];
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://fixture.test");
    if (url.pathname === "/bundle.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(
        scripts[
          url.searchParams.get("environment") === "production"
            ? "production"
            : "local"
        ]
      );
      return;
    }
    if (url.pathname === "/style.css") {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(css);
      return;
    }
    if (!url.pathname.startsWith("/api/")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><main class="supplier-dashboard dashboard-canvas"><div id="root"></div></main><script src="/bundle.js?environment=' +
          (url.searchParams.get("environment") === "production"
            ? "production"
            : "local") +
          '"></script></body></html>'
      );
      return;
    }
    const recorded = {
      method: req.method,
      path: url.pathname,
      query: url.search,
    };
    requests.push(recorded);
    const base = "/api/v2/supplier/dataset-drafts";
    if (url.pathname === base + "/catalog-labels") {
      const category =
        categories.find(
          (item) => item.id === url.searchParams.get("primaryCategoryId")
        ) ?? null;
      const source =
        sources.find((item) => item.id === url.searchParams.get("sourceId")) ??
        null;
      json(res, 200, {
        success: true,
        data: { primaryCategory: category, source },
      });
      return;
    }
    if (
      url.pathname === "/api/v1/supplier/categories" ||
      url.pathname === "/api/v1/supplier/sources"
    ) {
      const pageSize = req.headers.referer?.includes("environment=production")
        ? 100
        : 20;
      assert.equal(
        url.searchParams.get("pageSize"),
        String(pageSize),
        "Each creator keeps its real catalogue pageSize parameter"
      );
      const collection = url.pathname.endsWith("categories")
        ? categories
        : sources;
      const query = (url.searchParams.get("q") ?? "").toLowerCase();
      const matching = collection.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
      const page = Number(url.searchParams.get("page") ?? 1);
      json(res, 200, {
        success: true,
        data: {
          items: matching.slice((page - 1) * pageSize, page * pageSize),
          total: matching.length,
          page,
          pageSize,
        },
      });
      return;
    }
    if (
      url.pathname === "/api/v1/supplier/dataset-proposals" &&
      req.method === "GET"
    ) {
      const submitted = url.searchParams.get("scope") === "SUBMITTED";
      const item = {
        id: cuid(9999),
        datasetUniqueId: "KB-EARLIER-1",
        title: submitted
          ? "Existing submitted proposal"
          : "Earlier server draft",
        verificationStatus: submitted ? "SUBMITTED" : "PENDING",
        updatedAt: "2026-10-14T00:00:00.000Z",
        currentUploadId: null,
      };
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const items =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.datasetUniqueId.toLowerCase().includes(q)
          ? [item]
          : [];
      json(res, 200, {
        success: true,
        data: {
          items,
          total: items.length,
          page: 1,
          pageSize: 10,
          summary: {
            total: 1,
            draftsWithCurrentUpload: 0,
            draftsWithoutCurrentUpload: 1,
            byVerificationStatus: {
              PENDING: submitted ? 0 : 1,
              SUBMITTED: submitted ? 1 : 0,
              CHANGES_REQUESTED: 0,
              RESUBMITTED: 0,
              UNDER_REVIEW: 0,
              VERIFIED: 0,
              REJECTED: 0,
            },
          },
        },
      });
      return;
    }
    if (url.pathname === base && req.method === "GET") {
      assert.equal(url.searchParams.get("limit"), "20");
      const query = (url.searchParams.get("q") ?? "").toLowerCase();
      const matching = [...drafts.values()].filter(
        (item) => !query || item.metadata.title.toLowerCase().includes(query)
      );
      const page = Number(url.searchParams.get("page") ?? 1);
      if (query === "speech")
        await new Promise((resolveWait) => setTimeout(resolveWait, 900));
      json(res, 200, {
        success: true,
        data: {
          items: matching.slice((page - 1) * 20, page * 20),
          page,
          limit: 20,
          total: matching.length,
        },
      });
      return;
    }
    const id = url.pathname.startsWith(base + "/")
      ? url.pathname.slice(base.length + 1)
      : null;
    if (id && req.method === "GET") {
      if (flags.failRead === id) {
        json(res, 503, {
          success: false,
          error: { code: "UNAVAILABLE", message: "Fixture read unavailable" },
        });
        return;
      }
      json(
        res,
        drafts.has(id) ? 200 : 404,
        drafts.has(id)
          ? { success: true, data: drafts.get(id) }
          : {
              success: false,
              error: { code: "NOT_FOUND", message: "Draft not found" },
            }
      );
      return;
    }
    if (req.method === "POST" || req.method === "PATCH") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      recorded.body = copy(body);
      const parsed = (
        req.method === "POST"
          ? DatasetPreparationCreateBodySchema
          : DatasetPreparationPatchBodySchema
      ).safeParse(body);
      if (!parsed.success) {
        json(res, 400, {
          success: false,
          error: { code: "INVALID_INPUT", message: "Invalid provided values" },
        });
        return;
      }
      let result;
      if (replays.has(body.requestId))
        result = copy(replays.get(body.requestId));
      else {
        if (req.method === "POST") {
          const createdId = cuid(sequence++);
          result = dto(parsed.data.metadata, createdId);
          drafts.set(createdId, result);
        } else {
          const current = drafts.get(id);
          if (!current || current.generation !== body.expectedGeneration) {
            json(res, 409, {
              success: false,
              error: {
                code: "DRAFT_CHANGED",
                message:
                  "This draft changed. Reload it before saving your changes",
              },
            });
            return;
          }
          result = dto(
            { ...current.metadata, ...parsed.data.changes },
            id,
            current.generation + 1
          );
          drafts.set(id, result);
        }
        replays.set(body.requestId, copy(result));
      }
      if (flags.newerDuringAck) {
        flags.newerDuringAck = false;
        mutate(result.id, {
          description: "Remote description after uncertain acknowledgement",
          title: "Remote concurrent title",
        });
      }
      const acknowledgement = flags.acknowledgement;
      flags.acknowledgement = "";
      if (acknowledgement === "malformed") {
        res.writeHead(req.method === "POST" ? 201 : 200, {
          "Content-Type": "application/json",
        });
        res.end("{not-json");
        return;
      }
      if (acknowledgement === "503") {
        json(res, 503, {
          success: false,
          error: { code: "UNAVAILABLE", message: "Fixture uncertain save" },
        });
        return;
      }
      if (
        acknowledgement === "network" ||
        flags.blockedNetworkRequestId === body.requestId
      ) {
        flags.blockedNetworkRequestId = body.requestId;
        req.socket.destroy();
        return;
      }
      json(res, req.method === "POST" ? 201 : 200, {
        success: true,
        data: result,
      });
      return;
    }
    json(res, 404, {
      success: false,
      error: { code: "NOT_FOUND", message: "Unexpected fixture API" },
    });
  } catch (error) {
    fixtureErrors.push(String(error));
    console.error(error);
    json(res, 500, {
      success: false,
      error: { code: "FIXTURE_ERROR", message: String(error) },
    });
  }
});
await new Promise((resolveListen) =>
  server.listen(0, "127.0.0.1", resolveListen)
);
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
const errors = [];
const external = [];
const sleepReady = (page) =>
  page.getByRole("button", { name: "Save draft", exact: true }).waitFor();
async function step(page, label) {
  await page.getByRole("button", { name: label, exact: true }).click();
}
async function save(page, label = "Save draft") {
  const acknowledgement = page.waitForResponse((response) => {
    const request = response.request();
    return (
      ["POST", "PATCH"].includes(request.method()) &&
      new URL(response.url()).pathname.startsWith(
        "/api/v2/supplier/dataset-drafts"
      )
    );
  });
  await page.getByRole("button", { name: label, exact: true }).click();
  const response = await acknowledgement;
  assert(
    [200, 201].includes(response.status()),
    "A successful save needs an acknowledged mutation response"
  );
  const body = await response.json();
  assert.equal(body.success, true);
  await page.waitForFunction(
    ({ id, generation }) => {
      const status = document.querySelector('[data-preparation-status="true"]');
      return (
        status?.getAttribute("data-saved-id") === id &&
        status.getAttribute("data-saved-generation") === String(generation) &&
        status.textContent.includes("Draft saved")
      );
    },
    { id: body.data.id, generation: body.data.generation }
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Resolve the changed draft", exact: true })
      .count(),
    0
  );
}
async function showNew(page) {
  await page.evaluate(() => window.showEditor());
  await sleepReady(page);
}
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(origin + "/dashboard/datasets/create");
  await page
    .getByRole("heading", { name: "Create proposal", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "Draft proposals", exact: true })
      .getAttribute("href"),
    "/dashboard/datasets"
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Create a dataset proposal", exact: true })
      .count(),
    0
  );
  assert.equal(
    await page
      .getByText("Prepare a Dataset step by step", { exact: true })
      .count(),
    0
  );
  console.log(
    "PASS existing Create proposal route uses one four-step proposal editor"
  );
  assert.deepEqual(await page.evaluate(() => window.runtimeContract), {
    partial: true,
    forged: false,
  });
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Only a title is needed");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Files & contents", exact: true })
    .waitFor();
  const titleOnlyId = page.url().split("/").at(-1);
  assert.deepEqual(drafts.get(titleOnlyId).metadata, {
    title: "Only a title is needed",
  });
  assert.equal(drafts.get(titleOnlyId).readiness.canSubmit, false);
  await page.reload();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Only a title is needed"
  );
  console.log(
    "PASS title-only real save, stable URL, continue and server readback"
  );

  const profiles = [
    {
      name: "Tables and spreadsheets",
      modalities: ["Tables and spreadsheets"],
      field: "What does one record represent?",
      value: "One transaction",
    },
    {
      name: "Speech and other audio",
      modalities: ["Speech and other audio"],
      field: "Recording context",
      value: "Conversation recording",
    },
    {
      name: "Images",
      modalities: ["Images"],
      field: "What do the images show?",
      value: "Product images",
    },
    {
      name: "Video",
      modalities: ["Video"],
      field: "What do the videos show?",
      value: "Assembly recordings",
    },
    {
      name: "Text and documents",
      modalities: ["Text and documents"],
      field: "What does one document or text record represent?",
      value: "One message",
    },
    {
      name: "Sensor readings",
      modalities: ["Sensor readings"],
      field: "Sensor channels and units",
      value: "Untimed temperature measurements; Celsius",
    },
    {
      name: "Mixed egocentric",
      modalities: ["Video", "Sensor readings"],
      field: "Camera mounting position",
      value: "Head-mounted",
      egocentric: true,
    },
  ];
  const choices = ["SAMPLE_ONLY", "FULL_ONLY", "FULL_AND_SAMPLE"];
  for (const profile of profiles)
    for (const choice of choices) {
      await showNew(page);
      await page
        .getByLabel("Dataset title", { exact: true })
        .fill(profile.name + " " + choice);
      await page.locator('input[type="radio"][value="' + choice + '"]').check();
      for (const modality of profile.modalities)
        await page
          .getByRole("checkbox", { name: new RegExp("^" + modality) })
          .check();
      if (profile.egocentric)
        await page
          .getByRole("checkbox", {
            name: "Egocentric / first-person capture",
            exact: true,
          })
          .check();
      await step(page, "2. Files & contents");
      assert.equal(
        await page
          .getByRole("region", { name: "Full material", exact: true })
          .count(),
        choice === "SAMPLE_ONLY" ? 0 : 1
      );
      assert.equal(
        await page
          .getByRole("region", { name: "Sample material", exact: true })
          .count(),
        choice === "FULL_ONLY" ? 0 : 1
      );
      assert.equal(await page.locator('input[type="file"]').count(), 0);
      await step(page, "3. Dataset details");
      await page.getByLabel(profile.field, { exact: true }).fill(profile.value);
      if (profile.name === "Speech and other audio") {
        await page
          .getByLabel("What kind of audio does the collection contain?", {
            exact: true,
          })
          .selectOption("SPEECH");
        await page
          .getByLabel("Spoken languages", { exact: true })
          .pressSequentially("Mandarin Chinese, English");
        assert.equal(
          await page
            .getByLabel("Spoken languages", { exact: true })
            .inputValue(),
          "Mandarin Chinese, English"
        );
        await page
          .getByLabel("Transcript availability", { exact: true })
          .selectOption("ABSENT");
      }
      if (profile.name !== "Tables and spreadsheets")
        assert.equal(
          await page
            .getByLabel("What does one record represent?", { exact: true })
            .count(),
          0
        );
      await save(page);
      const id = page.url().split("/").at(-1);
      assert.equal(drafts.get(id).metadata.uploadChoice, choice);
      assert.equal(drafts.get(id).readiness.canSubmit, false);
      if (profile.name === "Speech and other audio")
        assert.deepEqual(drafts.get(id).metadata.profiles.audio.languages, [
          "Mandarin Chinese",
          "English",
        ]);
      await step(page, "4. Review draft");
      assert(
        await page
          .getByRole("button", {
            name: "Submit for admin review — unavailable",
            exact: true,
          })
          .isDisabled()
      );
      assert.equal(
        await page
          .getByRole("heading", { name: "Saved draft summary", exact: true })
          .count(),
        1
      );
    }
  console.log(
    "PASS all 21 upload-choice/profile paths, conditional questions, raw language typing and unavailable file/Submit controls"
  );

  await showNew(page);
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Scoped sample declaration");
  await page.locator('input[type="radio"][value="FULL_AND_SAMPLE"]').check();
  await page
    .getByLabel("Dataset license", { exact: true })
    .fill("Supplier-stated license");
  await page.getByRole("checkbox", { name: /^Speech and other audio/ }).check();
  await page.getByRole("checkbox", { name: /^Healthcare content/ }).check();
  await step(page, "2. Files & contents");
  for (const [label, value, unit] of [
    ["Declared amount in prepared full material", "200", "HOUR"],
    ["Declared amount in prepared sample", "15", "MINUTE"],
  ]) {
    await page
      .getByLabel("Add a quantity to " + label, { exact: true })
      .selectOption("AUDIO_DURATION");
    await page
      .getByLabel(label + ": Audio duration answer", { exact: true })
      .selectOption("KNOWN");
    await page
      .getByLabel(label + ": Audio duration value", { exact: true })
      .fill(value);
    await page
      .getByLabel(label + ": Audio duration unit", { exact: true })
      .selectOption(unit);
  }
  await step(page, "3. Dataset details");
  await page
    .getByLabel("Add a quantity to Represented collection quantity", {
      exact: true,
    })
    .selectOption("AUDIO_DURATION");
  await page
    .getByLabel("Represented collection quantity: Audio duration answer", {
      exact: true,
    })
    .selectOption("ESTIMATED");
  await page
    .getByLabel("Represented collection quantity: Audio duration value", {
      exact: true,
    })
    .fill("200");
  await page
    .getByLabel("How were personal identifiers handled?", { exact: true })
    .fill("Handling unknown; supplier declaration for private review");
  await save(page);
  const scopedId = page.url().split("/").at(-1);
  assert.equal(
    drafts.get(scopedId).metadata.collectionMeasurements[0].state,
    "ESTIMATED"
  );
  assert.equal(drafts.get(scopedId).metadata.fullMeasurements[0].value, "200");
  assert.equal(drafts.get(scopedId).metadata.sampleMeasurements[0].value, "15");
  await step(page, "4. Review draft");
  await page.getByText("Supplier-stated license", { exact: true }).waitFor();
  await page
    .getByText("Audio duration: 200 hours (supplier estimate)", { exact: true })
    .waitFor();
  await page
    .getByText("Audio duration: 15 minutes (supplier-declared)", {
      exact: true,
    })
    .waitFor();
  console.log(
    "PASS separate represented/full/sample declarations, stated license and private healthcare preparation"
  );

  await step(page, "1. Basics");
  for (let pageIndex = 0; pageIndex < 5; pageIndex++) {
    await page
      .getByRole("button", { name: "Load more categories", exact: true })
      .click();
    await page
      .getByText(
        String(Math.min((pageIndex + 2) * 20, 113)) +
          " of 113 matching categories loaded.",
        { exact: true }
      )
      .waitFor();
  }
  await page
    .getByLabel("Primary category", { exact: true })
    .selectOption(categories[112].id);
  await page
    .getByRole("button", { name: "Load more sources", exact: true })
    .click();
  await page
    .getByText("40 of 42 matching sources loaded.", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Load more sources", exact: true })
    .click();
  await page
    .getByText("42 of 42 matching sources loaded.", { exact: true })
    .waitFor();
  await page
    .getByLabel("Data source", { exact: true })
    .selectOption(sources[41].id);
  await page.getByLabel("Search categories", { exact: true }).fill("Subject 2");
  await page
    .getByRole("button", { name: "Search categories", exact: true })
    .click();
  await page
    .getByText("11 of 11 matching categories loaded.", { exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Primary category", { exact: true }).inputValue(),
    categories[112].id
  );
  await save(page);
  await page.reload();
  await page
    .getByLabel("Primary category", { exact: true })
    .locator("option", { hasText: "Subject 113" })
    .waitFor({ state: "attached" });
  await page
    .getByLabel("Data source", { exact: true })
    .locator("option", { hasText: "Source 42" })
    .waitFor({ state: "attached" });
  assert.equal(
    await page.getByLabel("Data source", { exact: true }).inputValue(),
    sources[41].id
  );
  console.log(
    "PASS actual pageSize catalogue pagination beyond 100, selection retention through search and current-label readback"
  );

  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Local title survives stale save");
  mutate(scopedId, { description: "A newer remote description" });
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByText(
      "Another save changed this draft. Your local answers have been kept.",
      { exact: true }
    )
    .waitFor();
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Local title survives stale save"
  );
  await page
    .getByRole("button", { name: "Review latest saved draft", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await save(page);
  assert.equal(
    drafts.get(scopedId).metadata.title,
    "Local title survives stale save"
  );
  assert.equal(
    drafts.get(scopedId).metadata.description,
    "A newer remote description"
  );
  console.log(
    "PASS conflict keeps local input and explicitly reapplies only edited fields over newer saved data"
  );

  for (const acknowledgement of ["malformed", "503", "network"]) {
    await page
      .getByLabel("Dataset title", { exact: true })
      .fill("Retry " + acknowledgement);
    flags.acknowledgement = acknowledgement;
    const start = requests.length;
    const originalGeneration = drafts.get(scopedId).generation;
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    try {
      await page
        .getByRole("button", { name: "Retry save", exact: true })
        .waitFor();
    } catch (error) {
      console.error("Uncertain-save diagnostic", {
        acknowledgement,
        requests: requests.slice(start),
        status: await page.getByRole("status").allTextContents(),
        alerts: await page.getByRole("alert").allTextContents(),
      });
      throw error;
    }
    assert(
      await page.getByLabel("Dataset title", { exact: true }).isDisabled()
    );
    flags.blockedNetworkRequestId = "";
    await save(page, "Retry save");
    const attempts = requests
      .slice(start)
      .filter((request) => request.method === "PATCH");
    if (acknowledgement === "network")
      assert(
        attempts.length >= 2,
        "Network retransmission and manual retry must share one mutation"
      );
    else assert.equal(attempts.length, 2);
    for (const attempt of attempts)
      assert.deepEqual(attempt.body, attempts[0].body);
    assert.equal(
      drafts.get(scopedId).generation,
      originalGeneration + 1,
      "All retries acknowledge one committed mutation"
    );
  }
  console.log(
    "PASS uncertain JSON/HTTP5xx/network results retry the identical request/body without duplicate saves"
  );

  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Intended delta after lost acknowledgement");
  flags.acknowledgement = "malformed";
  flags.newerDuringAck = true;
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await page
    .getByRole("heading", { name: "Resolve the changed draft", exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Intended delta after lost acknowledgement"
  );
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await save(page);
  assert.equal(
    drafts.get(scopedId).metadata.title,
    "Intended delta after lost acknowledgement"
  );
  assert.equal(
    drafts.get(scopedId).metadata.description,
    "Remote description after uncertain acknowledgement"
  );
  console.log(
    "PASS replayed older acknowledgement retains original edit delta and newer unedited fields"
  );

  flags.failRead = scopedId;
  const createCount = requests.filter(
    (request) => request.method === "POST"
  ).length;
  await page.reload();
  await page.getByText("Fixture read unavailable", { exact: true }).waitFor();
  assert(
    await page
      .getByRole("button", { name: "Save draft", exact: true })
      .isDisabled()
  );
  assert(await page.getByLabel("Dataset title", { exact: true }).isDisabled());
  assert.equal(
    requests.filter((request) => request.method === "POST").length,
    createCount
  );
  flags.failRead = "";
  await page
    .getByRole("button", { name: "Reload saved draft", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  console.log(
    "PASS failed existing-draft reads cannot silently create a new draft"
  );

  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Unsaved navigation input");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("link", { name: "Draft proposals", exact: true })
    .click();
  assert.equal(page.url().split("/").at(-1), scopedId);
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Unsaved navigation input"
  );
  await save(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "3. Dataset details", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByLabel("What collection does this Dataset cover?", { exact: true })
    .waitFor();
  await page
    .getByLabel("What collection does this Dataset cover?", { exact: true })
    .fill("Mobile keyboard-accessible boundary");
  await save(page);
  assert(
    (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390,
    "Mobile form must not overflow horizontally"
  );
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-entry-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await step(page, "1. Basics");
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-entry-light.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-entry-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.setViewportSize({ width: 390, height: 844 });
  console.log(
    "PASS dirty SPA navigation protection, keyboard steps and narrow-screen save with actual generated dashboard CSS"
  );

  await page.goto(origin + "/dashboard/datasets");
  await page.getByRole("heading", { name: "My Drafts", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "Only a title is needed", exact: true })
      .count(),
    1
  );
  await page
    .getByRole("button", { name: "Next draft page", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Unsaved navigation input", exact: true })
    .waitFor();
  await page
    .getByRole("link", { name: "Earlier server draft", exact: true })
    .first()
    .waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "Earlier server draft", exact: true })
      .first()
      .getAttribute("href"),
    "/dashboard/datasets/" + cuid(9999)
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Create proposal", exact: true })
      .count(),
    1
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Prepare a Dataset", exact: true })
      .count(),
    0
  );
  const resumeLink = page
    .getByRole("link", { name: "Unsaved navigation input", exact: true })
    .first();
  assert.equal(
    await resumeLink.getAttribute("href"),
    "/dashboard/datasets/drafts/" + scopedId
  );
  const newDrafts = page.getByRole("region", {
    name: "Draft proposals",
    exact: true,
  });
  const lateSearch = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === "/api/v2/supplier/dataset-drafts" &&
      url.searchParams.get("q") === "Speech"
    );
  });
  const slowRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname === "/api/v2/supplier/dataset-drafts" &&
      url.searchParams.get("q") === "Speech"
    );
  });
  await page
    .getByLabel("Search draft proposals", { exact: true })
    .fill("Speech");
  await slowRequest;
  await page
    .getByLabel("Search draft proposals", { exact: true })
    .fill("Only a title");
  await newDrafts.getByText("1 draft in this view", { exact: true }).waitFor();
  await lateSearch;
  assert.equal(
    await newDrafts.getByText("1 draft in this view", { exact: true }).count(),
    1
  );
  console.log(
    "PASS late draft search responses cannot replace newer search results"
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Next draft page", exact: true })
      .count(),
    0
  );
  await page
    .getByRole("link", { name: "Only a title is needed", exact: true })
    .first()
    .click();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  assert.equal(
    new URL(page.url()).pathname,
    "/dashboard/datasets/drafts/" + titleOnlyId
  );
  console.log(
    "PASS same My Drafts workspace, bounded paginated/searchable new drafts and unchanged earlier draft links"
  );
  for (const [oldPath, expected] of [
    ["/prepare", ""],
    ["/prepare/new", "/create"],
    ["/prepare/" + scopedId, "/drafts/" + scopedId],
  ]) {
    await page.goto(origin + "/dashboard/datasets" + oldPath);
    await page.waitForURL(origin + "/dashboard/datasets" + expected);
  }
  const beforeSubmitted = requests.length;
  await page.goto(origin + "/dashboard/datasets?status=submitted");
  await page
    .getByRole("link", { name: "Existing submitted proposal", exact: true })
    .first()
    .waitFor();
  assert(
    !requests
      .slice(beforeSubmitted)
      .some((request) =>
        request.path.startsWith("/api/v2/supplier/dataset-drafts")
      )
  );
  console.log(
    "PASS old preparation bookmarks redirect and historical submitted proposal view remains unchanged"
  );
  await showNew(page);
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("New draft with lost acknowledgement");
  const beforeCreateRetry = requests.length;
  const beforeDraftCount = drafts.size;
  flags.acknowledgement = "malformed";
  flags.newerDuringAck = true;
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await page
    .getByRole("heading", { name: "Resolve the changed draft", exact: true })
    .waitFor();
  const replayedCreateId = page.url().split("/").at(-1);
  assert(
    drafts.has(replayedCreateId),
    "A replayed create must reserve its stable resume URL before conflict resolution"
  );
  assert.equal(drafts.size, beforeDraftCount + 1);
  const createAttempts = requests
    .slice(beforeCreateRetry)
    .filter((request) => request.method === "POST");
  assert.equal(createAttempts.length, 2);
  assert.deepEqual(createAttempts[0].body, createAttempts[1].body);
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await save(page);
  assert.equal(
    drafts.get(replayedCreateId).metadata.title,
    "New draft with lost acknowledgement"
  );
  assert.equal(
    drafts.get(replayedCreateId).metadata.description,
    "Remote description after uncertain acknowledgement"
  );
  await page.reload();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "New draft with lost acknowledgement"
  );
  console.log(
    "PASS uncertain CREATE replay retains stable URL and original delta across newer saves and reload"
  );

  await page.evaluate((id) => window.showEditor(id), titleOnlyId);
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  await page
    .getByRole("checkbox", { name: /^Tables and spreadsheets/ })
    .check();
  await step(page, "3. Dataset details");
  await page
    .getByLabel("What does one record represent?", { exact: true })
    .fill("A locally declared transaction");
  mutate(titleOnlyId, {
    profiles: { images: { subject: "Unedited remote image description" } },
  });
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("button", { name: "Review latest saved draft", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await save(page);
  assert.equal(
    drafts.get(titleOnlyId).metadata.profiles.tabular.recordUnit,
    "A locally declared transaction"
  );
  assert.equal(
    drafts.get(titleOnlyId).metadata.profiles.images.subject,
    "Unedited remote image description"
  );
  console.log(
    "PASS newly introduced nested answers reapply without losing unedited remote profile fields"
  );

  const beforeProduction = requests.length;
  const productionPage = await browser.newPage();
  await productionPage.goto(
    origin + "/dashboard/datasets/create?environment=production"
  );
  await productionPage
    .getByRole("heading", { name: "Create a dataset proposal", exact: true })
    .waitFor();
  assert.equal(
    await productionPage
      .getByRole("heading", { name: "Prepare a Dataset" })
      .count(),
    0
  );
  assert.equal(
    await productionPage.evaluate(() => window.tryProductionWrite()),
    "NOT_ENABLED"
  );
  assert(
    !requests
      .slice(beforeProduction)
      .some((request) =>
        request.path.startsWith("/api/v2/supplier/dataset-drafts")
      )
  );
  for (const path of [
    "/prepare",
    "/prepare/new",
    "/drafts/" + scopedId,
    "/drafts/new",
    "/drafts/bad-id",
  ]) {
    await productionPage.goto(
      origin + "/dashboard/datasets" + path + "?environment=production"
    );
    await productionPage
      .getByRole("heading", { name: "Not found", exact: true })
      .waitFor();
  }
  await page.goto(origin + "/dashboard/datasets/drafts/bad-id");
  await page.getByRole("heading", { name: "Not found", exact: true }).waitFor();
  await productionPage.close();
  assert(
    !requests.some((request) =>
      /submit|upload|presign|publish|payment/.test(request.path)
    )
  );
  assert.deepEqual(fixtureErrors, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    "PASS production UI/API guard, pinned browser runtime and zero intake/submission/payment effects"
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolveClose) => server.close(resolveClose));
}
