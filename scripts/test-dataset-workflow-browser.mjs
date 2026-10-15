import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import {
  DatasetPreparationResponseSchema,
  DatasetPreparationPatchBodySchema,
  DatasetPreparationCatalogLabelsResponseSchema,
  DatasetFilesContextBodySchema,
  DatasetFilesContextResponseSchema,
  DatasetFilesInventoryPageQuerySchema,
  DatasetFilesInventoryPageResponseSchema,
  DatasetIntakeConfigResponseSchema,
  DatasetUploadsPageResponseSchema,
  DatasetWorkflowResponseSchema,
  DatasetProposalReadinessQuerySchema,
  DatasetProposalReadinessResponseSchema,
  DatasetPricingSaveBodySchema,
  DatasetPricingSubmitBodySchema,
  DatasetProposalSubmitBodySchema,
  DatasetSubmissionResponseSchema,
  DatasetFrozenInventoryQuerySchema,
  DatasetFrozenInventoryResponseSchema,
  DatasetEditContextQuerySchema,
  DatasetEditContextResponseSchema,
  DatasetEditBaseResponseSchema,
} from "@kuinbee/dataset-preparation-contracts";

// Real Editor, workflow hook, native sessionStorage and HTTP against an explicit
// synthetic service. This qualifies supplier orchestration, never native intake,
// malware/security evidence, real admin/publication/access or hosted deployment.
const id = (value) => "c" + String(value).padStart(24, "0");
let sequence = 2000;
const newId = () => id(sequence++);
const now = "2026-10-16T00:00:00.000Z";
const fingerprint = "a".repeat(64);
const drafts = new Map(),
  receipts = new Map();
const requests = [],
  fixtureErrors = [],
  browserErrors = [],
  external = [];
const flags = {
  closed: false,
  lose: null,
  mismatchedContext: false,
  staleSubmit: false,
  retryStatus: 0,
};
const choices = ["SAMPLE_ONLY", "FULL_ONLY", "FULL_AND_SAMPLE"];
const clone = (value) => structuredClone(value);

function seed(choice, options = {}) {
  const draft = {
    id: newId(),
    contentId: newId(),
    generation: 0,
    contentGeneration: 0,
    sourceGeneration: 0,
    workflowRevision: 0,
    datasetStatus: "SUBMITTED",
    verificationStatus: "PENDING",
    reviewedContentId: null,
    publishedContentId: null,
    frozen: null,
    currentCategoryName: "Category before submission",
    currentSourceName: "Supplier collection source",
    metadata: {
      title: "Workflow collection " + choice,
      uploadChoice: choice,
      primaryCategoryId: "category",
      sourceId: "source",
      license: "CC-BY-4.0",
      modalities: ["TABULAR"],
      contexts: [],
      collectionBoundary: "The complete defined test collection",
      overview: "Collection overview",
      description: "Each record represents a test event.",
      dataQuality: "Supplier declared test quality",
      fullCompleteness: choice === "SAMPLE_ONLY" ? null : true,
      sample:
        choice === "FULL_ONLY"
          ? null
          : {
              selectionMethod: "Representative subset",
              coverage: "One test session",
            },
    },
    pricing: {
      id: newId(),
      revision: 0,
      isPaid: false,
      price: null,
      currency: "INR",
      status: "DRAFT",
      notes: null,
      rejectionReason: null,
      submittedAt: null,
      approvedAt: null,
      updatedAt: now,
    },
    members: [],
  };
  const components =
    choice === "FULL_AND_SAMPLE"
      ? ["FULL", "SAMPLE"]
      : [choice === "SAMPLE_ONLY" ? "SAMPLE" : "FULL"];
  for (let index = 0; index < (options.members ?? components.length); index++) {
    const evidence = newId();
    draft.members.push({
      id: newId(),
      contentId: draft.contentId,
      uploadObjectId: newId(),
      component: components[index % components.length],
      role: "PRIMARY",
      relativePath: null,
      groupId: null,
      originalFileName: `selected-${index + 1}.csv`,
      measuredSizeBytes: "13",
      inspectionAtSubmissionId: evidence,
      inspection: {
        securityState: "ACCEPTED",
        currentEvidenceId: evidence,
        recordedOutcome: "PASS",
        current: true,
        eligibility: "NOT_EVALUATED",
      },
    });
  }
  drafts.set(draft.id, draft);
  return draft;
}
const hasWorking = (draft) =>
  !draft.frozen || Boolean(draft.correction && draft.initialized);
function editable(draft, operation) {
  if (draft.correction) return true;
  if (!draft.frozen) return true;
  // Existing submitted proposals can still submit editable pricing separately.
  return (
    operation === "PRICING" &&
    ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(draft.pricing.status)
  );
}
function state(draft) {
  return {
    datasetId: draft.id,
    datasetUniqueId: "D" + draft.id.slice(-10),
    datasetStatus: draft.datasetStatus,
    verificationStatus: draft.verificationStatus,
    preparationGeneration: draft.generation,
    workflowRevision: draft.workflowRevision,
    activeContentId: hasWorking(draft) ? draft.contentId : null,
    reviewedContentId: draft.reviewedContentId,
    publishedContentId: draft.publishedContentId,
    pricing: clone(draft.pricing),
  };
}
function dto(draft) {
  return DatasetPreparationResponseSchema.parse({
    contractVersion: 1,
    id: draft.id,
    generation: draft.generation,
    metadata: draft.metadata,
    createdAt: now,
    updatedAt: now,
    readiness: {
      canSubmit: false,
      issues: [
        {
          code: "SUBMISSION_NOT_ENABLED",
          message: "The protected review checklist is checked separately.",
        },
      ],
    },
  });
}
function editContext(draft, operation) {
  const allowed = editable(draft, operation);
  return DatasetEditContextResponseSchema.parse({
    datasetId: draft.id,
    operation,
    preparationGeneration: draft.generation,
    workflowRevision:
      draft.workflowRevision + (flags.mismatchedContext ? 1 : 0),
    managementContext: "INITIAL_PROPOSAL",
    editable: allowed,
    precondition:
      allowed && draft.correction && !draft.initialized
        ? {
            mode: "INITIALIZE",
            expectedWorkflowRevision: draft.workflowRevision,
            context: "REQUESTED_CHANGES",
            expectedBaseContentId: draft.frozen.id,
          }
        : allowed && hasWorking(draft)
          ? {
              mode: "EXISTING_DRAFT",
              expectedContentId: draft.contentId,
              expectedGeneration: draft.contentGeneration,
            }
          : null,
    reason: allowed ? null : "SUBMITTED_READ_ONLY",
  });
}
function editBase(draft, operation) {
  if (draft.correction && !draft.initialized)
    return DatasetEditBaseResponseSchema.parse({
      context: editContext(draft, operation),
      metadataSource: "FROZEN_BASE",
      metadata: draft.baseMetadata,
      contentReference: {
        contentId: draft.frozen.id,
        generation: draft.frozen.generation,
        frozen: true,
      },
    });
  return DatasetEditBaseResponseSchema.parse({
    context: editContext(draft, operation),
    metadataSource: hasWorking(draft) ? "CURRENT_DRAFT" : "CURRENT_METADATA",
    metadata: draft.metadata,
    contentReference: hasWorking(draft)
      ? {
          contentId: draft.contentId,
          generation: draft.contentGeneration,
          frozen: false,
        }
      : null,
  });
}
function readiness(draft) {
  const issues = [];
  if (!draft.members.length)
    issues.push({
      code: "FILES_REQUIRED",
      message:
        "Upload and select the required checked material before submission.",
    });
  if (!draft.metadata.license)
    issues.push({
      code: "LICENSE_REQUIRED",
      field: "license",
      message: "Choose a Dataset license before submission.",
    });
  if (!draft.metadata.overview)
    issues.push({
      code: "OVERVIEW_REQUIRED",
      field: "overview",
      message: "Complete the collection summary before submission.",
    });
  if (!hasWorking(draft))
    issues.push({
      code: "INVALID_STATE",
      message: "This proposal is already submitted for admin review.",
    });
  if (flags.closed)
    issues.push({
      code: "INSPECTION_NOT_QUALIFIED",
      message: "Required backend file checks are currently unavailable.",
    });
  if (draft.sourceGeneration !== draft.generation)
    issues.push({
      code: "DRAFT_CHANGED",
      message: "Synchronize the current saved details and files.",
    });
  if (
    draft.pricing.isPaid &&
    !["SUBMITTED", "RESUBMITTED", "UNDER_REVIEW", "ACTIVE"].includes(
      draft.pricing.status
    )
  )
    issues.push({
      code: "PRICING_NOT_READY",
      message: "Submit paid pricing for its separate review.",
    });
  if (draft.metadata.uploadChoice === "SAMPLE_ONLY" && draft.pricing.isPaid)
    issues.push({
      code: "SAMPLE_DISPLAY_ONLY",
      message: "Samples are displayed without an on-platform sample purchase.",
    });
  return DatasetProposalReadinessResponseSchema.parse({
    state: state(draft),
    contentId: hasWorking(draft) ? draft.contentId : null,
    contentGeneration: hasWorking(draft) ? draft.contentGeneration : null,
    dependencyFingerprint: hasWorking(draft) ? fingerprint : null,
    canSubmit: issues.length === 0,
    issues,
  });
}
function filesContext(draft) {
  const retained = (candidates) => {
    const objects = new Map(
      candidates
        .flatMap((item) => [...item.members, ...(item.frozenMembers ?? [])])
        .map((member) => [
          member.uploadObjectId,
          BigInt(member.measuredSizeBytes),
        ])
    );
    return [...objects.values()].reduce((sum, value) => sum + value, 0n);
  };
  const account = (limitBytes, retainedBytes) => ({
    limitBytes,
    retainedBytes: String(retainedBytes),
    reservedBytes: "0",
    chargedBytes: String(retainedBytes),
    remainingBytes: String(BigInt(limitBytes) - retainedBytes),
  });
  return DatasetFilesContextResponseSchema.parse({
    contractVersion: 1,
    preparationId: draft.id,
    preparationGeneration: draft.generation,
    contentId: hasWorking(draft) ? draft.contentId : null,
    contentGeneration: hasWorking(draft) ? draft.contentGeneration : null,
    sourcePreparationGeneration: hasWorking(draft)
      ? draft.sourceGeneration
      : null,
    serverUploadChoice: draft.metadata.uploadChoice,
    editable: editable(draft, "MATERIALS"),
    synchronizationRequired:
      hasWorking(draft) && draft.sourceGeneration !== draft.generation,
    usage: {
      state: "ACCOUNTED",
      dataset: account("5000000000", retained([draft])),
      supplier: account("100000000000", retained([...drafts.values()])),
    },
    admission: { enabled: false, reason: "INTAKE_NOT_ENABLED" },
  });
}
function freeze(draft) {
  const metadata = clone(draft.metadata);
  for (const key of [
    "title",
    "uploadChoice",
    "primaryCategoryId",
    "sourceId",
    "license",
    "overview",
    "description",
    "dataQuality",
  ])
    delete metadata[key];
  const frozen = {
    id: draft.contentId,
    generation: draft.contentGeneration,
    uploadChoice: draft.metadata.uploadChoice,
    frozenAt: now,
    common: {
      title: draft.metadata.title,
      overview: draft.metadata.overview,
      description: draft.metadata.description,
      dataQuality: draft.metadata.dataQuality,
      license: draft.metadata.license,
      primaryCategoryId: "category",
      sourceId: "source",
      secondaryCategoryIds: [],
      tags: [],
      categories: [{ id: "category", name: draft.currentCategoryName }],
      source: {
        id: "source",
        name: draft.currentSourceName,
        description: null,
        websiteUrl: null,
        isVerifiedAtFreeze: false,
      },
    },
    metadata,
    pricingReference: {
      id: draft.pricing.id,
      revision: draft.pricing.revision,
    },
    pricingAtSubmission: {
      isPaid: draft.pricing.isPaid,
      price: draft.pricing.price,
      currency: draft.pricing.currency,
    },
    dependencyFingerprint: fingerprint,
    dependenciesChanged: false,
    selectedFiles: draft.members.length,
  };
  // Canonical projection proves the fixture itself never invents extra fields.
  DatasetSubmissionResponseSchema.parse({
    state: { ...state(draft), reviewedContentId: draft.contentId },
    submittedContent: frozen,
  });
  return frozen;
}
function submission(draft) {
  return DatasetSubmissionResponseSchema.parse({
    state: state(draft),
    submittedContent: draft.frozen,
  });
}
function inventory(draft, query) {
  assert(draft.frozen);
  assert.equal(query.expectedWorkflowRevision, draft.workflowRevision);
  assert.equal(query.contentId, draft.frozen.id);
  assert.equal(query.contentGeneration, draft.frozen.generation);
  const all = (draft.frozenMembers ?? draft.members).filter(
    (member) => !query.component || member.component === query.component
  );
  const filtered = all.filter(
    (member) => !query.afterId || member.id > query.afterId
  );
  const items =
    query.inventory === "FILES" ? filtered.slice(0, query.limit) : [];
  const context = {
    expectedWorkflowRevision: draft.workflowRevision,
    contentId: draft.frozen.id,
    contentGeneration: draft.frozen.generation,
    inventory: query.inventory,
    ...(query.component ? { component: query.component } : {}),
  };
  return DatasetFrozenInventoryResponseSchema.parse({
    datasetId: draft.id,
    workflowRevision: draft.workflowRevision,
    contentId: draft.frozen.id,
    contentGeneration: draft.frozen.generation,
    frozenAt: draft.frozen.frozenAt,
    inventory: query.inventory,
    component: query.component ?? null,
    total: query.inventory === "FILES" ? all.length : 0,
    items,
    nextCursor:
      filtered.length > query.limit && items.length
        ? { ...context, afterId: items.at(-1).id }
        : null,
  });
}
function writeExpected(draft, body) {
  return (
    body.expectedPreparationGeneration === draft.generation &&
    body.expectedWorkflowRevision === draft.workflowRevision &&
    body.expectedPricingReference.id === draft.pricing.id &&
    body.expectedPricingReference.revision === draft.pricing.revision
  );
}
function initializeCorrection(draft, context) {
  assert(draft.correction && !draft.initialized);
  assert.equal(context.mode, "INITIALIZE");
  assert.equal(context.expectedWorkflowRevision, draft.workflowRevision);
  assert.equal(context.context, "REQUESTED_CHANGES");
  assert.equal(context.expectedBaseContentId, draft.frozen.id);
  draft.frozenMembers = clone(draft.members);
  draft.contentId = newId();
  draft.contentGeneration = 0;
  draft.metadata = clone(draft.baseMetadata);
  draft.members = draft.members.map((member) => ({
    ...member,
    id: newId(),
    contentId: draft.contentId,
  }));
  draft.workflowRevision++;
  draft.initialized = true;
}
function record(draft, kind, body, response) {
  const key = `${draft.id}:${body.requestId}`;
  const prior = receipts.get(key);
  if (prior) {
    assert.equal(prior.kind, kind);
    assert.deepEqual(prior.body, body);
    return prior.response;
  }
  receipts.set(key, { kind, body: clone(body), response: clone(response) });
  return response;
}

// A cheap fixture-only mode validates every canonical projection without opening
// a browser, listener, external connection or mutation outside these objects.
for (const choice of choices) {
  const draft = seed(choice, { members: 23 });
  dto(draft);
  editContext(draft, "METADATA");
  editBase(draft, "METADATA");
  DatasetWorkflowResponseSchema.parse({ state: state(draft) });
  readiness(draft);
  filesContext(draft);
  draft.frozen = freeze(draft);
  draft.reviewedContentId = draft.contentId;
  draft.verificationStatus = "SUBMITTED";
  submission(draft);
  editContext(draft, "METADATA");
  editBase(draft, "PRICING");
  readiness(draft);
  filesContext(draft);
  inventory(
    draft,
    DatasetFrozenInventoryQuerySchema.parse({
      expectedWorkflowRevision: 0,
      contentId: draft.contentId,
      contentGeneration: 0,
      inventory: "FILES",
      limit: 20,
    })
  );
  drafts.delete(draft.id);
}
if (process.argv.includes("--fixtures-only")) {
  console.log(
    "PASS canonical workflow, correction-read, frozen and paginated fixture projections for all three choices; no browser run"
  );
  process.exit(0);
}

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
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import{QueryProvider}from'./src/components/QueryProvider';import{DashboardShell}from'./src/components/layout/DashboardShell';import{DatasetPreparationEditor}from'./src/components/datasets/preparation/DatasetPreparationEditor';const nativeFetch=window.fetch.bind(window);window.workflowFetchInvocations=[];window.fetch=(url,options={})=>{window.workflowFetchInvocations.push({path:new URL(url,location.href).pathname,method:options.method??'GET',body:options.body??null});return nativeFetch(url,options)};const root=createRoot(document.getElementById('root'));let mount=0;window.mount=(id)=>root.render(<React.StrictMode><QueryProvider><DashboardShell><DatasetPreparationEditor key={++mount} draftId={id} onExit={()=>window.fixtureExits=(window.fixtureExits??0)+1}/></DashboardShell></QueryProvider></React.StrictMode>);window.mount(window.location.pathname.split('/').at(-1));`,
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
              ? "import React from'react';export default function Link(p){return <a {...p}/>}"
              : args.path === "next/image"
                ? "import React from'react';export default function Image({priority,fill,quality,unoptimized,...p}){return <img {...p}/>}"
                : "export function usePathname(){return window.location.pathname}export function useRouter(){return{push:()=>{},replace:()=>{}}}export function useSearchParams(){return new URLSearchParams()}",
        }));
      },
    },
  ],
});
function json(res, status, value) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store",
  });
  res.end(JSON.stringify(value));
}
const ok = (res, data) => json(res, 200, { success: true, data });
const deny = (res, code, message, status = 409) =>
  json(res, status, { success: false, error: { code, message } });
const queryObject = (url) => Object.fromEntries(url.searchParams);
function replyCommand(res, kind, draft, body, response) {
  const receipt = record(draft, kind, body, response);
  if (flags.lose === kind) res.destroy();
  else ok(res, receipt);
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
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      assert(length <= 131072, "Bounded fixture JSON");
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks),
      body = bytes.length ? JSON.parse(bytes) : null;
    requests.push({
      method: req.method,
      path: url.pathname,
      query: url.search,
      body: clone(body),
    });
    if (/^\/api\/v1\/supplier\/(categories|sources)$/.test(url.pathname)) {
      ok(res, { items: [], total: 0 });
      return;
    }
    if (url.pathname.endsWith("/catalog-labels")) {
      ok(
        res,
        DatasetPreparationCatalogLabelsResponseSchema.parse({
          primaryCategory: {
            id: "category",
            name: "Category before submission",
          },
          source: { id: "source", name: "Supplier collection source" },
        })
      );
      return;
    }
    const match = url.pathname.match(
      /^\/api\/v2\/supplier\/dataset-drafts\/([^/]+)(?:\/(.*))?$/
    );
    if (!match || !drafts.has(match[1])) {
      deny(res, "NOT_FOUND", "Fixture path not found", 404);
      return;
    }
    const draft = drafts.get(match[1]),
      tail = match[2] ?? "";
    if (
      draft.unbound &&
      [
        "workflow",
        "edit-context",
        "edit-base",
        "readiness",
        "submission",
        "submission/inventory",
      ].includes(tail)
    ) {
      deny(res, "NOT_FOUND", "Dataset proposal not found", 404);
      return;
    }
    if (!tail && req.method === "GET") {
      if (draft.failPreparationReads) {
        deny(
          res,
          "CURRENT_READ_UNAVAILABLE",
          "Current proposal read is temporarily unavailable.",
          503
        );
        return;
      }
      ok(res, dto(draft));
      return;
    }
    if (!tail && req.method === "PATCH") {
      const parsed = DatasetPreparationPatchBodySchema.parse(body),
        prior = receipts.get(`${draft.id}:${parsed.requestId}`);
      if (prior) {
        assert.equal(prior.kind, "SAVE");
        assert.deepEqual(prior.body, body);
        replyCommand(res, "SAVE", draft, body, prior.response);
        return;
      }
      if (!editable(draft, "METADATA")) {
        deny(res, "INVALID_STATE", "Submitted details are read-only.");
        return;
      }
      if (parsed.expectedGeneration !== draft.generation) {
        deny(res, "DRAFT_CHANGED", "Saved details changed.");
        return;
      }
      if (parsed.editContext) {
        if (parsed.editContext.mode === "INITIALIZE") {
          initializeCorrection(draft, parsed.editContext);
        } else {
          assert.equal(parsed.editContext.expectedContentId, draft.contentId);
          assert.equal(
            parsed.editContext.expectedGeneration,
            draft.contentGeneration
          );
        }
      }
      const newlyBound = Boolean(draft.unbound);
      draft.unbound = false;
      draft.metadata = { ...draft.metadata, ...parsed.changes };
      draft.generation++;
      draft.sourceGeneration = draft.generation;
      if (!newlyBound) draft.contentGeneration++;
      replyCommand(res, "SAVE", draft, body, dto(draft));
      return;
    }
    if (tail === "workflow" && req.method === "GET") {
      ok(res, DatasetWorkflowResponseSchema.parse({ state: state(draft) }));
      return;
    }
    if (tail === "edit-context") {
      const query = DatasetEditContextQuerySchema.parse(queryObject(url));
      ok(res, editContext(draft, query.operation));
      return;
    }
    if (tail === "edit-base") {
      const query = DatasetEditContextQuerySchema.parse(queryObject(url));
      if (!editable(draft, query.operation)) {
        deny(res, "INVALID_STATE", "Submitted details are read-only.");
        return;
      }
      ok(res, editBase(draft, query.operation));
      return;
    }
    if (tail === "readiness") {
      const query = DatasetProposalReadinessQuerySchema.parse(queryObject(url));
      if (query.expectedPreparationGeneration !== draft.generation) {
        deny(res, "DRAFT_CHANGED", "The saved Dataset changed.");
        return;
      }
      ok(res, readiness(draft));
      return;
    }
    if (tail === "submission") {
      if (!draft.frozen) {
        deny(res, "NOT_FOUND", "No frozen submission", 404);
        return;
      }
      ok(res, submission(draft));
      return;
    }
    if (tail === "submission/inventory") {
      const query = DatasetFrozenInventoryQuerySchema.parse(queryObject(url));
      if (
        !draft.frozen ||
        query.contentId !== draft.frozen.id ||
        query.contentGeneration !== draft.frozen.generation ||
        query.expectedWorkflowRevision !== draft.workflowRevision
      ) {
        deny(res, "REVIEW_CHANGED", "The exact submission changed.");
        return;
      }
      ok(res, inventory(draft, query));
      return;
    }
    if (tail === "files-context" && req.method === "GET") {
      ok(res, filesContext(draft));
      return;
    }
    if (tail === "files-context" && req.method === "POST") {
      const parsed = DatasetFilesContextBodySchema.parse(body);
      if (
        draft.frozen ||
        parsed.expectedPreparationGeneration !== draft.generation ||
        parsed.expectedContentId !== draft.contentId ||
        parsed.expectedContentGeneration !== draft.contentGeneration
      ) {
        deny(res, "DRAFT_CHANGED", "File selection context changed.");
        return;
      }
      draft.sourceGeneration = draft.generation;
      draft.contentGeneration++;
      ok(res, { ...filesContext(draft), requestId: parsed.requestId });
      return;
    }
    if (tail === "files") {
      const query = DatasetFilesInventoryPageQuerySchema.parse(
        queryObject(url)
      );
      if (
        draft.frozen ||
        query.contentId !== draft.contentId ||
        query.contentGeneration !== draft.contentGeneration ||
        query.expectedPreparationGeneration !== draft.generation ||
        draft.sourceGeneration !== draft.generation
      ) {
        deny(res, "DRAFT_CHANGED", "Files changed.");
        return;
      }
      const all = draft.members
        .filter(
          (item) => !query.component || item.component === query.component
        )
        .filter((item) => !query.afterId || item.id > query.afterId);
      const items = all.slice(0, query.limit).map((item) => {
        const { inspectionAtSubmissionId: ignored, ...value } = item;
        void ignored;
        return value;
      });
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
            all.length > query.limit
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
    if (tail === "intake-config") {
      ok(
        res,
        DatasetIntakeConfigResponseSchema.parse({
          context: filesContext(draft),
          maximumFileBytes: "2000000000",
          admission: {
            enabled: false,
            reason: "INTAKE_PAUSED",
            policyVersion: "synthetic-workflow-v1",
          },
          capabilities: [],
          transport: null,
        })
      );
      return;
    }
    if (tail === "uploads") {
      ok(
        res,
        DatasetUploadsPageResponseSchema.parse({
          preparationId: draft.id,
          items: [],
          nextCursor: null,
        })
      );
      return;
    }
    if (
      ["pricing", "pricing/submit", "submit"].includes(tail) &&
      ["PUT", "POST"].includes(req.method)
    ) {
      const kind =
        tail === "pricing"
          ? "PRICING_SAVE"
          : tail === "pricing/submit"
            ? "PRICING_SUBMIT"
            : "SUBMIT";
      const schema =
        kind === "PRICING_SAVE"
          ? DatasetPricingSaveBodySchema
          : kind === "PRICING_SUBMIT"
            ? DatasetPricingSubmitBodySchema
            : DatasetProposalSubmitBodySchema;
      const parsed = schema.parse(body),
        prior = receipts.get(`${draft.id}:${parsed.requestId}`);
      if (flags.retryStatus) {
        deny(
          res,
          "RECEIPT_NOT_CHECKED",
          `Receipt lookup paused with ${flags.retryStatus}.`,
          flags.retryStatus
        );
        return;
      }
      if (prior) {
        assert.equal(prior.kind, kind);
        assert.deepEqual(prior.body, body);
        replyCommand(res, kind, draft, body, prior.response);
        return;
      }
      if (kind === "SUBMIT" && flags.staleSubmit) {
        flags.staleSubmit = false;
        draft.workflowRevision++;
        deny(
          res,
          "DRAFT_CHANGED",
          "The exact proposal changed; preserve your input and refresh."
        );
        return;
      }
      if (!writeExpected(draft, parsed)) {
        deny(res, "DRAFT_CHANGED", "The exact proposal or pricing changed.");
        return;
      }
      if (kind !== "SUBMIT" && !editable(draft, "PRICING")) {
        deny(res, "INVALID_STATE", "Pricing is not editable.");
        return;
      }
      if (parsed.editContext) {
        if (parsed.editContext.mode === "INITIALIZE") {
          initializeCorrection(draft, parsed.editContext);
          draft.generation++;
          draft.sourceGeneration = draft.generation;
          draft.contentGeneration++;
        } else {
          assert.equal(parsed.editContext.expectedContentId, draft.contentId);
          assert.equal(
            parsed.editContext.expectedGeneration,
            draft.contentGeneration
          );
        }
      }
      if (kind === "PRICING_SAVE") {
        if (
          draft.metadata.uploadChoice === "SAMPLE_ONLY" &&
          parsed.changes.isPaid
        ) {
          deny(
            res,
            "SAMPLE_DISPLAY_ONLY",
            "Samples have no on-platform purchase."
          );
          return;
        }
        draft.pricing = {
          ...draft.pricing,
          ...parsed.changes,
          price:
            parsed.changes.price === null
              ? null
              : Number(parsed.changes.price).toFixed(2),
          revision: draft.pricing.revision + 1,
        };
      } else if (kind === "PRICING_SUBMIT") {
        assert(
          ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(
            draft.pricing.status
          )
        );
        draft.pricing.status =
          draft.pricing.status === "CHANGES_REQUESTED"
            ? "RESUBMITTED"
            : "SUBMITTED";
        draft.pricing.submittedAt = now;
        draft.pricing.revision++;
      } else {
        if (!readiness(draft).canSubmit) {
          deny(
            res,
            "SUBMISSION_NOT_READY",
            "Complete current backend checks before submitting."
          );
          return;
        }
        assert.equal(parsed.expectedContentId, draft.contentId);
        assert.equal(parsed.expectedContentGeneration, draft.contentGeneration);
        assert.equal(parsed.expectedDependencyFingerprint, fingerprint);
        draft.frozen = freeze(draft);
        draft.reviewedContentId = draft.contentId;
        draft.verificationStatus = "SUBMITTED";
      }
      draft.workflowRevision++;
      replyCommand(
        res,
        kind,
        draft,
        body,
        DatasetWorkflowResponseSchema.parse({
          requestId: parsed.requestId,
          state: state(draft),
        })
      );
      return;
    }
    throw new Error(`Unexpected fixture action ${req.method} ${tail}`);
  } catch (failure) {
    fixtureErrors.push(failure.stack);
    if (!res.destroyed) deny(res, "FIXTURE_ERROR", failure.message, 500);
  }
});
await new Promise((resolveListen) =>
  server.listen(0, "127.0.0.1", resolveListen)
);
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const button = (page, name) => page.getByRole("button", { name, exact: true });
const panel = (page) => page.locator("[data-workflow-panel]");
const writes = (draft) =>
  requests.filter(
    (request) =>
      request.path.includes(draft.id) &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  );
const commandWrites = (draft, suffix) =>
  writes(draft).filter(
    (request) =>
      request.path === `/api/v2/supplier/dataset-drafts/${draft.id}${suffix}`
  );
async function review(page) {
  await page.waitForFunction(() => {
    const panel = document.querySelector("[data-workflow-panel]");
    const next = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent.trim() === "4. Review draft"
    );
    return panel?.checkVisibility() || (next && !next.disabled);
  });
  if (!(await panel(page).isVisible()))
    await button(page, "4. Review draft").click();
  await panel(page).waitFor();
  await button(page, "Refresh review checks").waitFor();
}
async function open(page, draft) {
  await page.goto(`${origin}/dashboard/datasets/drafts/${draft.id}`);
  await page.locator("[data-workflow-panel]").waitFor({ state: "attached" });
  await review(page);
}
async function enabled(locator) {
  await locator.waitFor();
  await locator.click({ trial: true });
}
async function choosePaid(page, amount = "12.50", currency = "USD") {
  await page.getByLabel("Paid access", { exact: true }).check();
  await page.getByLabel("Dataset price", { exact: true }).fill(amount);
  await page.getByLabel("Currency", { exact: true }).selectOption(currency);
}
async function pending(page) {
  await enabled(button(page, "Retry proposal request"));
}
const fetchWrites = (page, draft, suffix) =>
  page.evaluate(
    ({ draftId, suffix }) =>
      window.workflowFetchInvocations.filter(
        (call) =>
          call.path === `/api/v2/supplier/dataset-drafts/${draftId}${suffix}` &&
          call.method !== "GET"
      ),
    { draftId: draft.id, suffix }
  );
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 1000 },
  });
  page.setDefaultTimeout(15_000);
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });

  // Initial Dataset business status is SUBMITTED for compatibility; verification
  // PENDING and no frozen snapshot keep it a private editable proposal.
  for (const choice of choices) {
    const draft = seed(choice);
    await open(page, draft);
    await enabled(button(page, "Submit proposal for admin review"));
    assert.equal(draft.datasetStatus, "SUBMITTED");
    assert.equal(draft.verificationStatus, "PENDING");
    assert.equal(
      writes(draft).length,
      0,
      "Opening a private proposal must never write/submit"
    );
    assert.equal(await page.locator("[data-frozen-submission]").count(), 0);
    if (choice === "SAMPLE_ONLY") {
      const paid = page.getByLabel("Paid access", { exact: true });
      assert(
        (await paid.count()) === 0 || (await paid.isDisabled()),
        "A sample is display-only"
      );
    }
    await button(page, "Submit proposal for admin review").click();
    await page.locator("[data-frozen-submission]").waitFor();
    assert.equal(commandWrites(draft, "/submit").length, 1);
    assert.equal(commandWrites(draft, "/pricing").length, 0);
    assert.equal(draft.verificationStatus, "SUBMITTED");
    assert.equal(draft.frozen.uploadChoice, choice);
    assert.equal(draft.pricing.isPaid, false);
    assert.equal(draft.publishedContentId, null);
    const title = page.getByLabel("Dataset title", { exact: true });
    assert(
      (await title.count()) === 0 || (await title.isDisabled()),
      "Frozen contents expose no editable title"
    );
  }
  console.log(
    "PASS all three choices use explicit free Submit; initial business status does not freeze the draft, successful Submit does not publish"
  );

  for (const choice of ["FULL_ONLY", "FULL_AND_SAMPLE"]) {
    const draft = seed(choice);
    await open(page, draft);
    await choosePaid(page);
    assert.equal(draft.pricing.isPaid, false, "Typing pricing never saves it");
    assert.equal(writes(draft).length, 0);
    await button(page, "Save pricing").click();
    await page.getByText(/Pricing save acknowledged/).waitFor();
    assert.equal(draft.pricing.isPaid, true);
    assert.equal(draft.pricing.price, "12.50");
    assert.equal(draft.pricing.currency, "USD");
    assert.equal(draft.pricing.status, "DRAFT");
    assert.equal(draft.verificationStatus, "PENDING");
    assert.equal(commandWrites(draft, "/submit").length, 0);
    await enabled(button(page, "Submit pricing for review"));
    assert.equal(
      await button(page, "Submit proposal for admin review").isDisabled(),
      true
    );
    await button(page, "Submit pricing for review").click();
    await page.getByText(/Pricing submitted for its separate review/).waitFor();
    assert.equal(draft.pricing.status, "SUBMITTED");
    assert.equal(draft.verificationStatus, "PENDING");
    assert.equal(draft.frozen, null);
    await enabled(button(page, "Submit proposal for admin review"));
    await button(page, "Submit proposal for admin review").click();
    await page.locator("[data-frozen-submission]").waitFor();
    assert.equal(draft.frozen.pricingAtSubmission.price, "12.50");
    assert.equal(
      draft.frozen.pricingReference.revision,
      draft.pricing.revision
    );
    assert.equal(commandWrites(draft, "/pricing").length, 1);
    assert.equal(commandWrites(draft, "/pricing/submit").length, 1);
    assert.equal(commandWrites(draft, "/submit").length, 1);
  }
  console.log(
    "PASS both full choices separate local pricing input, Save pricing, pricing review and proposal Submit with exact frozen pricing"
  );

  const unbound = seed("FULL_ONLY", { members: 0 });
  unbound.unbound = true;
  await open(page, unbound);
  await page
    .getByText(
      /Current pricing is unavailable. Save an older draft normally to connect it/
    )
    .waitFor();
  assert.equal(
    writes(unbound).length,
    0,
    "Unbound preparation reads never create its workflow"
  );
  assert.equal(
    await page.getByLabel("Free access", { exact: true }).count(),
    0
  );
  assert.equal(
    await button(page, "Submit proposal for admin review").isDisabled(),
    true
  );
  const bindAck = page.waitForResponse(
    (response) =>
      response.url() ===
        `${origin}/api/v2/supplier/dataset-drafts/${unbound.id}` &&
      response.request().method() === "PATCH"
  );
  await button(page, "Save draft").click();
  await bindAck;
  await page.getByLabel("Free access", { exact: true }).waitFor();
  assert.equal(writes(unbound).length, 1);
  assert.deepEqual(writes(unbound)[0].body.changes, {
    title: unbound.metadata.title,
  });
  assert.equal(writes(unbound)[0].body.editContext, undefined);
  assert.equal(unbound.unbound, false);
  assert.equal(unbound.generation, 1);
  assert.equal(unbound.verificationStatus, "PENDING");
  assert.equal(unbound.frozen, null);
  assert.equal(
    await button(page, "Submit proposal for admin review").isDisabled(),
    true,
    "Binding does not invent selected files or complete checks"
  );
  console.log(
    "PASS older unbound preparation uses explicit same-title Save to bind its stable identity, with no read-side writes or invented pricing/file references"
  );

  const coordinated = seed("FULL_ONLY");
  await open(page, coordinated);
  await choosePaid(page, "40", "EUR");
  await button(page, "1. Basics").click();
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Saved metadata and pricing together");
  assert.equal(writes(coordinated).length, 0);
  const coordinatedAck = page.waitForResponse(
    (response) =>
      response.url() ===
        `${origin}/api/v2/supplier/dataset-drafts/${coordinated.id}/pricing` &&
      response.request().method() === "PUT"
  );
  await button(page, "Save draft").click();
  await coordinatedAck;
  await enabled(button(page, "Save draft"));
  assert.equal(
    coordinated.metadata.title,
    "Saved metadata and pricing together"
  );
  assert.equal(coordinated.pricing.price, "40.00");
  assert.equal(coordinated.pricing.currency, "EUR");
  const coordinatedWrites = writes(coordinated);
  assert.equal(coordinatedWrites.length, 2);
  assert.equal(coordinatedWrites[0].method, "PATCH");
  assert.equal(coordinatedWrites[1].method, "PUT");
  assert.equal(
    coordinatedWrites[1].body.expectedPreparationGeneration,
    coordinated.generation
  );
  assert.equal(coordinated.verificationStatus, "PENDING");
  assert.equal(coordinated.frozen, null);
  await review(page);
  assert.equal(
    await button(page, "Submit proposal for admin review").isDisabled(),
    true,
    "Saved paid pricing still needs its explicit review submission"
  );

  const invalidPrice = seed("FULL_ONLY");
  await open(page, invalidPrice);
  await choosePaid(page, "not-a-price");
  const exitsBefore = await page.evaluate(() => window.fixtureExits ?? 0);
  await button(page, "Save and exit").click();
  await page
    .getByText(/Enter a positive price with at most two decimal places/)
    .waitFor();
  assert.equal(writes(invalidPrice).length, 0);
  assert.equal(
    await page.evaluate(() => window.fixtureExits ?? 0),
    exitsBefore
  );
  assert.equal(
    await page.getByLabel("Dataset price", { exact: true }).inputValue(),
    "not-a-price"
  );

  const partial = seed("FULL_ONLY");
  partial.metadata.license = null;
  partial.metadata.overview = null;
  await open(page, partial);
  await page
    .getByText("Choose a Dataset license before submission.", { exact: true })
    .waitFor();
  assert.equal(
    await button(page, "Submit proposal for admin review").isDisabled(),
    true
  );
  await button(page, "1. Basics").click();
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("A partial saved draft");
  await button(page, "Save draft").click();
  await page.waitForFunction(() =>
    document.body.innerText.includes("Draft saved")
  );
  assert.equal(partial.metadata.title, "A partial saved draft");
  assert.equal(partial.metadata.license, null);
  assert.equal(writes(partial).length, 1);
  assert.equal(partial.verificationStatus, "PENDING");
  console.log(
    "PASS Save draft coordinates metadata then pricing, permits partial saves and prevents exit with invalid unsaved pricing"
  );

  const correction = seed("FULL_ONLY");
  correction.metadata.title = "Frozen correction base B";
  correction.metadata.overview = "Frozen summary B";
  correction.baseMetadata = clone(correction.metadata);
  correction.frozen = freeze(correction);
  correction.reviewedContentId = correction.frozen.id;
  correction.verificationStatus = "CHANGES_REQUESTED";
  correction.workflowRevision = 1;
  correction.correction = true;
  correction.initialized = false;
  correction.metadata = {
    ...correction.baseMetadata,
    title: "Unrelated mutable metadata A",
    overview: "Mutable summary A",
  };
  await open(page, correction);
  await button(page, "1. Basics").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#dataset-title")?.value ===
        "Frozen correction base B" ||
      Array.from(document.querySelectorAll("input")).some(
        (input) => input.value === "Frozen correction base B"
      )
  );
  assert.equal(
    writes(correction).length,
    0,
    "Reading an exact edit base never initializes it"
  );
  await button(page, "Save draft").click();
  await enabled(button(page, "Save draft"));
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Frozen correction base B"
  );
  assert.equal(
    writes(correction).length,
    0,
    "No-op Save retains the selected frozen base without initializing it"
  );
  assert.equal(correction.metadata.title, "Unrelated mutable metadata A");
  await review(page);
  await choosePaid(page, "15", "INR");
  await button(page, "Save pricing").click();
  await page.getByText(/Pricing save acknowledged/).waitFor();
  assert.equal(writes(correction).length, 1);
  assert.equal(writes(correction)[0].method, "PUT");
  assert.equal(writes(correction)[0].body.editContext.mode, "INITIALIZE");
  assert.equal(
    writes(correction)[0].body.editContext.expectedBaseContentId,
    correction.frozen.id
  );
  assert.equal(correction.workflowRevision, 3);
  assert.equal(correction.generation, 1);
  assert.equal(correction.metadata.title, "Frozen correction base B");
  assert.equal(correction.metadata.overview, "Frozen summary B");
  assert.equal(correction.frozen.common.title, "Frozen correction base B");
  assert.equal(correction.pricing.price, "15.00");
  console.log(
    "PASS exact frozen correction base survives no-op Save; pricing-first initialization restores that base with workflow +2 and preparation +1"
  );

  for (const resolveChoice of [
    "Use current pricing",
    "Keep my pricing against current save",
  ]) {
    const conflict = seed("FULL_ONLY");
    conflict.pricing.isPaid = true;
    conflict.pricing.price = "10.00";
    await open(page, conflict);
    await choosePaid(page, "20", "INR");
    conflict.pricing.price = "30.00";
    conflict.pricing.revision++;
    conflict.workflowRevision++;
    await button(page, "Refresh review checks").click();
    await page.getByText(/Pricing changed in another save/).waitFor();
    assert.equal(
      await page.getByLabel("Dataset price", { exact: true }).inputValue(),
      "20"
    );
    assert.equal(await button(page, "Save pricing").isDisabled(), true);
    assert.equal(
      writes(conflict).length,
      0,
      "Refresh does not silently rebase local pricing onto another save"
    );
    await button(page, "Save draft").click();
    await enabled(button(page, resolveChoice));
    assert.equal(
      writes(conflict).length,
      0,
      "Footer Save also cannot bypass the pricing conflict"
    );
    await button(page, resolveChoice).click();
    if (resolveChoice === "Use current pricing") {
      assert.equal(
        await page.getByLabel("Dataset price", { exact: true }).inputValue(),
        "30.00"
      );
      assert.equal(writes(conflict).length, 0);
    } else {
      await button(page, "Save pricing").click();
      await page.getByText(/Pricing save acknowledged/).waitFor();
      assert.equal(conflict.pricing.price, "20.00");
      assert.equal(conflict.pricing.revision, 2);
      assert.equal(writes(conflict).length, 1);
      assert.equal(
        writes(conflict)[0].body.expectedPricingReference.revision,
        1
      );
    }
  }
  console.log(
    "PASS local price 20 versus separately saved 30 requires explicit conflict resolution before any pricing write"
  );

  const acknowledgedUnreadable = seed("FULL_ONLY");
  await open(page, acknowledgedUnreadable);
  await choosePaid(page, "18", "INR");
  acknowledgedUnreadable.failPreparationReads = true;
  await button(page, "Save pricing").click();
  await page.getByText(/The request was acknowledged\./).waitFor();
  assert.equal(commandWrites(acknowledgedUnreadable, "/pricing").length, 1);
  assert.equal(acknowledgedUnreadable.pricing.price, "18.00");
  const acknowledgedStorage = `kuinbee:dataset-workflow-request:v1:${acknowledgedUnreadable.id}`;
  assert.equal(
    await page.evaluate(
      (key) => sessionStorage.getItem(key),
      acknowledgedStorage
    ),
    null,
    "A verified ACK clears its exact command"
  );
  assert.equal(await button(page, "Retry proposal request").count(), 0);
  assert.equal(await button(page, "Save draft").isDisabled(), true);
  assert.equal(
    await page.getByLabel("Dataset price", { exact: true }).isDisabled(),
    true
  );
  assert.equal(await button(page, "1. Basics").isDisabled(), true);
  await enabled(button(page, "Refresh review checks"));
  const failedRefresh = page.waitForResponse(
    (response) =>
      response.url() ===
        `${origin}/api/v2/supplier/dataset-drafts/${acknowledgedUnreadable.id}` &&
      response.request().method() === "GET" &&
      response.status() === 503
  );
  await button(page, "Refresh review checks").click();
  await failedRefresh;
  await enabled(button(page, "Refresh review checks"));
  assert.equal(
    await button(page, "Save draft").isDisabled(),
    true,
    "Fresh workflow alone cannot unlock an unreadable current preparation"
  );
  assert.equal(
    await page.getByLabel("Dataset price", { exact: true }).isDisabled(),
    true
  );
  acknowledgedUnreadable.failPreparationReads = false;
  await button(page, "Refresh review checks").click();
  await page.getByLabel("Dataset price", { exact: true }).fill("19");
  await enabled(button(page, "1. Basics"));
  assert.equal(
    writes(acknowledgedUnreadable).length,
    1,
    "Read reconciliation never resends the acknowledged mutation"
  );
  console.log(
    "PASS verified ACK clears its command but failed current preparation reads keep mutations locked until fresh preparation/workflow reconciliation"
  );

  const lostPrice = seed("FULL_ONLY");
  await open(page, lostPrice);
  await choosePaid(page, "25", "INR");
  flags.lose = "PRICING_SAVE";
  await button(page, "Save pricing").click();
  await pending(page);
  assert.equal(
    (await fetchWrites(page, lostPrice, "/pricing")).length,
    1,
    "One application dispatch before retry"
  );
  const originalPriceDeliveries = commandWrites(lostPrice, "/pricing").length;
  assert(originalPriceDeliveries >= 1);
  const originalPrice = clone(commandWrites(lostPrice, "/pricing")[0].body);
  for (const delivery of commandWrites(lostPrice, "/pricing"))
    assert.deepEqual(
      delivery.body,
      originalPrice,
      "Browser transport redelivery retains the exact UUID/body"
    );
  const storageKey = `kuinbee:dataset-workflow-request:v1:${lostPrice.id}`;
  assert.equal(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key)).body.requestId,
      storageKey
    ),
    originalPrice.requestId
  );
  await page.reload();
  await review(page);
  await pending(page);
  assert.equal(
    commandWrites(lostPrice, "/pricing").length,
    originalPriceDeliveries,
    "Reload never retries a write automatically"
  );
  assert.equal((await fetchWrites(page, lostPrice, "/pricing")).length, 0);
  flags.lose = null;
  const blockedReceiptStatuses = [401, 429, 400, 404, 409];
  for (const status of blockedReceiptStatuses) {
    flags.retryStatus = status;
    await button(page, "Retry proposal request").click();
    await page
      .getByText(`Receipt lookup paused with ${status}.`, { exact: true })
      .waitFor();
    await pending(page);
    assert.equal(
      await page.evaluate(
        (key) => JSON.parse(sessionStorage.getItem(key)).body.requestId,
        storageKey
      ),
      originalPrice.requestId
    );
    assert.equal(lostPrice.workflowRevision, 1);
    assert.equal(lostPrice.pricing.revision, 1);
    assert.equal(await button(page, "Save draft").isDisabled(), true);
  }
  flags.retryStatus = 0;
  await button(page, "Retry proposal request").click();
  await page.getByText(/Pricing save acknowledged/).waitFor();
  assert.deepEqual(
    commandWrites(lostPrice, "/pricing").map((item) => item.body),
    Array.from(
      { length: originalPriceDeliveries + blockedReceiptStatuses.length + 1 },
      () => originalPrice
    )
  );
  assert.equal(
    (await fetchWrites(page, lostPrice, "/pricing")).length,
    blockedReceiptStatuses.length + 1,
    "Only explicit post-reload retry clicks dispatch"
  );
  assert.equal(lostPrice.workflowRevision, 1);
  assert.equal(lostPrice.pricing.revision, 1);
  assert.equal(
    await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
    null
  );
  console.log(
    "PASS lost pricing ACK survives reload; auth, rate-limit, validation, scope and unknown-conflict retries retain the same UUID without double mutation"
  );

  const lostSubmit = seed("FULL_AND_SAMPLE");
  await open(page, lostSubmit);
  flags.lose = "SUBMIT";
  await button(page, "Submit proposal for admin review").click();
  await pending(page);
  assert.equal(
    (await fetchWrites(page, lostSubmit, "/submit")).length,
    1,
    "One application Submit dispatch before retry"
  );
  const originalSubmitDeliveries = commandWrites(lostSubmit, "/submit").length;
  assert(originalSubmitDeliveries >= 1);
  const originalSubmit = clone(commandWrites(lostSubmit, "/submit")[0].body);
  for (const delivery of commandWrites(lostSubmit, "/submit"))
    assert.deepEqual(delivery.body, originalSubmit);
  assert(lostSubmit.frozen);
  assert.equal(lostSubmit.workflowRevision, 1);
  await page.reload();
  await review(page);
  await pending(page);
  assert.equal(
    commandWrites(lostSubmit, "/submit").length,
    originalSubmitDeliveries
  );
  assert.equal((await fetchWrites(page, lostSubmit, "/submit")).length, 0);
  flags.lose = null;
  await button(page, "Retry proposal request").click();
  await page.locator("[data-frozen-submission]").waitFor();
  await page.getByText(/Submission acknowledged/).waitFor();
  assert.deepEqual(
    commandWrites(lostSubmit, "/submit").map((item) => item.body),
    Array.from({ length: originalSubmitDeliveries + 1 }, () => originalSubmit)
  );
  assert.equal(
    (await fetchWrites(page, lostSubmit, "/submit")).length,
    1,
    "Only the explicit post-reload retry dispatches"
  );
  assert.equal(lostSubmit.workflowRevision, 1);
  console.log(
    "PASS lost Submit ACK and reload confirm the same exact frozen proposal, with no automatic resubmission"
  );

  const closed = seed("FULL_ONLY");
  flags.closed = true;
  await open(page, closed);
  await page
    .getByText("Required backend file checks are currently unavailable.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await button(page, "Submit proposal for admin review").isDisabled(),
    true
  );
  assert.equal(writes(closed).length, 0);
  flags.closed = false;
  await button(page, "Refresh review checks").click();
  await enabled(button(page, "Submit proposal for admin review"));
  const mixed = seed("FULL_ONLY");
  flags.mismatchedContext = true;
  await open(page, mixed);
  await page
    .getByText(/saved proposal changed while loading its review/)
    .waitFor();
  assert.equal(
    await button(page, "Submit proposal for admin review").isDisabled(),
    true
  );
  assert.equal(writes(mixed).length, 0);
  flags.mismatchedContext = false;
  await button(page, "Refresh review checks").click();
  await enabled(button(page, "Submit proposal for admin review"));
  flags.staleSubmit = true;
  await button(page, "Submit proposal for admin review").click();
  await page
    .getByText(/exact proposal changed; preserve your input and refresh/)
    .waitFor();
  assert.equal(mixed.frozen, null);
  assert.equal(mixed.verificationStatus, "PENDING");
  assert.equal(
    await button(page, "Submit proposal for admin review").isDisabled(),
    true
  );
  assert.equal(
    await button(page, "Retry proposal request").count(),
    0,
    "A definite conflict clears only its exact command"
  );
  console.log(
    "PASS closed runtime, mixed context snapshots and stale Submit fail without inventing acceptance or publishing"
  );

  const frozen = seed("FULL_AND_SAMPLE", { members: 23 });
  await open(page, frozen);
  await button(page, "Submit proposal for admin review").click();
  const frozenPanel = page.locator("[data-frozen-submission]");
  await frozenPanel.waitFor();
  frozen.currentCategoryName = "Current category renamed after submission";
  frozen.currentSourceName = "Current source renamed after submission";
  frozen.frozen.dependenciesChanged = true;
  frozen.members[0].inspection = {
    securityState: "BLOCKED",
    currentEvidenceId: newId(),
    recordedOutcome: "FAIL",
    current: true,
    eligibility: "NOT_EVALUATED",
  };
  await button(page, "Refresh review checks").click();
  await frozenPanel
    .getByText("Category before submission", { exact: true })
    .waitFor();
  assert.equal(
    await frozenPanel
      .getByText("Current category renamed after submission", { exact: true })
      .count(),
    0
  );
  const frozenInventory = page.locator("[data-frozen-inventory]");
  await frozenInventory.waitFor();
  await frozenInventory
    .getByRole("button", { name: "Refresh submission", exact: true })
    .click();
  await frozenInventory.getByText("selected-1.csv", { exact: true }).waitFor();
  // A stored inspection-at-submission reference is distinct from current status.
  assert.equal(frozen.members[0].inspection.recordedOutcome, "FAIL");
  await frozenInventory.getByText("Blocked", { exact: true }).waitFor();
  await frozenInventory
    .getByText(/fail · current evidence reference/)
    .waitFor();
  const firstFile = frozenInventory
    .getByRole("listitem")
    .filter({ hasText: "selected-1.csv" });
  assert(
    (await firstFile.innerText()).includes(
      frozen.members[0].inspectionAtSubmissionId
    )
  );
  assert(
    (await firstFile.innerText()).includes(
      frozen.members[0].inspection.currentEvidenceId
    )
  );
  const nextFiles = frozenInventory.getByRole("button", {
    name: /Next|Load more/,
  });
  if (await nextFiles.count()) {
    await nextFiles.first().click();
    await frozenInventory
      .getByText("selected-23.csv", { exact: true })
      .waitFor();
  }
  const inventoryReads = requests.filter(
    (item) =>
      item.path ===
      `/api/v2/supplier/dataset-drafts/${frozen.id}/submission/inventory`
  );
  assert(
    inventoryReads.length >= 2,
    "The bounded frozen inventory reaches later pages"
  );
  for (const request of inventoryReads) {
    const query = DatasetFrozenInventoryQuerySchema.parse(
      Object.fromEntries(new URLSearchParams(request.query))
    );
    assert.equal(query.contentId, frozen.frozen.id);
    assert.equal(query.contentGeneration, frozen.frozen.generation);
    assert.equal(query.expectedWorkflowRevision, frozen.workflowRevision);
  }
  await frozenInventory
    .getByLabel("Material", { exact: true })
    .selectOption("SAMPLE");
  await frozenInventory.getByText("selected-2.csv", { exact: true }).waitFor();
  assert.equal(
    await frozenInventory.getByText("selected-1.csv", { exact: true }).count(),
    0
  );
  await frozenInventory
    .getByLabel("Inventory", { exact: true })
    .selectOption("GROUPS");
  await frozenInventory
    .getByText("No matching groups in this submitted proposal.", {
      exact: true,
    })
    .waitFor();
  await frozenInventory
    .getByLabel("Inventory", { exact: true })
    .selectOption("RELATIONSHIPS");
  await frozenInventory
    .getByText("No matching relationships in this submitted proposal.", {
      exact: true,
    })
    .waitFor();
  await frozenInventory
    .getByLabel("Material", { exact: true })
    .selectOption("ALL");
  await frozenInventory
    .getByLabel("Inventory", { exact: true })
    .selectOption("FILES");
  await frozenInventory.getByText("selected-1.csv", { exact: true }).waitFor();
  frozen.workflowRevision++;
  await frozenInventory
    .getByRole("button", { name: "Next page", exact: true })
    .click();
  await frozenInventory
    .getByText("The exact submission changed.", { exact: true })
    .waitFor();
  assert.equal(
    await frozenInventory.getByText("selected-1.csv", { exact: true }).count(),
    0,
    "A stale page never remains visible under a failed context"
  );
  assert.equal(
    await frozenInventory.getByText("selected-23.csv", { exact: true }).count(),
    0
  );
  await frozenInventory
    .getByRole("button", { name: "Refresh submission", exact: true })
    .click();
  await frozenInventory.getByText("selected-1.csv", { exact: true }).waitFor();
  assert.equal(
    await frozenInventory
      .getByText("The exact submission changed.", { exact: true })
      .count(),
    0
  );
  assert.equal(
    await frozenInventory
      .getByRole("button", { name: /Remove|Upload|Use in/ })
      .count(),
    0,
    "Frozen inventory has no material mutations"
  );
  console.log(
    "PASS frozen facts remain distinct from renamed current labels/current inspection; exact paged read-only inventory filters and stale-context recovery do not mix pages"
  );

  const output = process.argv
    .find((value) => value.startsWith("--screenshots="))
    ?.split("=")[1];
  if (output) await mkdir(resolve(output), { recursive: true });
  for (const width of [1366, 390])
    for (const dark of [false, true]) {
      await page.setViewportSize({ width, height: 1000 });
      const toggle = button(page, dark ? "Use dark theme" : "Use light theme");
      if (await toggle.count()) await toggle.click();
      await page.waitForFunction(
        (dark) =>
          document.documentElement.classList.contains("dark") === dark &&
          document.documentElement.dataset.dashboardThemeTransition !== "true",
        dark
      );
      await page
        .locator("#supplier-dashboard-main")
        .evaluate((main) =>
          main.scrollTo({ top: 0, left: 0, behavior: "instant" })
        );
      assert.equal(
        await page.evaluate(() => {
          const main = document.querySelector("#supplier-dashboard-main");
          return (
            document.documentElement.scrollWidth <= innerWidth &&
            main.scrollWidth <= main.clientWidth
          );
        }),
        true,
        "No review overflow on desktop/mobile"
      );
      if (output)
        await page.screenshot({
          path: resolve(
            output,
            `workflow-${width}-${dark ? "dark" : "light"}.png`
          ),
          fullPage: true,
        });
    }
  assert.deepEqual(fixtureErrors, []);
  assert.deepEqual(browserErrors, []);
  assert.deepEqual(external, []);
  assert(
    !requests.some((item) =>
      /\/admin\/|publish|payment|presign|download-url/.test(item.path)
    )
  );
  console.log(
    "PASS rendered supplier workflow qualification; no native scanner, real admin/publication/access or hosted qualification claim"
  );
} catch (failure) {
  console.error("Workflow fixture errors:", fixtureErrors);
  console.error("Browser errors:", browserErrors);
  for (const page of browser
    ?.contexts()
    .flatMap((context) => context.pages()) ?? [])
    console.error(
      "Rendered page:",
      (await page.locator("body").innerText()).slice(-18000)
    );
  throw failure;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolveClose) => server.close(resolveClose));
}
