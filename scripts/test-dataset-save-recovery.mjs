import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
const directory = await mkdtemp(join(tmpdir(), "dataset-save-recovery-")), output = join(directory, "save.mjs");
await build({ stdin: { contents: "export * from './src/lib/datasets/preparation-save-command';export {PreparationApiError} from './src/lib/api/dataset-preparations';", resolveDir: process.cwd() },
  bundle: true, outfile: output, platform: "node", format: "esm", define: { "process.env.NEXT_PUBLIC_APP_ENV": '"local"', "process.env.NODE_ENV": '"test"' } });
const mod = await import(pathToFileURL(output)), values = new Map(), previous = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: storage });
after(async () => { if (previous) Object.defineProperty(globalThis, "sessionStorage", previous); else delete globalThis.sessionStorage; await rm(directory, { recursive: true, force: true }); });
const id = number => "c" + String(number).padStart(24, "0"), actor = id(1), draft = id(2);
const metadata = { title: "Local intended title", overview: "Original overview" }, baseline = { ...metadata, title: "Original saved title" };
const create = { kind: "create", body: { requestId: "6ecc2724-5baf-43c0-9f73-7243c57efaa2", metadata } };
const patch = { kind: "patch", id: draft, body: { requestId: "7ecc2724-5baf-43c0-9f73-7243c57efaa2", expectedGeneration: 4, changes: { title: metadata.title } } };

test("create and patch retain exact UUID, intended answers and original baseline across reload-like reads", () => {
  values.clear();
  for (const operation of [create, patch]) {
    const route = operation.kind === "patch" ? draft : undefined;
    mod.retainPreparationSave(actor, route, operation, metadata, operation.kind === "patch" ? baseline : null);
    const restored = mod.readPreparationSave(actor, route);
    assert.deepEqual(restored.operation, operation); assert.deepEqual(restored.metadata, metadata);
    assert.deepEqual(restored.baseline, operation.kind === "patch" ? baseline : null);
    assert.equal(mod.readPreparationSave(id(3), route), null, "Another supplier cannot read this browser's retained request");
    mod.retainPreparationSave(actor, route, restored.operation, restored.metadata, restored.baseline);
    mod.clearPreparationSave(actor, route, restored.operation); assert.equal(mod.readPreparationSave(actor, route), null);
  }
});
test("a pending save cannot be overwritten or cleared by another UUID, route or changed payload", () => {
  values.clear(); mod.retainPreparationSave(actor, draft, patch, metadata, baseline);
  const changed = { ...patch, body: { ...patch.body, changes: { title: "Another change" } } };
  assert.throws(() => mod.retainPreparationSave(actor, draft, changed, metadata, baseline), /previous/);
  assert.throws(() => mod.clearPreparationSave(actor, draft, changed), /changed/);
  assert.throws(() => mod.retainPreparationSave(actor, id(4), patch, metadata, baseline));
  assert.deepEqual(mod.readPreparationSave(actor, draft).operation, patch);
});
test("corrupt, transplanted, oversized and unavailable browser storage fail closed", () => {
  values.clear(); mod.retainPreparationSave(actor, draft, patch, metadata, baseline);
  const key = [...values.keys()][0], text = values.get(key);
  values.set(key, "invalid JSON"); assert.throws(() => mod.readPreparationSave(actor, draft));
  values.set(key, JSON.stringify({ ...JSON.parse(text), actorId: id(9) })); assert.throws(() => mod.readPreparationSave(actor, draft), /another account/);
  values.set(key, "x".repeat(229377)); assert.throws(() => mod.readPreparationSave(actor, draft), /budget/);
  values.clear();
  const original = storage.setItem; storage.setItem = () => { throw Error("Storage blocked"); };
  try { assert.throws(() => mod.retainPreparationSave(actor, undefined, create, metadata, null), /Storage blocked/); }
  finally { storage.setItem = original; }
});
test("lost responses, auth changes and throttling retain uncertainty; definite invalid/stale inputs can be corrected", () => {
  for (const status of [401, 403, 404, 429, 500, 503]) assert.equal(mod.uncertainPreparationSave(new mod.PreparationApiError("failure", "HTTP_ERROR", status)), true);
  for (const status of [400, 409, 413, 422]) assert.equal(mod.uncertainPreparationSave(new mod.PreparationApiError("failure", "INVALID_INPUT", status)), false);
  assert.equal(mod.uncertainPreparationSave(new mod.PreparationApiError("failure", "NETWORK_ERROR")), true);
  assert.equal(mod.uncertainPreparationSave(new Error("unknown response")), true);
});
