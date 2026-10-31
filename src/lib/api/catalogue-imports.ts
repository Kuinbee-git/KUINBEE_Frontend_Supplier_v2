import { catalogueClient } from "@/lib/catalogue-imports";
import { requestPreparationResource } from "./dataset-preparations";
export const supplierCatalogueApi = catalogueClient(
  (path, schema, options = {}) =>
    requestPreparationResource(path, schema, {
      method: options.method,
      signal: options.signal,
      timeoutMs: 90_000,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    }),
  "/api/v2/supplier/dataset-drafts"
);
