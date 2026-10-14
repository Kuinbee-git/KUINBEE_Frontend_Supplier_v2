import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  DATASET_PREPARATION_CONTRACT_VERSION,
  DatasetPreparationMetadataSchema,
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
assert.equal(manifest.sourceRepository, "Kuinbee-git/KUINBEE");
assert.equal(
  manifest.sourcePath,
  "packages/api-contracts/src/datasets/preparation.schema.ts"
);
for (const [key, value] of Object.entries(packagedManifest))
  assert.deepEqual(manifest[key], value, `Manifest drift: ${key}`);
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
console.log(
  "PASS pinned preparation tarball, installed runtime/types, manifests, lockfile and strict browser contract"
);
