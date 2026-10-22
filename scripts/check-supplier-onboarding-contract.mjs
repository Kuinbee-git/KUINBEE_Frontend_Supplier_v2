import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
const canonicalDigest = "f6024ad94d4e08ff7886becc3da9ab27448f4a8d98ca5e51d37a697d5543387d";
assert.equal(createHash("sha256").update(readFileSync(new URL("../src/lib/supplier-onboarding-contracts.ts", import.meta.url))).digest("hex"),canonicalDigest,"Refresh the canonical supplier onboarding contract and its pinned digest together");
console.log("Canonical supplier onboarding contract copy verified");
