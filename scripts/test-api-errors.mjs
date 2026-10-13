import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { build } from "esbuild";

async function service(file) {
  const result = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    define: {
      "process.env.NEXT_PUBLIC_API_BASE_URL": '"http://127.0.0.1:4319"',
    },
  });
  const commonJS = { exports: {} };
  const model = {
    response: {
      status: 200,
      body: { success: true, data: { items: [], total: 0 } },
    },
    requests: [],
    cleared: [],
  };
  const context = {
    module: commonJS,
    exports: commonJS.exports,
    URL,
    URLSearchParams,
    console: { error: () => {} },
    window: {
      location: {
        href: "",
        origin: "https://supplier.fixture.test",
        assign(url) {
          this.href = url;
        },
      },
    },
    localStorage: { removeItem: (key) => model.cleared.push(key) },
    fetch: async (url, options) => {
      model.requests.push({ url, options });
      if (model.failure) throw model.failure;
      return new Response(JSON.stringify(model.response.body), {
        status: model.response.status,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
  vm.runInNewContext(result.outputFiles[0].text, context);
  return { api: commonJS.exports, model, context };
}

test("dataset API preserves structured errors and does not log out on permission denial", async () => {
  const { api, model, context } = await service("src/lib/api/datasets.ts");
  model.response = {
    status: 403,
    body: {
      success: false,
      error: { code: "FORBIDDEN", message: "Approval required" },
    },
  };
  await assert.rejects(
    api.listMyDatasets(),
    (error) =>
      error.status === 403 &&
      error.code === "FORBIDDEN" &&
      error.message === "Approval required"
  );
  assert.deepEqual(model.cleared, []);
  assert.equal(context.window.location.href, "");
  model.response = {
    status: 401,
    body: { error: { code: "UNAUTHORIZED", message: "Session expired" } },
  };
  await assert.rejects(api.listMyDatasets(), (error) => error.status === 401);
  assert.equal(
    context.window.location.href,
    "https://supplier.fixture.test/auth/login"
  );
  assert.equal(model.cleared.length, 3);
});

test("dataset and catalog wrappers retain successful envelopes and normalize malformed thrown values", async () => {
  for (const [file, method] of [
    ["src/lib/api/datasets.ts", "listMyDatasets"],
    ["src/lib/api/catalog.ts", "listMySources"],
  ]) {
    const { api, model } = await service(file);
    assert.deepEqual(await api[method](), { items: [], total: 0 });
    assert.equal(model.requests[0].options.credentials, "include");
    model.failure = null;
    model.response = { status: 500, body: {} };
    await assert.rejects(
      api[method](),
      (error) => error.status === 500 && error.code === "HTTP_500"
    );
    model.failure = "unexpected rejection";
    await assert.rejects(
      api[method](),
      (error) =>
        error.code === "NETWORK_ERROR" && error.message === "Network error"
    );
    model.failure = new TypeError("Failed to fetch");
    await assert.rejects(
      api[method](),
      (error) =>
        error.code === "NETWORK_ERROR" && error.message === "Failed to fetch"
    );
  }
});
