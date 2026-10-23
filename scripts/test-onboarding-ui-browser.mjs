import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

// Presentation/interaction qualification against isolated request fixtures.
// This never calls staging/production or sends real notifications.
const base = process.env.ONBOARDING_UI_URL || "http://127.0.0.1:3241";
assert.equal(new URL(base).hostname, "127.0.0.1");
const evidence =
  process.env.ONBOARDING_UI_EVIDENCE || "/tmp/kuinbee-onboarding-ui-20261023";
mkdirSync(evidence, { recursive: true });
const compiled = await build({
  entryPoints: ["src/lib/supplier-onboarding-contracts.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "browser",
});
const contracts = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`
);
const identity = contracts.SupplierIdentitySchema.parse({
  supplierType: "INDIVIDUAL",
  name: "Amara Okafor",
  contactName: "Amara Okafor",
  country: "Kenya",
  phone: "+254 700 000 000",
  website: "https://example.test",
});
const capabilities = contracts.SupplierCapabilitiesSchema.parse({
  offerings: ["Existing datasets", "Custom collection"],
  domains: ["Speech", "Language"],
  modalities: ["Audio"],
  languages: ["English", "Swahili"],
  countries: ["Kenya"],
  description:
    "Multilingual speech datasets and custom collection for language technology research.",
  rights: "We own the recordings and hold permission to license the data.",
  capacity: "100 hours per month",
  experience: "Three years supporting speech research projects.",
  notes: "Can collect regional language variants on request.",
});
const details = contracts.SupplierVerificationDetailsSchema.parse({
  legalName: "Amara Okafor",
  registrationCountry: "Kenya",
  address: "Nairobi, Kenya",
});
function workspace(mode = "application") {
  const verified = mode !== "application";
  return {
    id: "ui-fixture",
    email: "amara.supplier@example.test",
    version: 2,
    emailVerified: true,
    userId: verified ? "fixture-user" : null,
    applicationStatus: verified ? "INVITED" : "DRAFT",
    verificationStatus:
      mode === "approved"
        ? "APPROVED"
        : mode === "submitted"
          ? "SUBMITTED"
          : "DRAFT",
    identity,
    capabilities,
    verificationDetails: details,
    documentChecklist: contracts.getSupplierDocumentChecklist(
      identity.supplierType
    ),
    documents: verified
      ? [
          {
            id: "fixture-document",
            requirementKey: "identity",
            name: "identity-verification.pdf",
            size: 248124,
            contentType: "application/pdf",
            createdAt: new Date().toISOString(),
          },
        ]
      : [],
    reviews: [],
    reason:
      mode === "corrections"
        ? "Please confirm your business address before resubmitting."
        : null,
    reapplyAt: null,
    access:
      mode === "approved"
        ? "APPROVED"
        : verified
          ? "VERIFICATION"
          : "APPLICATION",
    canEdit: mode !== "submitted",
    invitation: null,
  };
}
const browser = await chromium.launch({ headless: true });
const errors = [],
  unexpectedRequests = [],
  results = [];
let captures = 0;
async function fixture(page, mode) {
  let data = structuredClone(workspace(mode));
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    let result;
    if (path.endsWith("/auth/login")) {
      return route.fulfill({
        status: 401,
        json: {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email or password is incorrect.",
          },
        },
      });
    } else if (
      path.endsWith("/password/reset/request") ||
      path.endsWith("/password/reset/confirm")
    ) {
      result = { message: "Request accepted" };
    } else if (path.endsWith("/onboarding/status"))
      result = {
        supplier: {
          id: "fixture-user",
          email: data.email,
          name: identity.name,
          userType: "SUPPLIER",
        },
        onboarding: {
          supplierType: "INDIVIDUAL",
          nextStep: "DONE",
          steps: {
            supplierTypeSelected: true,
            emailOtpVerified: true,
            profileCompleted: true,
          },
        },
      };
    else if (path.endsWith("/onboarding/profile"))
      result = { profile: { logoUrl: null, isOfflineContractDone: true } };
    else if (path.endsWith("/application/invitation"))
      result = {
        email: data.email,
        existingAccount: mode === "existing-invitation",
        expiresAt: "2026-11-01T10:00:00Z",
      };
    else if (path.endsWith("/application/start")) {
      if (mode === "email-error")
        return route.fulfill({
          status: 429,
          json: {
            error: {
              message: "Please wait a moment before requesting another link.",
            },
          },
        });
      result = { message: "We’ve emailed your secure application link." };
    } else if (path.endsWith("/application/workspace/submit")) {
      data = { ...data, canEdit: false, applicationStatus: "SUBMITTED" };
      result = data;
    } else if (
      path.endsWith("/application/workspace") ||
      path.endsWith("/application/profile/capabilities")
    ) {
      if (mode === "loading")
        await new Promise((resolve) => setTimeout(resolve, 8000));
      if (mode === "workspace-error")
        return route.fulfill({
          status: 500,
          json: {
            error: {
              message: "Your workspace could not be loaded. Please try again.",
            },
          },
        });
      if (req.method() === "PUT") {
        const body = req.postDataJSON();
        data = {
          ...data,
          ...body,
          version: data.version + 1,
          documentChecklist: contracts.getSupplierDocumentChecklist(
            body.identity.supplierType
          ),
        };
      }
      result = data;
    } else {
      unexpectedRequests.push({ path, method: req.method() });
      return route.fulfill({
        status: 400,
        json: { error: { message: "Unexpected UI fixture request" } },
      });
    }
    return route.fulfill({
      status: 200,
      json: { success: true, data: result },
    });
  });
}
async function check(page, name, width, theme, screenshot = true) {
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false,
    `${name} ${width} ${theme}: page overflow`
  );
  const measurements = await page.evaluate(() => {
    const h = document.querySelector("h1"),
      inputs = [
        ...document.querySelectorAll("input:not([type=file]),[role=combobox]"),
      ].filter((n) => n.getBoundingClientRect().width);
    const primary = [
      ...document.querySelectorAll(".dashboard-button-primary"),
    ].find((n) => n.getBoundingClientRect().width);
    function rgb(color) {
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      const x = c.getContext("2d");
      x.fillStyle = color;
      x.fillRect(0, 0, 1, 1);
      return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3);
    }
    function luminance(c) {
      return rgb(c)
        .map((n) => n / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
        .reduce((s, n, i) => s + n * [0.2126, 0.7152, 0.0722][i], 0);
    }
    let contrast = null;
    if (primary) {
      const s = getComputedStyle(primary),
        a = luminance(s.color),
        b = luminance(s.backgroundColor);
      contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    return {
      font: h ? getComputedStyle(h).fontFamily : null,
      h1Size: h ? parseFloat(getComputedStyle(h).fontSize) : null,
      controls: inputs.map((n) => ({
        height: n.getBoundingClientRect().height,
        font: parseFloat(getComputedStyle(n).fontSize),
      })),
      contrast,
    };
  });
  assert.ok(
    measurements.font?.includes("Geist"),
    `${name}: supplier panel typeface`
  );
  assert.ok(
    measurements.h1Size <= (name === "landing" ? 36 : 30),
    `${name}: compact heading`
  );
  for (const c of measurements.controls) {
    assert.equal(c.height, 40, `${name}: standard control height`);
    assert.equal(c.font, 14, `${name}: input type size`);
  }
  if (measurements.contrast !== null)
    assert.ok(
      measurements.contrast >= 4.5,
      `${name} ${theme}: primary contrast ${measurements.contrast}`
    );
  if (screenshot) {
    await page.screenshot({
      path: resolve(evidence, `${name}-${width}-${theme}.png`),
      fullPage: true,
      animations: "disabled",
    });
    captures++;
  }
  results.push({ name, width, theme, ...measurements });
}
try {
  for (const theme of ["light", "dark"])
    for (const width of (
      process.env.ONBOARDING_UI_WIDTHS || "390,768,1024,1440"
    )
      .split(",")
      .map(Number)) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      await context.addInitScript(
        (t) =>
          localStorage.setItem(
            "kuinbee-supplier-theme-storage",
            JSON.stringify({
              state: { theme: t, isDark: t === "dark" },
              version: 0,
            })
          ),
        theme
      );
      await context.route("**/*", (route) =>
        new URL(route.request().url()).origin === base
          ? route.continue()
          : (unexpectedRequests.push({ url: route.request().url() }),
            route.abort())
      );
      for (const [name, path, mode] of [
        ["login", "/auth/login", "login"],
        ["forgot-password", "/auth/forgot-password", "recovery"],
        [
          "reset-password",
          "/auth/reset-password?token=fixture-token&email=fixture%40example.test",
          "recovery",
        ],
        ["invalid-reset", "/auth/reset-password", "recovery"],
        ["landing", "/", "application"],
        ["apply", "/apply", "application"],
        ["status", "/application/status", "application"],
        ["invitation", "/invitation", "invitation"],
        ["existing-invitation", "/invitation", "existing-invitation"],
        ["application", "/application/status", "application"],
        ["verification", "/onboarding/workspace", "verification"],
      ]) {
        const page = await context.newPage();
        page.on("pageerror", (e) => errors.push(e.message));
        await fixture(page, mode);
        await page.goto(base + path, { waitUntil: "networkidle" });
        if (name === "application" || name === "verification") {
          await page
            .getByRole("combobox", { name: "Supplier type", exact: true })
            .waitFor();
        }
        // The status route resumes the isolated saved application fixture.
        await check(page, name, width, theme);
        if (name === "login") {
          await page
            .getByLabel("Email", { exact: true })
            .fill("fixture@example.test");
          await page
            .getByLabel("Password", { exact: true })
            .fill("FixturePassword123!");
          await page
            .getByRole("button", { name: "Show password", exact: true })
            .click();
          assert.equal(
            await page
              .getByLabel("Password", { exact: true })
              .getAttribute("type"),
            "text"
          );
          await page
            .getByRole("button", { name: "Hide password", exact: true })
            .click();
          await page.getByLabel("Password", { exact: true }).press("Enter");
          await page
            .getByRole("alert")
            .filter({ hasText: "Email or password is incorrect." })
            .waitFor();
          await check(page, "login-error", width, theme);
          await page
            .getByRole("button", {
              name: "New supplier? Apply to join",
              exact: true,
            })
            .click();
          await page.waitForURL(base + "/apply");
        }
        if (name === "forgot-password") {
          await page
            .getByRole("button", {
              name: "Send reset instructions",
              exact: true,
            })
            .click();
          await page.locator('[aria-invalid="true"]').waitFor();
          await page
            .getByLabel("Email address", { exact: true })
            .fill("fixture@example.test");
          await page
            .getByRole("button", {
              name: "Send reset instructions",
              exact: true,
            })
            .click();
          await page
            .getByRole("heading", { name: "Check your email", exact: true })
            .waitFor();
          await check(page, "reset-sent", width, theme);
          await page
            .getByRole("button", {
              name: "Resend reset instructions",
              exact: true,
            })
            .click();
        }
        if (name === "reset-password") {
          await page
            .getByLabel("New password", { exact: true })
            .fill("FixturePassword123!");
          await page
            .getByLabel("Confirm password", { exact: true })
            .fill("DifferentPassword123!");
          await page
            .getByRole("button", { name: "Update password", exact: true })
            .click();
          await page
            .getByRole("alert")
            .filter({ hasText: "Passwords do not match" })
            .waitFor();
          await page
            .getByLabel("Confirm password", { exact: true })
            .fill("FixturePassword123!");
          await page
            .getByRole("button", { name: "Update password", exact: true })
            .click();
          await page
            .getByRole("heading", { name: "Password updated!", exact: true })
            .waitFor();
          await check(page, "reset-success", width, theme);
        }
        if (name === "invalid-reset") {
          await page
            .getByRole("button", {
              name: "Request new reset link",
              exact: true,
            })
            .click();
          await page
            .getByRole("heading", { name: "Reset your password", exact: true })
            .waitFor();
        }
        if (name === "landing") {
          assert.ok(
            (
              await page
                .getByRole("link", { name: "Become a supplier", exact: true })
                .getAttribute("href")
            ).startsWith("/apply")
          );
          assert.equal(
            await page.locator("h2").count(),
            0,
            "Minimal landing has no extra cards"
          );
        }
        if (name === "apply") {
          await page
            .getByLabel("Email address", { exact: true })
            .fill("fixture@example.test");
          await page
            .getByRole("button", { name: "Email me a secure link" })
            .click();
          await page
            .getByRole("status")
            .filter({ hasText: "secure application link" })
            .waitFor();
        }
        if (name === "application") {
          const trigger = page.getByRole("combobox", {
            name: "Supplier type",
            exact: true,
          });
          await trigger.focus();
          await page.keyboard.press("ArrowDown");
          await page
            .getByRole("option", {
              name: "Company / organization",
              exact: true,
            })
            .waitFor();
          await page.screenshot({
            path: resolve(evidence, `dropdown-${width}-${theme}.png`),
            fullPage: false,
          });
          captures++;
          const menu = page.getByRole("listbox"),
            bounds = await menu.boundingBox();
          assert.ok(
            bounds.x >= 0 && bounds.x + bounds.width <= width + 1,
            "Dropdown stays in viewport"
          );
          await page.keyboard.press("Escape");
          await trigger.focus();
          await page.keyboard.press("Enter");
          await page
            .getByRole("option", {
              name: "Company / organization",
              exact: true,
            })
            .click();
          await page
            .getByLabel("Company / organization name *", { exact: true })
            .waitFor();
          await page
            .getByRole("button", { name: "Save changes", exact: true })
            .click();
          await page
            .getByRole("status")
            .filter({ hasText: "Your changes are saved." })
            .waitFor();
          await page.getByRole("button", { name: "Next", exact: true }).click();
          await check(page, "capabilities", width, theme);
          await page
            .getByRole("button", { name: "3. Review & submit", exact: true })
            .click();
          await check(page, "application-review", width, theme);
        }
        if (name === "verification") {
          await page
            .getByRole("button", { name: "2. Private documents", exact: true })
            .click();
          await check(page, "documents", width, theme);
          assert.equal(await page.locator('input[type="file"]').count(), 5);
          await page
            .getByRole("button", { name: "1. Confirm details", exact: true })
            .click();
          await page
            .getByRole("combobox", { name: "Supplier type", exact: true })
            .click();
          await page
            .getByRole("option", {
              name: "Company / organization",
              exact: true,
            })
            .click();
          await page
            .getByRole("button", { name: "Save changes", exact: true })
            .click();
          await page
            .getByRole("status")
            .filter({ hasText: "Your changes are saved." })
            .waitFor();
          await page
            .getByRole("button", { name: "2. Private documents", exact: true })
            .click();
          await page
            .getByRole("heading", { name: /Business Registration/ })
            .waitFor();
          await check(page, "company-documents", width, theme);
          assert.equal(await page.locator('input[type="file"]').count(), 5);
        }
        await page.close();
      }
      await context.close();
    }
  // Long content, recovery, explicit email errors and the approved own-profile state.
  for (const theme of ["light", "dark"])
    for (const [name, mode, path] of [
      ["email-error", "email-error", "/apply"],
      ["workspace-error", "workspace-error", "/onboarding/workspace"],
      ["approved-profile", "approved", "/dashboard/profile"],
      ["corrections", "corrections", "/onboarding/workspace"],
      ["submitted", "submitted", "/onboarding/workspace"],
    ]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      await context.addInitScript(
        (t) =>
          localStorage.setItem(
            "kuinbee-supplier-theme-storage",
            JSON.stringify({
              state: { theme: t, isDark: t === "dark" },
              version: 0,
            })
          ),
        theme
      );
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      await fixture(page, mode);
      await page.goto(base + path, { waitUntil: "networkidle" });
      if (name === "email-error") {
        await page
          .getByLabel("Email address", { exact: true })
          .fill("fixture@example.test");
        await page
          .getByRole("button", { name: "Email me a secure link" })
          .click();
        await page
          .getByRole("alert")
          .filter({ hasText: "Please wait a moment" })
          .waitFor();
      }
      if (name === "approved-profile")
        await page
          .getByRole("heading", { name: "Your supplier profile", exact: true })
          .waitFor();
      await check(page, name, 390, theme);
      await context.close();
    }
  assert.deepEqual(errors, [], "No browser runtime errors");
  assert.deepEqual(
    unexpectedRequests,
    [],
    "No external/unexpected API requests"
  );
  writeFileSync(
    resolve(evidence, "results.json"),
    JSON.stringify(
      {
        result: "PASS",
        captures,
        checks: results.length,
        results,
        errors,
        unexpectedRequests,
        provider:
          "Local Next UI with isolated API fixtures; no backend or email side effects",
      },
      null,
      2
    )
  );
  console.log(
    JSON.stringify({
      result: "PASS",
      captures,
      checks: results.length,
      evidence,
    })
  );
} finally {
  await browser.close();
}
