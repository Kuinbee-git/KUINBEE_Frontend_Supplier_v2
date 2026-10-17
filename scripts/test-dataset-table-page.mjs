import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const temporary = await mkdtemp(join(tmpdir(), "kuinbee-table-page-"));
const outfile = join(temporary, "page.mjs");
await build({
  stdin: {
    contents:
      "export * from './src/lib/datasets/dataset-table-page-commands';export * from './src/lib/datasets/dataset-upload-commands';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  outfile,
  platform: "node",
  format: "esm",
  define: {
    "process.env.NEXT_PUBLIC_APP_ENV": '"local"',
    "process.env.NODE_ENV": '"test"',
  },
});
const api = await import(pathToFileURL(outfile).href);
const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
const values = new Map();
let failWrite = false,
  failRemove = false;
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      if (failWrite) throw Error("Synthetic full storage");
      values.set(key, value);
    },
    removeItem: (key) => {
      if (failRemove) throw Error("Synthetic unavailable removal");
      values.delete(key);
    },
  },
});
beforeEach(() => {
  values.clear();
  failWrite = false;
  failRemove = false;
});
after(async () => {
  if (original) Object.defineProperty(globalThis, "sessionStorage", original);
  else delete globalThis.sessionStorage;
  await rm(temporary, { recursive: true, force: true });
});
const id = (n) => "c" + String(n).padStart(24, "0");
const actor = id(1),
  draft = id(2),
  member = id(3),
  table = id(4);
const basis = {
  preparationId: draft,
  preparationGeneration: 5,
  contentId: id(5),
  contentGeneration: 8,
};
const operations = (count, start = 0, long = false) =>
  Array.from({ length: count }, (_, i) => ({
    operation: "SET_COLUMN",
    memberId: member,
    tableId: table,
    columnId: id(100 + start + i),
    changes: {
      meaningState: "KNOWN",
      description: long ? "界".repeat(2000) : "Temperature " + (start + i),
      semanticType: "DECIMAL",
      unitState: "KNOWN",
      unit: long ? "界".repeat(200) : "degrees Celsius",
    },
  }));
const buildFor = (context, editContext) => (ops, requestId) => ({
  kind: "TABLES",
  actorId: actor,
  draftId: context.preparationId,
  body: {
    requestId,
    expectedContentId: context.contentId,
    expectedGeneration: context.contentGeneration,
    expectedPreparationGeneration: context.preparationGeneration,
    ...(editContext ? { editContext } : {}),
    operations: ops,
  },
});
const beginPlan = (owner, context, ops, build) =>
  api.beginTablePagePlan(owner, context, ops, build, {
    component: "FULL",
    fileName: "readings.csv",
    tableName: "Readings",
    columns: ops.flatMap((op, index) =>
      op.operation === "SET_COLUMN"
        ? [{ id: op.columnId, position: index + 1, name: "value" }]
        : []
    ),
  });
const acknowledge = (command, initial = false) => ({
  requestId: command.body.requestId,
  contentId: initial ? id(9) : command.body.expectedContentId,
  generation: initial ? 2 : command.body.expectedGeneration + 1,
  preparationGeneration:
    command.body.expectedPreparationGeneration + (initial ? 1 : 0),
  results: command.body.operations.map((op, index) => ({
    index,
    operation: op.operation,
    memberId: initial ? id(10) : op.memberId,
    tableId: op.tableId,
    columnId: op.operation === "SET_COLUMN" ? op.columnId : null,
  })),
});

test("twenty known column answers share one exact bounded request and leave other columns absent", () => {
  const ops = operations(20),
    plan = beginPlan(actor, basis, ops, buildFor(basis));
  assert.deepEqual(plan.command.body.operations, ops);
  assert.deepEqual(api.readTablePagePlan(actor, draft), plan);
  assert(Buffer.byteLength(JSON.stringify(plan.command)) <= 32768);
  assert.equal(api.readTablePagePlan(id(88), draft), null);
  assert.throws(() => api.clearTablePagePlan(plan), /Confirm/);
});
test("maximum UTF-8 answers split without dropping or inventing operations and preserve every exact target", () => {
  const ops = operations(20, 0, true),
    seen = [];
  let plan = beginPlan(actor, basis, ops, buildFor(basis)),
    requests = 0;
  while (plan.remaining.length) {
    const command =
      plan.command ??
      api.prepareTablePageCommand(
        plan,
        plan.expectedBasis,
        buildFor(plan.expectedBasis)
      ).command;
    assert(Buffer.byteLength(JSON.stringify(command)) <= 32768);
    assert(command.body.operations.length <= 50);
    seen.push(...command.body.operations);
    api.storeDatasetUploadCommand(command);
    plan = api.recordTablePageAcknowledgement(
      actor,
      command,
      acknowledge(command)
    );
    api.clearDatasetUploadCommand(command);
    requests++;
  }
  assert(requests > 1 && requests <= 5);
  assert.deepEqual(seen, ops);
  api.clearTablePagePlan(plan);
  assert.equal(values.size, 0);
});
test("a 1024-column known schema uses 52 page requests rather than exhausting the 512-request guard", () => {
  let context = basis,
    count = 0;
  const seen = new Set();
  for (let offset = 0; offset < 1024; offset += 20) {
    const plan = beginPlan(
      actor,
      context,
      operations(Math.min(20, 1024 - offset), offset),
      buildFor(context)
    );
    const command = plan.command;
    command.body.operations.forEach((op) => seen.add(op.columnId));
    const done = api.recordTablePageAcknowledgement(
      actor,
      command,
      acknowledge(command)
    );
    assert.equal(done.remaining.length, 0);
    context = done.expectedBasis;
    api.clearTablePagePlan(done);
    count++;
  }
  assert.equal(count, 52);
  assert.equal(seen.size, 1024);
});
test("lost ACK and crashes between both journals retain original UUID, unsent answers and idempotent checkpoints", () => {
  const originalPlan = beginPlan(
    actor,
    basis,
    operations(20, 0, true),
    buildFor(basis)
  );
  const command = originalPlan.command,
    response = acknowledge(command);
  api.storeDatasetUploadCommand(command);
  assert.deepEqual(api.readTablePagePlan(actor, draft).command, command);
  assert.deepEqual(api.readDatasetUploadCommand(draft), command);
  failWrite = true;
  assert.throws(() =>
    api.recordTablePageAcknowledgement(actor, command, response)
  );
  assert.deepEqual(api.readTablePagePlan(actor, draft), originalPlan);
  failWrite = false;
  const checkpoint = api.recordTablePageAcknowledgement(
    actor,
    command,
    response
  );
  assert.equal(
    checkpoint.remaining.length,
    20 - command.body.operations.length
  );
  assert.deepEqual(
    api.recordTablePageAcknowledgement(actor, command, response),
    checkpoint
  );
  assert.deepEqual(api.readDatasetUploadCommand(draft), command);
  api.clearDatasetUploadCommand(command);
  assert.throws(
    () => api.prepareTablePageCommand(checkpoint, basis, buildFor(basis)),
    /exact saved/
  );
  const next = api.prepareTablePageCommand(
    checkpoint,
    checkpoint.expectedBasis,
    buildFor(checkpoint.expectedBasis)
  );
  assert.notEqual(next.command.body.requestId, command.body.requestId);
  assert.deepEqual(
    next.command.body.operations,
    checkpoint.remaining.slice(0, next.command.body.operations.length)
  );
});
test("the first frozen correction maps all remaining operations only from its exact generation-two receipt", () => {
  const context = {
    mode: "INITIALIZE",
    context: "REQUESTED_CHANGES",
    expectedWorkflowRevision: 6,
    expectedBaseContentId: basis.contentId,
  };
  const plan = beginPlan(
    actor,
    basis,
    operations(20, 0, true),
    buildFor(basis, context)
  );
  const response = acknowledge(plan.command, true);
  const checkpoint = api.recordTablePageAcknowledgement(
    actor,
    plan.command,
    response
  );
  assert(checkpoint.remaining.length > 0);
  assert(checkpoint.remaining.every((op) => op.memberId === id(10)));
  assert.deepEqual(
    checkpoint.remaining.map((op) => op.columnId),
    plan.remaining
      .slice(plan.command.body.operations.length)
      .map((op) => op.columnId)
  );
  assert.equal(checkpoint.expectedBasis.contentGeneration, 2);
  const existing = {
    mode: "EXISTING_DRAFT",
    expectedContentId: id(9),
    expectedGeneration: 2,
  };
  const next = api.prepareTablePageCommand(
    checkpoint,
    checkpoint.expectedBasis,
    buildFor(checkpoint.expectedBasis, existing)
  );
  assert.equal(next.command.body.editContext.mode, "EXISTING_DRAFT");
  assert(next.command.body.operations.every((op) => op.memberId === id(10)));
});
test("initial receipts preserve a one-to-one source-member mapping across legitimate multi-member commands", () => {
  const command = buildFor(basis, {
    mode: "INITIALIZE",
    context: "REQUESTED_CHANGES",
    expectedWorkflowRevision: 6,
    expectedBaseContentId: basis.contentId,
  })(operations(3), crypto.randomUUID());
  command.body.operations[2].memberId = id(88);
  const response = acknowledge(command, true);
  response.results[2].memberId = id(89);
  assert.deepEqual(
    api.validateTableDescriptionAcknowledgement(command.body, response),
    response
  );
  const wrong = structuredClone(response);
  wrong.results[1].memberId = id(90);
  assert.throws(() =>
    api.validateTableDescriptionAcknowledgement(command.body, wrong)
  );
  wrong.results[1].memberId = id(10);
  wrong.results[2].memberId = id(10);
  assert.throws(() =>
    api.validateTableDescriptionAcknowledgement(command.body, wrong)
  );
});
test("definite rejection preserves all answers and can recover a crash before the shared command clears", () => {
  const plan = beginPlan(actor, basis, operations(20), buildFor(basis));
  api.storeDatasetUploadCommand(plan.command);
  const refused = api.recordTablePageRejection(actor, plan.command);
  assert.equal(refused.command, null);
  assert.deepEqual(refused.remaining, plan.remaining);
  assert.deepEqual(api.recordTablePageRejection(actor, plan.command), refused);
  api.clearDatasetUploadCommand(plan.command);
  api.clearTablePagePlan(refused);
  assert.equal(values.size, 0);
});
test("corrupt, wrong-account, mixed-table, duplicate-target and mismatched-context plans fail closed without deletion", () => {
  const plan = beginPlan(actor, basis, operations(2), buildFor(basis));
  const [key, value] = [...values][0];
  for (const change of [
    (p) => {
      p.actorId = id(99);
    },
    (p) => {
      p.remaining[1].tableId = id(99);
    },
    (p) => {
      p.remaining[1] = p.remaining[0];
    },
    (p) => {
      p.command.body.expectedGeneration++;
    },
    (p) => {
      p.remaining[1].changes.description = "tampered";
    },
    (p) => {
      p.privateStorageKey = "no";
    },
  ]) {
    const wrong = structuredClone(plan);
    change(wrong);
    values.set(key, JSON.stringify(wrong));
    assert.throws(() => api.readTablePagePlan(actor, draft));
    assert.equal(values.get(key), JSON.stringify(wrong));
  }
  values.set(key, "broken json");
  assert.throws(() => api.readTablePagePlan(actor, draft));
  values.set(key, value);
  assert.throws(() => beginPlan(actor, basis, operations(1), buildFor(basis)));
  assert.deepEqual(api.readTablePagePlan(actor, draft), plan);
});
test("storage failures occur before dispatch and cannot remove or replace unconfirmed page intent", () => {
  failWrite = true;
  assert.throws(() => beginPlan(actor, basis, operations(2), buildFor(basis)));
  assert.equal(values.size, 0);
  failWrite = false;
  const plan = beginPlan(actor, basis, operations(2), buildFor(basis));
  const done = api.recordTablePageAcknowledgement(
    actor,
    plan.command,
    acknowledge(plan.command)
  );
  failRemove = true;
  assert.throws(() => api.clearTablePagePlan(done));
  assert.deepEqual(api.readTablePagePlan(actor, draft), done);
});
test("retained page count and aggregate UTF-8 bytes have independent bounded admission", () => {
  for (let n = 0; n < 32; n++) {
    const context = { ...basis, preparationId: id(10000 + n) };
    beginPlan(actor, context, operations(1), buildFor(context));
  }
  const context = { ...basis, preparationId: id(20000) };
  assert.throws(() =>
    beginPlan(actor, context, operations(1), buildFor(context))
  );
  assert.equal(values.size, 32);
  values.clear();
  let refused = false;
  for (let n = 0; n < 32; n++) {
    const context = { ...basis, preparationId: id(30000 + n) };
    try {
      beginPlan(actor, context, operations(50, 0, true), buildFor(context));
    } catch {
      refused = true;
      break;
    }
  }
  assert(refused);
  assert(values.size < 32);
  assert(
    [...values.values()].reduce(
      (sum, value) => sum + Buffer.byteLength(value),
      0
    ) <= api.TABLE_PAGE_SESSION_BYTES
  );
});
