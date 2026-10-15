import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import {
  DatasetPreparationResponseSchema,
  DatasetPreparationPatchBodySchema,
  DatasetFilesContextBodySchema,
  DatasetFilesContextResponseSchema,
  DatasetFilesInventoryPageResponseSchema,
  DatasetFilesMutationBodySchema,
  DatasetMaterialMutationResponseSchema,
  DatasetIntakeConfigResponseSchema,
  DatasetUploadAdmissionBodySchema,
  DatasetUploadActionBodySchema,
  DatasetUploadCancelBodySchema,
  DatasetUploadAttemptResponseSchema,
  DatasetUploadAttemptStatusResponseSchema,
  DatasetUploadPartsPageResponseSchema,
  DatasetUploadPartQuerySchema,
  DatasetUploadsPageResponseSchema,
} from "@kuinbee/dataset-preparation-contracts";

// Real rendered editor, native File/Blob/WebCrypto and HTTP requests against a
// bounded synthetic service. This qualifies UI orchestration, never the native
// scanner, cloud provider, 2 GB transfer, or hosted deployment.
const require = createRequire(import.meta.url);
const postcss = require(
  require.resolve("postcss", {
    paths: [require.resolve("@tailwindcss/postcss")],
  })
);
const css =
  (
    await postcss([
      require("@tailwindcss/postcss")({ base: process.cwd() }),
    ]).process(await readFile("src/app/globals.css", "utf8"), {
      from: resolve("src/app/globals.css"),
    })
  ).css +
  "\n" +
  (await readFile("src/app/dashboard/dashboard.css", "utf8"));
const bundle = await build({
  stdin: {
    contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {QueryProvider} from './src/components/QueryProvider';
    import {DashboardShell} from './src/components/layout/DashboardShell';
    import {DatasetPreparationEditor} from './src/components/datasets/preparation/DatasetPreparationEditor';
    const root=createRoot(document.getElementById('root'));let mount=0;
    window.mount=(id)=>root.render(<React.StrictMode><QueryProvider><DashboardShell><DatasetPreparationEditor key={++mount} draftId={id}/></DashboardShell></QueryProvider></React.StrictMode>);
    window.mount(window.location.pathname.split('/').at(-1));
  `,
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
  },
  plugins: [
    {
      name: "local-next-fixture",
      setup(builder) {
        builder.onResolve(
          { filter: /^next\/(link|navigation|image)$/ },
          (args) => ({ path: args.path, namespace: "fixture" })
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          loader: "jsx",
          resolveDir: process.cwd(),
          contents:
            args.path === "next/link"
              ? "import React from 'react';export default function Link(p){return <a {...p}/>}"
              : args.path === "next/image"
                ? "import React from 'react';export default function Image({priority,fill,quality,unoptimized,...p}){return <img {...p}/>}"
                : "export function usePathname(){return window.location.pathname}export function useRouter(){return {push:()=>{},replace:()=>{}}}export function useSearchParams(){return new URLSearchParams()}",
        }));
      },
    },
  ],
});
const id = (value) => "c" + String(value).padStart(24, "0");
let sequence = 1000;
const newId = () => id(sequence++);
const partBytes = 5 * 1024 * 1024;
const drafts = new Map(),
  attempts = new Map(),
  receipts = new Map();
const requests = [],
  fixtureErrors = [],
  browserErrors = [],
  external = [];
const flags = { closed: false, lose: null, holdPart: null, failChecks: false };
const held = new Set();
const choices = ["SAMPLE_ONLY", "FULL_ONLY", "FULL_AND_SAMPLE"];
const capabilities = [
  ["UTF8_CSV_SYNTAX_V1", ".csv", "text/csv"],
  ["UTF8_TSV_SYNTAX_V1", ".tsv", "text/tab-separated-values"],
  ["UTF8_JSONL_SYNTAX_V1", ".jsonl", "application/x-ndjson"],
  ["RIFF_INTEGER_PCM_WAVE_V1", ".wav", "audio/wav"],
  ["PNG_STATIC_8BIT_V1", ".png", "image/png"],
  ["ZIP32_CONTAINER_V1", ".zip", "application/zip"],
].map(([profileId, extension, mime]) => ({
  profileId,
  maximumObjectBytes: "2000000000",
  choices,
  extensions: [extension],
  mimeTypes: [mime],
}));
function seed(choice) {
  const draft = {
    id: newId(),
    contentId: newId(),
    generation: 0,
    contentGeneration: 0,
    sourceGeneration: 0,
    members: [],
    protectedObjects: new Set(),
    metadata: {
      title: "Dataset uploader exercise",
      uploadChoice: choice,
      modalities: ["TABULAR"],
    },
  };
  drafts.set(draft.id, draft);
  return draft;
}
function dto(draft) {
  return DatasetPreparationResponseSchema.parse({
    contractVersion: 1,
    id: draft.id,
    generation: draft.generation,
    metadata: draft.metadata,
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
    readiness: {
      canSubmit: false,
      issues: [
        {
          code: "SUBMISSION_NOT_ENABLED",
          message: "Submission stays separate from upload.",
        },
      ],
    },
  });
}
function scopedAttempts(draft) {
  return [...attempts.values()].filter((item) => item.rootId === draft.id);
}
function account(draft, limit) {
  const items =
    limit === "5000000000" ? scopedAttempts(draft) : [...attempts.values()];
  const retained = items.reduce(
    (sum, item) => sum + BigInt(item.retainedBytes),
    0n
  );
  const reserved = items.reduce(
      (sum, item) => sum + BigInt(item.reservedBytes),
      0n
    ),
    charged = retained + reserved;
  return {
    limitBytes: limit,
    retainedBytes: String(retained),
    reservedBytes: String(reserved),
    chargedBytes: String(charged),
    remainingBytes: String(
      charged < BigInt(limit) ? BigInt(limit) - charged : 0n
    ),
  };
}
function context(draft) {
  return DatasetFilesContextResponseSchema.parse({
    contractVersion: 1,
    preparationId: draft.id,
    preparationGeneration: draft.generation,
    contentId: draft.contentId,
    contentGeneration: draft.contentGeneration,
    sourcePreparationGeneration: draft.sourceGeneration,
    serverUploadChoice: draft.metadata.uploadChoice,
    editable: true,
    synchronizationRequired: draft.generation !== draft.sourceGeneration,
    usage: {
      state: "ACCOUNTED",
      dataset: account(draft, "5000000000"),
      supplier: account(draft, "100000000000"),
    },
    admission: { enabled: false, reason: "INTAKE_NOT_ENABLED" },
  });
}
function status(item) {
  const { parts, protected: ignored, ...value } = item;
  void parts;
  void ignored;
  return DatasetUploadAttemptStatusResponseSchema.parse(value);
}
function ack(item, requestId) {
  const value = status(item);
  delete value.uploadObjectId;
  return DatasetUploadAttemptResponseSchema.parse({
    ...value,
    requestId,
    eligibility: "NOT_ACCEPTED",
  });
}
function json(res, code, value) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
}
const ok = (res, value) => json(res, 200, { success: true, data: value });
const deny = (res, code, message) =>
  json(res, 409, { success: false, error: { code, message } });
function sameContext(draft, body) {
  return (
    body.expectedPreparationGeneration === draft.generation &&
    body.expectedContentId === draft.contentId &&
    (body.expectedContentGeneration ?? body.expectedGeneration) ===
      draft.contentGeneration &&
    draft.sourceGeneration === draft.generation
  );
}
function accept(item) {
  item.state = flags.failChecks ? "REJECTED" : "ACCEPTED";
  item.eligibility = flags.failChecks ? "NOT_ACCEPTED" : "ACCEPTED";
  item.uploadObjectId = flags.failChecks ? null : newId();
  item.revision++;
}
function member(draft, item, component = item.component) {
  return {
    id: newId(),
    contentId: draft.contentId,
    uploadObjectId: item.uploadObjectId,
    component,
    role: item.role,
    relativePath: null,
    groupId: null,
    originalFileName: item.originalName,
    measuredSizeBytes: item.expectedBytes,
    inspection: {
      securityState: "ACCEPTED",
      currentEvidenceId: newId(),
      recordedOutcome: "PASS",
      current: true,
      eligibility: "NOT_EVALUATED",
    },
  };
}
function saveReceipt(res, key, body, value, kind) {
  receipts.set(key, {
    body: structuredClone(body),
    value: structuredClone(value),
    kind,
  });
  if (flags.lose === kind) {
    res.destroy();
    return;
  }
  ok(res, value);
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://fixture.test");
    if (url.pathname === "/bundle.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(bundle.outputFiles[0].text);
      return;
    }
    if (url.pathname === "/style.css") {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(css);
      return;
    }
    if (/^\/logo-(light|dark)\.png$/.test(url.pathname)) {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(await readFile(resolve("public", url.pathname.slice(1))));
      return;
    }
    if (!url.pathname.startsWith("/api/")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
      );
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks),
      body =
        bytes.length &&
        req.headers["content-type"]?.startsWith("application/json")
          ? JSON.parse(bytes)
          : null;
    requests.push({
      method: req.method,
      path: url.pathname,
      query: url.search,
      body: structuredClone(body),
      bytes: bytes.length,
    });
    if (url.pathname.endsWith("/catalog-labels")) {
      ok(res, { primaryCategory: null, source: null });
      return;
    }
    if (/^\/api\/v1\/supplier\/(categories|sources)$/.test(url.pathname)) {
      ok(res, { items: [], total: 0 });
      return;
    }
    const match = url.pathname.match(
      /^\/api\/v2\/supplier\/dataset-drafts\/([^/]+)(?:\/(.*))?$/
    );
    if (!match || !drafts.has(match[1])) {
      json(res, 404, {
        success: false,
        error: { code: "NOT_FOUND", message: "Fixture path not found" },
      });
      return;
    }
    const draft = drafts.get(match[1]),
      tail = match[2] ?? "";
    // This upload-only fixture does not qualify the separate review workflow.
    // Owned read probes may be unavailable; workflow writes still fail below.
    if (
      req.method === "GET" &&
      ["workflow", "readiness", "edit-context", "edit-base"].includes(tail)
    ) {
      json(res, 404, {
        success: false,
        error: {
          code: "NOT_FOUND",
          message:
            "Review workflow is not configured in the upload-only fixture",
        },
      });
      return;
    }
    if (!tail && req.method === "GET") {
      ok(res, dto(draft));
      return;
    }
    if (!tail && req.method === "PATCH") {
      const parsed = DatasetPreparationPatchBodySchema.parse(body);
      const replayKey = draft.id + ":" + parsed.requestId;
      const prior = receipts.get(replayKey);
      if (prior) {
        assert.deepEqual(body, prior.body);
        if (flags.lose === "SAVE") res.destroy();
        else ok(res, prior.value);
        return;
      }
      if (parsed.expectedGeneration !== draft.generation) {
        deny(res, "DRAFT_CHANGED", "Saved details changed.");
        return;
      }
      draft.metadata = { ...draft.metadata, ...parsed.changes };
      draft.generation++;
      saveReceipt(res, replayKey, body, dto(draft), "SAVE");
      return;
    }
    if (tail === "files-context" && req.method === "GET") {
      ok(res, context(draft));
      return;
    }
    if (tail === "intake-config") {
      const ready =
        !flags.closed &&
        draft.generation === draft.sourceGeneration &&
        Boolean(draft.metadata.uploadChoice);
      ok(
        res,
        DatasetIntakeConfigResponseSchema.parse({
          context: context(draft),
          maximumFileBytes: "2000000000",
          admission: ready
            ? { enabled: true, reason: null, policyVersion: "synthetic-ui-v1" }
            : {
                enabled: false,
                reason: "INTAKE_PAUSED",
                policyVersion: "synthetic-ui-v1",
              },
          capabilities: ready ? capabilities : [],
          transport: ready
            ? {
                kind: "BOUNDED_PARTS_V1",
                partBytes,
                maximumParts: 10000,
                mediaType: "application/octet-stream",
                partPathTemplate:
                  "/api/v2/supplier/dataset-drafts/{draftId}/uploads/{attemptId}/parts/{partNumber}",
              }
            : null,
        })
      );
      return;
    }
    if (tail === "uploads" && req.method === "GET") {
      const after = url.searchParams.get("afterId"),
        all = scopedAttempts(draft)
          .sort((a, b) => a.id.localeCompare(b.id))
          .filter((item) => !after || item.id > after);
      const items = all.slice(0, 20).map(status);
      ok(
        res,
        DatasetUploadsPageResponseSchema.parse({
          preparationId: draft.id,
          items,
          nextCursor: all.length > 20 ? { afterId: items.at(-1).id } : null,
        })
      );
      return;
    }
    if (tail === "files" && req.method === "GET") {
      if (
        Number(url.searchParams.get("contentGeneration")) !==
        draft.contentGeneration
      ) {
        deny(res, "DRAFT_CHANGED", "File inventory changed.");
        return;
      }
      const after = url.searchParams.get("afterId"),
        all = draft.members.filter((item) => !after || item.id > after),
        items = all.slice(0, 20);
      ok(
        res,
        DatasetFilesInventoryPageResponseSchema.parse({
          preparationId: draft.id,
          preparationGeneration: draft.generation,
          contentId: draft.contentId,
          contentGeneration: draft.contentGeneration,
          sourcePreparationGeneration: draft.sourceGeneration,
          items,
          nextCursor:
            all.length > 20
              ? {
                  contentId: draft.contentId,
                  contentGeneration: draft.contentGeneration,
                  afterId: items.at(-1).id,
                }
              : null,
        })
      );
      return;
    }
    const key = body?.requestId ? draft.id + ":" + body.requestId : null;
    if (key && receipts.has(key)) {
      const prior = receipts.get(key);
      assert.deepEqual(body, prior.body);
      if (flags.lose === prior.kind) {
        res.destroy();
        return;
      }
      ok(res, prior.value);
      return;
    }
    if (tail === "files-context" && req.method === "POST") {
      DatasetFilesContextBodySchema.parse(body);
      if (
        body.expectedPreparationGeneration !== draft.generation ||
        body.expectedContentId !== draft.contentId ||
        body.expectedContentGeneration !== draft.contentGeneration
      ) {
        deny(res, "DRAFT_CHANGED", "Draft changed.");
        return;
      }
      draft.contentGeneration++;
      draft.sourceGeneration = draft.generation;
      saveReceipt(
        res,
        key,
        body,
        { ...context(draft), requestId: body.requestId },
        "SYNCHRONIZE"
      );
      return;
    }
    if (tail === "files" && req.method === "PATCH") {
      DatasetFilesMutationBodySchema.parse(body);
      if (!sameContext(draft, body)) {
        deny(
          res,
          "DRAFT_CHANGED",
          "File selection changed. Refresh before changing files."
        );
        return;
      }
      const results = body.operations.map((operation, index) => {
        if (operation.operation === "ADD_MEMBER") {
          const item = scopedAttempts(draft).find(
            (value) =>
              value.uploadObjectId === operation.uploadObjectId &&
              value.state === "ACCEPTED"
          );
          assert(item);
          const added = member(draft, item, operation.component);
          draft.members.push(added);
          return { index, operation: operation.operation, id: added.id };
        }
        assert.equal(operation.operation, "REMOVE_MEMBER");
        const indexOf = draft.members.findIndex(
          (item) => item.id === operation.memberId
        );
        assert(indexOf >= 0);
        draft.members.splice(indexOf, 1);
        return {
          index,
          operation: operation.operation,
          id: operation.memberId,
        };
      });
      draft.contentGeneration++;
      saveReceipt(
        res,
        key,
        body,
        DatasetMaterialMutationResponseSchema.parse({
          requestId: body.requestId,
          contentId: draft.contentId,
          generation: draft.contentGeneration,
          results,
        }),
        "MEMBERS"
      );
      return;
    }
    if (tail === "uploads" && req.method === "POST") {
      DatasetUploadAdmissionBodySchema.parse(body);
      if (flags.closed || !sameContext(draft, body)) {
        deny(res, "DRAFT_CHANGED", "Save and update files before uploading.");
        return;
      }
      const item = {
        id: newId(),
        rootId: draft.id,
        contentId: draft.contentId,
        component: body.component,
        role: body.role,
        inspectionProfile: body.inspectionProfile,
        originalName: body.originalName,
        expectedBytes: body.expectedBytes,
        retainedBytes: "0",
        reservedBytes: body.expectedBytes,
        partBytes,
        totalParts: Math.ceil(Number(body.expectedBytes) / partBytes),
        state: "RECEIVING",
        revision: 1,
        recoveryEpoch: 7,
        expiresAt: "2030-01-01T00:00:00.000Z",
        eligibility: "NOT_ACCEPTED",
        uploadObjectId: null,
        parts: [],
      };
      item.parts = Array.from({ length: item.totalParts }, (_, index) => ({
        partNumber: index + 1,
        expectedBytes: Math.min(
          partBytes,
          Number(body.expectedBytes) - index * partBytes
        ),
        measuredBytes: null,
        state: "PENDING",
        receivedAt: null,
        checksumSha256: null,
      }));
      attempts.set(item.id, item);
      saveReceipt(res, key, body, ack(item, body.requestId), "ADMIT");
      return;
    }
    const upload = tail.match(/^uploads\/([^/]+)(?:\/(.*))?$/),
      item = upload && attempts.get(upload[1]);
    assert(item && item.rootId === draft.id, "Owned upload fixture path");
    const action = upload[2] ?? "";
    if (!action && req.method === "GET") {
      ok(res, status(item));
      return;
    }
    if (action === "parts" && req.method === "GET") {
      if (
        Number(url.searchParams.get("expectedAttemptRevision")) !==
        item.revision
      ) {
        deny(res, "UPLOAD_CHANGED", "Upload changed.");
        return;
      }
      ok(
        res,
        DatasetUploadPartsPageResponseSchema.parse({
          preparationId: draft.id,
          attemptId: item.id,
          attemptRevision: item.revision,
          recoveryEpoch: item.recoveryEpoch,
          totalParts: item.totalParts,
          items: item.parts,
          nextCursor: null,
        })
      );
      return;
    }
    if (action.startsWith("parts/") && req.method === "PUT") {
      DatasetUploadPartQuerySchema.parse(Object.fromEntries(url.searchParams));
      assert.equal(req.headers["content-type"], "application/octet-stream");
      const part = item.parts[Number(action.split("/")[1]) - 1];
      assert(part);
      assert.equal(part.state, "PENDING");
      assert.equal(bytes.length, part.expectedBytes);
      if (flags.holdPart === part.partNumber) {
        held.add(item.id);
        await new Promise((resolveWait) => {
          res.once("close", resolveWait);
        });
        held.delete(item.id);
        return;
      }
      part.state = "RECEIVED";
      part.measuredBytes = bytes.length;
      part.receivedAt = "2026-10-16T00:00:00.000Z";
      part.checksumSha256 = createHash("sha256").update(bytes).digest("hex");
      item.retainedBytes = String(
        BigInt(item.retainedBytes) + BigInt(bytes.length)
      );
      item.reservedBytes = String(
        BigInt(item.reservedBytes) - BigInt(bytes.length)
      );
      item.revision++;
      ok(res, status(item));
      return;
    }
    if (action === "finalize") {
      DatasetUploadActionBodySchema.parse(body);
      if (!sameContext(draft, body)) {
        deny(res, "DRAFT_CHANGED", "Saved details changed.");
        return;
      }
      assert.equal(item.retainedBytes, item.expectedBytes);
      item.state = "CHECKING";
      item.revision++;
      saveReceipt(res, key, body, ack(item, body.requestId), "FINALIZE");
      return;
    }
    if (action === "cancel" || action === "remove") {
      DatasetUploadCancelBodySchema.parse(body);
      assert.equal(body.expectedAttemptRevision, item.revision);
      assert.equal(body.expectedRecoveryEpoch, item.recoveryEpoch);
      if (
        action === "remove" &&
        (draft.members.some(
          (member) => member.uploadObjectId === item.uploadObjectId
        ) ||
          draft.protectedObjects.has(item.uploadObjectId))
      ) {
        deny(
          res,
          "FILE_REFERENCED",
          "This file protects a selected draft or historical access and cannot be deleted."
        );
        return;
      }
      item.state = "CANCEL_REQUESTED";
      item.eligibility = "NOT_ACCEPTED";
      item.uploadObjectId = null;
      item.revision++;
      saveReceipt(
        res,
        key,
        body,
        ack(item, body.requestId),
        action === "remove" ? "REMOVE" : "CANCEL"
      );
      return;
    }
    throw new Error("Unexpected fixture action " + req.method + " " + tail);
  } catch (failure) {
    fixtureErrors.push(failure.stack);
    json(res, 500, {
      success: false,
      error: { code: "FIXTURE_ERROR", message: failure.message },
    });
  }
});
await new Promise((resolveListen) =>
  server.listen(0, "127.0.0.1", resolveListen)
);
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
const file = (name, buffer = Buffer.from("id,value\n1,a\n")) => ({
  name,
  mimeType: "application/octet-stream",
  buffer,
});
const namedButton = (page, name) =>
  page.getByRole("button", {
    name:
      {
        Basics: "1. Basics",
        "Files & contents": "2. Files & contents",
        "Review draft": "4. Review draft",
      }[name] ?? name,
    exact: true,
  });
async function filesStep(page) {
  await namedButton(page, "Files & contents").click();
  await page
    .getByRole("heading", { name: "Upload files", exact: true })
    .waitFor();
}
async function open(page, draft) {
  await page.goto(origin + "/dashboard/datasets/drafts/" + draft.id);
  await page.getByLabel("Dataset title", { exact: true }).waitFor();
  await filesStep(page);
}
async function choose(page, fixtureFile, format = "UTF8_CSV_SYNTAX_V1") {
  await page.getByLabel("File format", { exact: true }).selectOption(format);
  if (format === "UTF8_CSV_SYNTAX_V1" || format === "UTF8_TSV_SYNTAX_V1")
    await page
      .getByLabel("CSV / TSV first row", { exact: true })
      .selectOption("PRESENT");
  if (format === "UTF8_JSONL_SYNTAX_V1")
    await page
      .getByLabel("JSON Lines records", { exact: true })
      .selectOption("OBJECT");
  if (format === "ZIP32_CONTAINER_V1") {
    await page
      .getByRole("checkbox", { name: "CSV · UTF-8 text", exact: true })
      .check();
    await page
      .getByLabel("CSV / TSV first row", { exact: true })
      .selectOption("PRESENT");
  }
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(fixtureFile);
}
const uploadRow = (page, item) =>
  page.locator(`[data-upload-attempt="${item.id}"]`);
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 1000 },
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });

  // Every creation choice reaches receipt/check/selection through the real UI.
  for (const capability of capabilities)
    for (const choice of choices) {
      const draft = seed(choice);
      await open(page, draft);
      const components =
        choice === "FULL_AND_SAMPLE"
          ? ["FULL", "SAMPLE"]
          : [choice === "FULL_ONLY" ? "FULL" : "SAMPLE"];
      for (const component of components) {
        if (components.length > 1)
          await page
            .getByLabel("Upload to", { exact: true })
            .selectOption(component);
        await choose(
          page,
          file(component.toLowerCase() + capability.extensions[0]),
          capability.profileId
        );
        await namedButton(page, "Upload file").click();
        await page
          .getByText(
            "All file bytes were received. Choose Finish upload to start backend checks.",
            { exact: true }
          )
          .waitFor();
        const item = scopedAttempts(draft).at(-1),
          row = uploadRow(page, item);
        assert.equal(item.component, component);
        assert.equal(item.retainedBytes, item.expectedBytes);
        assert.equal(
          await row.getByRole("button", { name: /Use/ }).count(),
          0,
          "Receipt alone cannot select a file"
        );
        await row
          .getByRole("button", { name: "Finish upload", exact: true })
          .click();
        await row.getByText(/Backend checks in progress/).waitFor();
        accept(item);
        await namedButton(page, "Refresh upload status").click();
        const before = draft.members.length;
        await row
          .getByRole("button", {
            name:
              component === "FULL" ? "Use in full dataset" : "Use as sample",
            exact: true,
          })
          .click();
        await row
          .getByText("Selected in this draft", { exact: true })
          .waitFor();
        assert.equal(draft.members.length, before + 1);
        assert.equal(draft.members.at(-1).uploadObjectId, item.uploadObjectId);
      }
      assert.deepEqual(
        draft.members.map((member) => member.component),
        components
      );
      await namedButton(page, "Review draft").click();
      assert(
        await namedButton(page, "Submit proposal for admin review").isDisabled()
      );
    }
  console.log(
    "PASS six advertised formats across all three choices (24 component uploads): native browser transfer, separate finalize/check/selection and no implicit Submit; synthetic inspection only"
  );

  // A committed admission with a lost response survives a real page reload.
  const lost = seed("FULL_ONLY");
  await open(page, lost);
  await choose(page, file("lost.csv"));
  flags.lose = "ADMIT";
  await namedButton(page, "Upload file").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /could not complete/ })
    .waitFor();
  flags.lose = null;
  await namedButton(page, "Retry upload request").waitFor();
  const original = requests
    .filter(
      (item) =>
        item.method === "POST" && item.path.endsWith(lost.id + "/uploads")
    )
    .at(-1).body;
  assert.equal(scopedAttempts(lost).length, 1);
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await filesStep(page);
  await namedButton(page, "Retry upload request").click();
  await namedButton(page, "Retry upload request").waitFor({ state: "hidden" });
  await page.waitForFunction(
    (draftId) =>
      sessionStorage.getItem(`kuinbee:dataset-file-request:v1:${draftId}`) ===
      null,
    lost.id
  );
  const retries = requests.filter(
    (item) => item.method === "POST" && item.path.endsWith(lost.id + "/uploads")
  );
  assert(retries.length >= 2);
  assert(
    retries.every(
      (request) => JSON.stringify(request.body) === JSON.stringify(original)
    )
  );
  assert.equal(scopedAttempts(lost).length, 1);
  assert.equal(
    await page.evaluate(
      () =>
        Object.keys(sessionStorage).filter((key) =>
          key.startsWith("kuinbee:dataset-file-request:")
        ).length
    ),
    0
  );
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(file("lost.csv"));
  await namedButton(page, "Resume upload").click();
  await namedButton(page, "Finish upload").waitFor();
  console.log(
    "PASS lost admission ACK and reload retry the exact UUID, body and reservation"
  );

  // Ordinary Save during an active upload does not unmount/lock the uploader.
  const paused = seed("FULL_ONLY");
  await open(page, paused);
  const large = Buffer.concat([
    Buffer.alloc(partBytes, 65),
    Buffer.from("tail\n"),
  ]);
  flags.holdPart = 2;
  await choose(page, file("resume.csv", large));
  await namedButton(page, "Upload file").click();
  for (let polls = 0; !held.size; polls++) {
    assert(polls < 100, "Second upload part reached the fixture hold");
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  await namedButton(page, "Basics").click();
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Saved while receiving");
  assert(await namedButton(page, "Save draft").isEnabled());
  const savedResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      new URL(response.url()).pathname.endsWith(paused.id)
  );
  await namedButton(page, "Save draft").click();
  await savedResponse;
  assert.equal(draftFor(paused.id).metadata.title, "Saved while receiving");
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Saved with an uncertain reply");
  flags.lose = "SAVE";
  await namedButton(page, "Save draft").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /could not complete/ })
    .waitFor();
  assert(await namedButton(page, "Pause active upload").isEnabled());
  await namedButton(page, "Pause active upload").click();
  flags.lose = null;
  await namedButton(page, "Retry save").click();
  await namedButton(page, "Save draft").waitFor();
  assert.equal(
    draftFor(paused.id).metadata.title,
    "Saved with an uncertain reply"
  );
  await filesStep(page);
  await page.getByText(/Transfer paused\. Refresh/).waitFor();
  flags.holdPart = null;
  await namedButton(page, "Update files").click();
  await namedButton(page, "Refresh upload status").click();
  const partial = scopedAttempts(paused)[0];
  assert.equal(partial.retainedBytes, String(partBytes));
  assert.equal(
    await uploadRow(page, partial)
      .getByRole("progressbar")
      .getAttribute("aria-valuenow"),
    "99",
    "Partial receipt cannot round up to 100 percent"
  );
  const beforeMismatch = requests.filter(
    (item) => item.method === "PUT"
  ).length;
  const different = Buffer.from(large);
  different[0] ^= 1;
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(file("resume.csv", different));
  await namedButton(page, "Resume upload").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /differ|match/i })
    .waitFor();
  assert.equal(
    requests.filter((item) => item.method === "PUT").length,
    beforeMismatch,
    "Wrong reselected bytes cannot send a missing part"
  );
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(file("resume.csv", large));
  await namedButton(page, "Resume upload").click();
  await namedButton(page, "Finish upload").waitFor();
  assert.equal(partial.retainedBytes, String(large.length));
  console.log(
    "PASS Save across steps during transfer, pause, received-byte mismatch refusal and correct-file resume"
  );

  // Current-ID operations never replace a paginated inventory or release bytes.
  await namedButton(page, "Finish upload").click();
  await uploadRow(page, partial)
    .getByText(/Backend checks in progress/)
    .waitFor();
  accept(partial);
  await namedButton(page, "Refresh upload status").click();
  flags.lose = "MEMBERS";
  await namedButton(page, "Use in full dataset").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /could not complete/ })
    .waitFor();
  flags.lose = null;
  await namedButton(page, "Retry upload request").waitFor();
  assert.equal(paused.members.length, 1);
  await namedButton(page, "Retry upload request").click();
  await uploadRow(page, partial)
    .getByText("Selected in this draft", { exact: true })
    .waitFor();
  assert.equal(paused.members.length, 1);
  const unseen = member(paused, { ...partial, uploadObjectId: newId() });
  unseen.id = id(999_999);
  const fillers = Array.from({ length: 23 }, () =>
    member(paused, { ...partial, uploadObjectId: newId() })
  );
  paused.members.push(...fillers, unseen);
  await namedButton(page, "Refresh files").click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[aria-label="Stored file references"] li')
        .length === 20
  );
  const selectedId = paused.members[0].id,
    beforeCharge = account(paused, "5000000000").chargedBytes;
  const removedResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      new URL(response.url()).pathname.endsWith(paused.id + "/files")
  );
  await page
    .getByRole("button", { name: "Remove from full dataset", exact: true })
    .first()
    .click();
  await removedResponse;
  assert(!paused.members.some((item) => item.id === selectedId));
  assert(paused.members.some((item) => item.id === unseen.id));
  assert.equal(account(paused, "5000000000").chargedBytes, beforeCharge);
  const mutation = requests
    .filter(
      (item) =>
        item.method === "PATCH" && item.path.endsWith(paused.id + "/files")
    )
    .at(-1).body;
  assert.deepEqual(mutation.operations, [
    { operation: "REMOVE_MEMBER", memberId: selectedId },
  ]);
  console.log(
    "PASS lost selection ACK deduplicates and exact-member removal preserves unseen files and charges"
  );

  await page.waitForFunction(() => {
    const buttons = [...document.querySelectorAll("button")];
    return (
      buttons.some(
        (button) => button.textContent === "Save draft" && !button.disabled
      ) &&
      buttons.some(
        (button) =>
          button.textContent === "Remove from full dataset" && !button.disabled
      )
    );
  });
  const inventoryCount = paused.members.length,
    seenGeneration = paused.contentGeneration;
  paused.contentGeneration++;
  await page
    .getByRole("button", { name: "Remove from full dataset", exact: true })
    .first()
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: /File selection changed/ })
    .waitFor();
  assert.equal(paused.members.length, inventoryCount);
  const staleMutation = requests
    .filter(
      (request) =>
        request.method === "PATCH" &&
        request.path.endsWith(paused.id + "/files")
    )
    .at(-1).body;
  assert.equal(staleMutation.expectedGeneration, seenGeneration);
  assert.equal(
    await page
      .getByLabel("File to upload or resume", { exact: true })
      .evaluate((input) => input.files[0].name),
    "resume.csv"
  );
  console.log(
    "PASS stale file edits retain their rendered generation and preserve all files/local selection"
  );

  // A protected historical file is refused by the service, despite the button.
  paused.members = [];
  paused.protectedObjects.add(partial.uploadObjectId);
  await namedButton(page, "Refresh files").click();
  page.once("dialog", (dialog) => dialog.accept());
  await namedButton(page, "Delete stored file").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /historical access/ })
    .waitFor();
  assert.equal(partial.state, "ACCEPTED");
  assert.equal(account(paused, "5000000000").chargedBytes, beforeCharge);
  console.log(
    "PASS historical protection is backend-authoritative and cannot release occupied quota"
  );

  const storageDraft = seed("FULL_ONLY"),
    storagePage = await browser.newPage();
  storagePage.on("pageerror", (failure) => browserErrors.push(failure.message));
  await storagePage.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await storagePage.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith("kuinbee:dataset-file-request:"))
        throw new DOMException("Session storage unavailable", "SecurityError");
      return get.call(this, key);
    };
  });
  await open(storagePage, storageDraft);
  await storagePage
    .getByRole("alert")
    .filter({ hasText: /could not recover its saved file request/ })
    .waitFor();
  assert(await namedButton(storagePage, "Upload file").isDisabled());
  assert(await namedButton(storagePage, "Save draft").isEnabled());
  assert(
    !requests.some(
      (request) =>
        request.path.includes(storageDraft.id) && request.method !== "GET"
    )
  );
  await storagePage.close();
  console.log(
    "PASS unavailable browser request storage pauses file writes while keeping metadata Save usable"
  );

  // Cancellation is available without pretending storage was already freed.
  await open(page, lost);
  const cancelled = scopedAttempts(lost)[0],
    charged = account(lost, "5000000000").chargedBytes;
  await namedButton(page, "Cancel upload").click();
  await page.getByText(/Cleanup requested · storage still counts/).waitFor();
  assert.equal(account(lost, "5000000000").chargedBytes, charged);
  cancelled.state = "CLOSED";
  cancelled.retainedBytes = "0";
  cancelled.reservedBytes = "0";
  cancelled.revision++;
  await namedButton(page, "Refresh upload status").click();
  await page.getByText(/Upload closed/).waitFor();
  await namedButton(page, "Refresh files").click();
  await page.getByText("0 bytes charged of 5 GB", { exact: true }).waitFor();
  console.log(
    "PASS cancellation retains charges until confirmed backend cleanup"
  );

  // ZIP UX uses compact intent without asking the supplier for internal paths.
  const zip = seed("FULL_AND_SAMPLE");
  await open(page, zip);
  await page
    .getByLabel("File format", { exact: true })
    .selectOption("ZIP32_CONTAINER_V1");
  await page
    .getByRole("checkbox", { name: "CSV · UTF-8 text", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "WAV · integer PCM audio", exact: true })
    .check();
  await page
    .getByLabel("CSV / TSV first row", { exact: true })
    .selectOption("PRESENT");
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(
      file("collection.zip", Buffer.from("synthetic-ui-transport-only"))
    );
  await namedButton(page, "Upload file").click();
  await namedButton(page, "Finish upload").waitFor();
  const zipItem = scopedAttempts(zip)[0];
  assert.deepEqual(zipItem.inspectionProfile, {
    profileId: "ZIP32_CONTAINER_V1",
    leafProfiles: [],
    entryDefaults: [
      {
        extension: ".csv",
        profile: { profileId: "UTF8_CSV_SYNTAX_V1", header: "PRESENT" },
      },
      { extension: ".wav", profile: { profileId: "RIFF_INTEGER_PCM_WAVE_V1" } },
    ],
  });
  await namedButton(page, "Finish upload").click();
  await uploadRow(page, zipItem)
    .getByText(/Backend checks in progress/)
    .waitFor();
  flags.failChecks = true;
  accept(zipItem);
  flags.failChecks = false;
  await namedButton(page, "Refresh upload status").click();
  await page.getByText(/checks did not accept/).waitFor();
  assert.equal(await namedButton(page, "Use in full dataset").count(), 0);
  console.log(
    "PASS compact ZIP type declarations and failed-check selection denial"
  );

  const output = process.argv[2];
  if (output) await mkdir(resolve(output), { recursive: true });
  for (const width of [1366, 390])
    for (const dark of [false, true]) {
      await page.setViewportSize({ width, height: 1000 });
      const toggle = page.getByRole("button", {
        name: dark ? "Use dark theme" : "Use light theme",
        exact: true,
      });
      if (await toggle.count()) await toggle.click();
      await page.evaluate((dark) => {
        document.documentElement.classList.toggle("dark", dark);
      }, dark);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        ),
        true
      );
      assert.equal(
        await page.locator('[data-proposal-tile="true"]').evaluateAll((tiles) =>
          tiles.every((tile) => {
            const outer = tile.getBoundingClientRect();
            return [...tile.querySelectorAll("input,select,button")].every(
              (control) => {
                const bounds = control.getBoundingClientRect();
                return (
                  !bounds.width ||
                  (bounds.left >= outer.left && bounds.right <= outer.right + 1)
                );
              }
            );
          })
        ),
        true,
        "Every visible uploader control remains inside its tile"
      );
      if (output)
        await page.screenshot({
          path: resolve(
            output,
            `uploader-${width}-${dark ? "dark" : "light"}.png`
          ),
          fullPage: true,
        });
    }
  flags.closed = true;
  await namedButton(page, "Refresh upload status").click();
  await page
    .getByText(
      "New uploads are currently unavailable. Existing files and saved draft details remain available.",
      { exact: true }
    )
    .waitFor();
  assert.equal(await namedButton(page, "Upload file").count(), 0);
  console.log(
    "PASS backend pause removes advertised formats/admission; light/dark desktop/mobile contain no horizontal overflow"
  );
  assert.deepEqual(fixtureErrors, []);
  assert.deepEqual(browserErrors, []);
  assert.deepEqual(external, []);
  assert(
    !requests.some((item) => /submit|publish|payment|presign/.test(item.path))
  );
  console.log(
    "PASS rendered supplier uploader qualification; no hosted/cloud/native-scanner or complete-flow claim"
  );
} catch (failure) {
  console.error("UI fixture errors:", fixtureErrors);
  console.error("Browser errors:", browserErrors);
  for (const page of browser
    ?.contexts()
    .flatMap((context) => context.pages()) ?? []) {
    console.error(
      "Rendered page:",
      (await page.locator("body").innerText()).slice(-12000)
    );
    console.error(
      "Form controls:",
      await page.locator("input,select").evaluateAll((elements) =>
        elements.map((element) => ({
          id: element.id,
          disabled: element.disabled,
          label: Array.from(element.labels ?? []).map(
            (label) => label.textContent
          ),
        }))
      )
    );
  }
  throw failure;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolveClose) => server.close(resolveClose));
}
function draftFor(draftId) {
  return drafts.get(draftId);
}
