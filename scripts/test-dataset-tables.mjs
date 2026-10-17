import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { tableMetadataFixture } from "./table-metadata-fixtures.mjs";
const temporary = await mkdtemp(join(tmpdir(), "kuinbee-table-protocol-"));
const originalFetch = globalThis.fetch,
  originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage"
  );
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalStorage)
    Object.defineProperty(globalThis, "sessionStorage", originalStorage);
  else delete globalThis.sessionStorage;
  await rm(temporary, { recursive: true, force: true });
});
async function load(environment) {
  const outfile = join(temporary, environment + ".mjs");
  await build({
    stdin: {
      contents:
        "export {datasetTablesApi} from './src/lib/api/dataset-tables';export {datasetTableMetadataApi} from './src/lib/api/dataset-table-metadata';export * from './src/lib/datasets/dataset-upload-commands';export {PreparationApiError} from './src/lib/api/dataset-preparations';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    outfile,
    platform: "node",
    format: "esm",
    define: {
      "process.env.NEXT_PUBLIC_APP_ENV": JSON.stringify(environment),
      "process.env.NODE_ENV": '"test"',
    },
  });
  return import(pathToFileURL(outfile).href);
}
const local = await load("local"),
  production = await load("production"),
  api = local.datasetTablesApi;
const ids = {
  draft: "cm000000000000000000000001",
  content: "cm000000000000000000000002",
  member: "cm000000000000000000000003",
  table: "cm000000000000000000000004",
  column: "cm000000000000000000000005",
  next: "cm000000000000000000000006",
};
const query = {
  contentId: ids.content,
  contentGeneration: 2,
  expectedPreparationGeneration: 3,
  memberId: ids.member,
  tableId: ids.table,
  limit: 1,
};
const table = {
  kind: "TABLE",
  id: ids.table,
  syntaxProfileId: "UTF8_CSV_SYNTAX_V1",
  headerConvention: "PRESENT",
  logicalEntryId: null,
  locator: null,
  columnCount: 2,
  recordCount: "3",
  dataRecordCount: "2",
  description: null,
};
const row = {
  kind: "COLUMN",
  id: ids.column,
  tableId: ids.table,
  position: 1,
  observedName: "amount",
  storageRepresentation: "UTF8_TEXT",
  description: null,
};
const page = {
  contentId: ids.content,
  contentGeneration: 2,
  preparationGeneration: 3,
  frozen: false,
  memberId: ids.member,
  component: "FULL",
  tableId: ids.table,
  table,
  items: [row],
  nextCursor: { ...query, afterId: ids.column },
};
const body = {
  requestId: "6363eb60-e9b9-444b-b916-a697a1df9ee0",
  expectedContentId: ids.content,
  expectedGeneration: 2,
  expectedPreparationGeneration: 3,
  operations: [
    {
      operation: "SET_COLUMN",
      memberId: ids.member,
      tableId: ids.table,
      columnId: ids.column,
      changes: { meaningState: "UNKNOWN" },
    },
  ],
};
const ack = {
  requestId: body.requestId,
  contentId: ids.content,
  generation: 3,
  preparationGeneration: 3,
  results: [
    {
      index: 0,
      operation: "SET_COLUMN",
      memberId: ids.member,
      tableId: ids.table,
      columnId: ids.column,
    },
  ],
};
const incompatible = (error) => error.code === "INCOMPATIBLE_RESPONSE";
const respond = (data) => {
  globalThis.fetch = async () => Response.json({ success: true, data });
};
test("table page sends exact context privately and refuses mixed generations, members, tables and cursors", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url: new URL(url), options };
    return Response.json({ success: true, data: page });
  };
  assert.deepEqual(await api.page(ids.draft, query), page);
  assert(request.url.pathname.endsWith(ids.draft + "/files/tables"));
  assert.equal(request.url.searchParams.get("memberId"), ids.member);
  assert.equal(request.options.credentials, "include");
  assert.equal(request.options.cache, "no-store");
  for (const change of [
    { contentId: ids.next },
    { memberId: ids.next },
    { contentGeneration: 3 },
    { preparationGeneration: 4 },
    { tableId: ids.next },
    { table: null },
    { table: { ...table, id: ids.next } },
    { nextCursor: { ...page.nextCursor, limit: 2 } },
    { items: [{ ...row, bucket: "private" }] },
  ]) {
    respond({ ...page, ...change });
    await assert.rejects(api.page(ids.draft, query), incompatible);
  }
});
test("table writes send explicit deltas and validate every acknowledged target", async () => {
  let sent;
  globalThis.fetch = async (url, options) => {
    sent = { url, options };
    return Response.json({ success: true, data: ack });
  };
  assert.deepEqual(await api.mutate(ids.draft, body), ack);
  assert.equal(sent.options.method, "PATCH");
  assert.deepEqual(JSON.parse(sent.options.body), body);
  for (const change of [
    { requestId: "11111111-1111-4111-8111-111111111111" },
    { contentId: ids.next },
    { generation: 4 },
    { preparationGeneration: 4 },
    { results: [{ ...ack.results[0], memberId: ids.next }] },
    { results: [{ ...ack.results[0], tableId: ids.next }] },
    { results: [{ ...ack.results[0], columnId: ids.next }] },
    { results: [] },
  ]) {
    respond({ ...ack, ...change });
    await assert.rejects(api.mutate(ids.draft, body), incompatible);
  }
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("No malformed write may be sent");
  };
  await assert.rejects(
    api.mutate(ids.draft, {
      ...body,
      operations: [
        { ...body.operations[0], changes: { observedName: "fake" } },
      ],
    })
  );
  assert.equal(calls, 0);
});
test("initial correction acknowledgements may remap membership only with the exact new draft shape", async () => {
  const initial = {
    ...body,
    editContext: {
      mode: "INITIALIZE",
      context: "REQUESTED_CHANGES",
      expectedWorkflowRevision: 4,
      expectedBaseContentId: ids.content,
    },
  };
  const response = {
    ...ack,
    contentId: ids.next,
    generation: 2,
    preparationGeneration: 4,
    results: [{ ...ack.results[0], memberId: ids.next }],
  };
  respond(response);
  assert.deepEqual(await api.mutate(ids.draft, initial), response);
  respond({ ...response, generation: 3 });
  await assert.rejects(api.mutate(ids.draft, initial), incompatible);
});
test("production gate and malformed page prevent requests", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("Must not fetch");
  };
  await assert.rejects(
    production.datasetTablesApi.page(ids.draft, query),
    (error) => error.code === "NOT_ENABLED"
  );
  await assert.rejects(
    api.page(ids.draft, { ...query, contentGeneration: "02" })
  );
  assert.equal(calls, 0);
});
test("table commands share the bounded file journal and preserve exact replay across reload", async () => {
  const storage = new Map();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  });
  const command = { kind: "TABLES", draftId: ids.draft, body };
  local.storeDatasetUploadCommand(command);
  assert.deepEqual(local.readDatasetUploadCommand(ids.draft), command);
  assert.throws(() =>
    local.storeDatasetUploadCommand({
      ...command,
      body: { ...body, requestId: "11111111-1111-4111-8111-111111111111" },
    })
  );
  let sent;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return Response.json({ success: true, data: ack });
  };
  await local.dispatchDatasetUploadCommand(
    local.readDatasetUploadCommand(ids.draft)
  );
  assert.deepEqual(sent, body);
  local.clearDatasetUploadCommand(command);
  assert.equal(local.readDatasetUploadCommand(ids.draft), null);
  const huge = {
    ...command,
    body: {
      ...body,
      operations: Array.from({ length: 6 }, () => ({
        ...body.operations[0],
        changes: { description: "界".repeat(2000) },
      })),
    },
  };
  assert.throws(() => local.storeDatasetUploadCommand(huge), /too large/);
  assert.equal(storage.size, 0);
});
test("auth, scope, throttle and unknown failures cannot disprove a lost table write", () => {
  for (const kind of [
    "ADMIT",
    "FINALIZE",
    "CANCEL",
    "REMOVE",
    "MEMBERS",
    "TABLES",
  ])
    for (const status of [401, 403, 404, 429])
      assert.equal(
        local.ambiguousDatasetUploadFailure(
          new local.PreparationApiError(
            "test",
            "BEFORE_RECEIPT_LOOKUP",
            status
          ),
          kind
        ),
        true
      );
  for (const [status, code] of [
    [401, "UNAUTHORIZED"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
    [429, "RATE_LIMITED"],
    [500, "INTERNAL"],
    [409, "UNRECOGNIZED"],
  ])
    assert.equal(
      local.ambiguousDatasetUploadFailure(
        new local.PreparationApiError("test", code, status),
        "TABLES"
      ),
      true
    );
  for (const code of [
    "DRAFT_CHANGED",
    "IDEMPOTENCY_CONFLICT",
    "CONTENT_CAPACITY_EXCEEDED",
  ])
    assert.equal(
      local.ambiguousDatasetUploadFailure(
        new local.PreparationApiError("test", code, 409),
        "TABLES"
      ),
      false
    );
});

test("private table metadata preserves exact working, reviewed and permitted correction bases", async () => {
  for (const scope of ["WORKING", "REVIEWED", "PUBLISHED", "EDIT_BASE"]) {
    const context = {
      datasetId: ids.draft,
      scope,
      component: "FULL",
      contentId: ids.content,
      contentGeneration: 2,
      workflowRevision: 4,
      frozen: scope !== "WORKING",
      publicationId: scope === "PUBLISHED" ? ids.next : null,
      editOperation: scope === "EDIT_BASE" ? "METADATA" : null,
    };
    const value = tableMetadataFixture(context, ids.member);
    const query = {
      scope,
      component: "FULL",
      contentId: ids.content,
      contentGeneration: 2,
      expectedWorkflowRevision: 4,
      memberId: ids.member,
      ...(scope === "EDIT_BASE" ? { editOperation: "METADATA" } : {}),
      limit: 20,
    };
    let sent;
    globalThis.fetch = async (url, options) => {
      sent = { url: new URL(url), options };
      return Response.json({ success: true, data: value });
    };
    assert.deepEqual(
      await local.datasetTableMetadataApi.page(ids.draft, query),
      value
    );
    assert.equal(sent.options.credentials, "include");
    assert.equal(sent.options.cache, "no-store");
    assert(
      sent.url.pathname.endsWith("/dataset-files/" + ids.draft + "/tables")
    );
    for (const mutate of [
      (v) => v.context.workflowRevision++,
      (v) => v.page.contentGeneration++,
      (v) => (v.context.datasetId = ids.next),
      (v) => (v.memberId = ids.next),
      (v) => (v.targets[0].memberId = ids.next),
      (v) => (v.page.items[0].missingValues.value = "inactive private claim"),
      (v) => (v.page.items[0].storageKey = "private"),
      (v) => (v.page.tableId = ids.next),
    ]) {
      const wrong = structuredClone(value);
      mutate(wrong);
      respond(wrong);
      await assert.rejects(
        local.datasetTableMetadataApi.page(ids.draft, query),
        incompatible
      );
    }
  }
});
test("metadata-only correction inventory and table views refuse granted scope and production before dispatch", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("must not send");
  };
  const context = {
    scope: "EDIT_BASE",
    editOperation: "METADATA",
    component: "FULL",
    contentId: ids.content,
    contentGeneration: 2,
    expectedWorkflowRevision: 4,
    limit: 20,
  };
  await assert.rejects(
    local.datasetTableMetadataApi.editMembers(ids.draft, {
      ...context,
      editOperation: "MATERIALS",
    }),
    (e) => e.code === "INVALID_FILE_SCOPE"
  );
  await assert.rejects(
    local.datasetTableMetadataApi.page(ids.draft, {
      ...context,
      scope: "GRANTED",
      editOperation: undefined,
    }),
    (e) => e.code === "INVALID_FILE_SCOPE"
  );
  await assert.rejects(
    production.datasetTableMetadataApi.page(ids.draft, context),
    (e) => e.code === "NOT_ENABLED"
  );
  assert.equal(calls, 0);
});
