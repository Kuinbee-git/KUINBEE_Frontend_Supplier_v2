import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import {
  DatasetPreparationResponseSchema,
  DatasetPreparationPatchBodySchema,
  DatasetFilesContextBodySchema,
  DatasetFilesContextResponseSchema,
  DatasetFilesInventoryPageResponseSchema,
  DatasetFilesMutationBodySchema,
  DatasetFilesOrganizationQuerySchema,
  DatasetFilesOrganizationPageResponseSchema,
  DatasetMaterialMutationResponseSchema,
  DatasetIntakeConfigResponseSchema,
  DatasetUploadAdmissionBodySchema,
  DatasetUploadActionBodySchema,
  DatasetUploadCancelBodySchema,
  DatasetUploadAttemptResponseSchema,
  DatasetUploadAttemptStatusResponseSchema,
  DatasetUploadPartsPageResponseSchema,
  DatasetUploadPartQuerySchema,
  DatasetUploadsPageResponseSchema,
  DatasetTableDescriptionsPageQuerySchema,
  DatasetTableDescriptionsPageResponseSchema,
  DatasetTableDescriptionsMutationBodySchema,
  DatasetTableDescriptionsMutationResponseSchema,
  DatasetTableReferencesPageQuerySchema,
  DatasetTableReferencesPageResponseSchema,
} from "@kuinbee/dataset-preparation-contracts";

// Real rendered editor, native File/Blob/WebCrypto and HTTP requests against a
// bounded synthetic service. This qualifies UI orchestration, never the native
// scanner, cloud provider, 2 GB transfer, or hosted deployment.
const require = createRequire(import.meta.url);
const postcss = require(
  require.resolve("postcss", {
    paths: [require.resolve("@tailwindcss/postcss")],
  })
);
const css =
  (
    await postcss([
      require("@tailwindcss/postcss")({ base: process.cwd() }),
    ]).process(await readFile("src/app/globals.css", "utf8"), {
      from: resolve("src/app/globals.css"),
    })
  ).css +
  "\n" +
  (await readFile("src/app/dashboard/dashboard.css", "utf8"));
const bundle = await build({
  stdin: {
    contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {QueryProvider} from './src/components/QueryProvider';
    import {DashboardShell} from './src/components/layout/DashboardShell';
    import {DatasetPreparationEditor} from './src/components/datasets/preparation/DatasetPreparationEditor';
    import {useAuthStore} from './src/store/auth.store';
    window.fixtureLogin=(id)=>useAuthStore.getState().login({id,email:'fixture@example.test',name:'Fixture supplier',role:'supplier'});
    window.fixtureLogin('c000000000000000000999999');
    const root=createRoot(document.getElementById('root'));let mount=0;
    window.mount=(id)=>root.render(<React.StrictMode><QueryProvider><DashboardShell><DatasetPreparationEditor key={++mount} draftId={id} onExit={()=>window.fixtureExits=(window.fixtureExits??0)+1}/></DashboardShell></QueryProvider></React.StrictMode>);
    window.mount(window.location.pathname.split('/').at(-1));
  `,
    loader: "jsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.NEXT_PUBLIC_APP_ENV": '"local"',
  },
  plugins: [
    {
      name: "local-next-fixture",
      setup(builder) {
        builder.onResolve(
          { filter: /^next\/(link|navigation|image)$/ },
          (args) => ({ path: args.path, namespace: "fixture" })
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          loader: "jsx",
          resolveDir: process.cwd(),
          contents:
            args.path === "next/link"
              ? "import React from 'react';export default function Link(p){return <a {...p}/>}"
              : args.path === "next/image"
                ? "import React from 'react';export default function Image({priority,fill,quality,unoptimized,...p}){return <img {...p}/>}"
                : "export function usePathname(){return window.location.pathname}export function useRouter(){return {push:()=>{},replace:()=>{}}}export function useSearchParams(){return new URLSearchParams()}",
        }));
      },
    },
  ],
});
const id = (value) => "c" + String(value).padStart(24, "0");
let sequence = 1000;
const newId = () => id(sequence++);
const partBytes = 5 * 1024 * 1024;
const drafts = new Map(),
  attempts = new Map(),
  receipts = new Map();
const requests = [],
  fixtureErrors = [],
  browserErrors = [],
  external = [];
const flags = { closed: false, lose: null, holdPart: null, failChecks: false };
const held = new Set();
const choices = ["SAMPLE_ONLY", "FULL_ONLY", "FULL_AND_SAMPLE"];
const capabilities = [
  ["UTF8_CSV_SYNTAX_V1", ".csv", "text/csv"],
  ["UTF8_TSV_SYNTAX_V1", ".tsv", "text/tab-separated-values"],
  ["UTF8_JSONL_SYNTAX_V1", ".jsonl", "application/x-ndjson"],
  ["RIFF_INTEGER_PCM_WAVE_V1", ".wav", "audio/wav"],
  ["PNG_STATIC_8BIT_V1", ".png", "image/png"],
  ["ZIP32_CONTAINER_V1", ".zip", "application/zip"],
].map(([profileId, extension, mime]) => ({
  profileId,
  maximumObjectBytes: "2000000000",
  choices,
  extensions: [extension],
  mimeTypes: [mime],
}));
function seed(choice) {
  const draft = {
    id: newId(),
    contentId: newId(),
    generation: 0,
    contentGeneration: 0,
    sourceGeneration: 0,
    members: [],
    groups: [],
    links: [],
    inventories: [],
    tables: [],
    protectedObjects: new Set(),
    metadata: {
      title: "Dataset uploader exercise",
      uploadChoice: choice,
      modalities: ["TABULAR"],
    },
  };
  drafts.set(draft.id, draft);
  return draft;
}
function tableFixture(draft, component, count = 22) {
  const selected = member(draft, {
    uploadObjectId: newId(),
    component,
    role: "PRIMARY",
    originalName: component.toLowerCase() + "-readings.csv",
    expectedBytes: "120",
  });
  draft.members.push(selected);
  const table = {
    kind: "TABLE",
    applicability: {
      purpose: "PRIMARY",
      origin: "SUPPLIER_DECLARED",
      basis: "SELECTED_FILE_PURPOSE",
      definitionsRequired: true,
    },
    id: newId(),
    memberId: selected.id,
    syntaxProfileId: "UTF8_CSV_SYNTAX_V1",
    headerConvention: "PRESENT",
    logicalEntryId: null,
    locator: null,
    columnCount: count,
    recordCount: "4",
    dataRecordCount: "3",
    description: null,
    columns: [],
  };
  table.columns = Array.from({ length: count }, (_, i) => ({
    kind: "COLUMN",
    id: newId(),
    tableId: table.id,
    position: i + 1,
    observedName:
      i === 20
        ? '<img src=x onerror="window.tableInjected=true">' +
          " long column".repeat(25)
        : i === 1
          ? ""
          : i === 2
            ? "amount"
            : "amount",
    storageRepresentation: "UTF8_TEXT",
    description: null,
  }));
  draft.tables.push(table);
  return { member: selected, table };
}
function dto(draft) {
  return DatasetPreparationResponseSchema.parse({
    contractVersion: 1,
    id: draft.id,
    generation: draft.generation,
    metadata: draft.metadata,
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
    readiness: {
      canSubmit: false,
      issues: [
        {
          code: "SUBMISSION_NOT_ENABLED",
          message: "Submission stays separate from upload.",
        },
      ],
    },
  });
}
function scopedAttempts(draft) {
  return [...attempts.values()].filter((item) => item.rootId === draft.id);
}
function account(draft, limit) {
  const items =
    limit === "5000000000" ? scopedAttempts(draft) : [...attempts.values()];
  const retained = items.reduce(
    (sum, item) => sum + BigInt(item.retainedBytes),
    0n
  );
  const reserved = items.reduce(
      (sum, item) => sum + BigInt(item.reservedBytes),
      0n
    ),
    charged = retained + reserved;
  return {
    limitBytes: limit,
    retainedBytes: String(retained),
    reservedBytes: String(reserved),
    chargedBytes: String(charged),
    remainingBytes: String(
      charged < BigInt(limit) ? BigInt(limit) - charged : 0n
    ),
  };
}
function context(draft) {
  return DatasetFilesContextResponseSchema.parse({
    contractVersion: 1,
    preparationId: draft.id,
    preparationGeneration: draft.generation,
    contentId: draft.contentId,
    contentGeneration: draft.contentGeneration,
    sourcePreparationGeneration: draft.sourceGeneration,
    serverUploadChoice: draft.metadata.uploadChoice,
    editable: true,
    synchronizationRequired: draft.generation !== draft.sourceGeneration,
    usage: {
      state: "ACCOUNTED",
      dataset: account(draft, "5000000000"),
      supplier: account(draft, "100000000000"),
    },
    admission: { enabled: false, reason: "INTAKE_NOT_ENABLED" },
  });
}
function status(item) {
  const { parts, protected: ignored, ...value } = item;
  void parts;
  void ignored;
  return DatasetUploadAttemptStatusResponseSchema.parse(value);
}
function ack(item, requestId) {
  const value = status(item);
  delete value.uploadObjectId;
  return DatasetUploadAttemptResponseSchema.parse({
    ...value,
    requestId,
    eligibility: "NOT_ACCEPTED",
  });
}
function json(res, code, value) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
}
const ok = (res, value) => json(res, 200, { success: true, data: value });
const deny = (res, code, message) =>
  json(res, 409, { success: false, error: { code, message } });
function sameContext(draft, body) {
  return (
    body.expectedPreparationGeneration === draft.generation &&
    body.expectedContentId === draft.contentId &&
    (body.expectedContentGeneration ?? body.expectedGeneration) ===
      draft.contentGeneration &&
    draft.sourceGeneration === draft.generation
  );
}
function accept(item) {
  item.state = flags.failChecks ? "REJECTED" : "ACCEPTED";
  item.eligibility = flags.failChecks ? "NOT_ACCEPTED" : "ACCEPTED";
  item.uploadObjectId = flags.failChecks ? null : newId();
  item.revision++;
}
function member(draft, item, component = item.component) {
  return {
    id: newId(),
    contentId: draft.contentId,
    uploadObjectId: item.uploadObjectId,
    component,
    role: item.role,
    relativePath: null,
    groupId: null,
    originalFileName: item.originalName,
    measuredSizeBytes: item.expectedBytes,
    inspection: {
      securityState: "ACCEPTED",
      currentEvidenceId: newId(),
      recordedOutcome: "PASS",
      current: true,
      eligibility: "NOT_EVALUATED",
    },
  };
}
function saveReceipt(res, key, body, value, kind) {
  receipts.set(key, {
    body: structuredClone(body),
    value: structuredClone(value),
    kind,
  });
  if (flags.lose === kind) {
    res.destroy();
    return;
  }
  ok(res, value);
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://fixture.test");
    if (url.pathname === "/bundle.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(bundle.outputFiles[0].text);
      return;
    }
    if (url.pathname === "/style.css") {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(css);
      return;
    }
    if (/^\/logo-(light|dark)\.png$/.test(url.pathname)) {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(await readFile(resolve("public", url.pathname.slice(1))));
      return;
    }
    if (!url.pathname.startsWith("/api/")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
      );
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks),
      body =
        bytes.length &&
        req.headers["content-type"]?.startsWith("application/json")
          ? JSON.parse(bytes)
          : null;
    requests.push({
      method: req.method,
      path: url.pathname,
      query: url.search,
      body: structuredClone(body),
      bytes: bytes.length,
    });
    if (url.pathname.endsWith("/catalog-labels")) {
      ok(res, { primaryCategory: null, source: null });
      return;
    }
    if (/^\/api\/v1\/supplier\/(categories|sources)$/.test(url.pathname)) {
      ok(res, { items: [], total: 0 });
      return;
    }
    const match = url.pathname.match(
      /^\/api\/v2\/supplier\/dataset-drafts\/([^/]+)(?:\/(.*))?$/
    );
    if (!match || !drafts.has(match[1])) {
      json(res, 404, {
        success: false,
        error: { code: "NOT_FOUND", message: "Fixture path not found" },
      });
      return;
    }
    const draft = drafts.get(match[1]),
      tail = match[2] ?? "";
    if (flags.fileDeny && tail === "uploads" && req.method === "POST") {
      json(res, 403, {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Synthetic upload authority unavailable",
        },
      });
      return;
    }
    // This upload-only fixture does not qualify the separate review workflow.
    // Owned read probes may be unavailable; workflow writes still fail below.
    if (
      req.method === "GET" &&
      ["workflow", "readiness", "edit-context", "edit-base"].includes(tail)
    ) {
      json(res, 404, {
        success: false,
        error: {
          code: "NOT_FOUND",
          message:
            "Review workflow is not configured in the upload-only fixture",
        },
      });
      return;
    }
    if (!tail && req.method === "GET") {
      ok(res, dto(draft));
      return;
    }
    if (!tail && req.method === "PATCH") {
      const parsed = DatasetPreparationPatchBodySchema.parse(body);
      const replayKey = draft.id + ":" + parsed.requestId;
      const prior = receipts.get(replayKey);
      if (prior) {
        assert.deepEqual(body, prior.body);
        if (flags.lose === "SAVE") res.destroy();
        else ok(res, prior.value);
        return;
      }
      if (parsed.expectedGeneration !== draft.generation) {
        deny(res, "DRAFT_CHANGED", "Saved details changed.");
        return;
      }
      draft.metadata = { ...draft.metadata, ...parsed.changes };
      draft.generation++;
      saveReceipt(res, replayKey, body, dto(draft), "SAVE");
      return;
    }
    if (tail === "files-context" && req.method === "GET") {
      ok(res, context(draft));
      return;
    }
    if (tail === "intake-config") {
      const ready =
        !flags.closed &&
        draft.generation === draft.sourceGeneration &&
        Boolean(draft.metadata.uploadChoice);
      ok(
        res,
        DatasetIntakeConfigResponseSchema.parse({
          context: context(draft),
          maximumFileBytes: "2000000000",
          admission: ready
            ? { enabled: true, reason: null, policyVersion: "synthetic-ui-v1" }
            : {
                enabled: false,
                reason: "INTAKE_PAUSED",
                policyVersion: "synthetic-ui-v1",
              },
          capabilities: ready ? capabilities : [],
          transport: ready
            ? {
                kind: "BOUNDED_PARTS_V1",
                partBytes,
                maximumParts: 10000,
                mediaType: "application/octet-stream",
                partPathTemplate:
                  "/api/v2/supplier/dataset-drafts/{draftId}/uploads/{attemptId}/parts/{partNumber}",
              }
            : null,
        })
      );
      return;
    }
    if (tail === "uploads" && req.method === "GET") {
      const after = url.searchParams.get("afterId"),
        all = scopedAttempts(draft)
          .sort((a, b) => a.id.localeCompare(b.id))
          .filter((item) => !after || item.id > after);
      const items = all.slice(0, 20).map(status);
      ok(
        res,
        DatasetUploadsPageResponseSchema.parse({
          preparationId: draft.id,
          items,
          nextCursor: all.length > 20 ? { afterId: items.at(-1).id } : null,
        })
      );
      return;
    }
    if (tail === "files" && req.method === "GET") {
      if (
        Number(url.searchParams.get("contentGeneration")) !==
        draft.contentGeneration
      ) {
        deny(res, "DRAFT_CHANGED", "File inventory changed.");
        return;
      }
      const after = url.searchParams.get("afterId"),
        all = draft.members.filter((item) => !after || item.id > after),
        items = all.slice(0, 20);
      ok(
        res,
        DatasetFilesInventoryPageResponseSchema.parse({
          preparationId: draft.id,
          preparationGeneration: draft.generation,
          contentId: draft.contentId,
          contentGeneration: draft.contentGeneration,
          sourcePreparationGeneration: draft.sourceGeneration,
          items,
          nextCursor:
            all.length > 20
              ? {
                  contentId: draft.contentId,
                  contentGeneration: draft.contentGeneration,
                  afterId: items.at(-1).id,
                }
              : null,
        })
      );
      return;
    }
    if (tail === "files/table-references" && req.method === "GET") {
      const query = DatasetTableReferencesPageQuerySchema.parse(
        Object.fromEntries(url.searchParams)
      );
      if (
        query.contentId !== draft.contentId ||
        query.contentGeneration !== draft.contentGeneration ||
        query.expectedPreparationGeneration !== draft.generation
      ) {
        deny(res, "DRAFT_CHANGED", "Table reference context changed.");
        return;
      }
      const member = draft.members.find((item) => item.id === query.memberId);
      assert(member, "Reference reads retain exact fixture membership");
      assert(!query.component || query.component === member.component);
      assert(
        !query.tableId ||
          draft.tables.some(
            (table) =>
              table.id === query.tableId && table.memberId === member.id
          )
      );
      // This uploader fixture declares no keys, joins or dictionaries. Their
      // read is exact and schema-checked; unexpected writes still fail below.
      ok(
        res,
        DatasetTableReferencesPageResponseSchema.parse({
          contentId: draft.contentId,
          contentGeneration: draft.contentGeneration,
          preparationGeneration: draft.generation,
          frozen: false,
          items: [],
          nextCursor: null,
        })
      );
      return;
    }
    if (tail === "files/tables") {
      if (req.method === "GET") {
        const q = DatasetTableDescriptionsPageQuerySchema.parse(
          Object.fromEntries(url.searchParams)
        );
        if (
          q.contentId !== draft.contentId ||
          q.contentGeneration !== draft.contentGeneration ||
          q.expectedPreparationGeneration !== draft.generation
        ) {
          deny(res, "DRAFT_CHANGED", "Table context changed.");
          return;
        }
        const selected = draft.members.find((item) => item.id === q.memberId);
        assert(selected);
        const available = draft.tables.filter(
          (item) => item.memberId === selected.id
        );
        const view = (item) => {
          return Object.fromEntries(
            Object.entries(item).filter(
              ([key]) => key !== "memberId" && key !== "columns"
            )
          );
        };
        const table = q.tableId
          ? available.find((item) => item.id === q.tableId)
          : null;
        if (q.tableId) assert(table);
        const candidates = table ? table.columns : available.map(view);
        const offset = q.afterId
          ? candidates.findIndex((item) => item.id === q.afterId) + 1
          : 0;
        if (q.afterId) assert(offset > 0);
        const items = candidates.slice(offset, offset + q.limit);
        ok(
          res,
          DatasetTableDescriptionsPageResponseSchema.parse({
            contentId: draft.contentId,
            contentGeneration: draft.contentGeneration,
            preparationGeneration: draft.generation,
            frozen: false,
            memberId: selected.id,
            component: selected.component,
            tableId: q.tableId ?? null,
            table: table ? view(table) : null,
            items,
            nextCursor:
              offset + q.limit < candidates.length
                ? { ...q, afterId: items.at(-1).id }
                : null,
          })
        );
        return;
      }
      assert.equal(req.method, "PATCH");
      const command = DatasetTableDescriptionsMutationBodySchema.parse(body);
      if (flags.tableDeny) {
        json(res, 403, {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Synthetic table authority unavailable",
          },
        });
        return;
      }
      const key = draft.id + ":" + command.requestId,
        prior = receipts.get(key);
      if (prior) {
        assert.deepEqual(body, prior.body);
        if (flags.lose === "TABLES") res.destroy();
        else ok(res, prior.value);
        return;
      }
      if (
        command.expectedContentId !== draft.contentId ||
        command.expectedGeneration !== draft.contentGeneration ||
        command.expectedPreparationGeneration !== draft.generation
      ) {
        deny(res, "DRAFT_CHANGED", "Table descriptions changed.");
        return;
      }
      for (const operation of command.operations) {
        const table = draft.tables.find(
          (item) =>
            item.id === operation.tableId &&
            item.memberId === operation.memberId
        );
        assert(table);
        if (operation.operation === "SET_TABLE")
          table.description = {
            displayName: null,
            recordUnit: null,
            missingConventionState: null,
            missingConventionDetails: null,
            ...table.description,
            ...operation.changes,
          };
        else {
          const column = table.columns.find(
            (item) => item.id === operation.columnId
          );
          assert(column);
          column.description = {
            meaningState: null,
            description: null,
            semanticType: null,
            unitState: null,
            unit: null,
            ...column.description,
            ...operation.changes,
          };
        }
      }
      draft.contentGeneration++;
      const value = DatasetTableDescriptionsMutationResponseSchema.parse({
        requestId: command.requestId,
        contentId: draft.contentId,
        generation: draft.contentGeneration,
        preparationGeneration: draft.generation,
        results: command.operations.map((operation, index) => ({
          index,
          operation: operation.operation,
          memberId: operation.memberId,
          tableId: operation.tableId,
          columnId:
            operation.operation === "SET_COLUMN" ? operation.columnId : null,
        })),
      });
      saveReceipt(res, key, body, value, "TABLES");
      return;
    }
    if (tail === "files/organization" && req.method === "GET") {
      const q = DatasetFilesOrganizationQuerySchema.parse(
        Object.fromEntries(url.searchParams)
      );
      if (
        q.expectedPreparationGeneration !== draft.generation ||
        q.contentId !== draft.contentId ||
        q.contentGeneration !== draft.contentGeneration ||
        draft.sourceGeneration !== draft.generation
      ) {
        deny(
          res,
          "DRAFT_CHANGED",
          "File organization changed. Refresh before continuing."
        );
        return;
      }
      const selected = q.memberId
        ? draft.members.find(
            (item) =>
              item.id === q.memberId &&
              (!q.component || item.component === q.component)
          )
        : null;
      if (q.memberId && !selected) {
        json(res, 404, {
          success: false,
          error: { code: "NOT_FOUND", message: "Selected file not found." },
        });
        return;
      }
      const target = (ref) => {
        const selected = draft.members.find((item) => item.id === ref.memberId);
        assert(selected);
        const inventory = draft.inventories.find(
          (item) =>
            item.uploadObjectId === selected.uploadObjectId &&
            item.entries.some((entry) => entry.id === ref.logicalEntryId)
        );
        const entry = inventory?.entries.find(
          (item) => item.id === ref.logicalEntryId
        );
        return {
          ...ref,
          displayName: selected.relativePath ?? selected.originalFileName,
          logicalEntry: entry
            ? {
                id: entry.id,
                inventoryId: inventory.id,
                locator: entry.locator,
              }
            : null,
        };
      };
      let all;
      if (q.section === "GROUPS")
        all = draft.groups.map((item) => ({ ...item, kind: "GROUP" }));
      else if (q.section === "MEMBERS")
        all = draft.members
          .filter((item) => !q.memberId || item.id === q.memberId)
          .map((item) => ({
            kind: "MEMBER",
            id: item.id,
            uploadObjectId: item.uploadObjectId,
            component: item.component,
            role: item.role,
            originalFileName: item.originalFileName,
            relativePath: item.relativePath,
            group: item.groupId
              ? {
                  id: item.groupId,
                  label: draft.groups.find((group) => group.id === item.groupId)
                    .label,
                }
              : null,
          }));
      else if (q.section === "RELATIONSHIPS")
        all = draft.links
          .filter(
            (item) =>
              !q.memberId ||
              item.source.memberId === q.memberId ||
              item.target.memberId === q.memberId
          )
          .map((item) => ({
            ...item,
            kind: "RELATIONSHIP",
            source: target(item.source),
            target: target(item.target),
          }));
      else if (q.section === "INVENTORIES")
        all = draft.inventories
          .filter(
            (item) =>
              item.uploadObjectId === selected.uploadObjectId && item.sealedAt
          )
          .map(({ entries: ignored, ...item }) => {
            void ignored;
            return { ...item, kind: "INVENTORY" };
          });
      else {
        const inventory = draft.inventories.find(
          (item) =>
            item.id === q.inventoryId &&
            item.uploadObjectId === selected.uploadObjectId &&
            item.sealedAt
        );
        if (!inventory) {
          json(res, 404, {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Exact sealed inventory not found.",
            },
          });
          return;
        }
        all = inventory.entries.map((item) => ({
          ...item,
          kind: "ENTRY",
          uploadObjectId: selected.uploadObjectId,
          inventoryId: inventory.id,
        }));
      }
      all = all
        .filter(
          (item) =>
            (!q.component ||
              !item.component ||
              item.component === q.component) &&
            (!q.afterId || item.id > q.afterId)
        )
        .sort((a, b) => a.id.localeCompare(b.id));
      const visible = all.slice(0, q.limit);
      ok(
        res,
        DatasetFilesOrganizationPageResponseSchema.parse({
          preparationId: draft.id,
          preparationGeneration: draft.generation,
          contentId: draft.contentId,
          contentGeneration: draft.contentGeneration,
          section: q.section,
          component: q.component ?? null,
          memberId: q.memberId ?? null,
          inventoryId: q.inventoryId ?? null,
          uploadObjectId: ["INVENTORIES", "ENTRIES"].includes(q.section)
            ? selected.uploadObjectId
            : null,
          items: visible,
          nextCursor:
            all.length > q.limit ? { ...q, afterId: visible.at(-1).id } : null,
        })
      );
      return;
    }
    const key = body?.requestId ? draft.id + ":" + body.requestId : null;
    if (key && receipts.has(key)) {
      const prior = receipts.get(key);
      assert.deepEqual(body, prior.body);
      if (flags.lose === prior.kind) {
        res.destroy();
        return;
      }
      ok(res, prior.value);
      return;
    }
    if (tail === "files-context" && req.method === "POST") {
      DatasetFilesContextBodySchema.parse(body);
      if (
        body.expectedPreparationGeneration !== draft.generation ||
        body.expectedContentId !== draft.contentId ||
        body.expectedContentGeneration !== draft.contentGeneration
      ) {
        deny(res, "DRAFT_CHANGED", "Draft changed.");
        return;
      }
      draft.contentGeneration++;
      draft.sourceGeneration = draft.generation;
      saveReceipt(
        res,
        key,
        body,
        { ...context(draft), requestId: body.requestId },
        "SYNCHRONIZE"
      );
      return;
    }
    if (tail === "files" && req.method === "PATCH") {
      DatasetFilesMutationBodySchema.parse(body);
      if (!sameContext(draft, body)) {
        deny(
          res,
          "DRAFT_CHANGED",
          "File selection changed. Refresh before changing files."
        );
        return;
      }
      const next = {
        members: structuredClone(draft.members),
        groups: structuredClone(draft.groups),
        links: structuredClone(draft.links),
      };
      let results;
      try {
        results = body.operations.map((operation, index) => {
          const missing = (code) => {
            throw Object.assign(new Error(code), { code });
          };
          let resultId;
          if (operation.operation === "ADD_MEMBER") {
            const item = scopedAttempts(draft).find(
              (value) =>
                value.uploadObjectId === operation.uploadObjectId &&
                value.state === "ACCEPTED"
            );
            assert(item);
            const added = member(draft, item, operation.component);
            added.role = operation.role;
            added.groupId = operation.groupId ?? null;
            added.relativePath = operation.relativePath ?? null;
            next.members.push(added);
            return { index, operation: operation.operation, id: added.id };
          }
          if (operation.operation === "REMOVE_MEMBER") {
            const indexOf = next.members.findIndex(
              (item) => item.id === operation.memberId
            );
            assert(indexOf >= 0);
            if (
              next.links.some(
                (item) =>
                  item.source.memberId === operation.memberId ||
                  item.target.memberId === operation.memberId
              )
            )
              missing("MEMBER_HAS_RELATIONSHIPS");
            next.members.splice(indexOf, 1);
            resultId = operation.memberId;
          } else if (operation.operation === "ADD_GROUP") {
            const group = {
              id: newId(),
              component: operation.component,
              label: operation.label,
            };
            next.groups.push(group);
            resultId = group.id;
          } else if (
            ["RENAME_GROUP", "REMOVE_GROUP"].includes(operation.operation)
          ) {
            const group = next.groups.find(
              (item) => item.id === operation.groupId
            );
            assert(group);
            if (operation.operation === "RENAME_GROUP")
              group.label = operation.label;
            else {
              if (next.members.some((item) => item.groupId === group.id))
                missing("GROUP_HAS_MEMBERS");
              next.groups = next.groups.filter((item) => item.id !== group.id);
            }
            resultId = group.id;
          } else if (
            ["SET_MEMBER_ROLE", "SET_MEMBER_GROUP"].includes(
              operation.operation
            )
          ) {
            const item = next.members.find(
              (item) => item.id === operation.memberId
            );
            assert(item);
            if (operation.operation === "SET_MEMBER_ROLE")
              item.role = operation.role;
            else {
              if (
                operation.groupId &&
                !next.groups.some(
                  (group) =>
                    group.id === operation.groupId &&
                    group.component === item.component
                )
              )
                missing("INVALID_MEMBER_GROUP");
              item.groupId = operation.groupId;
            }
            resultId = item.id;
          } else if (operation.operation === "ADD_LINK") {
            for (const ref of [operation.source, operation.target]) {
              const item = next.members.find(
                (item) => item.id === ref.memberId
              );
              assert(item);
              if (item.component !== operation.component)
                missing("INVALID_RELATIONSHIP_COMPONENT");
              if (
                ref.logicalEntryId &&
                !draft.inventories.some(
                  (inv) =>
                    inv.uploadObjectId === item.uploadObjectId &&
                    inv.sealedAt &&
                    inv.entries.some((entry) => entry.id === ref.logicalEntryId)
                )
              )
                missing("INVALID_LOGICAL_ENTRY");
            }
            const relation = {
              id: newId(),
              component: operation.component,
              relationship: operation.kind,
              required: operation.required,
              source: operation.source,
              target: operation.target,
            };
            next.links.push(relation);
            resultId = relation.id;
          } else {
            assert.equal(operation.operation, "REMOVE_LINK");
            assert(next.links.some((item) => item.id === operation.linkId));
            next.links = next.links.filter(
              (item) => item.id !== operation.linkId
            );
            resultId = operation.linkId;
          }
          return { index, operation: operation.operation, id: resultId };
        });
      } catch (error) {
        if (error.code) {
          deny(res, error.code, error.code);
          return;
        }
        throw error;
      }
      draft.members = next.members;
      draft.groups = next.groups;
      draft.links = next.links;
      draft.contentGeneration++;
      saveReceipt(
        res,
        key,
        body,
        DatasetMaterialMutationResponseSchema.parse({
          requestId: body.requestId,
          contentId: draft.contentId,
          generation: draft.contentGeneration,
          results,
        }),
        "MEMBERS"
      );
      return;
    }
    if (tail === "uploads" && req.method === "POST") {
      DatasetUploadAdmissionBodySchema.parse(body);
      if (flags.closed || !sameContext(draft, body)) {
        deny(res, "DRAFT_CHANGED", "Save and update files before uploading.");
        return;
      }
      const item = {
        id: newId(),
        rootId: draft.id,
        contentId: draft.contentId,
        component: body.component,
        role: body.role,
        inspectionProfile: body.inspectionProfile,
        originalName: body.originalName,
        expectedBytes: body.expectedBytes,
        retainedBytes: "0",
        reservedBytes: body.expectedBytes,
        partBytes,
        totalParts: Math.ceil(Number(body.expectedBytes) / partBytes),
        state: "RECEIVING",
        revision: 1,
        recoveryEpoch: 7,
        expiresAt: "2030-01-01T00:00:00.000Z",
        eligibility: "NOT_ACCEPTED",
        uploadObjectId: null,
        parts: [],
      };
      item.parts = Array.from({ length: item.totalParts }, (_, index) => ({
        partNumber: index + 1,
        expectedBytes: Math.min(
          partBytes,
          Number(body.expectedBytes) - index * partBytes
        ),
        measuredBytes: null,
        state: "PENDING",
        receivedAt: null,
        checksumSha256: null,
      }));
      attempts.set(item.id, item);
      saveReceipt(res, key, body, ack(item, body.requestId), "ADMIT");
      return;
    }
    const upload = tail.match(/^uploads\/([^/]+)(?:\/(.*))?$/),
      item = upload && attempts.get(upload[1]);
    assert(item && item.rootId === draft.id, "Owned upload fixture path");
    const action = upload[2] ?? "";
    if (!action && req.method === "GET") {
      ok(res, status(item));
      return;
    }
    if (action === "parts" && req.method === "GET") {
      if (
        Number(url.searchParams.get("expectedAttemptRevision")) !==
        item.revision
      ) {
        deny(res, "UPLOAD_CHANGED", "Upload changed.");
        return;
      }
      ok(
        res,
        DatasetUploadPartsPageResponseSchema.parse({
          preparationId: draft.id,
          attemptId: item.id,
          attemptRevision: item.revision,
          recoveryEpoch: item.recoveryEpoch,
          totalParts: item.totalParts,
          items: item.parts,
          nextCursor: null,
        })
      );
      return;
    }
    if (action.startsWith("parts/") && req.method === "PUT") {
      DatasetUploadPartQuerySchema.parse(Object.fromEntries(url.searchParams));
      assert.equal(req.headers["content-type"], "application/octet-stream");
      const part = item.parts[Number(action.split("/")[1]) - 1];
      assert(part);
      assert.equal(part.state, "PENDING");
      assert.equal(bytes.length, part.expectedBytes);
      if (flags.holdPart === part.partNumber) {
        held.add(item.id);
        await new Promise((resolveWait) => {
          res.once("close", resolveWait);
        });
        held.delete(item.id);
        return;
      }
      part.state = "RECEIVED";
      part.measuredBytes = bytes.length;
      part.receivedAt = "2026-10-16T00:00:00.000Z";
      part.checksumSha256 = createHash("sha256").update(bytes).digest("hex");
      item.retainedBytes = String(
        BigInt(item.retainedBytes) + BigInt(bytes.length)
      );
      item.reservedBytes = String(
        BigInt(item.reservedBytes) - BigInt(bytes.length)
      );
      item.revision++;
      ok(res, status(item));
      return;
    }
    if (action === "finalize") {
      DatasetUploadActionBodySchema.parse(body);
      if (!sameContext(draft, body)) {
        deny(res, "DRAFT_CHANGED", "Saved details changed.");
        return;
      }
      assert.equal(item.retainedBytes, item.expectedBytes);
      item.state = "CHECKING";
      item.revision++;
      saveReceipt(res, key, body, ack(item, body.requestId), "FINALIZE");
      return;
    }
    if (action === "cancel" || action === "remove") {
      DatasetUploadCancelBodySchema.parse(body);
      assert.equal(body.expectedAttemptRevision, item.revision);
      assert.equal(body.expectedRecoveryEpoch, item.recoveryEpoch);
      if (
        action === "remove" &&
        (draft.members.some(
          (member) => member.uploadObjectId === item.uploadObjectId
        ) ||
          draft.protectedObjects.has(item.uploadObjectId))
      ) {
        deny(
          res,
          "FILE_REFERENCED",
          "This file protects a selected draft or historical access and cannot be deleted."
        );
        return;
      }
      item.state = "CANCEL_REQUESTED";
      item.eligibility = "NOT_ACCEPTED";
      item.uploadObjectId = null;
      item.revision++;
      saveReceipt(
        res,
        key,
        body,
        ack(item, body.requestId),
        action === "remove" ? "REMOVE" : "CANCEL"
      );
      return;
    }
    throw new Error("Unexpected fixture action " + req.method + " " + tail);
  } catch (failure) {
    fixtureErrors.push(failure.stack);
    json(res, 500, {
      success: false,
      error: { code: "FIXTURE_ERROR", message: failure.message },
    });
  }
});
await new Promise((resolveListen) =>
  server.listen(0, "127.0.0.1", resolveListen)
);
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
const file = (name, buffer = Buffer.from("id,value\n1,a\n")) => ({
  name,
  mimeType: "application/octet-stream",
  buffer,
});
const namedButton = (page, name) =>
  page.getByRole("button", {
    name:
      {
        Basics: "1. Basics",
        "Files & contents": "2. Files & contents",
        "Review draft": "4. Review draft",
      }[name] ?? name,
    exact: true,
  });
async function filesStep(page) {
  await namedButton(page, "Files & contents").click();
  await page
    .getByRole("heading", { name: "Upload files", exact: true })
    .waitFor();
}
async function open(page, draft) {
  await page.goto(origin + "/dashboard/datasets/drafts/" + draft.id);
  await page.getByLabel("Dataset title", { exact: true }).waitFor();
  await filesStep(page);
}
async function choose(page, fixtureFile, format = "UTF8_CSV_SYNTAX_V1") {
  await page.getByLabel("File format", { exact: true }).selectOption(format);
  if (format === "UTF8_CSV_SYNTAX_V1" || format === "UTF8_TSV_SYNTAX_V1")
    await page
      .getByLabel("CSV / TSV first row", { exact: true })
      .selectOption("PRESENT");
  if (format === "UTF8_JSONL_SYNTAX_V1")
    await page
      .getByLabel("JSON Lines records", { exact: true })
      .selectOption("OBJECT");
  if (format === "ZIP32_CONTAINER_V1") {
    await page
      .getByRole("checkbox", { name: "CSV · UTF-8 text", exact: true })
      .check();
    await page
      .getByLabel("CSV / TSV first row", { exact: true })
      .selectOption("PRESENT");
  }
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(fixtureFile);
}
const uploadRow = (page, item) =>
  page.locator(`[data-upload-attempt="${item.id}"]`);
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 1000 },
  });
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });

  // Every creation choice reaches receipt/check/selection through the real UI.
  for (const capability of capabilities)
    for (const choice of choices) {
      const draft = seed(choice);
      await open(page, draft);
      const components =
        choice === "FULL_AND_SAMPLE"
          ? ["FULL", "SAMPLE"]
          : [choice === "FULL_ONLY" ? "FULL" : "SAMPLE"];
      for (const component of components) {
        if (components.length > 1)
          await page
            .getByLabel("Upload to", { exact: true })
            .selectOption(component);
        await choose(
          page,
          file(component.toLowerCase() + capability.extensions[0]),
          capability.profileId
        );
        await namedButton(page, "Upload file").click();
        await page
          .getByText(
            "All file bytes were received. Choose Finish upload to start backend checks.",
            { exact: true }
          )
          .waitFor();
        const item = scopedAttempts(draft).at(-1),
          row = uploadRow(page, item);
        assert.equal(item.component, component);
        assert.equal(item.retainedBytes, item.expectedBytes);
        assert.equal(
          await row.getByRole("button", { name: /Use/ }).count(),
          0,
          "Receipt alone cannot select a file"
        );
        await row
          .getByRole("button", { name: "Finish upload", exact: true })
          .click();
        await row.getByText(/Backend checks in progress/).waitFor();
        accept(item);
        await namedButton(page, "Refresh upload status").click();
        const before = draft.members.length;
        await row
          .getByRole("button", {
            name:
              component === "FULL" ? "Use in full dataset" : "Use as sample",
            exact: true,
          })
          .click();
        await row
          .getByText("Selected in this draft", { exact: true })
          .waitFor();
        assert.equal(draft.members.length, before + 1);
        assert.equal(draft.members.at(-1).uploadObjectId, item.uploadObjectId);
      }
      assert.deepEqual(
        draft.members.map((member) => member.component),
        components
      );
      await namedButton(page, "Review draft").click();
      assert(
        await namedButton(page, "Submit proposal for admin review").isDisabled()
      );
    }
  console.log(
    "PASS six advertised formats across all three choices (24 component uploads): native browser transfer, separate finalize/check/selection and no implicit Submit; synthetic inspection only"
  );

  // A committed admission with a lost response survives a real page reload.
  const lost = seed("FULL_ONLY");
  await open(page, lost);
  await choose(page, file("lost.csv"));
  flags.lose = "ADMIT";
  await namedButton(page, "Upload file").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /could not complete/ })
    .waitFor();
  flags.lose = null;
  await namedButton(page, "Retry upload request").waitFor();
  const original = requests
    .filter(
      (item) =>
        item.method === "POST" && item.path.endsWith(lost.id + "/uploads")
    )
    .at(-1).body;
  assert.equal(scopedAttempts(lost).length, 1);
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await filesStep(page);
  flags.fileDeny = true;
  await namedButton(page, "Retry upload request").click();
  await page
    .getByText("Synthetic upload authority unavailable", { exact: true })
    .waitFor();
  assert(await namedButton(page, "Retry upload request").isVisible());
  flags.fileDeny = false;
  await namedButton(page, "Retry upload request").click();
  await namedButton(page, "Retry upload request").waitFor({ state: "hidden" });
  await page.waitForFunction(
    (draftId) =>
      sessionStorage.getItem(`kuinbee:dataset-file-request:v1:${draftId}`) ===
      null,
    lost.id
  );
  const retries = requests.filter(
    (item) => item.method === "POST" && item.path.endsWith(lost.id + "/uploads")
  );
  assert(retries.length >= 2);
  assert(
    retries.every(
      (request) => JSON.stringify(request.body) === JSON.stringify(original)
    )
  );
  assert.equal(scopedAttempts(lost).length, 1);
  assert.equal(
    await page.evaluate(
      () =>
        Object.keys(sessionStorage).filter((key) =>
          key.startsWith("kuinbee:dataset-file-request:")
        ).length
    ),
    0
  );
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(file("lost.csv"));
  await namedButton(page, "Resume upload").click();
  await namedButton(page, "Finish upload").waitFor();
  console.log(
    "PASS lost admission ACK survives reload and a pre-receipt 403 with the exact UUID, body and reservation"
  );

  // Ordinary Save during an active upload does not unmount/lock the uploader.
  const paused = seed("FULL_ONLY");
  await open(page, paused);
  const large = Buffer.concat([
    Buffer.alloc(partBytes, 65),
    Buffer.from("tail\n"),
  ]);
  flags.holdPart = 2;
  await choose(page, file("resume.csv", large));
  await namedButton(page, "Upload file").click();
  for (let polls = 0; !held.size; polls++) {
    assert(polls < 100, "Second upload part reached the fixture hold");
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  await namedButton(page, "Basics").click();
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Saved while receiving");
  assert(await namedButton(page, "Save draft").isEnabled());
  const savedResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      new URL(response.url()).pathname.endsWith(paused.id)
  );
  await namedButton(page, "Save draft").click();
  await savedResponse;
  assert.equal(draftFor(paused.id).metadata.title, "Saved while receiving");
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Saved with an uncertain reply");
  flags.lose = "SAVE";
  await namedButton(page, "Save draft").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /could not complete/ })
    .waitFor();
  assert(await namedButton(page, "Pause active upload").isEnabled());
  await namedButton(page, "Pause active upload").click();
  flags.lose = null;
  await namedButton(page, "Retry save").click();
  await namedButton(page, "Save draft").waitFor();
  assert.equal(
    draftFor(paused.id).metadata.title,
    "Saved with an uncertain reply"
  );
  await filesStep(page);
  await page.getByText(/Transfer paused\. Refresh/).waitFor();
  flags.holdPart = null;
  await namedButton(page, "Update files").click();
  await namedButton(page, "Refresh upload status").click();
  const partial = scopedAttempts(paused)[0];
  assert.equal(partial.retainedBytes, String(partBytes));
  assert.equal(
    await uploadRow(page, partial)
      .getByRole("progressbar")
      .getAttribute("aria-valuenow"),
    "99",
    "Partial receipt cannot round up to 100 percent"
  );
  const beforeMismatch = requests.filter(
    (item) => item.method === "PUT"
  ).length;
  const different = Buffer.from(large);
  different[0] ^= 1;
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(file("resume.csv", different));
  await namedButton(page, "Resume upload").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /differ|match/i })
    .waitFor();
  assert.equal(
    requests.filter((item) => item.method === "PUT").length,
    beforeMismatch,
    "Wrong reselected bytes cannot send a missing part"
  );
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(file("resume.csv", large));
  await namedButton(page, "Resume upload").click();
  await namedButton(page, "Finish upload").waitFor();
  assert.equal(partial.retainedBytes, String(large.length));
  console.log(
    "PASS Save across steps during transfer, pause, received-byte mismatch refusal and correct-file resume"
  );

  // Current-ID operations never replace a paginated inventory or release bytes.
  await namedButton(page, "Finish upload").click();
  await uploadRow(page, partial)
    .getByText(/Backend checks in progress/)
    .waitFor();
  accept(partial);
  await namedButton(page, "Refresh upload status").click();
  flags.lose = "MEMBERS";
  await namedButton(page, "Use in full dataset").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /could not complete/ })
    .waitFor();
  flags.lose = null;
  await namedButton(page, "Retry upload request").waitFor();
  assert.equal(paused.members.length, 1);
  await namedButton(page, "Retry upload request").click();
  await uploadRow(page, partial)
    .getByText("Selected in this draft", { exact: true })
    .waitFor();
  assert.equal(paused.members.length, 1);
  const unseen = member(paused, { ...partial, uploadObjectId: newId() });
  unseen.id = id(999_999);
  const fillers = Array.from({ length: 23 }, () =>
    member(paused, { ...partial, uploadObjectId: newId() })
  );
  paused.members.push(...fillers, unseen);
  await namedButton(page, "Refresh files").click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[aria-label="Stored file references"] li')
        .length === 20
  );
  const selectedId = paused.members[0].id,
    beforeCharge = account(paused, "5000000000").chargedBytes;
  const removedResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      new URL(response.url()).pathname.endsWith(paused.id + "/files")
  );
  await page
    .getByRole("button", { name: "Remove from full dataset", exact: true })
    .first()
    .click();
  await removedResponse;
  assert(!paused.members.some((item) => item.id === selectedId));
  assert(paused.members.some((item) => item.id === unseen.id));
  assert.equal(account(paused, "5000000000").chargedBytes, beforeCharge);
  const mutation = requests
    .filter(
      (item) =>
        item.method === "PATCH" && item.path.endsWith(paused.id + "/files")
    )
    .at(-1).body;
  assert.deepEqual(mutation.operations, [
    { operation: "REMOVE_MEMBER", memberId: selectedId },
  ]);
  console.log(
    "PASS lost selection ACK deduplicates and exact-member removal preserves unseen files and charges"
  );

  await page.waitForFunction(() => {
    const buttons = [...document.querySelectorAll("button")];
    return (
      buttons.some(
        (button) => button.textContent === "Save draft" && !button.disabled
      ) &&
      buttons.some(
        (button) =>
          button.textContent === "Remove from full dataset" && !button.disabled
      )
    );
  });
  const inventoryCount = paused.members.length,
    seenGeneration = paused.contentGeneration;
  paused.contentGeneration++;
  await page
    .getByRole("button", { name: "Remove from full dataset", exact: true })
    .first()
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: /File selection changed/ })
    .waitFor();
  assert.equal(paused.members.length, inventoryCount);
  const staleMutation = requests
    .filter(
      (request) =>
        request.method === "PATCH" &&
        request.path.endsWith(paused.id + "/files")
    )
    .at(-1).body;
  assert.equal(staleMutation.expectedGeneration, seenGeneration);
  assert.equal(
    await page
      .getByLabel("File to upload or resume", { exact: true })
      .evaluate((input) => input.files[0].name),
    "resume.csv"
  );
  console.log(
    "PASS stale file edits retain their rendered generation and preserve all files/local selection"
  );

  // A protected historical file is refused by the service, despite the button.
  paused.members = [];
  paused.protectedObjects.add(partial.uploadObjectId);
  await namedButton(page, "Refresh files").click();
  page.once("dialog", (dialog) => dialog.accept());
  await namedButton(page, "Delete stored file").click();
  await page
    .getByRole("alert")
    .filter({ hasText: /historical access/ })
    .waitFor();
  assert.equal(partial.state, "ACCEPTED");
  assert.equal(account(paused, "5000000000").chargedBytes, beforeCharge);
  console.log(
    "PASS historical protection is backend-authoritative and cannot release occupied quota"
  );

  const storageDraft = seed("FULL_ONLY"),
    storagePage = await browser.newPage();
  storagePage.on("pageerror", (failure) => browserErrors.push(failure.message));
  await storagePage.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await storagePage.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith("kuinbee:dataset-file-request:"))
        throw new DOMException("Session storage unavailable", "SecurityError");
      return get.call(this, key);
    };
  });
  await open(storagePage, storageDraft);
  await storagePage
    .getByRole("alert")
    .filter({ hasText: /could not recover its saved file request/ })
    .waitFor();
  assert(await namedButton(storagePage, "Upload file").isDisabled());
  assert(await namedButton(storagePage, "Save draft").isEnabled());
  assert(
    !requests.some(
      (request) =>
        request.path.includes(storageDraft.id) && request.method !== "GET"
    )
  );
  await storagePage.close();
  console.log(
    "PASS unavailable browser request storage pauses file writes while keeping metadata Save usable"
  );

  // Cancellation is available without pretending storage was already freed.
  await open(page, lost);
  const cancelled = scopedAttempts(lost)[0],
    charged = account(lost, "5000000000").chargedBytes;
  await namedButton(page, "Cancel upload").click();
  await page.getByText(/Cleanup requested · storage still counts/).waitFor();
  assert.equal(account(lost, "5000000000").chargedBytes, charged);
  cancelled.state = "CLOSED";
  cancelled.retainedBytes = "0";
  cancelled.reservedBytes = "0";
  cancelled.revision++;
  await namedButton(page, "Refresh upload status").click();
  await page.getByText(/Upload closed/).waitFor();
  await namedButton(page, "Refresh files").click();
  await page.getByText("0 bytes charged of 5 GB", { exact: true }).waitFor();
  console.log(
    "PASS cancellation retains charges until confirmed backend cleanup"
  );

  // ZIP UX uses compact intent without asking the supplier for internal paths.
  const zip = seed("FULL_AND_SAMPLE");
  await open(page, zip);
  await page
    .getByLabel("File format", { exact: true })
    .selectOption("ZIP32_CONTAINER_V1");
  await page
    .getByRole("checkbox", { name: "CSV · UTF-8 text", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "WAV · integer PCM audio", exact: true })
    .check();
  await page
    .getByLabel("CSV / TSV first row", { exact: true })
    .selectOption("PRESENT");
  await page
    .getByLabel("File to upload or resume", { exact: true })
    .setInputFiles(
      file("collection.zip", Buffer.from("synthetic-ui-transport-only"))
    );
  await namedButton(page, "Upload file").click();
  await namedButton(page, "Finish upload").waitFor();
  const zipItem = scopedAttempts(zip)[0];
  assert.deepEqual(zipItem.inspectionProfile, {
    profileId: "ZIP32_CONTAINER_V1",
    leafProfiles: [],
    entryDefaults: [
      {
        extension: ".csv",
        profile: { profileId: "UTF8_CSV_SYNTAX_V1", header: "PRESENT" },
      },
      { extension: ".wav", profile: { profileId: "RIFF_INTEGER_PCM_WAVE_V1" } },
    ],
  });
  await namedButton(page, "Finish upload").click();
  await uploadRow(page, zipItem)
    .getByText(/Backend checks in progress/)
    .waitFor();
  flags.failChecks = true;
  accept(zipItem);
  flags.failChecks = false;
  await namedButton(page, "Refresh upload status").click();
  await page.getByText(/checks did not accept/).waitFor();
  assert.equal(await namedButton(page, "Use in full dataset").count(), 0);
  console.log(
    "PASS compact ZIP type declarations and failed-check selection denial"
  );

  // Exercise organization on actual UI-uploaded files for every creation choice.
  const organized = [];
  const org = page.getByRole("region", {
    name: "Organize selected files",
    exact: true,
  });
  const selectOrg = (label, value) =>
    org.getByLabel(label, { exact: true }).selectOption(value);
  async function selectedFile(value) {
    await selectOrg("File to organize", value);
    await org.getByLabel("Selected file purpose", { exact: true }).waitFor();
  }
  for (const choice of choices) {
    const draft = [...drafts.values()].find(
      (d) => d.metadata.uploadChoice === choice && d.members.length
    );
    organized.push(draft);
    await open(page, draft);
    for (const area of choice === "FULL_AND_SAMPLE"
      ? ["FULL", "SAMPLE"]
      : [choice === "SAMPLE_ONLY" ? "SAMPLE" : "FULL"]) {
      if (choice === "FULL_AND_SAMPLE")
        await page.getByLabel("Upload to", { exact: true }).selectOption(area);
      await page
        .getByLabel("File purpose", { exact: true })
        .selectOption("TRANSCRIPT");
      await choose(page, file(`transcript-${area}.csv`));
      await namedButton(page, "Upload file").click();
      await page
        .getByText(
          "All file bytes were received. Choose Finish upload to start backend checks.",
          { exact: true }
        )
        .waitFor();
      const item = scopedAttempts(draft).at(-1),
        row = uploadRow(page, item);
      await row
        .getByRole("button", { name: "Finish upload", exact: true })
        .click();
      await row.getByText(/Backend checks in progress/).waitFor();
      accept(item);
      await namedButton(page, "Refresh upload status").click();
      await row
        .getByRole("button", {
          name: area === "FULL" ? "Use in full dataset" : "Use as sample",
          exact: true,
        })
        .click();
      await row.getByText("Selected in this draft", { exact: true }).waitFor();
      const primary = draft.members.find(
        (m) => m.component === area && m.role === "PRIMARY"
      );
      const companion = draft.members.find(
        (m) => m.component === area && m.uploadObjectId === item.uploadObjectId
      );
      const before = structuredClone(draft.members),
        charge = account(draft, "5000000000").chargedBytes;
      if (await namedButton(org, "Use refreshed file view").count())
        await namedButton(org, "Use refreshed file view").click();
      await selectOrg("Organize area", area);
      await org
        .getByLabel("New group name", { exact: true })
        .fill(`Session ${area}`);
      await namedButton(org, "Add group").click();
      await org.getByLabel("Group name", { exact: true }).waitFor();
      const group = draft.groups.at(-1);
      await org
        .getByLabel("Group name", { exact: true })
        .fill(`Reviewed session ${area}`);
      await namedButton(org, "Rename group").click();
      await org
        .getByLabel("Existing group", { exact: true })
        .locator("option:checked")
        .filter({ hasText: `Reviewed session ${area}` })
        .waitFor({ state: "attached" });
      await selectedFile(companion.id);
      await selectOrg("Selected file group", group.id);
      await namedButton(org, "Save file details").click();
      await org.getByLabel("Selected file group", { exact: true }).waitFor();
      assert.equal(
        draft.members.find((m) => m.id === companion.id).groupId,
        group.id
      );
      await selectOrg("Relationship purpose", "TRANSCRIPT_FOR");
      await selectOrg("Related material", primary.id);
      await namedButton(org, "Add relationship").click();
      await org
        .getByRole("list", { name: "Selected file relationships" })
        .getByText(/Transcript for/)
        .waitFor();
      assert.equal(draft.links.at(-1).source.memberId, companion.id);
      assert.equal(draft.links.at(-1).target.memberId, primary.id);
      assert.equal(draft.links.at(-1).component, area);
      assert.equal(draft.links.at(-1).required, true);
      const targets = await org
        .getByLabel("Related material", { exact: true })
        .locator("option")
        .evaluateAll((nodes) => nodes.map((n) => n.value).filter(Boolean));
      assert(
        targets.every(
          (value) =>
            draft.members.find((m) => m.id === value).component === area
        )
      );
      await org
        .getByLabel("Selected file purpose", { exact: true })
        .selectOption("ANNOTATION");
      await namedButton(org, "Save file details").click();
      await org.getByLabel("Selected file purpose", { exact: true }).waitFor();
      assert.equal(
        draft.members.find((m) => m.id === companion.id).role,
        "ANNOTATION"
      );
      assert.equal(
        draft.links.length,
        1,
        "Changing purpose never silently deletes the previous relationship"
      );
      await namedButton(org, "Remove relationship").click();
      await org
        .getByText("No relationships for this file.", { exact: true })
        .waitFor();
      await selectOrg("Selected file group", "");
      await namedButton(org, "Save file details").click();
      await org.getByLabel("Selected file group", { exact: true }).waitFor();
      await namedButton(org, "Remove group").click();
      await org
        .getByLabel("Group name", { exact: true })
        .waitFor({ state: "hidden" });
      assert.equal(draft.groups.length, 0);
      assert.equal(draft.links.length, 0);
      assert.equal(account(draft, "5000000000").chargedBytes, charge);
      assert.deepEqual(
        draft.members.filter((m) => m.id !== companion.id),
        before.filter((m) => m.id !== companion.id),
        "Unseen/other-component files are unchanged"
      );
    }
  }
  console.log(
    "PASS organization across all three choices and both areas: UI-uploaded companions, rename/assign/clear/remove groups, exact relationships and purpose correction; no unseen deletion or capacity release"
  );

  const organizationDraft = organized.at(-1);
  await open(page, organizationDraft);
  // A real exit guard keeps unapplied input, including after metadata Save.
  await org
    .getByLabel("New group name", { exact: true })
    .fill("Unapplied group");
  const discardDialog = page.waitForEvent("dialog").then(async (dialog) => {
    assert.match(dialog.message(), /file organization input/);
    await dialog.dismiss();
  });
  await namedButton(page, "Save and exit").click();
  await discardDialog;
  assert.equal(await page.evaluate(() => window.fixtureExits ?? 0), 0);
  assert.equal(
    await org.getByLabel("New group name", { exact: true }).inputValue(),
    "Unapplied group"
  );
  // Metadata Save is independent. Reconcile its acknowledged file context
  // explicitly before testing another, external content generation change.
  await page
    .getByRole("status")
    .filter({
      hasText:
        /^(Saved details changed\. Update files to use your saved choices\.|Files use your saved upload choice\.)$/,
    })
    .waitFor();
  if (await namedButton(page, "Update files").count()) {
    await namedButton(page, "Update files").click();
    await namedButton(page, "Update files").waitFor({ state: "hidden" });
  }
  // External mutation forces an explicit refresh without replacing typed inputs.
  organizationDraft.contentGeneration++;
  await namedButton(page, "Refresh files").click();
  await namedButton(org, "Use refreshed file view").waitFor();
  assert(await namedButton(org, "Add group").isDisabled());
  await namedButton(org, "Use refreshed file view").click();
  assert.equal(
    await org.getByLabel("New group name", { exact: true }).inputValue(),
    "Unapplied group"
  );
  await namedButton(org, "Add group").click();
  await org.getByLabel("Group name", { exact: true }).waitFor();
  assert.equal(organizationDraft.groups.at(-1).label, "Unapplied group");
  console.log(
    "PASS unapplied organization input survives Save and exit cancellation and generation refresh; stale form cannot mutate until explicitly refreshed"
  );

  // Lost group ACK uses the same durable file command through a full reload.
  await org
    .getByLabel("New group name", { exact: true })
    .fill("Recover one exact group");
  flags.lose = "MEMBERS";
  await namedButton(org, "Add group").click();
  await namedButton(page, "Retry upload request").waitFor();
  const lostGroupCommand = requests
    .filter(
      (r) =>
        r.method === "PATCH" && r.path.endsWith(organizationDraft.id + "/files")
    )
    .at(-1).body;
  assert.equal(
    organizationDraft.groups.filter(
      (g) => g.label === "Recover one exact group"
    ).length,
    1
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await filesStep(page);
  flags.lose = null;
  await namedButton(page, "Retry upload request").click();
  await namedButton(page, "Retry upload request").waitFor({ state: "hidden" });
  const groupRetries = requests.filter(
    (r) => r.body?.requestId === lostGroupCommand.requestId
  );
  assert(groupRetries.length >= 2);
  for (const r of groupRetries) assert.deepEqual(r.body, lostGroupCommand);
  assert.equal(
    organizationDraft.groups.filter(
      (g) => g.label === "Recover one exact group"
    ).length,
    1
  );
  console.log(
    "PASS lost organization ACK recovers one exact group through reload and immutable retry without duplicate creation"
  );

  // Physical and logical inventories paginate separately; choosing a file does
  // not imply a latest sealed inventory or a separate downloadable entitlement.
  const selectedArea = organizationDraft.members.find(
    (m) => m.role === "PRIMARY"
  ).component;
  await selectOrg("Organize area", selectedArea);
  const archiveMember = organizationDraft.members.find(
    (m) => m.component === selectedArea && m.role === "PRIMARY"
  );
  for (let index = 0; index < 23; index++)
    organizationDraft.groups.push({
      id: newId(),
      component: selectedArea,
      label: `Paged group ${index}`,
    });
  const moreMembers = Array.from({ length: 23 }, (_, index) => ({
    ...structuredClone(archiveMember),
    id: newId(),
    uploadObjectId: newId(),
    originalFileName: `paged-${index}.csv`,
    groupId: null,
  }));
  organizationDraft.members.push(...moreMembers);
  const makeInventory = (prefix, digest) => ({
    id: newId(),
    uploadObjectId: archiveMember.uploadObjectId,
    structuralDigest: digest.repeat(64),
    sealedAt: "2026-10-16T01:00:00.000Z",
    entries: Array.from({ length: 24 }, (_, index) => ({
      id: newId(),
      locator: { kind: "ARCHIVE_ENTRY", path: `${prefix}/item-${index}.csv` },
    })),
  });
  const firstInventory = makeInventory("first", "a"),
    secondInventory = makeInventory("second", "b");
  organizationDraft.inventories.push(firstInventory, secondInventory);
  organizationDraft.contentGeneration++;
  await namedButton(page, "Refresh files").click();
  if (await namedButton(org, "Use refreshed file view").count())
    await namedButton(org, "Use refreshed file view").click();
  await namedButton(org, "Next source files page").click();
  const lastMember = moreMembers.at(-1);
  await selectedFile(lastMember.id);
  await namedButton(org, "Previous source files page").click();
  assert.equal(
    await org.getByLabel("File to organize", { exact: true }).inputValue(),
    lastMember.id
  );
  await namedButton(org, "Next groups page").click();
  const lastGroup = organizationDraft.groups.at(-1);
  await selectOrg("Selected file group", lastGroup.id);
  await namedButton(org, "Previous groups page").click();
  assert.equal(
    await org.getByLabel("Selected file group", { exact: true }).inputValue(),
    lastGroup.id
  );
  await namedButton(org, "Save file details").click();
  await org.getByLabel("Selected file group", { exact: true }).waitFor();
  assert.equal(
    organizationDraft.members.find((m) => m.id === lastMember.id).groupId,
    lastGroup.id
  );
  await selectedFile(archiveMember.id);
  await selectOrg("Related material", archiveMember.id);
  await selectOrg("Relationship purpose", "ANNOTATION_FOR");
  await org
    .getByRole("checkbox", {
      name: "Select an item inside the source file",
      exact: true,
    })
    .check();
  await org
    .getByRole("checkbox", {
      name: "Select an item inside the related file",
      exact: true,
    })
    .check();
  assert(await namedButton(org, "Add relationship").isDisabled());
  assert.equal(
    await org
      .getByLabel("Source container inventory", { exact: true })
      .inputValue(),
    ""
  );
  await selectOrg("Source container inventory", firstInventory.id);
  await namedButton(org, "Next source entries page").click();
  const sourceEntry = firstInventory.entries.at(-1);
  await selectOrg("Source container item", sourceEntry.id);
  await namedButton(org, "Previous source entries page").click();
  assert.equal(
    await org.getByLabel("Source container item", { exact: true }).inputValue(),
    sourceEntry.id
  );
  await selectOrg("Related container inventory", secondInventory.id);
  const targetEntry = secondInventory.entries[0];
  await selectOrg("Related container item", targetEntry.id);
  await namedButton(page, "Review draft").click();
  await filesStep(page);
  assert.equal(
    await org.getByLabel("Source container item", { exact: true }).inputValue(),
    sourceEntry.id
  );
  assert.equal(
    await org
      .getByLabel("Related container item", { exact: true })
      .inputValue(),
    targetEntry.id
  );
  assert(
    await org
      .getByRole("checkbox", {
        name: "Select an item inside the source file",
        exact: true,
      })
      .isChecked()
  );
  assert(
    await org
      .getByRole("checkbox", {
        name: "Select an item inside the related file",
        exact: true,
      })
      .isChecked()
  );
  await namedButton(org, "Add relationship").click();
  await org
    .getByRole("list", { name: "Selected file relationships" })
    .getByText(/first\/item-23.csv.*second\/item-0.csv/)
    .waitFor();
  assert.equal(
    organizationDraft.links.at(-1).source.logicalEntryId,
    sourceEntry.id
  );
  assert.equal(
    organizationDraft.links.at(-1).target.logicalEntryId,
    targetEntry.id
  );
  assert.equal(
    organizationDraft.links.at(-1).source.memberId,
    organizationDraft.links.at(-1).target.memberId
  );
  console.log(
    "PASS paginated source and group selection keeps exact IDs off-page; explicit two-inventory entry selection retains original logical references in one physical container"
  );

  const literalName =
    '<img src=x onerror="window.organizationInjected=true">' +
    " very long session".repeat(8);
  await org.getByLabel("New group name", { exact: true }).fill(literalName);
  await namedButton(org, "Add group").click();
  await org.getByLabel("Group name", { exact: true }).waitFor();
  assert.equal(organizationDraft.groups.at(-1).label, literalName);
  assert.equal(
    await page.evaluate(() => window.organizationInjected ?? false),
    false
  );
  assert.equal(await org.locator("img").count(), 0);
  console.log(
    "PASS long and markup-like group labels remain literal text without injected content"
  );

  for (const [choice, component] of [
    ["SAMPLE_ONLY", "SAMPLE"],
    ["FULL_ONLY", "FULL"],
    ["FULL_AND_SAMPLE", "FULL"],
    ["FULL_AND_SAMPLE", "SAMPLE"],
  ]) {
    const draft = seed(choice),
      specimen = tableFixture(draft, component);
    await open(page, draft);
    const allowedAreas =
      choice === "SAMPLE_ONLY"
        ? ["SAMPLE"]
        : choice === "FULL_ONLY"
          ? ["FULL"]
          : ["FULL", "SAMPLE"];
    assert(
      allowedAreas.includes(
        await page.getByLabel("Organize area", { exact: true }).inputValue()
      ),
      "Asynchronously loaded choices must initialize a valid unused organization area"
    );
    const region = page.getByRole("region", {
      name: "Tables and columns",
      exact: true,
    });
    await region
      .getByLabel("File to describe", { exact: true })
      .selectOption(specimen.member.id);
    await region
      .getByLabel("Inspected table", { exact: true })
      .selectOption(specimen.table.id);
    await region
      .getByLabel("What does one record represent?", { exact: true })
      .fill("One sensor observation");
    await region
      .getByLabel("Missing-value conventions", { exact: true })
      .selectOption("UNKNOWN");
    await region
      .getByLabel("Column meaning", { exact: true })
      .selectOption("KNOWN");
    await region
      .getByLabel("What does this column mean?", { exact: true })
      .fill("Elapsed time from recording start");
    await region
      .getByLabel("Declared column type", { exact: true })
      .selectOption("DECIMAL");
    await region
      .getByLabel("Column units", { exact: true })
      .selectOption("KNOWN");
    await region
      .getByLabel("Unit of measurement", { exact: true })
      .fill("milliseconds");
    await region
      .getByLabel("Column to describe", { exact: true })
      .selectOption(specimen.table.columns[1].id);
    await region
      .getByLabel("Column meaning", { exact: true })
      .selectOption("KNOWN");
    await region
      .getByLabel("What does this column mean?", { exact: true })
      .fill("One distinct meaning despite a duplicate header");
    await region
      .getByLabel("Column to describe", { exact: true })
      .selectOption(specimen.table.columns[0].id);
    assert.equal(
      await region
        .getByLabel("What does this column mean?", { exact: true })
        .inputValue(),
      "Elapsed time from recording start"
    );
    assert(
      await region
        .getByRole("button", { name: "Next columns page", exact: true })
        .isDisabled()
    );
    await namedButton(region, "Save table descriptions").click();
    await region
      .getByText(
        "Unsaved table answers · you can describe other columns on this page. Save before changing the file, table or page.",
        { exact: true }
      )
      .waitFor({ state: "hidden" });
    assert.equal(
      specimen.table.description.recordUnit,
      "One sensor observation"
    );
    assert.equal(specimen.table.columns[0].description.unit, "milliseconds");
    assert.equal(
      specimen.table.columns[1].description.description,
      "One distinct meaning despite a duplicate header"
    );
    assert.equal(specimen.table.columns[2].description, null);
    const pageWrites = requests.filter(
      (item) =>
        item.method === "PATCH" &&
        item.path.endsWith(draft.id + "/files/tables")
    );
    assert.equal(pageWrites.length, 1);
    assert.equal(pageWrites[0].body.operations.length, 3);
    assert.equal(draft.contentGeneration, 1);
    console.log(
      `PASS table and column answers use exact ${choice}/${component} membership with partial saves`
    );
  }
  const tableDraft = seed("FULL_ONLY"),
    specimen = tableFixture(tableDraft, "FULL");
  await open(page, tableDraft);
  let tableRegion = page.getByRole("region", {
    name: "Tables and columns",
    exact: true,
  });
  await tableRegion
    .getByLabel("File to describe", { exact: true })
    .selectOption(specimen.member.id);
  await tableRegion
    .getByLabel("Inspected table", { exact: true })
    .selectOption(specimen.table.id);
  await namedButton(tableRegion, "Next columns page").click();
  await tableRegion.getByText(/Observed column 21:/).waitFor();
  await namedButton(tableRegion, "Use unknown on this page").click();
  await page.waitForFunction(() =>
    document
      .querySelector(
        '[aria-label="Tables and columns"] select[aria-label="Column to describe"] option'
      )
      ?.textContent.includes("Column 1:")
  );
  assert(
    specimen.table.columns
      .slice(0, 20)
      .every((item) => item.description === null)
  );
  assert(
    specimen.table.columns
      .slice(20)
      .every((item) => item.description.meaningState === "UNKNOWN")
  );
  console.log(
    "PASS explicit unknown shortcut touches only unanswered fields on the current columns page"
  );
  await namedButton(tableRegion, "Next columns page").click();
  await tableRegion.getByText(/Observed column 21:/).waitFor();
  assert.equal(await tableRegion.locator("img").count(), 0);
  assert.equal(await page.evaluate(() => window.tableInjected ?? false), false);
  await tableRegion
    .getByLabel("Column meaning", { exact: true })
    .selectOption("KNOWN");
  await tableRegion
    .getByLabel("What does this column mean?", { exact: true })
    .fill("Unsaved column interpretation");
  assert(await namedButton(tableRegion, "Previous columns page").isDisabled());
  tableDraft.contentGeneration++;
  await namedButton(page, "Refresh files").click();
  await tableRegion
    .getByText(/Saved files changed. Your unsaved table answers are retained/)
    .waitFor();
  assert.equal(
    await tableRegion
      .getByLabel("What does this column mean?", { exact: true })
      .inputValue(),
    "Unsaved column interpretation"
  );
  assert(
    await namedButton(tableRegion, "Save table descriptions").isDisabled()
  );
  await namedButton(tableRegion, "Reset unsaved table answers").click();
  console.log(
    "PASS stale generations preserve local interpretation and block rebasing; markup-like observed headers remain text"
  );

  for (const purpose of [
    "PRIMARY",
    "SENSOR",
    "TRANSCRIPT",
    "ANNOTATION",
    "CALIBRATION",
    "DOCUMENTATION",
    "COMPANION",
  ]) {
    const purposeDraft = seed("FULL_ONLY"),
      entry = tableFixture(purposeDraft, "FULL", 1);
    entry.table.applicability = {
      purpose,
      origin: "SUPPLIER_DECLARED",
      ...(purpose === "COMPANION"
        ? { companionPurposes: ["ANNOTATION", "TRANSCRIPT"] }
        : {}),
      basis:
        purpose === "COMPANION"
          ? "EXACT_ENTRY_RELATIONSHIP"
          : "SELECTED_FILE_PURPOSE",
      definitionsRequired: ["PRIMARY", "SENSOR"].includes(purpose),
    };
    await open(page, purposeDraft);
    const definitions = page.getByRole("region", {
      name: "Tables and columns",
      exact: true,
    });
    await definitions
      .getByLabel("File to describe", { exact: true })
      .selectOption(entry.member.id);
    await definitions
      .getByLabel("Inspected table", { exact: true })
      .selectOption(entry.table.id);
    await definitions
      .getByText(
        ["PRIMARY", "SENSOR"].includes(purpose)
          ? /Complete definitions for every inspected table/
          : /Table definitions are optional/
      )
      .waitFor();
    assert.equal(
      requests.filter(
        (request) =>
          request.method === "PATCH" &&
          request.path.endsWith(purposeDraft.id + "/files/tables")
      ).length,
      0,
      "Purpose guidance never invents saved definitions"
    );
  }
  console.log(
    "PASS backend-declared primary/sensor and single/multiple companion-purpose guidance stays distinct without duplicate classification fields or automatic definitions"
  );

  const lostDraft = seed("SAMPLE_ONLY"),
    lostTable = tableFixture(lostDraft, "SAMPLE", 3);
  await open(page, lostDraft);
  tableRegion = page.getByRole("region", {
    name: "Tables and columns",
    exact: true,
  });
  await tableRegion
    .getByLabel("File to describe", { exact: true })
    .selectOption(lostTable.member.id);
  await tableRegion
    .getByLabel("Inspected table", { exact: true })
    .selectOption(lostTable.table.id);
  await tableRegion
    .getByLabel("What does one record represent?", { exact: true })
    .fill("One exact lost-response record");
  flags.lose = "TABLES";
  await namedButton(tableRegion, "Save table descriptions").click();
  await namedButton(tableRegion, "Confirm table change").waitFor();
  assert.equal(lostDraft.contentGeneration, 1);
  await open(page, lostDraft);
  tableRegion = page.getByRole("region", {
    name: "Tables and columns",
    exact: true,
  });
  flags.lose = false;
  flags.tableDeny = true;
  await namedButton(tableRegion, "Confirm table change").click();
  await page
    .getByText("Synthetic table authority unavailable", { exact: true })
    .waitFor();
  assert(await namedButton(tableRegion, "Confirm table change").isVisible());
  flags.tableDeny = false;
  await namedButton(tableRegion, "Confirm table change").click();
  await namedButton(tableRegion, "Confirm table change").waitFor({
    state: "hidden",
  });
  assert.equal(lostDraft.contentGeneration, 1);
  const tableWrites = requests.filter(
    (item) =>
      item.path.endsWith(lostDraft.id + "/files/tables") &&
      item.method === "PATCH"
  );
  // Chromium may repeat a request whose HTTP response was destroyed. The
  // durable invariant is one mutation and one exact UUID/body across all sends.
  assert(tableWrites.length >= 3);
  for (const write of tableWrites)
    assert.deepEqual(write.body, tableWrites[0].body);
  assert.equal(
    new Set(tableWrites.map((write) => write.body.requestId)).size,
    1
  );
  assert.equal(
    [...receipts.values()].filter(
      (receipt) =>
        receipt.kind === "TABLES" &&
        receipt.value.requestId === tableWrites[0].body.requestId
    ).length,
    1
  );
  await tableRegion
    .getByLabel("File to describe", { exact: true })
    .selectOption(lostTable.member.id);
  await tableRegion
    .getByLabel("Inspected table", { exact: true })
    .selectOption(lostTable.table.id);
  await tableRegion
    .getByLabel("What does one record represent?", { exact: true })
    .waitFor();
  assert.equal(
    await tableRegion
      .getByLabel("What does one record represent?", { exact: true })
      .inputValue(),
    "One exact lost-response record"
  );
  console.log(
    "PASS lost table ACK survives reload and a pre-receipt 403; exact UUID/body replay does not duplicate the edit"
  );
  const wideDraft = seed("FULL_ONLY"),
    wide = tableFixture(wideDraft, "FULL", 22);
  await open(page, wideDraft);
  tableRegion = page.getByRole("region", {
    name: "Tables and columns",
    exact: true,
  });
  await tableRegion
    .getByLabel("File to describe", { exact: true })
    .selectOption(wide.member.id);
  await tableRegion
    .getByLabel("Inspected table", { exact: true })
    .selectOption(wide.table.id);
  for (let index = 0; index < 7; index++) {
    await tableRegion
      .getByLabel("Column to describe", { exact: true })
      .selectOption(wide.table.columns[index].id);
    await tableRegion
      .getByLabel("Column meaning", { exact: true })
      .selectOption("KNOWN");
    await tableRegion
      .getByLabel("What does this column mean?", { exact: true })
      .fill("界".repeat(2000));
  }
  assert(await namedButton(tableRegion, "Next columns page").isDisabled());
  flags.lose = "TABLES";
  await namedButton(tableRegion, "Save table descriptions").click();
  await namedButton(tableRegion, "Confirm table change").waitFor();
  assert.equal(wideDraft.contentGeneration, 1);
  const confirmedPrefix = wide.table.columns.filter(
    (column) => column.description
  ).length;
  assert(confirmedPrefix > 0 && confirmedPrefix < 7);
  await open(page, wideDraft);
  tableRegion = page.getByRole("region", {
    name: "Tables and columns",
    exact: true,
  });
  await namedButton(tableRegion, "Confirm table change").waitFor();
  const beforeAccountChange = requests.filter(
    (item) =>
      item.method === "PATCH" &&
      item.path.endsWith(wideDraft.id + "/files/tables")
  ).length;
  await page.evaluate(() => window.fixtureLogin("c000000000000000000999998"));
  assert.equal(
    await tableRegion
      .getByText("Review retained table answers", { exact: true })
      .count(),
    0
  );
  await namedButton(tableRegion, "Confirm table change").click();
  await page
    .getByText(
      "Sign in with the supplier account that started this table save to confirm it.",
      { exact: true }
    )
    .waitFor();
  assert.equal(
    requests.filter(
      (item) =>
        item.method === "PATCH" &&
        item.path.endsWith(wideDraft.id + "/files/tables")
    ).length,
    beforeAccountChange
  );
  await page.evaluate(() => window.fixtureLogin("c000000000000000000999999"));
  flags.lose = false;
  await namedButton(tableRegion, "Confirm table change").click();
  await namedButton(tableRegion, "Save remaining column answers").waitFor();
  assert.equal(wideDraft.contentGeneration, 1);
  assert.equal(
    wide.table.columns.filter((column) => column.description).length,
    confirmedPrefix
  );
  // Reload after a confirmed chunk, with no shared pending command. The rest
  // must remain available without selecting a replacement member or page.
  const beforeReload = requests.filter(
    (item) =>
      item.method === "PATCH" &&
      item.path.endsWith(wideDraft.id + "/files/tables")
  ).length;
  await open(page, wideDraft);
  tableRegion = page.getByRole("region", {
    name: "Tables and columns",
    exact: true,
  });
  await namedButton(tableRegion, "Save remaining column answers").waitFor();
  assert.equal(
    requests.filter(
      (item) =>
        item.method === "PATCH" &&
        item.path.endsWith(wideDraft.id + "/files/tables")
    ).length,
    beforeReload
  );
  await namedButton(tableRegion, "Save remaining column answers").click();
  await namedButton(tableRegion, "Save remaining column answers").waitFor({
    state: "hidden",
  });
  assert.equal(wideDraft.contentGeneration, 2);
  assert(
    wide.table.columns
      .slice(0, 7)
      .every((column) => column.description.description === "界".repeat(2000))
  );
  assert(
    wide.table.columns.slice(7).every((column) => column.description === null)
  );
  const wideWrites = requests.filter(
    (item) =>
      item.method === "PATCH" &&
      item.path.endsWith(wideDraft.id + "/files/tables")
  );
  assert.equal(new Set(wideWrites.map((item) => item.body.requestId)).size, 2);
  for (const write of wideWrites)
    assert(Buffer.byteLength(JSON.stringify(write.body)) < 32768);
  console.log(
    "PASS multiple known-column edits and long UTF-8 page saves preserve unsent answers through lost ACK, account switch and confirmed-chunk reload; unseen columns remain unchanged"
  );
  const tableOutput = process.argv[2];
  if (tableOutput) {
    await mkdir(resolve(tableOutput), { recursive: true });
    await open(page, tableDraft);
    tableRegion = page.getByRole("region", {
      name: "Tables and columns",
      exact: true,
    });
    await tableRegion
      .getByLabel("File to describe", { exact: true })
      .selectOption(specimen.member.id);
    await tableRegion
      .getByLabel("Inspected table", { exact: true })
      .selectOption(specimen.table.id);
    await namedButton(tableRegion, "Next columns page").click();
    await tableRegion.getByText(/Observed column 21:/).waitFor();
    for (const width of [1366, 390])
      for (const dark of [false, true]) {
        await page.setViewportSize({ width, height: 1000 });
        const toggle = page.getByRole("button", {
          name: dark ? "Use dark theme" : "Use light theme",
          exact: true,
        });
        if (await toggle.count()) await toggle.click();
        await page.waitForFunction(
          (dark) =>
            document.documentElement.classList.contains("dark") === dark &&
            document.documentElement.dataset.dashboardThemeTransition !==
              "true",
          dark
        );
        await tableRegion.scrollIntoViewIfNeeded();
        assert.equal(
          await tableRegion.evaluate(
            (element) => element.scrollWidth <= element.clientWidth
          ),
          true,
          "The table section must contain its controls and long observed labels"
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          ),
          true
        );
        // The workspace scrolls inside main. A tall element screenshot clips
        // off-screen descendants; capture actual scrolled viewports instead.
        for (const [part, anchor] of [
          [
            "top",
            tableRegion.getByRole("heading", {
              name: "Tables & columns",
              exact: true,
            }),
          ],
          [
            "columns",
            tableRegion.getByLabel("Column meaning", { exact: true }),
          ],
          ["actions", namedButton(tableRegion, "Refresh tables")],
        ]) {
          await anchor.scrollIntoViewIfNeeded();
          await page.screenshot({
            path: resolve(
              tableOutput,
              `tables-${width}-${dark ? "dark" : "light"}-${part}.png`
            ),
            animations: "disabled",
          });
        }
      }
    console.log(
      "PASS table description controls and long observed headers fit light/dark desktop/mobile within the existing design"
    );
  }
  await open(page, organizationDraft);
  const output = process.argv[2];
  if (output) await mkdir(resolve(output), { recursive: true });
  for (const width of [1366, 390])
    for (const dark of [false, true]) {
      await page.setViewportSize({ width, height: 1000 });
      const toggle = page.getByRole("button", {
        name: dark ? "Use dark theme" : "Use light theme",
        exact: true,
      });
      if (await toggle.count()) await toggle.click();
      await page.waitForFunction(
        (dark) =>
          document.documentElement.classList.contains("dark") === dark &&
          document.documentElement.dataset.dashboardThemeTransition !== "true",
        dark
      );
      await org
        .getByRole("heading", { name: "Organize selected files", exact: true })
        .scrollIntoViewIfNeeded();
      assert.equal(
        await page.evaluate(() => {
          const main = document.querySelector("#supplier-dashboard-main");
          return (
            document.documentElement.scrollWidth <= window.innerWidth &&
            main.scrollWidth <= main.clientWidth
          );
        }),
        true
      );
      assert.equal(
        await page.locator('[data-proposal-tile="true"]').evaluateAll((tiles) =>
          tiles.every((tile) => {
            const outer = tile.getBoundingClientRect();
            return [...tile.querySelectorAll("input,select,button")].every(
              (control) => {
                const bounds = control.getBoundingClientRect();
                return (
                  !bounds.width ||
                  (bounds.left >= outer.left && bounds.right <= outer.right + 1)
                );
              }
            );
          })
        ),
        true,
        "Every visible uploader control remains inside its tile"
      );
      if (output)
        await page.screenshot({
          path: resolve(
            output,
            `uploader-${width}-${dark ? "dark" : "light"}.png`
          ),
          fullPage: true,
          animations: "disabled",
        });
    }
  await open(page, zip);
  flags.closed = true;
  await namedButton(page, "Refresh upload status").click();
  await page
    .getByText(
      "New uploads are currently unavailable. Existing files and saved draft details remain available.",
      { exact: true }
    )
    .waitFor();
  assert.equal(await namedButton(page, "Upload file").count(), 0);
  console.log(
    "PASS backend pause removes advertised formats/admission; light/dark desktop/mobile contain no horizontal overflow"
  );
  assert.deepEqual(fixtureErrors, []);
  assert.deepEqual(browserErrors, []);
  assert.deepEqual(external, []);
  assert(
    !requests.some((item) => /submit|publish|payment|presign/.test(item.path))
  );
  console.log(
    "PASS rendered supplier uploader qualification; no hosted/cloud/native-scanner or complete-flow claim"
  );
} catch (failure) {
  console.error("UI fixture errors:", fixtureErrors);
  console.error("Browser errors:", browserErrors);
  for (const page of browser
    ?.contexts()
    .flatMap((context) => context.pages()) ?? []) {
    console.error(
      "Rendered page:",
      (await page.locator("body").innerText()).slice(-12000)
    );
    console.error(
      "Form controls:",
      await page.locator("input,select").evaluateAll((elements) =>
        elements.map((element) => ({
          id: element.id,
          disabled: element.disabled,
          label: Array.from(element.labels ?? []).map(
            (label) => label.textContent
          ),
        }))
      )
    );
  }
  throw failure;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolveClose) => server.close(resolveClose));
}
function draftFor(draftId) {
  return drafts.get(draftId);
}
