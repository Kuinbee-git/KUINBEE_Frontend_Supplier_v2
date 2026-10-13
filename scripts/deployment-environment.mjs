import { pathToFileURL } from "node:url";

export const app = "supplier";
const origins = {
  production: "https://marketplace.backend.production.kuinbee.com",
  staging: "https://marketplace.backend.staging.kuinbee.com",
};
const buyerUrls = {
  production: "https://www.kuinbee.com",
  staging: "https://staging.kuinbee.com",
};

export function deploymentEnvironment(source = process.env) {
  const hosted =
    source.VERCEL_ENV !== "development" &&
    Boolean(source.VERCEL || source.VERCEL_ENV);
  const inferred =
    source.VERCEL_ENV === "production"
      ? "production"
      : source.VERCEL_ENV === "preview"
        ? "staging"
        : "local";
  const environment = source.NEXT_PUBLIC_APP_ENV || inferred;
  if (!["local", "staging", "production"].includes(environment))
    throw new Error("Unknown NEXT_PUBLIC_APP_ENV");
  if (hosted && environment !== inferred)
    throw new Error("Application environment does not match the Vercel target");
  const apiKey =
    app === "admin" ? "NEXT_PUBLIC_API_URL" : "NEXT_PUBLIC_API_BASE_URL";
  const buyerKey =
    app === "buyer" ? "NEXT_PUBLIC_SITE_URL" : "NEXT_PUBLIC_USER_APP_URL";
  if (environment !== "local") {
    const expectedApi = origins[environment] + (app === "admin" ? "/api" : "");
    if (source[apiKey] !== expectedApi)
      throw new Error(
        `${apiKey} must exactly match the ${environment} API${app === "admin" ? " /api base" : " origin"}`
      );
    if (source[buyerKey] !== buyerUrls[environment])
      throw new Error(`${buyerKey} must match the ${environment} buyer site`);
    if (
      source.NEXT_PUBLIC_MARKETPLACE_URL &&
      source.NEXT_PUBLIC_MARKETPLACE_URL !== buyerUrls[environment]
    )
      throw new Error("Conflicting marketplace URL");
    if (
      source.ADMIN_API_PROXY_TARGET &&
      source.ADMIN_API_PROXY_TARGET !== origins[environment]
    )
      throw new Error("API proxy targets a different environment");
  } else if (hosted) {
    throw new Error(
      "Hosted deployments require a staging or production environment"
    );
  } else if (source[apiKey]) {
    const url = new URL(source[apiKey]);
    if (
      ![
        "localhost",
        "127.0.0.1",
        "[::1]",
        "marketplace.backend.staging.kuinbee.com",
      ].includes(url.hostname)
    )
      throw new Error("Local builds must use a local or staging API");
  }
  return {
    environment,
    isStaging: environment === "staging",
    apiBase: source[apiKey],
    buyerUrl: source[buyerKey],
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = deploymentEnvironment();
  console.log(`${app}: ${result.environment} environment validated`);
}
