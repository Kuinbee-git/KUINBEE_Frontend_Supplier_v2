import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Check the actual optimized bitmap chosen by Next/Image. The component
 * fixtures mock Image and cannot catch a tiny source enlarged with CSS. */
export async function checkCompiledDashboardBrand({
  browser,
  origin,
  apiOrigin,
}) {
  assert((await readFile(resolve(".next/BUILD_ID"), "utf8")).trim());
  const results = [];
  const fixturePaths = new Set([
    "/api/v1/supplier/onboarding/status",
    "/api/v2/supplier/dataset-drafts/workspace",
    "/api/v2/supplier/dataset-drafts/capacity",
  ]);
  for (const deviceScaleFactor of [1, 2]) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (
        (url.origin === origin || url.origin === apiOrigin) &&
        url.pathname.startsWith("/api/")
      ) {
        assert(
          fixturePaths.has(url.pathname),
          `Unexpected brand fixture API: ${url.pathname}`
        );
        const headers = {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Headers": "content-type,authorization",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
        };
        if (request.method() === "OPTIONS")
          return route.fulfill({ status: 204, headers });
        assert.equal(
          request.method(),
          "GET",
          "Logo checks must not mutate fixture or real data"
        );
        const data = url.pathname.endsWith("/status")
          ? {
              supplier: {
                id: "c000000000000000000000123",
                email: "brand@example.test",
                userType: "SUPPLIER",
                status: "ACTIVE",
                emailVerified: true,
                phone: null,
              },
              onboarding: { nextStep: "DONE" },
            }
          : url.pathname.endsWith("/capacity")
            ? {
                limit: 1000,
                used: 0,
                remaining: 1000,
                generation: 0,
                override: 1000,
              }
            : {
                items: [],
                page: 1,
                limit: 20,
                total: 0,
                summary: {
                  total: 0,
                  withCurrentUpload: 0,
                  withoutCurrentUpload: 0,
                },
              };
        return route.fulfill({
          status: 200,
          headers,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data }),
        });
      }
      return url.origin === origin ? route.continue() : route.abort();
    });
    try {
      await page.goto(origin + "/dashboard/datasets");
      await page
        .getByRole("heading", { name: "My Drafts", exact: true })
        .waitFor();
      for (const dark of [false, true]) {
        const themeAction = page.getByRole("button", {
          name: dark ? "Use dark theme" : "Use light theme",
          exact: true,
        });
        if (await themeAction.count()) await themeAction.click();
        await page.waitForFunction(
          (expected) =>
            document.documentElement.classList.contains("dark") === expected &&
            !document.documentElement.dataset.dashboardThemeTransition,
          dark
        );
        for (const layout of ["expanded", "collapsed", "mobile"]) {
          await page.setViewportSize({
            width: layout === "mobile" ? 390 : 1280,
            height: 900,
          });
          if (layout === "collapsed")
            await page
              .getByRole("button", { name: "Collapse navigation", exact: true })
              .click();
          const brand = page.locator(
            'a[aria-label="Kuinbee dashboard"]:visible'
          );
          assert.equal(await brand.count(), 1);
          const image = brand.locator("img:visible");
          assert.equal(await image.count(), 1);
          await image.evaluate((node) => node.decode());
          const state = await image.evaluate(async (node) => {
            const response = await fetch(node.currentSrc);
            const bitmap = await createImageBitmap(await response.blob());
            const bounds = node.getBoundingClientRect();
            const frame = node.parentElement.getBoundingClientRect();
            const result = {
              currentSrc: node.currentSrc,
              srcset: node.srcset,
              naturalWidth: node.naturalWidth,
              bitmapWidth: bitmap.width,
              renderedWidth: bounds.width,
              frameWidth: frame.width,
              frameHeight: frame.height,
              dpr: window.devicePixelRatio,
              status: response.status,
            };
            bitmap.close();
            return result;
          });
          const current = new URL(state.currentSrc);
          assert.equal(current.origin, origin);
          assert.equal(
            current.pathname,
            "/_next/image",
            "Qualification must use the real Next image optimizer"
          );
          assert.equal(
            current.searchParams.get("url"),
            dark ? "/logo-dark.png" : "/logo-light.png"
          );
          assert.equal(state.status, 200);
          assert(state.srcset.includes(" 1x") && state.srcset.includes(" 2x"));
          assert(
            state.naturalWidth >= state.renderedWidth,
            "Intrinsic logo resolution must cover its CSS enlargement"
          );
          assert(
            state.bitmapWidth >= Math.ceil(state.renderedWidth * state.dpr),
            "Optimized bitmap must cover the enlarged logo at the actual screen density"
          );
          assert.equal(state.frameWidth, 32);
          assert.equal(state.frameHeight, 32);
          assert(
            Math.abs(state.renderedWidth - 76.8) < 0.1,
            "Preserve the established logo crop and apparent size"
          );
          assert.equal(
            await brand.getByText("Kuinbee", { exact: true }).count(),
            layout === "expanded" ? 1 : 0
          );
          results.push({ theme: dark ? "dark" : "light", layout, ...state });
          if (deviceScaleFactor === 2)
            await page.screenshot({
              path: `/tmp/kuinbee-compiled-brand-${dark ? "dark" : "light"}-${layout}.png`,
              animations: "disabled",
            });
          if (layout === "collapsed")
            await page
              .getByRole("button", { name: "Expand navigation", exact: true })
              .click();
        }
      }
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  }
  console.log(
    "PASS supplier optimized original brand assets: DPR1/2 light/dark expanded, collapsed and mobile; source resolution covers unchanged crop",
    JSON.stringify(results)
  );
}
