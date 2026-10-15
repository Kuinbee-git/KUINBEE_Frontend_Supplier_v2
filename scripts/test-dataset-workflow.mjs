import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const directory = await mkdtemp(
  join(tmpdir(), "kuinbee-supplier-workflow-test-")
);
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage"
);
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalStorage)
    Object.defineProperty(globalThis, "sessionStorage", originalStorage);
  else delete globalThis.sessionStorage;
  await rm(directory, { recursive: true, force: true });
});
async function load(environment) {
  const output = join(directory, `${environment}.mjs`);
  await build({
    stdin: {
      contents: [
        "export {datasetWorkflowApi} from './src/lib/api/dataset-workflow';",
        "export * from './src/lib/datasets/dataset-workflow-commands';",
        "export {PreparationApiError} from './src/lib/api/dataset-preparations';",
      ].join("\n"),
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: true,
    outfile: output,
    platform: "node",
    format: "esm",
    define: {
      "process.env.NEXT_PUBLIC_APP_ENV": JSON.stringify(environment),
      "process.env.NODE_ENV": '"test"',
    },
  });
  return import(pathToFileURL(output).href);
}
const {
  datasetWorkflowApi: api,
  DatasetWorkflowCommandSchema,
  readDatasetWorkflowCommand,
  storeDatasetWorkflowCommand,
  clearDatasetWorkflowCommand,
  dispatchDatasetWorkflowCommand,
  ambiguousDatasetWorkflowFailure,
  PreparationApiError,
} = await load("local");
const { datasetWorkflowApi: productionApi } = await load("production");
const ids = {
  draft: "cm000000000000000000000001",
  content: "cm000000000000000000000002",
  price: "cm000000000000000000000003",
  other: "cm000000000000000000000004",
  next: "cm000000000000000000000005",
};
const requestId = "a37a8b2e-34bf-4df3-b3f2-1c0628563396";
const now = "2026-10-16T00:00:00.000Z";
const code = (expected) => (error) => error.code === expected;
const incompatible = code("INCOMPATIBLE_RESPONSE");
function state(changes = {}) {
  return {
    datasetId: ids.draft,
    datasetUniqueId: "D0000000001",
    datasetStatus: "SUBMITTED",
    verificationStatus: "PENDING",
    preparationGeneration: 3,
    workflowRevision: 4,
    activeContentId: ids.content,
    reviewedContentId: null,
    publishedContentId: null,
    pricing: {
      id: ids.price,
      revision: 2,
      isPaid: true,
      price: "10.00",
      currency: "INR",
      status: "DRAFT",
      notes: null,
      rejectionReason: null,
      submittedAt: null,
      approvedAt: null,
      updatedAt: now,
    },
    ...changes,
  };
}
const writeContext = {
  requestId,
  expectedPreparationGeneration: 3,
  expectedWorkflowRevision: 4,
  expectedPricingReference: { id: ids.price, revision: 2 },
};
const pricingBody = {
  ...writeContext,
  changes: { isPaid: true, price: "10", currency: "INR" },
};
const submitBody = {
  ...writeContext,
  expectedContentId: ids.content,
  expectedContentGeneration: 1,
  expectedDependencyFingerprint: "a".repeat(64),
};
function pricingReceipt(changes = {}) {
  return {
    requestId,
    state: state({
      workflowRevision: 5,
      pricing: { ...state().pricing, revision: 3 },
      ...changes,
    }),
  };
}
function submitReceipt(changes = {}) {
  return {
    requestId,
    state: state({
      workflowRevision: 5,
      activeContentId: null,
      reviewedContentId: ids.content,
      verificationStatus: "SUBMITTED",
      ...changes,
    }),
  };
}
function mock(data, status = 200) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: new URL(url), options });
    return Response.json(
      status === 200
        ? { success: true, data: structuredClone(data) }
        : { success: false, error: data },
      { status }
    );
  };
  return calls;
}
function assertRequest(calls, suffix, method = "GET", body) {
  assert.equal(
    calls.length,
    1,
    "One explicit operation never retries or reads on"
  );
  assert.equal(
    calls[0].url.pathname,
    `/api/v2/supplier/dataset-drafts/${ids.draft}/${suffix}`
  );
  assert.equal(calls[0].options.method ?? "GET", method);
  assert.equal(calls[0].options.credentials, "include");
  assert.equal(calls[0].options.cache, "no-store");
  assert(calls[0].options.signal instanceof AbortSignal);
  if (body) assert.deepEqual(JSON.parse(calls[0].options.body), body);
}

// Real production adapter and canonical schemas with a synthetic HTTP peer.
// These tests do not qualify database, scanner, admin or hosted acceptance.
test("owned workflow reads use the fixed supplier route and private request", async () => {
  const calls = mock({ state: state() });
  assert.deepEqual((await api.state(ids.draft)).state, state());
  assertRequest(calls, "workflow");
  for (const response of [
    { state: state({ datasetId: ids.other }) },
    { requestId, state: state() },
    { state: { ...state(), storageKey: "must-not-be-exposed" } },
  ]) {
    const rejected = mock(response);
    await assert.rejects(api.state(ids.draft), incompatible);
    assert.equal(rejected.length, 1);
  }
});

test("readiness pins the saved generation and exact editable content", async () => {
  const ready = {
    state: state(),
    contentId: ids.content,
    contentGeneration: 1,
    dependencyFingerprint: "a".repeat(64),
    canSubmit: true,
    issues: [],
  };
  const calls = mock(ready);
  assert.deepEqual(await api.readiness(ids.draft, 3), ready);
  assertRequest(calls, "readiness");
  assert.equal(
    calls[0].url.searchParams.get("expectedPreparationGeneration"),
    "3"
  );
  for (const change of [
    { state: state({ preparationGeneration: 4 }) },
    { contentId: ids.other },
    { contentId: null },
    { dependencyFingerprint: null },
    { state: state({ pricing: null }) },
    { issues: [{ code: "DRAFT_CHANGED", message: "Refresh" }] },
    { canSubmit: false },
  ]) {
    mock({ ...ready, ...change });
    await assert.rejects(api.readiness(ids.draft, 3), incompatible);
  }
  const unavailable = {
    ...ready,
    contentId: null,
    contentGeneration: null,
    dependencyFingerprint: null,
    canSubmit: false,
    issues: [
      { code: "INSPECTION_NOT_QUALIFIED", message: "Checks unavailable" },
    ],
  };
  mock(unavailable);
  assert.deepEqual(await api.readiness(ids.draft, 3), unavailable);
});

test("pricing Save checks the exact command receipt and normalized money", async () => {
  const calls = mock(pricingReceipt());
  const result = await api.savePricing(ids.draft, pricingBody);
  assert.equal(result.state.pricing.price, "10.00");
  assertRequest(calls, "pricing", "PUT", pricingBody);
  const freeBody = {
    ...pricingBody,
    changes: { isPaid: false, price: null, currency: "USD" },
  };
  mock(
    pricingReceipt({
      pricing: { ...state().pricing, ...freeBody.changes, revision: 3 },
    })
  );
  assert.equal(
    (await api.savePricing(ids.draft, freeBody)).state.pricing.price,
    null
  );
});

test("old immutable pricing ACK remains a receipt without a hidden latest read", async () => {
  const calls = mock(pricingReceipt());
  const original = await api.savePricing(ids.draft, pricingBody);
  const replay = await api.savePricing(ids.draft, pricingBody);
  assert.deepEqual(replay, original);
  assert.equal(calls.length, 2);
  assert(calls.every((call) => call.options.method === "PUT"));
  assert.equal(calls[0].options.body, calls[1].options.body);
  mock(pricingReceipt({ workflowRevision: 8 }));
  await assert.rejects(api.savePricing(ids.draft, pricingBody), incompatible);
});

test("pricing Save rejects another draft, request, revision, price or currency", async () => {
  const cases = [
    { requestId: "b37a8b2e-34bf-4df3-b3f2-1c0628563396" },
    { requestId: undefined },
    { state: state({ datasetId: ids.other, workflowRevision: 5 }) },
    { state: pricingReceipt({ preparationGeneration: 4 }).state },
    {
      state: pricingReceipt({ pricing: { ...state().pricing, revision: 4 } })
        .state,
    },
    {
      state: pricingReceipt({
        pricing: { ...state().pricing, id: ids.other, revision: 1 },
      }).state,
    },
    {
      state: pricingReceipt({
        pricing: { ...state().pricing, price: "11", revision: 3 },
      }).state,
    },
    {
      state: pricingReceipt({
        pricing: { ...state().pricing, currency: "USD", revision: 3 },
      }).state,
    },
    {
      state: pricingReceipt({
        pricing: { ...state().pricing, status: "ACTIVE", revision: 3 },
      }).state,
    },
  ];
  for (const change of cases) {
    const calls = mock({ ...pricingReceipt(), ...change });
    await assert.rejects(api.savePricing(ids.draft, pricingBody), incompatible);
    assert.equal(calls.length, 1);
  }
});

test("pricing-first correction supports exact initialization and new pricing draft", async () => {
  const body = {
    ...pricingBody,
    editContext: {
      mode: "INITIALIZE",
      context: "APPROVED_REEDIT",
      expectedWorkflowRevision: 4,
      expectedBaseContentId: ids.content,
    },
  };
  const receipt = pricingReceipt({
    workflowRevision: 6,
    preparationGeneration: 4,
    activeContentId: ids.other,
    pricing: { ...state().pricing, id: ids.next, revision: 1 },
  });
  mock(receipt);
  assert.deepEqual(await api.savePricing(ids.draft, body), receipt);
  for (const change of [
    { workflowRevision: 5 },
    { preparationGeneration: 3 },
    { activeContentId: null },
    { activeContentId: ids.content },
  ]) {
    mock({ ...receipt, state: { ...receipt.state, ...change } });
    await assert.rejects(api.savePricing(ids.draft, body), incompatible);
  }
  const existing = {
    ...pricingBody,
    editContext: {
      mode: "EXISTING_DRAFT",
      expectedContentId: ids.content,
      expectedGeneration: 1,
    },
  };
  mock(pricingReceipt());
  assert.equal(
    (await api.savePricing(ids.draft, existing)).state.activeContentId,
    ids.content
  );
  mock(pricingReceipt({ activeContentId: ids.other }));
  await assert.rejects(api.savePricing(ids.draft, existing), incompatible);
});

test("pricing submission is explicit and returns only its exact ACK", async () => {
  const receipt = pricingReceipt({
    pricing: {
      ...state().pricing,
      revision: 3,
      status: "SUBMITTED",
      submittedAt: now,
    },
  });
  const calls = mock(receipt);
  assert.deepEqual(await api.submitPricing(ids.draft, writeContext), receipt);
  assertRequest(calls, "pricing/submit", "POST", writeContext);
  mock(pricingReceipt());
  await assert.rejects(
    api.submitPricing(ids.draft, writeContext),
    incompatible
  );
});

test("proposal Submit freezes the exact content and pricing without publishing", async () => {
  const calls = mock(submitReceipt());
  assert.deepEqual(await api.submit(ids.draft, submitBody), submitReceipt());
  assertRequest(calls, "submit", "POST", submitBody);
  for (const change of [
    { workflowRevision: 6 },
    { preparationGeneration: 4 },
    { reviewedContentId: ids.other },
    { activeContentId: ids.content },
    { datasetStatus: "PUBLISHED" },
    { verificationStatus: "VERIFIED" },
    { pricing: { ...state().pricing, revision: 3 } },
  ]) {
    mock(submitReceipt(change));
    await assert.rejects(api.submit(ids.draft, submitBody), incompatible);
  }
});

function submission(choice = "FULL_ONLY") {
  return {
    state: submitReceipt().state,
    submittedContent: {
      id: ids.content,
      generation: 1,
      uploadChoice: choice,
      frozenAt: now,
      common: {
        title: "Test collection",
        overview: "Overview",
        description: "Description",
        dataQuality: "Quality",
        license: "CC-BY-4.0",
        primaryCategoryId: "category",
        secondaryCategoryIds: [],
        sourceId: "source",
        tags: [],
        categories: [{ id: "category", name: "Category" }],
        source: {
          id: "source",
          name: "Source",
          description: null,
          websiteUrl: null,
          isVerifiedAtFreeze: false,
        },
      },
      metadata: {},
      pricingReference: { id: ids.price, revision: 2 },
      pricingAtSubmission: { isPaid: false, price: null, currency: "INR" },
      dependencyFingerprint: "a".repeat(64),
      dependenciesChanged: false,
      selectedFiles: 1,
    },
  };
}
test("submission reads retain frozen facts and sample display-only scope", async () => {
  const receipt = submission("SAMPLE_ONLY");
  const calls = mock(receipt);
  assert.deepEqual(await api.submission(ids.draft), receipt);
  assertRequest(calls, "submission");
  mock({ ...receipt, state: state({ reviewedContentId: ids.other }) });
  await assert.rejects(api.submission(ids.draft), incompatible);
  mock({
    ...receipt,
    submittedContent: {
      ...receipt.submittedContent,
      pricingAtSubmission: { isPaid: true, price: "10", currency: "INR" },
    },
  });
  await assert.rejects(api.submission(ids.draft), incompatible);
});

test("frozen inventory pins content, workflow, component, page order and cursor", async () => {
  const query = {
    expectedWorkflowRevision: 5,
    contentId: ids.content,
    contentGeneration: 1,
    inventory: "GROUPS",
    component: "FULL",
    limit: 2,
  };
  const page = {
    datasetId: ids.draft,
    workflowRevision: 5,
    contentId: ids.content,
    contentGeneration: 1,
    frozenAt: now,
    inventory: "GROUPS",
    component: "FULL",
    total: 2,
    items: [ids.other, ids.next].map((id) => ({
      id,
      contentId: ids.content,
      component: "FULL",
      label: id,
    })),
    nextCursor: null,
  };
  const calls = mock(page);
  assert.deepEqual(await api.inventory(ids.draft, query), page);
  assertRequest(calls, "submission/inventory");
  assert.deepEqual(
    Object.fromEntries(calls[0].url.searchParams),
    Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key, String(value)])
    )
  );
  for (const change of [
    { datasetId: ids.other },
    { workflowRevision: 6 },
    { contentGeneration: 2 },
    { component: null },
    { total: 1 },
    { items: [...page.items].reverse() },
    {
      nextCursor: {
        ...query,
        limit: undefined,
        afterId: ids.next,
        expectedWorkflowRevision: 6,
      },
    },
  ]) {
    mock({ ...page, ...change });
    await assert.rejects(api.inventory(ids.draft, query), incompatible);
  }
  mock(page);
  await assert.rejects(
    api.inventory(ids.draft, { ...query, afterId: ids.other }),
    incompatible
  );
});

test("edit context/base reads preserve the exact selected correction base", async () => {
  const context = {
    datasetId: ids.draft,
    operation: "PRICING",
    preparationGeneration: 3,
    workflowRevision: 4,
    managementContext: "INITIAL_PROPOSAL",
    editable: true,
    precondition: {
      mode: "EXISTING_DRAFT",
      expectedContentId: ids.content,
      expectedGeneration: 1,
    },
    reason: null,
  };
  const calls = mock(context);
  assert.deepEqual(await api.editContext(ids.draft, "PRICING"), context);
  assertRequest(calls, "edit-context");
  const editBase = {
    context,
    metadataSource: "CURRENT_DRAFT",
    metadata: { title: "Test collection" },
    contentReference: { contentId: ids.content, generation: 1, frozen: false },
  };
  const baseCalls = mock(editBase);
  assert.deepEqual(await api.editBase(ids.draft, "PRICING"), editBase);
  assertRequest(baseCalls, "edit-base");
  mock({ ...context, operation: "MATERIALS" });
  await assert.rejects(api.editContext(ids.draft, "PRICING"), incompatible);
  mock({
    ...editBase,
    contentReference: { ...editBase.contentReference, contentId: ids.other },
  });
  await assert.rejects(api.editBase(ids.draft, "PRICING"), incompatible);
});

test("invalid IDs, prices and correction fences never send a write", async () => {
  const calls = mock(pricingReceipt());
  await assert.rejects(api.state("../admin"));
  await assert.rejects(
    api.savePricing(ids.draft, {
      ...pricingBody,
      changes: { ...pricingBody.changes, price: null },
    })
  );
  await assert.rejects(
    api.savePricing(ids.draft, {
      ...pricingBody,
      editContext: {
        mode: "INITIALIZE",
        context: "REQUESTED_CHANGES",
        expectedWorkflowRevision: 3,
        expectedBaseContentId: ids.content,
      },
    }),
    code("INVALID_EDIT_CONTEXT")
  );
  assert.equal(calls.length, 0);
});

test("authentication, cancellation and ambiguous network errors never retry", async () => {
  const denied = mock({ code: "FORBIDDEN", message: "Wrong supplier" }, 403);
  await assert.rejects(api.submit(ids.draft, submitBody), code("FORBIDDEN"));
  assert.equal(denied.length, 1);
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(options.credentials, "include");
    throw new TypeError("Synthetic lost acknowledgement");
  };
  await assert.rejects(
    api.savePricing(ids.draft, pricingBody),
    code("NETWORK_ERROR")
  );
  assert.equal(calls, 1);
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(options.signal.aborted, true);
    throw options.signal.reason;
  };
  await assert.rejects(
    api.state(ids.draft, controller.signal),
    code("NETWORK_ERROR")
  );
  assert.equal(calls, 2);
});

test("production remains gated before any workflow request", async () => {
  const calls = mock({ state: state() });
  await assert.rejects(productionApi.state(ids.draft), code("NOT_ENABLED"));
  await assert.rejects(
    productionApi.submit(ids.draft, submitBody),
    code("NOT_ENABLED")
  );
  assert.equal(calls.length, 0);
});

function storage() {
  const values = new Map();
  const calls = [];
  const object = {
    getItem(key) {
      calls.push(["GET", key]);
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      calls.push(["SET", key, value]);
      values.set(key, value);
    },
    removeItem(key) {
      calls.push(["REMOVE", key]);
      values.delete(key);
    },
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    writable: true,
    value: object,
  });
  return { values, calls, object };
}
const command = () => ({
  kind: "PRICING_SAVE",
  draftId: ids.draft,
  body: structuredClone(pricingBody),
});
const storageKey = `kuinbee:dataset-workflow-request:v1:${ids.draft}`;

test("one canonical command is retained per draft without storing other data", () => {
  const retained = storage();
  assert.equal(readDatasetWorkflowCommand(ids.draft), null);
  assert.equal(retained.calls.filter((call) => call[0] !== "GET").length, 0);
  const supplied = command();
  supplied.body.requestId = requestId.toUpperCase();
  storeDatasetWorkflowCommand(supplied);
  assert.deepEqual(readDatasetWorkflowCommand(ids.draft), command());
  const serialized = retained.values.get(storageKey);
  assert.equal(serialized, JSON.stringify(command()));
  storeDatasetWorkflowCommand(command());
  assert.equal(retained.values.size, 1);
  const other = { ...command(), draftId: ids.other };
  storeDatasetWorkflowCommand(other);
  assert.equal(retained.values.size, 2);
  clearDatasetWorkflowCommand(command());
  assert.equal(readDatasetWorkflowCommand(ids.draft), null);
  assert.deepEqual(readDatasetWorkflowCommand(ids.other), other);
});

test("an unresolved command cannot be replaced or cleared by a changed request", () => {
  storage();
  storeDatasetWorkflowCommand(command());
  const changed = command();
  changed.body.changes.price = "20";
  assert.throws(
    () => storeDatasetWorkflowCommand(changed),
    /previous proposal request/
  );
  assert.throws(
    () => clearDatasetWorkflowCommand(changed),
    /Stored proposal request changed/
  );
  assert.deepEqual(readDatasetWorkflowCommand(ids.draft), command());
  const newRequest = command();
  newRequest.body.requestId = "b37a8b2e-34bf-4df3-b3f2-1c0628563396";
  assert.throws(
    () => storeDatasetWorkflowCommand(newRequest),
    /previous proposal request/
  );
  assert.deepEqual(readDatasetWorkflowCommand(ids.draft), command());
});

test("malformed, oversized or foreign retained commands are preserved and refused", () => {
  const retained = storage();
  for (const value of [
    "{",
    " ".repeat(8193),
    JSON.stringify({ ...command(), draftId: ids.other }),
    JSON.stringify({ ...command(), credential: "forbidden-fixture" }),
    JSON.stringify({
      ...command(),
      body: { ...command().body, scannerVerdict: "PASS" },
    }),
  ]) {
    retained.values.set(storageKey, value);
    assert.throws(() => readDatasetWorkflowCommand(ids.draft));
    assert.throws(() => storeDatasetWorkflowCommand(command()));
    assert.equal(retained.values.get(storageKey), value);
  }
  assert.throws(() =>
    DatasetWorkflowCommandSchema.parse({ ...command(), kind: "PUBLISH" })
  );
  assert.throws(() =>
    storeDatasetWorkflowCommand({ ...command(), file: new Blob(["fixture"]) })
  );
});

test("dispatch requires the retained exact body and never clears its receipt", async () => {
  storage();
  const calls = mock(pricingReceipt());
  assert.throws(
    () => dispatchDatasetWorkflowCommand(command()),
    /Retain the exact/
  );
  assert.equal(calls.length, 0);
  storeDatasetWorkflowCommand(command());
  const changed = command();
  changed.body.changes.currency = "USD";
  assert.throws(
    () => dispatchDatasetWorkflowCommand(changed),
    /Retain the exact/
  );
  assert.equal(calls.length, 0);
  assert.deepEqual(
    await dispatchDatasetWorkflowCommand(command()),
    pricingReceipt()
  );
  assertRequest(calls, "pricing", "PUT", pricingBody);
  assert.deepEqual(readDatasetWorkflowCommand(ids.draft), command());
  clearDatasetWorkflowCommand(command());
  assert.equal(readDatasetWorkflowCommand(ids.draft), null);
});

test("lost ACK is replayed with the same persisted command, never automatically", async () => {
  storage();
  storeDatasetWorkflowCommand(command());
  const sent = [];
  globalThis.fetch = async (_url, options) => {
    sent.push(options.body);
    throw new TypeError("Synthetic lost acknowledgement");
  };
  await assert.rejects(
    dispatchDatasetWorkflowCommand(command()),
    code("NETWORK_ERROR")
  );
  assert.equal(sent.length, 1);
  assert.deepEqual(readDatasetWorkflowCommand(ids.draft), command());
  globalThis.fetch = async (_url, options) => {
    sent.push(options.body);
    return Response.json({ success: true, data: pricingReceipt() });
  };
  await dispatchDatasetWorkflowCommand(readDatasetWorkflowCommand(ids.draft));
  assert.equal(sent.length, 2);
  assert.equal(sent[0], sent[1]);
  assert.deepEqual(readDatasetWorkflowCommand(ids.draft), command());
});

test("each explicit persisted command uses its own supplier workflow route", async () => {
  for (const [kind, body, response, suffix] of [
    [
      "PRICING_SUBMIT",
      writeContext,
      pricingReceipt({
        pricing: {
          ...state().pricing,
          revision: 3,
          status: "SUBMITTED",
          submittedAt: now,
        },
      }),
      "pricing/submit",
    ],
    ["SUBMIT", submitBody, submitReceipt(), "submit"],
  ]) {
    storage();
    const supplied = { kind, draftId: ids.draft, body };
    storeDatasetWorkflowCommand(supplied);
    const calls = mock(response);
    assert.deepEqual(await dispatchDatasetWorkflowCommand(supplied), response);
    assertRequest(calls, suffix, "POST", body);
    assert.deepEqual(readDatasetWorkflowCommand(ids.draft), supplied);
  }
});

test("unavailable or unverifiable storage prevents dispatch", () => {
  const retained = storage();
  const calls = mock(pricingReceipt());
  retained.object.setItem = () => {
    throw new Error("Synthetic storage quota");
  };
  assert.throws(() => storeDatasetWorkflowCommand(command()), /storage quota/);
  assert.throws(
    () => dispatchDatasetWorkflowCommand(command()),
    /Retain the exact/
  );
  retained.object.setItem = () => {};
  assert.throws(
    () => storeDatasetWorkflowCommand(command()),
    /could not be retained/
  );
  assert.throws(
    () => dispatchDatasetWorkflowCommand(command()),
    /Retain the exact/
  );
  assert.equal(calls.length, 0);
  retained.object.setItem = (key, value) => retained.values.set(key, value);
  storeDatasetWorkflowCommand(command());
  retained.object.removeItem = () => {};
  assert.throws(
    () => clearDatasetWorkflowCommand(command()),
    /could not be cleared/
  );
  assert.deepEqual(readDatasetWorkflowCommand(ids.draft), command());
});

test("ambiguous command errors retain work while definite conflicts can refresh", () => {
  for (const failure of [
    new Error("Unknown"),
    new PreparationApiError("Lost ACK", "NETWORK_ERROR"),
    new PreparationApiError("Bad response", "INCOMPATIBLE_RESPONSE"),
    new PreparationApiError("Server interrupted", "HTTP_503", 503),
    ...[400, 401, 403, 404, 408, 425, 429].map(
      (status) =>
        new PreparationApiError(
          "Receipt lookup did not run",
          `HTTP_${status}`,
          status
        )
    ),
    new PreparationApiError(
      "Unknown conflict before receipt lookup",
      "UNKNOWN_CONFLICT",
      409
    ),
    new PreparationApiError("Unavailable gate", "NOT_ENABLED"),
    new PreparationApiError(
      "A validation error is not a workflow conflict",
      "DRAFT_CHANGED",
      400
    ),
  ])
    assert.equal(ambiguousDatasetWorkflowFailure(failure), true);
  for (const failure of [
    new PreparationApiError("Draft changed", "DRAFT_CHANGED", 409),
    new PreparationApiError("Pricing changed", "PRICING_CHANGED", 409),
  ])
    assert.equal(ambiguousDatasetWorkflowFailure(failure), false);
});
