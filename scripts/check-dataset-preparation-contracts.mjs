import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  DATASET_PREPARATION_CONTRACT_VERSION,
  DatasetPreparationMetadataSchema,
  DatasetFilesContextBodySchema,
  DatasetFilesInventoryPageQuerySchema,
  DatasetUploadAdmissionBodySchema,
  DatasetUploadPartStatusSchema,
  DATASET_UPLOAD_FILE_LIMIT_BYTES,
} from "@kuinbee/dataset-preparation-contracts";

const manifest = JSON.parse(
  await readFile("vendor/dataset-preparation-contracts.manifest.json", "utf8")
);
const installed = "node_modules/@kuinbee/dataset-preparation-contracts/";
const packagedManifest = JSON.parse(
  await readFile(installed + "manifest.json", "utf8")
);
const packageInfo = JSON.parse(
  await readFile(installed + "package.json", "utf8")
);
const project = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
assert.equal(manifest.package, "@kuinbee/dataset-preparation-contracts");
assert.equal(packageInfo.name, manifest.package);
assert.equal(packageInfo.version, manifest.version);
assert.equal(DATASET_PREPARATION_CONTRACT_VERSION, manifest.contractVersion);
assert.match(manifest.sourceSha256, /^[a-f0-9]{64}$/);
assert.match(
  manifest.sourceCommit,
  /^[a-f0-9]{40}$/,
  "Release contracts must come from committed canonical sources"
);
assert.equal(manifest.sourceRepository, "Kuinbee-git/KUINBEE");
assert.equal(
  manifest.sourcePath,
  "packages/api-contracts/src/datasets/preparation.schema.ts"
);
for (const [key, value] of Object.entries(packagedManifest))
  assert.deepEqual(manifest[key], value, `Manifest drift: ${key}`);
const expectedSources = [
  "preparation",
  "content",
  "files",
  "intake",
  "workflow",
  "proposals",
  "publication",
  "access",
  "acquisition",
  "inspectionProfile",
  "reader",
  "catalogue",
  "legacyCatalogue",
  "legacyCatalogueEndpoints",
  "edit",
  "cataloguePrimitives",
].map((name) => `packages/api-contracts/src/datasets/${name}.schema.ts`);
assert.deepEqual(
  manifest.sources.map((source) => source.sourcePath),
  expectedSources
);
for (const source of manifest.sources) {
  assert.match(source.sourceCommit, /^[a-f0-9]{40}$/);
  assert.equal(source.sourceCommit, manifest.sourceCommit);
  assert.match(source.sourceSha256, /^[a-f0-9]{64}$/);
  const name = source.sourcePath.split("/").at(-1).replace(/\.ts$/, "");
  assert.equal(
    sha256(await readFile(installed + name + ".js")),
    source.javascriptSha256,
    `Installed canonical runtime drift: ${name}`
  );
  assert.equal(
    sha256(await readFile(installed + name + ".d.ts")),
    source.declarationSha256,
    `Installed canonical declarations drift: ${name}`
  );
}
const tarball = await readFile("vendor/" + manifest.tarball);
assert.equal(sha256(tarball), manifest.tarballSha256, "Pinned tarball changed");
assert.equal(
  sha256(await readFile(installed + "index.js")),
  manifest.javascriptSha256,
  "Installed runtime differs from the pinned artifact"
);
assert.equal(
  sha256(await readFile(installed + "index.d.ts")),
  manifest.declarationSha256,
  "Installed declarations differ from the pinned artifact"
);
assert.equal(
  project.dependencies[manifest.package],
  "file:vendor/" + manifest.tarball
);
assert.equal(
  lock.packages["node_modules/" + manifest.package].version,
  manifest.version
);
assert.equal(
  lock.packages["node_modules/" + manifest.package].integrity,
  "sha512-" + createHash("sha512").update(tarball).digest("base64"),
  "Lockfile artifact integrity drift"
);
assert.equal(
  DatasetPreparationMetadataSchema.safeParse({ title: "Partial draft" })
    .success,
  true
);
assert.equal(
  DatasetPreparationMetadataSchema.safeParse({
    title: "Forged receipt",
    uploadedBytes: "1",
  }).success,
  false
);
assert.equal(
  DatasetPreparationMetadataSchema.safeParse({
    title: "Wrong scoped unit",
    sampleMeasurements: [
      { metric: "IMAGE_COUNT", state: "KNOWN", value: "1", unit: "HOUR" },
    ],
  }).success,
  false
);
const reference = "cjld2cjxh0000qzrmn831i7rn";
const requestId = "cc343078-c6fc-4b88-bf15-84ea00000001";
const contextBody = {
  requestId,
  expectedPreparationGeneration: 0,
  expectedContentId: null,
  expectedContentGeneration: null,
};
assert.equal(
  DatasetFilesContextBodySchema.safeParse(contextBody).success,
  true
);
assert.equal(
  DatasetFilesContextBodySchema.safeParse({
    ...contextBody,
    scanStatus: "CLEAN",
  }).success,
  false
);
assert.equal(
  DatasetFilesInventoryPageQuerySchema.safeParse({
    contentId: reference,
    contentGeneration: 0,
    expectedPreparationGeneration: 0,
    limit: 51,
  }).success,
  false
);
assert.equal(
  DatasetUploadAdmissionBodySchema.safeParse({
    requestId,
    expectedPreparationGeneration: 0,
    expectedContentId: reference,
    expectedContentGeneration: 0,
    component: "SAMPLE",
    role: "PRIMARY",
    originalName: "sample.csv",
    expectedBytes: "1",
    accepted: true,
  }).success,
  false
);
assert.equal(DATASET_UPLOAD_FILE_LIMIT_BYTES, "2000000000");
const received = {
  partNumber: 1,
  expectedBytes: 5,
  measuredBytes: 5,
  state: "RECEIVED",
  receivedAt: "2026-10-16T00:00:00.000Z",
  checksumSha256: "a".repeat(64),
};
assert.equal(DatasetUploadPartStatusSchema.safeParse(received).success, true);
assert.equal(
  DatasetUploadPartStatusSchema.safeParse({ ...received, checksumSha256: null })
    .success,
  false
);
assert.equal(
  DatasetUploadPartStatusSchema.safeParse({
    ...received,
    state: "UNCERTAIN",
    measuredBytes: null,
    receivedAt: null,
  }).success,
  false
);
console.log(
  "PASS pinned Dataset tarball, sixteen committed canonical sources, installed runtime/types, manifests, lockfile, file ceiling and exact resume receipts"
);
