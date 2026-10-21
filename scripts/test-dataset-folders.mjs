import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const directory = await mkdtemp(join(tmpdir(), "kuinbee-folder-queue-"));
after(() => rm(directory, { recursive: true, force: true }));
const output = join(directory, "folder.mjs");
await build({ stdin: { contents: "export * from './src/lib/datasets/folder-upload';export {PreparationApiError} from './src/lib/api/dataset-preparations';", resolveDir: process.cwd() },
  bundle: true, outfile: output, platform: "node", format: "esm", define: { "process.env.NEXT_PUBLIC_APP_ENV": '"local"', "process.env.NODE_ENV": '"test"' } });
const { prepareDatasetFolderPlan: prepare, runDatasetFolderUpload: run, DatasetFolderPlanSchema, PreparationApiError } = await import(pathToFileURL(output));
const id = number => "cm" + String(number).padStart(23, "0");
const config = { maximumFileBytes: "5000000000", admission: { enabled: true },
  context: { preparationId: id(1), preparationGeneration: 3, contentId: id(2), contentGeneration: 1, editable: true,
    synchronizationRequired: false, usage: { state: "ACCOUNTED", dataset: { remainingBytes: "5000000000" }, supplier: { remainingBytes: "100000000000" } } },
  capabilities: [
    { profileId: "UTF8_CSV_SYNTAX_V1", extensions: [".csv"], maximumObjectBytes: "5000000000" },
    { profileId: "UTF8_TSV_SYNTAX_V1", extensions: [".tsv"], maximumObjectBytes: "5000000000" },
    { profileId: "UTF8_JSONL_SYNTAX_V1", extensions: [".jsonl"], maximumObjectBytes: "5000000000" },
    { profileId: "UTF8_TEXT_UPLOAD_V1", extensions: [".txt", ".json"], maximumObjectBytes: "5000000000" },
    { profileId: "JPEG_BASELINE_STRUCTURE_V1", extensions: [".jpg"], maximumObjectBytes: "5000000000" },
    { profileId: "ZIP32_CONTAINER_V1", extensions: [".zip"], maximumObjectBytes: "5000000000", archiveContents: "PACKAGED_FILE" },
  ] };
function file(path, bytes = "example bytes") {
  const value = new File([bytes], path.split("/").at(-1), { lastModified: 100 });
  Object.defineProperty(value, "webkitRelativePath", { value: path }); return value;
}
const make = (files, changes = {}) => prepare({ actorId: id(3), draftId: id(1), config, files, component: "SAMPLE", role: "PRIMARY", header: "PRESENT", recordKind: "OBJECT", ...changes });

function fixture(options = {}) {
  const calls = [], attempts = new Map(), receipts = new Map(); let sequence = 10, saved, pending = null, lost = false, receives = 0;
  const dependencies = {
    persist(plan) { DatasetFolderPlanSchema.parse(plan); saved = structuredClone(plan); },
    retain(command) { assert(!pending || JSON.stringify(pending) === JSON.stringify(command)); pending = structuredClone(command); },
    clear(command) { assert.deepEqual(pending, command); pending = null; },
    async dispatch(command) {
      calls.push(structuredClone(command));
      if (receipts.has(command.body.requestId)) return receipts.get(command.body.requestId);
      let result;
      if (command.kind === "ADMIT") {
        if (options.reject) throw new PreparationApiError("Storage full", "DATASET_CAPACITY_EXCEEDED", 409);
        const body = command.body, attempt = { id: id(++sequence), relativePath: body.relativePath, contentId: body.expectedContentId,
          component: body.component, originalName: body.originalName, expectedBytes: body.expectedBytes, state: "ADMITTED", uploadObjectId: null };
        attempts.set(attempt.id, attempt); result = structuredClone(attempt);
      } else if (command.kind === "FINALIZE") {
        const attempt = attempts.get(command.attemptId); attempt.state = options.rejectedFile ? "REJECTED" : "ACCEPTED";
        attempt.uploadObjectId = id(++sequence); result = structuredClone(attempt);
      } else if (command.kind === "MEMBERS") result = { generation: command.body.expectedGeneration + 1,
        results: command.body.operations.map((operation, index) => ({ index, operation: operation.operation, id: id(++sequence) })) };
      else throw Error("Unexpected command");
      receipts.set(command.body.requestId, result);
      if (options.lose === command.kind && !lost) { lost = true; throw new PreparationApiError("Lost response", "NETWORK_ERROR", 0); }
      return result;
    },
    intake: { async status(draftId, attemptId) { assert.equal(draftId, id(1)); const attempt = structuredClone(attempts.get(attemptId));
      if (options.wrongPath) attempt.relativePath = "another/file.txt"; return attempt; } },
    async receive(input) { receives++; assert.equal(input.file.size, Number(attempts.get(input.attemptId).expectedBytes));
      if (options.abort) options.abort.abort(); else attempts.get(input.attemptId).state = "RECEIVING"; },
    async wait() { throw Error("Unexpected polling"); },
  };
  const invoke = (plan, files, controller = new AbortController(), actor = () => {}) => run({ plan, files, signal: controller.signal,
    assertActor: actor, onChange(value) { saved = structuredClone(value); }, dependencies });
  return { invoke, calls, attempts, get saved() { return saved; }, get pending() { return pending; }, get receives() { return receives; } };
}

test("folder planning preserves nested same-name files, mixed enabled types and explicit role/component", () => {
  const files = [file("collection/a/data.csv"), file("collection/b/data.csv"), file("collection/日本語/photo.jpg"), file("collection/notes.txt"), file("collection/archive.zip")];
  const plan = make(files, { component: "FULL", role: "DOCUMENTATION" });
  assert.deepEqual(plan.items.map(item => item.path), files.map(file => file.webkitRelativePath));
  assert.equal(plan.component, "FULL"); assert(plan.items.every(item => item.role === "DOCUMENTATION"));
  assert.equal(plan.items[0].profile.header, "PRESENT"); assert.equal(plan.items[4].profile.leafProfiles.length, 0);
});

test("unsupported, empty, duplicate, unsafe and oversized selections fail before any HTTP request", () => {
  for (const files of [[file("a.exe")], [file("a.txt", "")], [file("../a.txt")], [file("a.txt"), file("A.TXT")],
    [file("folder/CON.txt")], [file("folder/bad?.txt")], [file("folder/end.")], [file("folder/a.txt"), file("folder/a.txt/b.txt")]]) assert.throws(() => make(files));
  assert.throws(() => make([file("a.csv")], { header: "" }), /column names/);
  assert.throws(() => make([file("a.jsonl")], { recordKind: "" }), /record structure/);
  assert.throws(() => make([file("a.txt")], { config: { ...config, context: { ...config.context, usage: { ...config.context.usage, dataset: { remainingBytes: "1" } } } } }), /remaining Dataset/);
  assert.throws(() => make([]));
  assert.throws(() => make(Array.from({ length: 1001 }, (_, index) => file(`${index}.txt`))));
});
test("decomposed Unicode file names normalize to stable paths and equivalent names cannot overwrite each other", async () => {
  const decomposed = file("sample/cafe\u0301.txt"), plan = make([decomposed]), f = fixture();
  assert.equal(plan.items[0].path, "sample/café.txt"); assert.equal(plan.items[0].name, "café.txt");
  assert.throws(() => make([decomposed, file("sample/café.txt")]), /Duplicate/);
  const result = await f.invoke(plan, [decomposed]); assert.equal(result.items[0].state, "SELECTED");
});

test("four files are admitted, received, finalized and selected together with exact paths and no Submit", async () => {
  const files = ["a", "b", "c", "d"].map(value => file(`sample/${value}/data.txt`)), f = fixture();
  const result = await f.invoke(make(files), files);
  assert(result.items.every(item => item.state === "SELECTED")); assert.equal(f.receives, 4); assert.equal(f.pending, null);
  const selections = f.calls.filter(command => command.kind === "MEMBERS"); assert.equal(selections.length, 1);
  assert.deepEqual(selections[0].body.operations.map(item => item.relativePath), files.map(file => file.webkitRelativePath));
  assert(f.calls.every(command => ["ADMIT", "FINALIZE", "MEMBERS"].includes(command.kind)));
});

for (const kind of ["ADMIT", "FINALIZE", "MEMBERS"]) test(`lost ${kind} acknowledgement replays the same UUID without duplicate file bytes or members`, async () => {
  const files = [file("sample/a.txt"), file("sample/b.txt")], f = fixture({ lose: kind });
  await assert.rejects(() => f.invoke(make(files), files), /Lost response/);
  assert.equal(f.pending.kind, kind); assert.deepEqual(f.pending, f.saved.command);
  const requestId = f.pending.body.requestId;
  const result = await f.invoke(f.saved, files);
  assert(result.items.every(item => item.state === "SELECTED")); assert.equal(f.attempts.size, 2);
  assert.equal(f.receives, 2); assert.equal(f.calls.filter(call => call.body.requestId === requestId).length, 2); assert.equal(f.pending, null);
});

test("51 files select in bounded batches using only acknowledged generation advances", async () => {
  const files = Array.from({ length: 51 }, (_, index) => file(`sample/${index}.txt`)), f = fixture();
  const result = await f.invoke(make(files), files), batches = f.calls.filter(call => call.kind === "MEMBERS");
  assert.deepEqual(batches.map(call => call.body.operations.length), [50, 1]);
  assert.deepEqual(batches.map(call => call.body.expectedGeneration), [1, 2]); assert.equal(result.contentGeneration, 3);
});

test("pause leaves received identity recoverable, and missing/changed files never create another attempt", async () => {
  const files = [file("sample/a.txt")], controller = new AbortController(), f = fixture({ abort: controller });
  await assert.rejects(() => f.invoke(make(files), files, controller), /paused/);
  assert.equal(f.attempts.size, 1); const saved = f.saved;
  await assert.rejects(() => f.invoke(saved, []), /Reselect/);
  await assert.rejects(() => f.invoke(saved, [file("sample/a.txt", "changed bytes with a different size")]), /Reselect/);
  assert.equal(f.attempts.size, 1);
});

test("long UTF-8 paths split file selection by the saved-command byte budget as well as operation count", async () => {
  const files = Array.from({ length: 51 }, (_, index) => file(`${"界".repeat(70)}/${"界".repeat(70)}/${"界".repeat(70)}/${"界".repeat(70)}/${index}.txt`)), f = fixture();
  const result = await f.invoke(make(files), files), selections = f.calls.filter(call => call.kind === "MEMBERS");
  assert(result.items.every(item => item.state === "SELECTED")); assert(selections.length > 2);
  assert(selections.every(command => new TextEncoder().encode(JSON.stringify(command)).length < 32_768));
  assert.equal(selections.reduce((sum, command) => sum + command.body.operations.length, 0), 51);
});

test("definite backend refusal clears its command and never reports success or skips the failed file", async () => {
  const files = [file("sample/a.txt"), file("sample/b.txt")], f = fixture({ reject: true });
  await assert.rejects(() => f.invoke(make(files), files), /Storage full/);
  assert.equal(f.pending, null); assert.equal(f.receives, 0); assert.equal(f.saved.items.filter(item => item.state === "SELECTED").length, 0);
  const rejected = fixture({ rejectedFile: true }); await assert.rejects(() => rejected.invoke(make(files), files), /rejected/);
  assert.equal(rejected.attempts.size, 1); assert(!rejected.calls.some(call => call.kind === "MEMBERS"));
});

test("changed account, mismatched server path and failed browser persistence prevent unsafe continuation", async () => {
  const files = [file("sample/a.txt")], f = fixture();
  await assert.rejects(() => f.invoke(make(files), files, new AbortController(), () => { throw Error("Account changed"); }), /Account changed/);
  assert.equal(f.calls.length, 0);
  const mismatch = fixture({ wrongPath: true }); await assert.rejects(() => mismatch.invoke(make(files), files), /no longer matches/); assert.equal(mismatch.receives, 0);
  await assert.rejects(() => run({ plan: make(files), files, signal: new AbortController().signal, assertActor() {}, onChange() {},
    dependencies: { persist() { throw Error("Storage blocked"); }, dispatch() { assert.fail("No request before persistence"); } } }), /Storage blocked/);
});
