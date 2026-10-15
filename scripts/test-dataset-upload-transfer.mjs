import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const directory = await mkdtemp(
  join(tmpdir(), "kuinbee-supplier-upload-test-")
);
after(() => rm(directory, { recursive: true, force: true }));
const output = join(directory, "transfer.mjs");
await build({
  stdin: {
    contents: [
      "export {receiveDatasetFile} from './src/lib/datasets/receive-dataset-file';",
      "export {datasetIntakeApi} from './src/lib/api/dataset-intake';",
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
    "process.env.NEXT_PUBLIC_APP_ENV": '"local"',
    "process.env.NODE_ENV": '"test"',
  },
});
const { receiveDatasetFile, datasetIntakeApi, PreparationApiError } =
  await import(pathToFileURL(output).href);
const ids = {
  draft: "cm000000000000000000000001",
  attempt: "cm000000000000000000000002",
  content: "cm000000000000000000000003",
};
const partBytes = 5 * 1024 * 1024;
const context = {
  expectedPreparationGeneration: 3,
  expectedContentId: ids.content,
  expectedContentGeneration: 2,
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const code = (expected) => (error) => error.code === expected;

// Synthetic server protocol only: native local Blob/WebCrypto reads exercise
// the production browser transfer code. This is not S3, scanner qualification,
// admission activation or the complete rendered upload journey.
function fixture(options = {}) {
  const totalParts = options.totalParts ?? 2,
    size = partBytes * (totalParts - 1) + 13,
    calls = [],
    reads = [];
  const parts = Array.from({ length: totalParts }, (_, index) => {
    const number = index + 1,
      length = number === totalParts ? 13 : partBytes;
    const received = options.received?.includes(number) ?? false;
    return {
      partNumber: number,
      expectedBytes: length,
      measuredBytes: received ? length : null,
      state: received ? "RECEIVED" : "PENDING",
      receivedAt: received ? "2026-10-16T00:00:00.000Z" : null,
      checksumSha256: received
        ? sha(Buffer.alloc(length, 96 + (number % 100)))
        : null,
    };
  });
  const receivedBytes = () =>
    parts.reduce(
      (sum, part) => sum + (part.state === "RECEIVED" ? part.expectedBytes : 0),
      0
    );
  const status = {
    id: ids.attempt,
    rootId: ids.draft,
    contentId: ids.content,
    component: options.component ?? "FULL",
    role: "PRIMARY",
    inspectionProfile: { profileId: "UTF8_CSV_SYNTAX_V1", header: "PRESENT" },
    originalName: "data.csv",
    expectedBytes: String(size),
    retainedBytes: String(receivedBytes()),
    reservedBytes: String(size - receivedBytes()),
    partBytes,
    totalParts,
    state: "RECEIVING",
    revision: 1,
    recoveryEpoch: 4,
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    eligibility: "NOT_ACCEPTED",
  };
  const account = (limit) => ({
    limitBytes: limit,
    retainedBytes: status.retainedBytes,
    reservedBytes: status.reservedBytes,
    chargedBytes: String(size),
    remainingBytes: String(BigInt(limit) - BigInt(size)),
  });
  const config = {
    context: {
      contractVersion: 1,
      preparationId: ids.draft,
      preparationGeneration: 3,
      contentId: ids.content,
      contentGeneration: 2,
      sourcePreparationGeneration: 3,
      serverUploadChoice: options.choice ?? "FULL_ONLY",
      editable: true,
      synchronizationRequired: false,
      usage: {
        state: "ACCOUNTED",
        dataset: account("5000000000"),
        supplier: account("100000000000"),
      },
      admission: { enabled: false, reason: "INTAKE_NOT_ENABLED" },
    },
    maximumFileBytes: "2000000000",
    admission:
      options.enabled === false
        ? {
            enabled: false,
            reason: "INTAKE_PAUSED",
            policyVersion: "synthetic-only",
          }
        : { enabled: true, reason: null, policyVersion: "synthetic-only" },
    capabilities:
      options.enabled === false
        ? []
        : [
            {
              profileId: "UTF8_CSV_SYNTAX_V1",
              maximumObjectBytes: "2000000000",
              choices: ["SAMPLE_ONLY", "FULL_ONLY", "FULL_AND_SAMPLE"],
              extensions: [".csv"],
              mimeTypes: ["text/csv"],
            },
          ],
    transport:
      options.enabled === false
        ? null
        : {
            kind: "BOUNDED_PARTS_V1",
            partBytes,
            maximumParts: 10000,
            mediaType: "application/octet-stream",
            partPathTemplate:
              "/api/v2/supplier/dataset-drafts/{draftId}/uploads/{attemptId}/parts/{partNumber}",
          },
  };
  const file = {
    name: "data.csv",
    size,
    slice(start, end) {
      assert(end - start <= partBytes);
      assert(start >= 0 && end <= size);
      reads.push({ start, length: end - start });
      const number = Math.floor(start / partBytes) + 1;
      return new Blob([
        Buffer.alloc(
          end - start,
          options.differentPart === number ? 255 : 96 + (number % 100)
        ),
      ]);
    },
  };
  const api = {
    async config() {
      calls.push("CONFIG");
      return structuredClone(config);
    },
    async status() {
      calls.push("STATUS");
      return structuredClone(status);
    },
    async parts(_draft, _attempt, query) {
      calls.push("PARTS:" + (query.afterPartNumber ?? 0));
      assert.equal(query.expectedAttemptRevision, status.revision);
      assert.equal(query.expectedRecoveryEpoch, status.recoveryEpoch);
      const selected = parts.slice(
        query.afterPartNumber ?? 0,
        (query.afterPartNumber ?? 0) + query.limit
      );
      return structuredClone({
        preparationId: ids.draft,
        attemptId: ids.attempt,
        attemptRevision: status.revision,
        recoveryEpoch: status.recoveryEpoch,
        totalParts,
        items: selected,
        nextCursor:
          (query.afterPartNumber ?? 0) + selected.length < totalParts
            ? { afterPartNumber: selected.at(-1).partNumber }
            : null,
      });
    },
    async putPart(_draft, _attempt, number, query, bytes) {
      calls.push("PUT:" + number);
      assert.equal(query.expectedContentId, context.expectedContentId);
      if (options.failBeforeCommit)
        throw new PreparationApiError(
          "Synthetic lost connection",
          "NETWORK_ERROR"
        );
      const part = parts[number - 1];
      assert.equal(bytes.size, part.expectedBytes);
      part.state = "RECEIVED";
      part.measuredBytes = bytes.size;
      part.receivedAt = new Date().toISOString();
      part.checksumSha256 = options.badReceipt
        ? "0".repeat(64)
        : sha(Buffer.from(await bytes.arrayBuffer()));
      status.revision += 2;
      status.retainedBytes = String(receivedBytes());
      status.reservedBytes = String(size - receivedBytes());
      if (options.lostAck)
        throw new PreparationApiError(
          "Synthetic lost acknowledgement",
          "NETWORK_ERROR"
        );
      return structuredClone(status);
    },
  };
  const run = (extra = {}) =>
    receiveDatasetFile({
      draftId: ids.draft,
      attemptId: ids.attempt,
      context,
      file,
      signal: new AbortController().signal,
      api,
      ...extra,
    });
  return { api, run, file, config, status, parts, calls, reads };
}

test("all three upload choices receive exact bytes without submitting, selecting or claiming scan acceptance", async () => {
  for (const [choice, component] of [
    ["SAMPLE_ONLY", "SAMPLE"],
    ["FULL_ONLY", "FULL"],
    ["FULL_AND_SAMPLE", "FULL"],
    ["FULL_AND_SAMPLE", "SAMPLE"],
  ]) {
    const f = fixture({ choice, component, totalParts: 1 }),
      progress = [];
    const result = await f.run({ onProgress: (value) => progress.push(value) });
    assert.equal(result.eligibility, "NOT_ACCEPTED");
    assert.equal(result.state, "RECEIVING");
    assert.equal(result.retainedBytes, String(f.file.size));
    assert.equal(result.reservedBytes, "0");
    assert.deepEqual(
      f.calls.filter((call) => call.startsWith("PUT:")),
      ["PUT:1"]
    );
    assert.equal(progress.at(-1).phase, "RECEIVED");
    assert.equal(progress.at(-1).verifiedBytes, f.file.size);
  }
});

test("a matching reselected file skips only exact committed parts and reads bounded slices", async () => {
  const f = fixture({ received: [1] });
  await f.run();
  assert.deepEqual(
    f.calls.filter((call) => call.startsWith("PUT:")),
    ["PUT:2"]
  );
  assert.deepEqual(
    f.reads.map((read) => read.length),
    [partBytes, 13]
  );
});

test("same filename and size with different received bytes sends no new part", async () => {
  const f = fixture({ received: [1], differentPart: 1 });
  await assert.rejects(f.run(), code("LOCAL_FILE_MISMATCH"));
  assert.equal(
    f.calls.some((call) => call.startsWith("PUT:")),
    false
  );
});

test("received parts after the first inventory page are verified before a missing earlier part is sent", async () => {
  const f = fixture({ totalParts: 53, received: [52], differentPart: 52 });
  await assert.rejects(f.run(), code("LOCAL_FILE_MISMATCH"));
  assert(f.calls.includes("PARTS:50"));
  assert.equal(
    f.calls.some((call) => call.startsWith("PUT:")),
    false
  );
  assert.equal(f.reads.length, 1);
});

test("a mixed attempt generation during pagination cannot supply resume authority", async () => {
  const f = fixture({ totalParts: 53 }),
    original = f.api.parts;
  f.api.parts = async (...args) => {
    const page = await original(...args);
    if (args[2].afterPartNumber) page.attemptRevision++;
    return page;
  };
  await assert.rejects(f.run(), code("UPLOAD_CHANGED"));
  assert.equal(
    f.calls.some((call) => call.startsWith("PUT:")),
    false
  );
});

test("claimed or uncertain parts stop all new bytes before local verification", async () => {
  for (const state of ["CLAIMED", "UNCERTAIN"]) {
    const f = fixture();
    f.parts[1].state = state;
    await assert.rejects(f.run(), code("PART_RECONCILIATION_REQUIRED"));
    assert.equal(f.reads.length, 0);
    assert.equal(
      f.calls.some((call) => call.startsWith("PUT:")),
      false
    );
  }
});

test("incomplete but ordered inventory pages cannot be treated as complete upload progress", async () => {
  for (const mode of ["missing-tail", "hole"]) {
    const f = fixture({ totalParts: 53 }),
      original = f.api.parts;
    f.api.parts = async (...args) => {
      const page = await original(...args);
      if (mode === "missing-tail") page.nextCursor = null;
      else page.items = page.items.filter((part) => part.partNumber !== 2);
      return page;
    };
    await assert.rejects(f.run(), code("INCOMPATIBLE_RESPONSE"));
    assert.equal(
      f.calls.some((call) => call.startsWith("PUT:")),
      false
    );
  }
});

test("an epoch or revision change during file verification prevents subsequent byte writes", async () => {
  for (const mode of ["epoch", "revision"]) {
    const f = fixture({ received: [1] }),
      original = f.api.status;
    let reads = 0;
    f.api.status = async (...args) => {
      const result = await original(...args);
      if (++reads === 2) {
        if (mode === "epoch") result.recoveryEpoch++;
        else result.revision++;
      }
      return result;
    };
    await assert.rejects(f.run(), code("UPLOAD_CHANGED"));
    assert.equal(
      f.calls.some((call) => call.startsWith("PUT:")),
      false
    );
  }
});

test("lost acknowledgement is resolved from exact server status without another PUT", async () => {
  const f = fixture({ received: [1], lostAck: true });
  const result = await f.run();
  assert.equal(result.retainedBytes, String(f.file.size));
  assert.deepEqual(
    f.calls.filter((call) => call.startsWith("PUT:")),
    ["PUT:2"]
  );
});

test("an unresolved network failure never automatically repeats the raw write", async () => {
  const f = fixture({ received: [1], failBeforeCommit: true });
  await assert.rejects(f.run(), code("NETWORK_ERROR"));
  assert.deepEqual(
    f.calls.filter((call) => call.startsWith("PUT:")),
    ["PUT:2"]
  );
});

test("a different committed digest stops transfer without reporting completed receipt", async () => {
  const f = fixture({ totalParts: 1, badReceipt: true }),
    progress = [];
  await assert.rejects(
    f.run({ onProgress: (value) => progress.push(value) }),
    code("PART_RECEIPT_MISMATCH")
  );
  assert(!progress.some((value) => value.phase === "RECEIVED"));
});

test("a foreign receipt after a PUT cannot advance progress", async () => {
  const f = fixture({ totalParts: 1 }),
    original = f.api.parts;
  f.api.parts = async (...args) => {
    const page = await original(...args);
    if (args[2].limit === 1) page.attemptId = ids.content;
    return page;
  };
  await assert.rejects(f.run(), code("PART_RECEIPT_UNCONFIRMED"));
});

test("backend pause, changed content, withdrawn choice and closed upload prevent all new bytes", async () => {
  for (const option of ["paused", "content", "choice", "closed"]) {
    const f = fixture({ enabled: option !== "paused" });
    if (option === "content") f.config.context.contentId = ids.attempt;
    if (option === "choice")
      f.config.context.serverUploadChoice = "SAMPLE_ONLY";
    if (option === "closed") f.status.state = "CANCEL_REQUESTED";
    await assert.rejects(f.run());
    assert.equal(f.reads.length, 0);
    assert.equal(
      f.calls.some((call) => call.startsWith("PUT:")),
      false
    );
  }
});

test("files above 2 GB are refused locally before any request while backend checks remain required", async () => {
  const f = fixture();
  await assert.rejects(
    f.run({ file: { ...f.file, size: 2000000001 } }),
    code("FILE_SIZE_NOT_ALLOWED")
  );
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.reads, []);
});

test("pause while waiting for allocation sends no bytes and leaves the existing attempt intact", async () => {
  const f = fixture(),
    controller = new AbortController();
  f.status.state = "ADMITTED";
  const pending = f.run({ signal: controller.signal });
  const timer = setTimeout(() => controller.abort(), 10);
  try {
    await assert.rejects(pending, code("UPLOAD_PAUSED"));
  } finally {
    clearTimeout(timer);
  }
  assert.equal(
    f.calls.some((call) => call.startsWith("PUT:")),
    false
  );
  assert.equal(f.status.state, "ADMITTED");
});

test("raw API uses owned fixed routes, cookie credentials, octet-stream Blob bytes and strict response identity", async () => {
  const f = fixture({ totalParts: 1 }),
    requests = [],
    originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ success: true, data: f.status }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  try {
    await datasetIntakeApi.putPart(
      ids.draft,
      ids.attempt,
      1,
      { ...context, requestId: crypto.randomUUID() },
      new Blob([Buffer.alloc(13)])
    );
    assert.match(
      requests[0].url,
      new RegExp(`/uploads/${ids.attempt}/parts/1\\?`)
    );
    assert.equal(requests[0].options.method, "PUT");
    assert.equal(requests[0].options.credentials, "include");
    assert.equal(
      requests[0].options.headers["Content-Type"],
      "application/octet-stream"
    );
    assert(requests[0].options.body instanceof Blob);
    f.status.rootId = ids.content;
    await assert.rejects(
      datasetIntakeApi.status(ids.draft, ids.attempt),
      code("INCOMPATIBLE_RESPONSE")
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
