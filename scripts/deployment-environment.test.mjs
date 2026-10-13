import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { app, deploymentEnvironment } from "./deployment-environment.mjs";

function configuration(environment) {
  return {
    NEXT_PUBLIC_APP_ENV: environment,
    [app === "admin" ? "NEXT_PUBLIC_API_URL" : "NEXT_PUBLIC_API_BASE_URL"]:
      `https://marketplace.backend.${environment}.kuinbee.com${app === "admin" ? "/api" : ""}`,
    [app === "buyer" ? "NEXT_PUBLIC_SITE_URL" : "NEXT_PUBLIC_USER_APP_URL"]:
      environment === "production"
        ? "https://www.kuinbee.com"
        : "https://staging.kuinbee.com",
  };
}
const apiKey =
  app === "admin" ? "NEXT_PUBLIC_API_URL" : "NEXT_PUBLIC_API_BASE_URL";
const buyerKey =
  app === "buyer" ? "NEXT_PUBLIC_SITE_URL" : "NEXT_PUBLIC_USER_APP_URL";
for (const environment of ["production", "staging"]) {
  test(`${environment} uses the exact API and buyer site`, () =>
    assert.equal(
      deploymentEnvironment(configuration(environment)).environment,
      environment
    ));
  test(`${environment} rejects absent API configuration`, () =>
    assert.throws(() =>
      deploymentEnvironment({
        ...configuration(environment),
        [apiKey]: undefined,
      })
    ));
  test(`${environment} rejects the other environment's API`, () =>
    assert.throws(() =>
      deploymentEnvironment({
        ...configuration(environment),
        [apiKey]: configuration(
          environment === "production" ? "staging" : "production"
        )[apiKey],
      })
    ));
  test(`${environment} rejects missing buyer links`, () =>
    assert.throws(() =>
      deploymentEnvironment({
        ...configuration(environment),
        [buyerKey]: undefined,
      })
    ));
  test(`${environment} rejects conflicting proxy destinations`, () =>
    assert.throws(() =>
      deploymentEnvironment({
        ...configuration(environment),
        ADMIN_API_PROXY_TARGET: "https://wrong.example.test",
      })
    ));
  test(`${environment} rejects malformed paths and deceptive origins`, () => {
    for (const value of [
      "http://marketplace.backend.production.kuinbee.com",
      "https://marketplace.backend.production.kuinbee.com.evil.test",
      configuration(environment)[apiKey] + "/api",
      configuration(environment)[apiKey] + "?x=1",
    ]) {
      assert.throws(() =>
        deploymentEnvironment({
          ...configuration(environment),
          [apiKey]: value,
        })
      );
    }
  });
  test(`${environment} has the correct indexing header in the actual Next configuration`, () => {
    const script =
      "const {default:c}=await import('./next.config.ts'); console.log(JSON.stringify(await c.headers()));";
    const env = {
      PATH: process.env.PATH,
      NODE_ENV: "production",
      ...configuration(environment),
      VERCEL_ENV: environment === "production" ? "production" : "preview",
    };
    const entries = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "--input-type=module",
          "-e",
          script,
        ],
        { env, encoding: "utf8" }
      )
    );
    const header = entries
      .flatMap((entry) => entry.headers)
      .find((header) => header.key.toLowerCase() === "x-robots-tag");
    if (environment === "staging")
      assert.equal(header?.value, "noindex, nofollow");
    else assert.equal(header, undefined);
  });
}
test("Vercel target cannot be overridden to another environment", () => {
  assert.throws(() =>
    deploymentEnvironment({
      ...configuration("staging"),
      VERCEL_ENV: "production",
    })
  );
  assert.throws(() =>
    deploymentEnvironment({
      NEXT_PUBLIC_APP_ENV: "local",
      VERCEL_ENV: "preview",
    })
  );
});
test("local development can use a loopback API", () =>
  assert.equal(
    deploymentEnvironment({ [apiKey]: "http://127.0.0.1:4319" }).environment,
    "local"
  ));
test("local builds cannot silently call production", () =>
  assert.throws(() =>
    deploymentEnvironment({ [apiKey]: configuration("production")[apiKey] })
  ));

test("Vercel development permits a local API", () =>
  assert.equal(
    deploymentEnvironment({
      VERCEL: "1",
      VERCEL_ENV: "development",
      [apiKey]: "http://127.0.0.1:4319",
    }).environment,
    "local"
  ));
