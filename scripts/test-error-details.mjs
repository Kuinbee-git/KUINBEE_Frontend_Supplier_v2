import test from "node:test";
import assert from "node:assert/strict";
import { getErrorDetails } from "../src/lib/utils/error-details.ts";

test("preserves native errors and API status/code for checkout and auth handlers", () => {
  const failure = Object.assign(new Error("Payment confirmation failed"), {
    code: "FORBIDDEN",
    status: 403,
  });
  assert.deepEqual(getErrorDetails(failure), {
    message: failure.message,
    code: "FORBIDDEN",
    status: 403,
  });
  assert.equal(
    getErrorDetails({ message: "Already owned", code: "ALREADY_OWNED" }).code,
    "ALREADY_OWNED"
  );
});

test("malformed thrown values cannot become a non-string UI message", () => {
  for (const value of [null, undefined, 42, "failed", true])
    assert.deepEqual(getErrorDetails(value), {});
  assert.deepEqual(
    getErrorDetails({ message: { unsafe: true }, code: [], status: "429" }),
    {
      message: undefined,
      code: undefined,
      status: undefined,
    }
  );
  assert.equal(getErrorDetails({ message: "", status: 0 }).status, 0);
});
