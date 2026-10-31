import {
  CatalogueImportUploadBodySchema,
  CatalogueImportReviseBodySchema,
  CatalogueImportCommitBodySchema,
  CatalogueImportCancelBodySchema,
  CatalogueImportBatchResponseSchema,
  CatalogueImportProgressResponseSchema,
  CatalogueImportListResponseSchema,
  CatalogueImportTemplateResponseSchema,
  CatalogueEntryResponseSchema,
  CatalogueEntryPatchBodySchema,
  DatasetCatalogueDraftCandidatesResponseSchema,
  DatasetPreparationCapacityResponseSchema,
  DatasetPreparationCapacityUpdateBodySchema,
  type CatalogueImportUploadBody,
  type CatalogueImportReviseBody,
  type CatalogueImportCommitBody,
  type CatalogueImportBatchResponse,
  type CatalogueEntryPatchBody,
} from "@kuinbee/dataset-preparation-contracts";
import { z } from "zod";

export const CatalogueCapacitySchema = DatasetPreparationCapacityResponseSchema;
export const CatalogueCapacityUpdateSchema =
  DatasetPreparationCapacityUpdateBodySchema;
export type CatalogueCapacity = z.infer<typeof CatalogueCapacitySchema>;
export type CatalogueBatch = CatalogueImportBatchResponse;
export type CatalogueFile = z.infer<
  typeof CatalogueImportTemplateResponseSchema
>["files"][number];
export type CatalogueCandidates = z.infer<
  typeof DatasetCatalogueDraftCandidatesResponseSchema
>;
export type CatalogueEntry = z.infer<typeof CatalogueEntryResponseSchema>;
export type CatalogueRequest = <T>(
  path: string,
  schema: { parse(value: unknown): T },
  options?: {
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    signal?: AbortSignal;
  }
) => Promise<T>;

export function catalogueClient(request: CatalogueRequest, base: string) {
  const imports = `${base}/catalogue-imports`;
  return {
    key: base,
    capacity: (signal?: AbortSignal) =>
      request(`${base}/capacity`, CatalogueCapacitySchema, { signal }),
    updateCapacity: (body: z.infer<typeof CatalogueCapacityUpdateSchema>) =>
      request(`${base}/capacity`, CatalogueCapacitySchema, {
        method: "PATCH",
        body: CatalogueCapacityUpdateSchema.parse(body),
      }),
    list: (signal?: AbortSignal) =>
      request(imports, CatalogueImportListResponseSchema, { signal }),
    get: (id: string, signal?: AbortSignal) =>
      request(
        `${imports}/${encodeURIComponent(id)}`,
        CatalogueImportBatchResponseSchema,
        { signal }
      ),
    progress: (id: string, signal?: AbortSignal) =>
      request(
        `${imports}/${encodeURIComponent(id)}/progress`,
        CatalogueImportProgressResponseSchema,
        { signal }
      ),
    template: (format: "csv" | "xlsx") =>
      request(
        `${imports}/template?format=${format}`,
        CatalogueImportTemplateResponseSchema
      ),
    report: (id: string) =>
      request(
        `${imports}/${encodeURIComponent(id)}/report?format=csv`,
        CatalogueImportTemplateResponseSchema
      ),
    candidates: (q = "", page = 1) =>
      request(
        `${imports}/draft-candidates?${new URLSearchParams({ q, page: String(page), limit: "50" })}`,
        DatasetCatalogueDraftCandidatesResponseSchema
      ),
    preview: (body: CatalogueImportUploadBody) =>
      request(imports, CatalogueImportBatchResponseSchema, {
        method: "POST",
        body: CatalogueImportUploadBodySchema.parse(body),
      }),
    revise: (id: string, body: CatalogueImportReviseBody) =>
      request(
        `${imports}/${encodeURIComponent(id)}/preview`,
        CatalogueImportBatchResponseSchema,
        { method: "PATCH", body: CatalogueImportReviseBodySchema.parse(body) }
      ),
    commit: (id: string, body: CatalogueImportCommitBody) =>
      request(
        `${imports}/${encodeURIComponent(id)}/commit`,
        CatalogueImportBatchResponseSchema,
        { method: "POST", body: CatalogueImportCommitBodySchema.parse(body) }
      ),
    cancel: (id: string, body: { requestId: string }) =>
      request(
        `${imports}/${encodeURIComponent(id)}/cancel`,
        CatalogueImportBatchResponseSchema,
        { method: "POST", body: CatalogueImportCancelBodySchema.parse(body) }
      ),
    entry: (id: string) =>
      request(
        base.includes("/admin/")
          ? `${base}/catalogue-entries/${encodeURIComponent(id)}`
          : `${base}/${encodeURIComponent(id)}/catalogue-entry`,
        CatalogueEntryResponseSchema.nullable()
      ),
    saveEntry: (id: string, body: CatalogueEntryPatchBody) =>
      request(
        base.includes("/admin/")
          ? `${base}/catalogue-entries/${encodeURIComponent(id)}`
          : `${base}/${encodeURIComponent(id)}/catalogue-entry`,
        CatalogueEntryResponseSchema,
        { method: "PATCH", body: CatalogueEntryPatchBodySchema.parse(body) }
      ),
  };
}
export type CatalogueApi = ReturnType<typeof catalogueClient>;
export function catalogueError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  )
    return error.message;
  return "This request could not be completed. Your input is retained.";
}
export function readCatalogueFile(
  file: File
): Promise<{ name: string; contentBase64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error(`Could not read ${file.name}. Select it again.`));
    reader.onload = () =>
      resolve({
        name: file.name,
        contentBase64: String(reader.result).split(",")[1] ?? "",
      });
    reader.readAsDataURL(file);
  });
}
export function downloadCatalogueFile(file: CatalogueFile) {
  const bytes = Uint8Array.from(atob(file.contentBase64), (character) =>
    character.charCodeAt(0)
  );
  const url = URL.createObjectURL(new Blob([bytes], { type: file.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name.replace(/[\\/]/g, "_");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function catalogueRequestUncertain(error: unknown): boolean {
  if (error && typeof error === "object") {
    const status =
      "status" in error
        ? error.status
        : "statusCode" in error
          ? error.statusCode
          : null;
    if (typeof status === "number" && status >= 400 && status < 500)
      return false;
  }
  return true;
}

export const CatalogueRetainedRequestSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("preview"),
      body: CatalogueImportUploadBodySchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("revise"),
      id: z.string().cuid(),
      body: CatalogueImportReviseBodySchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("commit"),
      id: z.string().cuid(),
      body: CatalogueImportCommitBodySchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("cancel"),
      id: z.string().cuid(),
      body: CatalogueImportCancelBodySchema,
    })
    .strict(),
]);
