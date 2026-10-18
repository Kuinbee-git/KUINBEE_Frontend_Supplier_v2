import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
const require = createRequire(import.meta.url);
const postcss = require(
  require.resolve("postcss", {
    paths: [require.resolve("@tailwindcss/postcss")],
  })
);
const tailwind = require("@tailwindcss/postcss");
const css =
  (
    await postcss([tailwind({ base: process.cwd() })]).process(
      await readFile("src/app/globals.css", "utf8"),
      { from: resolve("src/app/globals.css") }
    )
  ).css +
  "\n" +
  (await readFile("src/app/dashboard/dashboard.css", "utf8"));
const compiled = await build({
  stdin: {
    contents: `import React from'react';import{createRoot}from'react-dom/client';import{SupplierDetailsFixture,proposalFixture,datasetFixture,pricingFixture,fixtureId,stamp,serviceFixture,categoryFixtures,datasetInventoryFixture,proposalInventoryFixture}from'./scripts/fixtures/supplier-details';const p=new URLSearchParams(location.search);window.fixture={proposal:proposalFixture(p.get('view')),dataset:datasetFixture(p.get('view')),pricing:pricingFixture,id:fixtureId,stamp,service:serviceFixture(p.get('view')),categories:categoryFixtures,datasetInventory:datasetInventoryFixture,proposalInventory:proposalInventoryFixture};createRoot(document.getElementById('root')).render(<React.StrictMode><SupplierDetailsFixture view={p.get('view')} dark={p.get('theme')==='dark'}/></React.StrictMode>);`,
    resolveDir: process.cwd(),
    loader: "jsx",
  },
  bundle: true,
  write: false,
  jsx: "automatic",
  format: "iife",
  define: {
    "process.env": JSON.stringify({
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_ENV: "local",
    }),
  },
  plugins: [
    {
      name: "next-detail-fixture",
      setup(b) {
        b.onResolve({ filter: /^next\/(link|image|navigation)$/ }, (a) => ({
          path: a.path,
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          loader: "jsx",
          resolveDir: process.cwd(),
          contents:
            a.path === "next/link"
              ? "import React from'react';export default function Link(p){return <a {...p}/>}"
              : a.path === "next/image"
                ? "import React from'react';export default function Image({priority,fill,quality,unoptimized,...p}){return <img {...p}/>}"
                : "export function useRouter(){return{push:()=>{},replace:(url)=>{const current=new URL(location.href),next=new URL(url,location.origin);if(next.searchParams.has('status'))current.searchParams.set('status',next.searchParams.get('status'));else current.searchParams.delete('status');history.replaceState(null,'',current)},back:()=>{}}}export function useParams(){return{id:'c000000000000000000000321'}}export function usePathname(){return '/dashboard/my-datasets/c000000000000000000000321'}export function useSearchParams(){return new URLSearchParams(location.search)}",
        }));
      },
    },
  ],
});
const server = createServer((req, res) => {
  if (req.url === "/bundle.js") {
    res.setHeader("Content-Type", "text/javascript");
    return res.end(compiled.outputFiles[0].text);
  }
  const dark =
    new URL(req.url, "http://fixture.test").searchParams.get("theme") ===
    "dark";
  res.setHeader("Content-Type", "text/html");
  res.end(
    `<html class="${dark ? "dark" : ""}"><head><style>${css}</style></head><body><div class="supplier-dashboard dashboard-canvas"><main style="margin-left: ${0}px" id="main-content"><div id="root"></div></main></div><script>if(innerWidth>=1024)document.querySelector('main').style.marginLeft='256px'</script><script src="/bundle.js"></script></body></html>`
  );
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = "http://127.0.0.1:" + server.address().port;
let browser, page;
let activeCase = "";
const errors = [],
  requests = [];
const shots = process.argv
  .find((x) => x.startsWith("--screenshots="))
  ?.slice(14);
if (shots) await mkdir(shots, { recursive: true });
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(() => {
    localStorage.clear();
    const theme =
      new URL(location.href).searchParams.get("theme") === "dark"
        ? "dark"
        : "light";
    localStorage.setItem(
      "kuinbee-supplier-theme-storage",
      JSON.stringify({ state: { theme, isDark: theme === "dark" }, version: 0 })
    );
  });
  await context.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    assert.equal(url.origin, origin, "Detailed UI fixtures stay local");
    if (!url.pathname.startsWith("/api/")) return route.continue();
    assert.equal(
      req.method(),
      "GET",
      "Opening, expanding, editing and cancelling do not submit"
    );
    requests.push(url.pathname);
    const f = await req.frame().evaluate(() => window.fixture);
    let data;
    if (
      url.pathname === "/api/v1/supplier/datasets" ||
      url.pathname === "/api/v2/supplier/dataset-proposals"
    ) {
      const isProposals = url.pathname.includes("dataset-proposals");
      const source = isProposals ? f.proposalInventory : f.datasetInventory;
      const status = url.searchParams.get(
        isProposals ? "verificationStatus" : "status"
      );
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const items = source.items.filter(
        (item) =>
          (!status ||
            (isProposals ? item.verificationStatus : item.status) === status) &&
          (!q ||
            `${item.title} ${item.datasetUniqueId}`
              .toLowerCase()
              .includes(q)) &&
          (!url.searchParams.get("visibility") ||
            item.visibility === url.searchParams.get("visibility"))
      );
      data = { ...source, items, total: items.length };
    } else if (url.pathname.includes("/custom-collection-services/"))
      data = f.service;
    else if (url.pathname.endsWith("/pricing")) data = { pricing: f.pricing };
    else if (url.pathname.endsWith("/kdts"))
      data = {
        currentScore: "89",
        breakdown: { Q: 90, L: 100, P: 85, U: 90, F: 80 },
        updatedAt: f.stamp,
      };
    else if (url.pathname.endsWith("/onboarding/profile"))
      data = { profile: { isOfflineContractDone: true } };
    else if (url.pathname.endsWith("/supplier/categories"))
      data = {
        items: f.categories,
        total: f.categories.length,
        page: 1,
        pageSize: 100,
      };
    else if (url.pathname.endsWith("/supplier/sources"))
      data = { items: [f.dataset.source], total: 1, page: 1, pageSize: 100 };
    else if (url.pathname.endsWith("/" + f.id))
      data = url.pathname.includes("dataset-proposals")
        ? f.proposal
        : f.dataset;
    else throw Error("Missing explicit detail fixture " + url.pathname);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data }),
    });
  });
  const requestedViews = process.argv
    .find((arg) => arg.startsWith("--views="))
    ?.slice(8)
    .split(",");
  const views = [
    "proposal",
    "submitted",
    "correction",
    "rejected",
    "published",
    "verified",
    "delisted",
    "archived",
    "edit",
    "edit-correction",
    "edit-locked",
    "create",
    "service-review",
    "service-detail",
    "service-edit",
    "inventory",
    "inventory-delisted",
    "inventory-proposals",
    "service-create",
  ].filter((view) => !requestedViews || requestedViews.includes(view));
  assert.ok(views.length, "Choose a known detail or inventory fixture");
  let cases = 0;
  for (const theme of ["light", "dark"])
    for (const width of [1920, 1440, 1024, 768, 390]) {
      for (const view of views) {
        const inventoryView = view.startsWith("inventory");
        if (width === 1920 && !inventoryView && view !== "service-create")
          continue;
        activeCase = `${view}/${theme}/${width}`;
        // Cases are independent fixtures. Tear down portals, in-flight requests
        // and accessibility state before loading a different component tree.
        await page?.close();
        page = await context.newPage();
        page.on("pageerror", (e) => errors.push(e.message));
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(
          `${origin}/?view=${view}&theme=${theme}${view === "inventory-delisted" ? "&status=DELISTED" : ""}`,
          {
            waitUntil: "domcontentloaded",
          }
        );
        await page.getByRole("heading", { level: 1 }).waitFor();
        if (
          ![
            "create",
            "service-review",
            "service-detail",
            "service-edit",
            "inventory",
            "inventory-delisted",
            "inventory-proposals",
            "service-create",
          ].includes(view)
        )
          await page.locator("[data-dashboard-detail]").waitFor();
        if (inventoryView) {
          const board = page.locator('[data-dataset-inventory="true"]');
          await board.waitFor();
          await page
            .getByRole("link", {
              name:
                view === "inventory-proposals"
                  ? "Proposal submitted"
                  : view === "inventory-delisted"
                    ? "Collection delisted"
                    : "Collection submitted",
              exact: true,
            })
            .waitFor();
          assert.equal(
            await page.locator("[data-dashboard-workspace]").count(),
            1,
            "Summary, toolbar, inventory and footer share one frame"
          );
          assert.equal(await board.locator("[role=search]").count(), 1);
          if (width >= 1024 && view !== "inventory-proposals") {
            const rects = await page
              .getByRole("combobox")
              .evaluateAll((es) =>
                es.map((e) => e.getBoundingClientRect().top)
              );
            const searchTop = await page
              .getByRole("searchbox")
              .evaluate((e) => e.getBoundingClientRect().top);
            assert.ok(
              rects.every((top) => Math.abs(top - searchTop) < 2),
              "Desktop search and both filters share one row"
            );
          }
          if (view === "inventory-delisted") {
            await page
              .getByText("Showing 1 dataset", { exact: true })
              .waitFor();
            await page
              .getByRole("button", { name: "Clear filters", exact: true })
              .click();
            await page
              .getByRole("heading", { name: "My Datasets", exact: true })
              .waitFor();
            assert.equal(new URL(page.url()).searchParams.has("status"), false);
          } else if (view === "inventory") {
            await page.getByRole("button", { name: /Needs attention/ }).click();
            await page
              .getByRole("heading", { name: "Delisted edits", exact: true })
              .waitFor();
            await page
              .getByText("Showing 1 dataset", { exact: true })
              .waitFor();
            assert.equal(
              new URL(page.url()).searchParams.get("status"),
              "DELISTED"
            );
            await page
              .getByRole("button", { name: "Clear filters", exact: true })
              .click();
          } else {
            await page.getByRole("combobox").click();
            await page
              .getByRole("option", { name: "Rejected", exact: true })
              .click();
            await page
              .getByRole("link", { name: "Proposal rejected", exact: true })
              .waitFor();
            await page
              .getByText("Showing 1 proposal", { exact: true })
              .waitFor();
            await page
              .getByRole("button", { name: "Clear filters", exact: true })
              .click();
          }
          await page.getByRole("searchbox").fill("No matching collection xyz");
          await page
            .getByText(
              view === "inventory-proposals"
                ? "No proposals match this view"
                : "No datasets match this view",
              { exact: true }
            )
            .waitFor();
          await page.getByRole("searchbox").fill("");
          await page
            .getByRole("link", {
              name:
                view === "inventory-proposals"
                  ? "Proposal submitted"
                  : "Collection submitted",
              exact: true,
            })
            .waitFor();
        }
        if (view === "service-create") {
          const primary = page.getByRole("combobox", {
            name: "Primary category",
            exact: true,
          });
          await primary.waitFor({ state: "visible" });
          await page.waitForFunction(
            () =>
              !document
                .querySelector("[role=combobox]")
                ?.hasAttribute("disabled")
          );
          await page
            .getByText("Your draft is created after the review step.", {
              exact: true,
            })
            .waitFor();
          const disclosure = page.locator(
            'summary[aria-label="Choose secondary categories"]'
          );
          assert.equal(
            await page.getByRole("checkbox").count(),
            0,
            "Secondary options start collapsed"
          );
          if (width >= 1024) {
            const a = await primary.boundingBox(),
              c = await disclosure.boundingBox();
            assert.equal(a.height, c.height);
            assert.ok(
              Math.abs(a.y - c.y) < 2,
              "Primary and secondary category controls align"
            );
          }
          await disclosure.click();
          const search = page.getByRole("textbox", {
            name: "Search secondary categories",
          });
          await search.fill("Additional category 01");
          await page
            .getByRole("checkbox", {
              name: "Additional category 01",
              exact: true,
            })
            .check();
          await search.fill("Additional category 02");
          await page
            .getByRole("checkbox", {
              name: "Additional category 02",
              exact: true,
            })
            .check();
          await page.keyboard.press("Escape");
          assert.equal(
            await disclosure.evaluate((e) => e === document.activeElement),
            true
          );
          assert.ok(
            (await disclosure.innerText()).includes("2 selected"),
            "Filtering preserves selections outside the visible list"
          );
          if (width === 1920 && theme === "light") {
            await disclosure.click();
            await search.fill("");
            for (let number = 3; number <= 10; number++)
              await page
                .getByRole("checkbox", {
                  name: `Additional category ${String(number).padStart(2, "0")}`,
                  exact: true,
                })
                .check();
            assert.equal(
              await page
                .getByRole("checkbox", {
                  name: "Additional category 11",
                  exact: true,
                })
                .isDisabled(),
              true,
              "Ten selected categories prevent an eleventh selection"
            );
            await page
              .getByRole("button", { name: "Done", exact: true })
              .click();
            assert.ok((await disclosure.innerText()).includes("10 selected"));
          }
          const footer = page.locator(".dashboard-form-actions");
          assert.equal(
            await footer.evaluate((e) => getComputedStyle(e).position),
            "static"
          );
          assert.ok(
            (await footer.boundingBox()).y >=
              (await disclosure.boundingBox()).y + 40,
            "Attached form actions follow category fields without covering them"
          );
          await page
            .getByLabel("Service title", { exact: false })
            .fill("Collection service fixture");
          await page
            .getByText("Unsaved changes. Save at the review step.", {
              exact: true,
            })
            .waitFor();
        }
        if (["service-detail", "service-edit"].includes(view)) {
          await page
            .getByRole("heading", {
              level: 1,
              name: "Detailed collection service",
              exact: true,
            })
            .waitFor();
          if (view === "service-edit" && width === 1024) {
            const stress = await page.addStyleTag({
              content:
                ".dashboard-button { font-size:18px !important; padding-inline:28px !important; }",
            });
            const titleWidth = await page
              .getByRole("heading", { level: 1 })
              .evaluate((e) => e.getBoundingClientRect().width);
            assert.ok(
              titleWidth >= 240,
              "Actions wrap instead of collapsing the title under larger text and spacing"
            );
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth > innerWidth + 1
              ),
              false,
              "Larger header actions stay within the page"
            );
            await stress.evaluate((e) => e.remove());
          }
          if (view === "service-edit") {
            await page
              .getByRole("button", { name: "Edit draft", exact: true })
              .click();
            await page.locator("#service-edit-form form").waitFor();
            for (let step = 0; step < 3; step++)
              await page.getByRole("button", { name: /^Next/ }).click();
            await page
              .getByRole("heading", {
                name: "Review your changes",
                exact: true,
              })
              .waitFor();
            await page
              .locator("#service-edit-form")
              .getByRole("button", { name: "Cancel", exact: true })
              .click();
          }
          await page
            .getByRole("button", { name: "Archive", exact: true })
            .click();
          await page.getByRole("dialog").waitFor();
          await page.keyboard.press("Escape");
          await page.getByRole("dialog").waitFor({ state: "detached" });
          await page.getByRole("heading", { level: 1 }).waitFor();
        }
        if (
          [
            "proposal",
            "correction",
            "edit",
            "edit-correction",
            "edit-locked",
          ].includes(view)
        ) {
          const collapsed = page.locator(
            "button[aria-expanded=false]:not([aria-haspopup])"
          );
          while (await collapsed.count()) await collapsed.first().click();
          const editNames = await page
            .locator('.dataset-detail-sections button[aria-label^="Edit "]')
            .evaluateAll((es) => es.map((e) => e.getAttribute("aria-label")));
          if (view === "edit-locked")
            assert.equal(
              editNames.length,
              0,
              "Locked lifecycle states remain read-only"
            );
          else
            assert.ok(
              editNames.length >= 5,
              `${view} has populated editable sections`
            );
          for (const editName of editNames) {
            await page
              .getByRole("button", { name: editName, exact: true })
              .click();
            const editor = page
              .locator(".dataset-detail-editor")
              .filter({ has: page.locator("form") });
            await editor.first().waitFor();
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth > innerWidth + 1
              ),
              false,
              `${view}/${editName}/${theme}/${width} does not overflow`
            );
            const cancel = editor
              .getByRole("button", { name: "Cancel", exact: true })
              .filter({ visible: true });
            await cancel.first().click();
            assert.equal(
              await editor.count(),
              0,
              `${editName} cancels without submitting`
            );
          }
        }
        if (["published", "verified"].includes(view)) {
          const more = page.getByRole("button", { name: "More", exact: true });
          await more.click();
          const actionNames = await page
            .getByRole("menuitem")
            .allTextContents();
          await page.keyboard.press("Escape");
          for (const action of actionNames.map((name) => name.trim())) {
            await more.click();
            await page
              .getByRole("menuitem", { name: action, exact: true })
              .click();
            const dialog = page.getByRole("dialog");
            await dialog.waitFor();
            assert.equal(
              await dialog.evaluate((e) => e.scrollWidth > e.clientWidth + 1),
              false,
              `${action}/${theme}/${width} fits the dialog`
            );
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "detached" });
            await page.getByRole("heading", { level: 1 }).waitFor();
          }
          if (view === "verified") {
            await page
              .getByRole("button", { name: "Publish dataset", exact: true })
              .click();
            await page.getByRole("dialog").waitFor();
            await page.keyboard.press("Escape");
            await page.getByRole("dialog").waitFor({ state: "detached" });
            await page.getByRole("heading", { level: 1 }).waitFor();
          }
        }
        if (view === "service-review") {
          for (let step = 0; step < 3; step++)
            await page.getByRole("button", { name: /^Next/ }).click();
          await page
            .getByRole("heading", { name: "Review your changes", exact: true })
            .waitFor();
        }
        assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
        assert.equal(
          await page
            .locator("html")
            .evaluate((e) => e.classList.contains("dark")),
          theme === "dark",
          "The theme store and rendered DOM match the requested theme"
        );
        assert.equal(await page.locator("main main").count(), 0);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1
          ),
          false,
          `${view}/${theme}/${width} does not overflow`
        );
        assert.equal(
          await page
            .locator("[data-dashboard-content] .dashboard-glass-card")
            .evaluateAll(
              (es) =>
                es.filter((e) => getComputedStyle(e).boxShadow !== "none")
                  .length
            ),
          0
        );
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.evaluate(() => document.activeElement?.blur());
        if (shots && view === "service-create") {
          await page.screenshot({
            path: resolve(shots, `${view}-${theme}-${width}-viewport.png`),
          });
          await page
            .getByRole("button", { name: /^Next/ })
            .scrollIntoViewIfNeeded();
          await page.screenshot({
            path: resolve(shots, `${view}-${theme}-${width}-footer.png`),
          });
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        if (shots)
          await page.screenshot({
            path: resolve(shots, `${view}-${theme}-${width}.png`),
            fullPage: true,
          });
        cases++;
      }
      console.log(`PASS populated supplier layouts: ${theme}, ${width}px`);
    }
  assert.deepEqual(errors, []);
  assert.ok(requests.length > 0);
  console.log(
    `PASS ${cases} populated supplier layout cases: details, inventories, service forms and review; filters, category selection, expansion/edit/cancel, no writes or nested main, light/dark and desktop/mobile`
  );
} catch (error) {
  console.error("Detailed UI case failed:", activeCase);
  if (page)
    console.error(
      "Detailed UI diagnostics:",
      JSON.stringify(
        await page
          .evaluate(() => ({
            url: location.href,
            headings: Array.from(document.querySelectorAll("h1")).map((h) => {
              const ancestors = [];
              for (let e = h; e; e = e.parentElement) {
                const s = getComputedStyle(e),
                  r = e.getBoundingClientRect();
                ancestors.push({
                  tag: e.tagName,
                  class: e.className,
                  display: s.display,
                  visibility: s.visibility,
                  width: r.width,
                  height: r.height,
                  hidden: e.getAttribute("aria-hidden"),
                  inert: e.inert,
                });
              }
              return { text: h.textContent, ancestors };
            }),
            dialogs: document.querySelectorAll("[role=dialog]").length,
          }))
          .catch(() => "Page is unavailable")
      )
    );
  if (shots && page) {
    await page.screenshot({
      path: resolve(shots, "failure.png"),
      fullPage: true,
    });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(
      resolve(shots, "failure.txt"),
      String(error.stack) + "\n" + (await page.locator("body").innerText())
    );
  }
  throw error;
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
