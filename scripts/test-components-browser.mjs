import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";

const result = await build({
  stdin: {
    contents: `
  import React from 'react'; import {createRoot} from 'react-dom/client';
  import {OTPVerification} from './src/components/auth/OTPVerification';
  window.calls=[]; window.failResend=true; window.failVerify=true;
  createRoot(document.getElementById('root')).render(<OTPVerification email="fixture@example.test"
    onVerify={async code => {window.calls.push(['verify',code]); if(window.failVerify) throw new Error('Invalid OTP'); await new Promise(resolve=>{window.verifyResolve=resolve;});}}
    onResend={async () => {window.calls.push(['resend']); if(window.failResend) throw new Error('Rate limited');}}
  />);
`,
    resolveDir: process.cwd(),
    loader: "jsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
});
const server = createServer((req, res) => {
  res.setHeader(
    "Content-Type",
    req.url === "/bundle.js" ? "text/javascript" : "text/html"
  );
  res.end(
    req.url === "/bundle.js"
      ? result.outputFiles[0].text
      : '<div id="root"></div><script src="/bundle.js"></script>'
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  const external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.clock.install();
  await page.goto(origin);
  const inputs = page.locator("input");
  await inputs.first().waitFor();
  assert.equal(await inputs.count(), 6);
  assert.equal(
    await page
      .getByRole("button", { name: "Verify", exact: true })
      .isDisabled(),
    true
  );
  await inputs.first().fill("x");
  assert.equal(await inputs.first().inputValue(), "");
  for (let i = 0; i < 6; i++) await inputs.nth(i).fill(String(i + 1));
  await page.getByRole("button", { name: "Verify", exact: true }).click();
  await page.waitForFunction(
    () => window.calls.filter((c) => c[0] === "verify").length === 1
  );
  await page.getByRole("button", { name: "Verify", exact: true }).waitFor();
  await inputs.first().fill("9");
  await page.evaluate(() => {
    window.failVerify = false;
  });
  await page.getByRole("button", { name: "Verify", exact: true }).click();
  await page.waitForFunction(() => window.verifyResolve);
  assert.equal(
    await page.getByRole("button", { name: "Verifying..." }).isDisabled(),
    true
  );
  assert.deepEqual(
    await page.evaluate(() =>
      window.calls.filter((c) => c[0] === "verify").map((c) => c[1])
    ),
    ["123456", "923456"]
  );
  await page.evaluate(() => window.verifyResolve());
  console.log(
    "PASS OTP rejects non-digits, permits retry after failure, and waits for asynchronous verification"
  );

  // Start another session to exercise the independent resend cooldown.
  await page.reload();
  await inputs.first().waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Resend", exact: true }).count(),
    0
  );
  for (let i = 0; i < 30; i++) await page.clock.runFor(1000);
  await page.getByRole("button", { name: "Resend", exact: true }).click();
  await page.waitForFunction(
    () => window.calls.filter((c) => c[0] === "resend").length === 1
  );
  await page.getByRole("button", { name: "Resend", exact: true }).waitFor();
  await page.evaluate(() => {
    window.failResend = false;
  });
  await page.getByRole("button", { name: "Resend", exact: true }).click();
  await page.getByText(/Resend in 30s/).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Resend", exact: true }).count(),
    0
  );
  console.log(
    "PASS resend waits for cooldown, permits retry on failure, and restarts cooldown on success"
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
