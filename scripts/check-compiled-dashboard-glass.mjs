import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Exercise the CSS emitted by Next's production build, not the source CSS.
 * The component harness intentionally skips this optimizer, so it cannot catch
 * vendor declaration ordering that silently removes Chromium's glass blur.
 */
export async function checkCompiledDashboardGlass({ browser, origin }) {
  const buildId = (await readFile(resolve(".next/BUILD_ID"), "utf8")).trim();
  assert(buildId, "Compiled glass checks require a completed Next build");
  const response = await fetch(origin + "/dashboard/datasets");
  assert.equal(response.status, 200, "Dashboard CSS route must be available");
  const html = await response.text();
  const stylesheets = [...html.matchAll(/<link\b[^>]*>/g)]
    .filter(([tag]) => /\brel="stylesheet"/.test(tag))
    .map(([tag]) => tag.match(/\bhref="([^"]+)"/)?.[1])
    .filter(Boolean)
    .map((href) => new URL(href.replaceAll("&amp;", "&"), origin));
  assert(stylesheets.length > 0, "Dashboard must link compiled stylesheets");
  for (const stylesheet of stylesheets) {
    assert.equal(stylesheet.origin, origin);
    assert(stylesheet.pathname.startsWith("/_next/static/"));
    assert(stylesheet.pathname.endsWith(".css"));
  }

  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  const session = await page.context().newCDPSession(page);
  const elements = {
    card: "dashboard-glass-card",
    sidebar: "dashboard-shell-sidebar",
    topbar: "dashboard-shell-topbar",
    control: "dashboard-glass-control",
    actions: "dashboard-form-actions",
    secondary: "dashboard-button-secondary",
  };
  try {
    await page.route("**/*", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      return url.origin === origin &&
        url.pathname.startsWith("/_next/static/") &&
        request.method() === "GET"
        ? route.continue()
        : route.abort();
    });
    await page.setContent(
      `<html><head>${stylesheets
        .map((stylesheet) => `<link rel="stylesheet" href="${stylesheet.href}">`)
        .join("")}</head><body><div class="supplier-dashboard dashboard-canvas">${Object.entries(
        elements
      )
        .map(
          ([name, className]) =>
            `<div data-compiled-glass="${name}" class="${className}" style="min-height:40px">${name}</div>`
        )
        .join("")}</div></body></html>`,
      { waitUntil: "load" }
    );
    assert(
      await page.evaluate(() => CSS.supports("backdrop-filter", "blur(1px)")),
      "Release Chromium must support the standard backdrop-filter property"
    );
    const inspect = () =>
      page.evaluate(() =>
        Object.fromEntries(
          [...document.querySelectorAll("[data-compiled-glass]")].map((el) => {
            const style = getComputedStyle(el);
            const token =
              el.dataset.compiledGlass === "card"
                ? "--dashboard-glass-blur"
                : "--dashboard-shell-blur";
            return [
              el.dataset.compiledGlass,
              {
                blur: style.backdropFilter,
                expected: `blur(${style.getPropertyValue(token).trim()})`,
              },
            ];
          })
        )
      );
    for (const dark of [false, true]) {
      await page.evaluate((isDark) => {
        document.documentElement.classList.toggle("dark", isDark);
      }, dark);
      for (const [name, state] of Object.entries(await inspect())) {
        assert.equal(
          state.blur,
          state.expected,
          `Production CSS must retain ${dark ? "dark" : "light"} ${name} blur`
        );
        assert.notEqual(state.blur, "none");
      }
    }

    await session.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
    });
    const reducedTransparencySupported = await page.evaluate(
      () => matchMedia("(prefers-reduced-transparency: reduce)").matches
    );
    if (reducedTransparencySupported) {
      for (const [name, state] of Object.entries(await inspect())) {
        assert.equal(
          state.blur,
          "none",
          `Reduced transparency must disable compiled ${name} blur`
        );
      }
    }
    console.log(
      `PASS supplier production-built glass CSS: light/dark card, shell and controls${
        reducedTransparencySupported
          ? "; reduced transparency disables blur"
          : "; reduced-transparency emulation unavailable"
      }`
    );
  } finally {
    await session.detach();
    await page.close();
  }
}
