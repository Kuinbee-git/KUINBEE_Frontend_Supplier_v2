import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { build } from "esbuild";
import { chromium } from "playwright";

// Exercise the actual router, API adapter, strict shared DTO and existing
// loading/error controls. The already-qualified editors are replaced only by
// markers so these cases isolate the production editor-selection boundary.
const result = await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';
      import{DatasetCreationRoute}from'./src/components/datasets/DatasetCreationRoute';
      const root=createRoot(document.getElementById('root'));window.unmount=()=>root.unmount();
      root.render(<DatasetCreationRoute isDark={false}/>);`,
    loader: "jsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.NEXT_PUBLIC_APP_ENV": '"production"',
    "process.env.NEXT_PUBLIC_DATASET_CONTENT_ENABLED": '"true"',
    "process.env.NEXT_PUBLIC_API_BASE_URL": '""',
  },
  plugins: [
    {
      name: "isolated-editors",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^\.\/(?:CreateDataset|preparation\/DatasetPreparationScreen)$/,
          },
          (args) =>
            args.importer.endsWith("/DatasetCreationRoute.tsx")
              ? { path: args.path, namespace: "editor" }
              : null
        );
        builder.onLoad({ filter: /.*/, namespace: "editor" }, (args) => ({
          contents:
            args.path === "./CreateDataset"
              ? `import React from'react';export function CreateDataset(){return <h1>Legacy proposal editor</h1>}`
              : `import React from'react';export function DatasetPreparationScreen(){return <h1>Content proposal editor</h1>}`,
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
        builder.onResolve({ filter: /^next\/link$/ }, (args) => ({
          path: args.path,
          namespace: "next",
        }));
        builder.onLoad({ filter: /.*/, namespace: "next" }, () => ({
          contents:
            "import React from'react';export default function Link(props){return <a {...props}/>}",
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const javascript = result.outputFiles[0].text;
const server = createServer((req, res) => {
  if (req.url === "/router.js") {
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end(javascript);
  } else {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(
      '<!doctype html><html><body><div id="root"></div><script src="/router.js"></script></body></html>'
    );
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const browser = await chromium.launch({ headless: true });
const url = `http://127.0.0.1:${server.address().port}/dashboard/datasets/create`;
let passed = 0;
async function scenario(label, perform) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await perform(page);
    assert.deepEqual(errors, [], label);
    passed++;
    console.log("PASS " + label);
  } finally {
    await page.close();
  }
}
const respond = (route, workflow) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: { workflow } }),
  });
try {
  for (const [workflow, heading] of [
    ["CONTENT", "Content proposal editor"],
    ["LEGACY", "Legacy proposal editor"],
  ]) {
    await scenario("backend chooses " + workflow, async (page) => {
      await page.route(
        "**/api/v2/supplier/dataset-drafts/creation-context",
        (route) => respond(route, workflow)
      );
      await page.goto(url);
      await page.getByRole("heading", { name: heading, exact: true }).waitFor();
      assert.equal(
        await page
          .getByRole("heading", {
            name:
              workflow === "CONTENT"
                ? "Legacy proposal editor"
                : "Content proposal editor",
            exact: true,
          })
          .count(),
        0
      );
    });
  }
  await scenario(
    "pending authority never flashes either editor",
    async (page) => {
      let held;
      await page.route(
        "**/api/v2/supplier/dataset-drafts/creation-context",
        (route) => {
          held = route;
        }
      );
      await page.goto(url);
      await page
        .getByText("Opening proposal creation", { exact: true })
        .waitFor();
      assert.equal(
        await page.getByRole("heading", { name: /proposal editor/ }).count(),
        0
      );
      while (!held) await page.waitForTimeout(10);
      await respond(held, "CONTENT");
      await page
        .getByRole("heading", { name: "Content proposal editor" })
        .waitFor();
    }
  );
  for (const failure of [
    "http-error",
    "network",
    "unknown-workflow",
    "extra-authority",
  ]) {
    await scenario(
      failure + " cannot open a legacy editor and can retry",
      async (page) => {
        let requests = 0;
        await page.route(
          "**/api/v2/supplier/dataset-drafts/creation-context",
          async (route) => {
            if (++requests > 1) return respond(route, "CONTENT");
            if (failure === "network") return route.abort("failed");
            if (failure === "http-error")
              return route.fulfill({
                status: 503,
                contentType: "application/json",
                body: JSON.stringify({
                  success: false,
                  error: {
                    code: "DATASET_WORKFLOW_UNAVAILABLE",
                    message: "Please retry.",
                  },
                }),
              });
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                success: true,
                data:
                  failure === "unknown-workflow"
                    ? { workflow: "UNKNOWN" }
                    : { workflow: "LEGACY", admitUploads: true },
              }),
            });
          }
        );
        await page.goto(url);
        await page
          .getByRole("heading", {
            name: "Proposal creation could not be loaded",
          })
          .waitFor();
        assert.equal(
          await page.getByRole("heading", { name: /proposal editor/ }).count(),
          0
        );
        await page
          .getByRole("button", { name: "Try again", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Content proposal editor" })
          .waitFor();
        assert.equal(requests, 2);
      }
    );
  }
  await scenario("unmount aborts a pending authority read", async (page) => {
    let requested = false;
    await page.route(
      "**/api/v2/supplier/dataset-drafts/creation-context",
      () => {
        requested = true;
      }
    );
    await page.goto(url);
    await page
      .getByText("Opening proposal creation", { exact: true })
      .waitFor();
    while (!requested) await page.waitForTimeout(10);
    await page.evaluate(() => window.unmount());
    assert.equal(await page.locator("#root").textContent(), "");
  });
  console.log(
    `PASS ${passed} production Dataset creation routing browser cases`
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
