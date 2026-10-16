import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import {
  DatasetPreparationCreateBodySchema,
  DatasetPreparationPatchBodySchema,
  DatasetFilesContextBodySchema,
  DatasetFilesContextResponseSchema,
  DatasetFilesInventoryPageQuerySchema,
  DatasetFilesInventoryPageResponseSchema,
  DatasetFilesOrganizationQuerySchema,
  DatasetFilesOrganizationPageResponseSchema,
} from "@kuinbee/dataset-preparation-contracts";

const require = createRequire(import.meta.url);
const postcss = require(
  require.resolve("postcss", {
    paths: [require.resolve("@tailwindcss/postcss")],
  })
);
const tailwind = require("@tailwindcss/postcss");
const globals = await readFile("src/app/globals.css", "utf8");
const dashboard = await readFile("src/app/dashboard/dashboard.css", "utf8");
const css =
  (
    await postcss([tailwind({ base: process.cwd() })]).process(globals, {
      from: resolve("src/app/globals.css"),
    })
  ).css +
  "\n" +
  dashboard;
const entry = [
  "import React from 'react'; import {createRoot} from 'react-dom/client';",
  "import {QueryProvider} from './src/components/QueryProvider';",
  "import {DashboardShell} from './src/components/layout/DashboardShell';",
  "import CreateDatasetPage from './src/app/dashboard/datasets/create/page';",
  "import ProposalsPage from './src/app/dashboard/datasets/page';",
  "import DraftProposalPage from './src/app/dashboard/datasets/drafts/[draftId]/page';",
  "import OldDraftListPage from './src/app/dashboard/datasets/prepare/page';",
  "import OldDraftPage from './src/app/dashboard/datasets/prepare/[draftId]/page';",
  "import {DatasetPreparationScreen} from './src/components/datasets/preparation/DatasetPreparationScreen';",
  "import {DATASET_PREPARATION_ENABLED} from './src/lib/dataset-preparation-environment';",
  "import {preparationApi} from './src/lib/api/dataset-preparations';",
  "import {DatasetPreparationMetadataSchema} from '@kuinbee/dataset-preparation-contracts';",
  "window.runtimeContract = {partial:DatasetPreparationMetadataSchema.safeParse({title:'Partial'}).success, forged:DatasetPreparationMetadataSchema.safeParse({title:'Bad',scanPassed:true}).success};",
  "window.tryProductionWrite=async()=>{try{await preparationApi.create({requestId:crypto.randomUUID(),metadata:{title:'Blocked'}});}catch(e){return e.code;}};",
  "const root=createRoot(document.getElementById('root')); let mount=0;",
  "function render(view){root.render(<React.StrictMode><QueryProvider><DashboardShell>{view}</DashboardShell></QueryProvider></React.StrictMode>)}",
  "window.showEditor=(id)=>{mount++;window.history.replaceState(window.history.state,'',id?'/dashboard/datasets/drafts/'+id:'/dashboard/datasets/create');render(DATASET_PREPARATION_ENABLED?<DatasetPreparationScreen key={mount} draftId={id}/>:<CreateDatasetPage/>);};",
  "window.showRoute=async()=>{const path=window.location.pathname;const tail=path.split('/').at(-1);try{let view;if(path==='/dashboard/datasets')view=<ProposalsPage/>;else if(path==='/dashboard/datasets/create')view=<CreateDatasetPage/>;else if(path==='/dashboard/datasets/prepare')view=OldDraftListPage();else if(path.startsWith('/dashboard/datasets/prepare/'))view=await OldDraftPage({params:Promise.resolve({draftId:tail})});else if(path.startsWith('/dashboard/datasets/drafts/'))view=await DraftProposalPage({params:Promise.resolve({draftId:tail})});else throw {notFound:true};render(view)}catch(error){if(error.redirect)window.location.replace(error.redirect);else if(error.notFound)render(<h1>Not found</h1>);else throw error}};",
  "window.showRoute();",
].join("\n");
const mockedNext = {
  name: "fixture-next",
  setup(builder) {
    builder.onResolve(
      { filter: /^next\/(link|navigation|image)$/ },
      (args) => ({
        path: args.path,
        namespace: "fixture",
      })
    );
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
      contents:
        args.path === "next/link"
          ? "import React from 'react'; export default function Link(props){return <a {...props}/>}"
          : args.path === "next/image"
            ? "import React from 'react'; export default function Image({priority,fill,quality,unoptimized,...props}){return <img {...props}/>}"
            : "export function usePathname(){return window.location.pathname}; export function useRouter(){return {push:url=>window.location.assign(url),replace:url=>window.location.replace(url),back:()=>window.history.back()}}; export function useSearchParams(){return new URLSearchParams(window.location.search)}; export function notFound(){throw {notFound:true}}; export function redirect(url){throw {redirect:url}};",
      loader: "jsx",
      resolveDir: process.cwd(),
    }));
  },
};
async function bundle(environment) {
  const result = await build({
    stdin: { contents: entry, loader: "jsx", resolveDir: process.cwd() },
    plugins: [mockedNext],
    bundle: true,
    write: false,
    metafile: true,
    format: "iife",
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"development"',
      "process.env.NEXT_PUBLIC_APP_ENV": JSON.stringify(environment),
    },
  });
  assert(
    Object.keys(result.metafile.inputs).some((path) =>
      path.includes(
        "node_modules/@kuinbee/dataset-preparation-contracts/index.js"
      )
    )
  );
  assert(
    !Object.keys(result.metafile.inputs).some((path) =>
      path.includes("../backend")
    ),
    "Browser must not import sibling backend files"
  );
  return result.outputFiles[0].text;
}
const scripts = {
  local: await bundle("local"),
  staging: await bundle("staging"),
  production: await bundle("production"),
};
function fixtureEnvironment(url) {
  const environment = url.searchParams.get("environment");
  return environment === "production" || environment === "staging"
    ? environment
    : "local";
}
const cuid = (n) => "c" + String(n).padStart(24, "0");
const categories = Array.from({ length: 113 }, (_, index) => ({
  id: cuid(index + 1000),
  name: "Subject " + (index + 1),
}));
const sources = Array.from({ length: 42 }, (_, index) => ({
  id: cuid(index + 5000),
  name: "Source " + (index + 1),
}));
const legacyDrafts = [
  {
    id: "legacy-draft-001",
    kind: "PROPOSAL",
    title: "Existing supplier proposal",
    datasetUniqueId: "KB-LEGACY-001",
    uploadChoice: null,
    currentUploadId: "upload-001",
    updatedAt: "2026-10-14T00:00:10.000Z",
  },
  {
    id: "legacy-draft-002",
    kind: "PROPOSAL",
    title: "Audio reference collection",
    datasetUniqueId: "KB-LEGACY-002",
    uploadChoice: null,
    currentUploadId: null,
    updatedAt: "2026-10-14T00:00:08.000Z",
  },
  {
    id: "legacy-draft-003",
    kind: "PROPOSAL",
    title: "Motion study collection",
    datasetUniqueId: "KB-LEGACY-003",
    uploadChoice: null,
    currentUploadId: "upload-003",
    updatedAt: "2026-10-14T00:00:06.000Z",
  },
  {
    id: "legacy-draft-004",
    kind: "PROPOSAL",
    title: "Image annotation collection",
    datasetUniqueId: "KB-LEGACY-004",
    uploadChoice: null,
    currentUploadId: null,
    updatedAt: "2026-10-14T00:00:04.000Z",
  },
  {
    id: "legacy-draft-005",
    kind: "PROPOSAL",
    title: "Archived sensor study draft",
    datasetUniqueId: "KB-LEGACY-005",
    uploadChoice: null,
    currentUploadId: "upload-005",
    updatedAt: "2026-10-14T00:00:02.000Z",
  },
  {
    id: "legacy-draft-006",
    kind: "PROPOSAL",
    title: "Pathology 100%_ benchmark",
    datasetUniqueId: "KB-LEGACY-006",
    uploadChoice: null,
    currentUploadId: null,
    updatedAt: "2026-10-14T00:00:01.000Z",
  },
];
const drafts = new Map();
function workspaceRows(q = "") {
  const query = q.toLowerCase();
  return [
    ...legacyDrafts,
    ...[...drafts.values()].map((item) => ({
      id: item.id,
      kind: "PREPARATION",
      title: item.metadata.title,
      datasetUniqueId: null,
      uploadChoice: item.metadata.uploadChoice ?? null,
      currentUploadId: null,
      updatedAt: item.updatedAt,
    })),
  ]
    .filter(
      (row) =>
        !query ||
        [row.title, row.id, row.datasetUniqueId ?? ""].some((value) =>
          value.toLowerCase().includes(query)
        )
    )
    .sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) ||
        b.id.localeCompare(a.id) ||
        b.kind.localeCompare(a.kind)
    );
}
const replays = new Map();
const fileContexts = new Map();
const fileReplays = new Map();
const fileMembers = new Map();
const requests = [];
const flags = {
  workspaceTake: null,
  workspaceFailure: "",
  workspaceMalformed: false,
  acknowledgement: "",
  newerDuringAck: false,
  failRead: "",
  blockedNetworkRequestId: "",
  filesAcknowledgement: "",
  filesAdvanceDuringAck: false,
  filesReadDelay: 0,
  filesMalformedContext: false,
  filesMalformedPage: false,
};
let sequence = 1;
function copy(value) {
  return structuredClone(value);
}
function dto(metadata, id, generation = 0) {
  return {
    contractVersion: 1,
    id,
    generation,
    metadata,
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: new Date(Date.UTC(2026, 9, 14, 0, 0, generation)).toISOString(),
    readiness: {
      canSubmit: false,
      issues: [
        {
          code: "FILES_NOT_ENABLED",
          message:
            "File upload and required file checks are not available in this testing release.",
        },
        {
          code: "SUBMISSION_NOT_ENABLED",
          message: "Admin submission is unavailable in this testing release.",
        },
      ],
    },
  };
}
function mutate(id, changes) {
  const current = drafts.get(id);
  const next = dto(
    { ...current.metadata, ...changes },
    id,
    current.generation + 1
  );
  drafts.set(id, next);
  return next;
}
function filesContext(id) {
  const draft = drafts.get(id);
  const content = fileContexts.get(id);
  return DatasetFilesContextResponseSchema.parse({
    contractVersion: 1,
    preparationId: id,
    preparationGeneration: draft.generation,
    contentId: content?.id ?? null,
    contentGeneration: content?.generation ?? null,
    sourcePreparationGeneration: content?.sourceGeneration ?? null,
    serverUploadChoice: draft.metadata.uploadChoice ?? null,
    editable: true,
    synchronizationRequired: Boolean(
      content && content.sourceGeneration !== draft.generation
    ),
    usage: {
      state: "UNAVAILABLE",
      dataset: {
        limitBytes: "5000000000",
        retainedBytes: null,
        reservedBytes: null,
        chargedBytes: null,
        remainingBytes: null,
      },
      supplier: {
        limitBytes: "100000000000",
        retainedBytes: null,
        reservedBytes: null,
        chargedBytes: null,
        remainingBytes: null,
      },
    },
    admission: { enabled: false, reason: "INTAKE_NOT_ENABLED" },
  });
}
function json(res, status, value) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
}
const fixtureErrors = [];
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://fixture.test");
    if (url.pathname === "/bundle.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(scripts[fixtureEnvironment(url)]);
      return;
    }
    if (["/logo-light.png", "/logo-dark.png"].includes(url.pathname)) {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(await readFile(resolve("public", url.pathname.slice(1))));
      return;
    }
    if (url.pathname === "/style.css") {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(css);
      return;
    }
    if (!url.pathname.startsWith("/api/")) {
      const environment = fixtureEnvironment(url);
      const environmentStrip =
        environment === "staging"
          ? '<div role="status" data-environment="staging" class="flex h-7 items-center justify-center border-b border-border bg-amber-200 px-3 text-xs font-semibold text-amber-950">Staging · Test environment</div>'
          : "";
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body>' +
          environmentStrip +
          '<div id="root"></div><script src="/bundle.js?environment=' +
          environment +
          '"></script></body></html>'
      );
      return;
    }
    const recorded = {
      method: req.method,
      path: url.pathname,
      query: url.search,
    };
    requests.push(recorded);
    const base = "/api/v2/supplier/dataset-drafts";
    const fileRoute = url.pathname.match(
      /^\/api\/v2\/supplier\/dataset-drafts\/([^/]+)\/(files-context|files\/organization|files)$/
    );
    if (fileRoute) {
      const [, draftId, action] = fileRoute;
      const draft = drafts.get(draftId);
      if (!draft) {
        json(res, 404, {
          success: false,
          error: { code: "NOT_FOUND", message: "Draft files not found" },
        });
        return;
      }
      if (action === "files-context" && req.method === "GET") {
        const data = filesContext(draftId);
        if (flags.filesMalformedContext) data.preparationId = cuid(99999);
        const delay = flags.filesReadDelay;
        flags.filesReadDelay = 0;
        if (delay)
          await new Promise((resolveDelay) => setTimeout(resolveDelay, delay));
        json(res, 200, { success: true, data });
        return;
      }
      if (action === "files-context" && req.method === "POST") {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = DatasetFilesContextBodySchema.parse(
          JSON.parse(Buffer.concat(chunks).toString())
        );
        recorded.body = copy(body);
        let result;
        if (fileReplays.has(body.requestId)) {
          const prior = fileReplays.get(body.requestId);
          assert.deepEqual(
            body,
            prior.body,
            "File retries keep their exact payload"
          );
          result = copy(prior.response);
        } else {
          const content = fileContexts.get(draftId);
          if (
            draft.generation !== body.expectedPreparationGeneration ||
            (body.expectedContentId === null
              ? Boolean(content)
              : content?.id !== body.expectedContentId ||
                content?.generation !== body.expectedContentGeneration)
          ) {
            json(res, 409, {
              success: false,
              error: {
                code: "DRAFT_CHANGED",
                message: "Saved files changed; refresh before continuing",
              },
            });
            return;
          }
          fileContexts.set(
            draftId,
            content
              ? {
                  ...content,
                  generation: content.generation + 1,
                  sourceGeneration: draft.generation,
                }
              : {
                  id: cuid(50_000 + sequence++),
                  generation: 0,
                  sourceGeneration: draft.generation,
                }
          );
          result = { ...filesContext(draftId), requestId: body.requestId };
          fileReplays.set(body.requestId, {
            body: copy(body),
            response: copy(result),
          });
        }
        const acknowledgement = flags.filesAcknowledgement;
        flags.filesAcknowledgement = "";
        if (flags.filesAdvanceDuringAck) {
          flags.filesAdvanceDuringAck = false;
          const content = fileContexts.get(draftId);
          content.generation++;
        }
        if (acknowledgement === "malformed") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end("{not-json");
          return;
        }
        if (acknowledgement === "503") {
          json(res, 503, {
            success: false,
            error: {
              code: "UNAVAILABLE",
              message: "File change acknowledgement unavailable",
            },
          });
          return;
        }
        json(res, 200, { success: true, data: result });
        return;
      }
      if (action === "files/organization" && req.method === "GET") {
        const q = DatasetFilesOrganizationQuerySchema.parse(
          Object.fromEntries(url.searchParams)
        );
        const content = fileContexts.get(draftId);
        if (
          content?.id !== q.contentId ||
          content?.generation !== q.contentGeneration ||
          draft.generation !== q.expectedPreparationGeneration ||
          content?.sourceGeneration !== draft.generation
        ) {
          json(res, 409, {
            success: false,
            error: {
              code: "DRAFT_CHANGED",
              message: "Organization context changed",
            },
          });
          return;
        }
        assert(["GROUPS", "MEMBERS"].includes(q.section));
        const all =
          q.section === "MEMBERS"
            ? (fileMembers.get(draftId) ?? [])
                .filter(
                  (m) =>
                    (!q.component || m.component === q.component) &&
                    (!q.memberId || m.id === q.memberId) &&
                    (!q.afterId || m.id > q.afterId)
                )
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((m) => ({
                  kind: "MEMBER",
                  id: m.id,
                  uploadObjectId: m.uploadObjectId,
                  component: m.component,
                  role: m.role,
                  originalFileName: m.originalFileName,
                  relativePath: m.relativePath,
                  group: null,
                }))
            : [];
        const items = all.slice(0, q.limit);
        json(res, 200, {
          success: true,
          data: DatasetFilesOrganizationPageResponseSchema.parse({
            preparationId: draftId,
            preparationGeneration: draft.generation,
            contentId: content.id,
            contentGeneration: content.generation,
            section: q.section,
            component: q.component ?? null,
            memberId: q.memberId ?? null,
            inventoryId: null,
            uploadObjectId: null,
            items,
            nextCursor:
              all.length > q.limit ? { ...q, afterId: items.at(-1).id } : null,
          }),
        });
        return;
      }
      if (action === "files" && req.method === "GET") {
        const query = DatasetFilesInventoryPageQuerySchema.parse(
          Object.fromEntries(
            [...url.searchParams].map(([key, value]) => [
              key,
              ["expectedPreparationGeneration", "contentGeneration"].includes(
                key
              )
                ? Number(value)
                : value,
            ])
          )
        );
        const content = fileContexts.get(draftId);
        if (
          content?.id !== query.contentId ||
          content?.generation !== query.contentGeneration ||
          content?.sourceGeneration !== draft.generation ||
          draft.generation !== query.expectedPreparationGeneration
        ) {
          json(res, 409, {
            success: false,
            error: {
              code: "DRAFT_CHANGED",
              message: "File page generation changed",
            },
          });
          return;
        }
        const all = (fileMembers.get(draftId) ?? [])
          .filter(
            (member) => !query.component || member.component === query.component
          )
          .sort((a, b) => a.id.localeCompare(b.id));
        const after = all.filter(
          (member) => !query.afterId || member.id > query.afterId
        );
        const items = after.slice(0, query.limit);
        const data = DatasetFilesInventoryPageResponseSchema.parse({
          preparationId: draftId,
          preparationGeneration: draft.generation,
          contentId: content.id,
          contentGeneration: content.generation,
          sourcePreparationGeneration: content.sourceGeneration,
          items,
          nextCursor:
            after.length > query.limit
              ? {
                  contentId: content.id,
                  contentGeneration: content.generation,
                  afterId: items.at(-1).id,
                }
              : null,
        });
        if (flags.filesMalformedPage) {
          data.contentGeneration++;
          if (data.nextCursor) data.nextCursor.contentGeneration++;
        }
        json(res, 200, { success: true, data });
        return;
      }
      throw new Error("Unexpected files action " + req.method);
    }
    if (url.pathname === base + "/catalog-labels") {
      const category =
        categories.find(
          (item) => item.id === url.searchParams.get("primaryCategoryId")
        ) ?? null;
      const source =
        sources.find((item) => item.id === url.searchParams.get("sourceId")) ??
        null;
      json(res, 200, {
        success: true,
        data: { primaryCategory: category, source },
      });
      return;
    }
    if (
      url.pathname === "/api/v1/supplier/categories" ||
      url.pathname === "/api/v1/supplier/sources"
    ) {
      const pageSize = req.headers.referer?.includes("environment=production")
        ? 100
        : 20;
      assert.equal(
        url.searchParams.get("pageSize"),
        String(pageSize),
        "Each creator keeps its real catalogue pageSize parameter"
      );
      const collection = url.pathname.endsWith("categories")
        ? categories
        : sources;
      const query = (url.searchParams.get("q") ?? "").toLowerCase();
      const matching = collection.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
      const page = Number(url.searchParams.get("page") ?? 1);
      json(res, 200, {
        success: true,
        data: {
          items: matching.slice((page - 1) * pageSize, page * pageSize),
          total: matching.length,
          page,
          pageSize,
        },
      });
      return;
    }
    if (
      url.pathname === "/api/v1/supplier/dataset-proposals" &&
      req.method === "GET"
    ) {
      const submitted = url.searchParams.get("scope") === "SUBMITTED";
      const item = {
        id: cuid(9999),
        datasetUniqueId: "KB-EARLIER-1",
        title: submitted
          ? "Existing submitted proposal"
          : "Existing supplier proposal",
        verificationStatus: submitted ? "SUBMITTED" : "PENDING",
        updatedAt: "2026-10-14T00:00:00.000Z",
        currentUploadId: null,
      };
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const items =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.datasetUniqueId.toLowerCase().includes(q)
          ? [item]
          : [];
      json(res, 200, {
        success: true,
        data: {
          items,
          total: items.length,
          page: 1,
          pageSize: 10,
          summary: {
            total: 1,
            draftsWithCurrentUpload: 0,
            draftsWithoutCurrentUpload: 1,
            byVerificationStatus: {
              PENDING: submitted ? 0 : 1,
              SUBMITTED: submitted ? 1 : 0,
              CHANGES_REQUESTED: 0,
              RESUBMITTED: 0,
              UNDER_REVIEW: 0,
              VERIFIED: 0,
              REJECTED: 0,
            },
          },
        },
      });
      return;
    }
    if (url.pathname === base + "/workspace" && req.method === "GET") {
      assert.equal(url.searchParams.get("limit"), "20");
      if (flags.workspaceFailure) {
        json(res, 403, {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Fixture inventory access denied",
          },
        });
        return;
      }
      const q = url.searchParams.get("q") ?? "";
      const matching =
        flags.workspaceTake === null
          ? workspaceRows(q)
          : workspaceRows(q).slice(0, flags.workspaceTake);
      const page = Number(url.searchParams.get("page") ?? 1);
      if (q.toLowerCase() === "speech")
        await new Promise((resolveWait) => setTimeout(resolveWait, 900));
      const withCurrentUpload = matching.filter(
        (row) => row.currentUploadId !== null
      ).length;
      const data = {
        items: matching.slice((page - 1) * 20, page * 20),
        page,
        limit: 20,
        total: matching.length,
        summary: {
          total: matching.length,
          withCurrentUpload,
          withoutCurrentUpload: matching.length - withCurrentUpload,
        },
      };
      if (flags.workspaceMalformed)
        data.items = [{ ...data.items[0], kind: "INVALID" }];
      json(res, 200, { success: true, data });
      return;
    }
    if (url.pathname === base && req.method === "GET") {
      assert.equal(url.searchParams.get("limit"), "20");
      const query = (url.searchParams.get("q") ?? "").toLowerCase();
      const matching = [...drafts.values()].filter(
        (item) => !query || item.metadata.title.toLowerCase().includes(query)
      );
      const page = Number(url.searchParams.get("page") ?? 1);
      if (query === "speech")
        await new Promise((resolveWait) => setTimeout(resolveWait, 900));
      json(res, 200, {
        success: true,
        data: {
          items: matching.slice((page - 1) * 20, page * 20),
          page,
          limit: 20,
          total: matching.length,
        },
      });
      return;
    }
    const id = url.pathname.startsWith(base + "/")
      ? url.pathname.slice(base.length + 1)
      : null;
    if (id && req.method === "GET") {
      if (flags.failRead === id) {
        json(res, 503, {
          success: false,
          error: { code: "UNAVAILABLE", message: "Fixture read unavailable" },
        });
        return;
      }
      json(
        res,
        drafts.has(id) ? 200 : 404,
        drafts.has(id)
          ? { success: true, data: drafts.get(id) }
          : {
              success: false,
              error: { code: "NOT_FOUND", message: "Draft not found" },
            }
      );
      return;
    }
    if (req.method === "POST" || req.method === "PATCH") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      recorded.body = copy(body);
      const parsed = (
        req.method === "POST"
          ? DatasetPreparationCreateBodySchema
          : DatasetPreparationPatchBodySchema
      ).safeParse(body);
      if (!parsed.success) {
        json(res, 400, {
          success: false,
          error: { code: "INVALID_INPUT", message: "Invalid provided values" },
        });
        return;
      }
      let result;
      if (replays.has(body.requestId))
        result = copy(replays.get(body.requestId));
      else {
        if (req.method === "POST") {
          const createdId = cuid(sequence++);
          result = dto(parsed.data.metadata, createdId);
          drafts.set(createdId, result);
        } else {
          const current = drafts.get(id);
          if (!current || current.generation !== body.expectedGeneration) {
            json(res, 409, {
              success: false,
              error: {
                code: "DRAFT_CHANGED",
                message:
                  "This draft changed. Reload it before saving your changes",
              },
            });
            return;
          }
          result = dto(
            { ...current.metadata, ...parsed.data.changes },
            id,
            current.generation + 1
          );
          drafts.set(id, result);
        }
        replays.set(body.requestId, copy(result));
      }
      if (flags.newerDuringAck) {
        flags.newerDuringAck = false;
        mutate(result.id, {
          description: "Remote description after uncertain acknowledgement",
          title: "Remote concurrent title",
        });
      }
      const acknowledgement = flags.acknowledgement;
      flags.acknowledgement = "";
      if (acknowledgement === "malformed") {
        res.writeHead(req.method === "POST" ? 201 : 200, {
          "Content-Type": "application/json",
        });
        res.end("{not-json");
        return;
      }
      if (acknowledgement === "503") {
        json(res, 503, {
          success: false,
          error: { code: "UNAVAILABLE", message: "Fixture uncertain save" },
        });
        return;
      }
      if (
        acknowledgement === "network" ||
        flags.blockedNetworkRequestId === body.requestId
      ) {
        flags.blockedNetworkRequestId = body.requestId;
        req.socket.destroy();
        return;
      }
      json(res, req.method === "POST" ? 201 : 200, {
        success: true,
        data: result,
      });
      return;
    }
    json(res, 404, {
      success: false,
      error: { code: "NOT_FOUND", message: "Unexpected fixture API" },
    });
  } catch (error) {
    fixtureErrors.push(String(error));
    console.error(error);
    json(res, 500, {
      success: false,
      error: { code: "FIXTURE_ERROR", message: String(error) },
    });
  }
});
await new Promise((resolveListen) =>
  server.listen(0, "127.0.0.1", resolveListen)
);
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
const errors = [];
const external = [];
const sleepReady = (page) =>
  page.getByRole("button", { name: "Save draft", exact: true }).waitFor();
async function step(page, label) {
  await page.getByRole("button", { name: label, exact: true }).click();
}
async function save(page, label = "Save draft") {
  const acknowledgement = page.waitForResponse((response) => {
    const request = response.request();
    return (
      ["POST", "PATCH"].includes(request.method()) &&
      new URL(response.url()).pathname.startsWith(
        "/api/v2/supplier/dataset-drafts"
      )
    );
  });
  await page.getByRole("button", { name: label, exact: true }).click();
  const response = await acknowledgement;
  assert(
    [200, 201].includes(response.status()),
    "A successful save needs an acknowledged mutation response"
  );
  const body = await response.json();
  assert.equal(body.success, true);
  await page.waitForFunction(
    ({ id, generation }) => {
      const status = document.querySelector('[data-preparation-status="true"]');
      return (
        status?.getAttribute("data-saved-id") === id &&
        status.getAttribute("data-saved-generation") === String(generation) &&
        status.textContent.includes("Draft saved")
      );
    },
    { id: body.data.id, generation: body.data.generation }
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Resolve the changed draft", exact: true })
      .count(),
    0
  );
}
async function showNew(page) {
  await page.evaluate(() => window.showEditor());
  await sleepReady(page);
}
async function setTheme(page, dark) {
  const action = page.getByRole("button", {
    name: dark ? "Use dark theme" : "Use light theme",
    exact: true,
  });
  if (await action.count()) await action.click();
  await page.waitForFunction(
    (expected) =>
      document.documentElement.classList.contains("dark") === expected &&
      !document.documentElement.dataset.dashboardThemeTransition,
    dark
  );
}
async function scrollMainToTop(page) {
  await page
    .locator("#supplier-dashboard-main")
    .evaluate((node) =>
      node.scrollTo({ top: 0, left: 0, behavior: "instant" })
    );
}
async function tileForHeading(page, name) {
  return page
    .getByRole("heading", { name, exact: true })
    .locator("xpath=ancestor::section[1]");
}
async function assertNoDecorativeShadows(page) {
  const shadows = await page.evaluate(() =>
    [...document.querySelectorAll(".dataset-proposal-workspace")]
      .flatMap((root) => [
        root,
        ...root.querySelectorAll(".dashboard-glass-card,.dashboard-button"),
      ])
      .filter((el) => {
        return (
          el.getClientRects().length &&
          !el.matches(":focus-visible") &&
          getComputedStyle(el).boxShadow !== "none"
        );
      })
      .map(
        (el) =>
          el.tagName +
          ": " +
          (el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 80))
      )
  );
  assert.deepEqual(
    shadows,
    [],
    "Proposal bento workspaces must not use decorative panel or button shadows"
  );
}
async function assertVisibleKeyboardFocus(page) {
  await page.getByRole("button", { name: "Save draft", exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    const style = getComputedStyle(el);
    return {
      keyboard: el.matches(":focus-visible"),
      width: parseFloat(style.outlineWidth),
      style: style.outlineStyle,
      color: style.outlineColor,
    };
  });
  assert(
    focus.keyboard &&
      focus.width >= 2 &&
      focus.style !== "none" &&
      focus.color !== "transparent",
    "Keyboard focus must remain visibly outlined without decorative shadows"
  );
  await page.evaluate(() => document.activeElement.blur());
}
async function assertTileLayout(page, first, second, width) {
  const left = await (await tileForHeading(page, first)).boundingBox();
  const right = await (await tileForHeading(page, second)).boundingBox();
  assert(left && right, "Both named content tiles must be visible");
  if (width >= 1024) {
    assert(
      Math.abs(left.y - right.y) <= 2,
      "Related desktop tiles start on the same row"
    );
    assert(
      right.x >= left.x + left.width + 10,
      "Related desktop tiles occupy distinct columns"
    );
  } else {
    assert(
      Math.abs(left.x - right.x) <= 2,
      "Mobile tiles align to the same content edge"
    );
    assert(
      right.y >= left.y + left.height + 10,
      "Mobile tiles stack in reading order"
    );
  }
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll("input,select,textarea,button")]
      .filter((el) => {
        if (
          !el.getClientRects().length ||
          getComputedStyle(el).visibility === "hidden"
        )
          return false;
        const rect = el.getBoundingClientRect();
        const section = el.closest("section");
        const bounds = section?.getBoundingClientRect();
        return (
          rect.left < -1 ||
          rect.right > document.documentElement.clientWidth + 1 ||
          (bounds &&
            (rect.left < bounds.left - 1 || rect.right > bounds.right + 1))
        );
      })
      .map(
        (el) =>
          el.getAttribute("aria-label") || el.textContent?.trim() || el.tagName
      )
  );
  assert.deepEqual(
    overflowing,
    [],
    "Controls must fit their tile and viewport"
  );
  assert(
    (await page.evaluate(() => document.documentElement.scrollWidth)) <= width,
    "The responsive page must not scroll horizontally"
  );
}
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(origin + "/dashboard/datasets/create");
  await page
    .getByRole("heading", { name: "Create proposal", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "Draft proposals", exact: true })
      .getAttribute("href"),
    "/dashboard/datasets"
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Create a dataset proposal", exact: true })
      .count(),
    0
  );
  assert.equal(
    await page
      .getByText("Prepare a Dataset step by step", { exact: true })
      .count(),
    0
  );
  console.log(
    "PASS existing Create proposal route uses one four-step proposal editor"
  );
  assert.deepEqual(await page.evaluate(() => window.runtimeContract), {
    partial: true,
    forged: false,
  });
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Only a title is needed");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Files & contents", exact: true })
    .waitFor();
  const titleOnlyId = page.url().split("/").at(-1);
  assert.deepEqual(drafts.get(titleOnlyId).metadata, {
    title: "Only a title is needed",
  });
  assert.equal(drafts.get(titleOnlyId).readiness.canSubmit, false);
  await page.reload();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Only a title is needed"
  );
  console.log(
    "PASS title-only real save, stable URL, continue and server readback"
  );

  const profiles = [
    {
      name: "Tables and spreadsheets",
      modalities: ["Tables and spreadsheets"],
      field: "What does one record represent?",
      value: "One transaction",
    },
    {
      name: "Speech and other audio",
      modalities: ["Speech and other audio"],
      field: "Recording context",
      value: "Conversation recording",
    },
    {
      name: "Images",
      modalities: ["Images"],
      field: "What do the images show?",
      value: "Product images",
    },
    {
      name: "Video",
      modalities: ["Video"],
      field: "What do the videos show?",
      value: "Assembly recordings",
    },
    {
      name: "Text and documents",
      modalities: ["Text and documents"],
      field: "What does one document or text record represent?",
      value: "One message",
    },
    {
      name: "Sensor readings",
      modalities: ["Sensor readings"],
      field: "Sensor channels and units",
      value: "Untimed temperature measurements; Celsius",
    },
    {
      name: "Mixed egocentric",
      modalities: ["Video", "Sensor readings"],
      field: "Camera mounting position",
      value: "Head-mounted",
      egocentric: true,
    },
  ];
  const choices = ["SAMPLE_ONLY", "FULL_ONLY", "FULL_AND_SAMPLE"];
  for (const profile of profiles)
    for (const choice of choices) {
      await showNew(page);
      await page
        .getByLabel("Dataset title", { exact: true })
        .fill(profile.name + " " + choice);
      await page.locator('input[type="radio"][value="' + choice + '"]').check();
      for (const modality of profile.modalities)
        await page
          .getByRole("checkbox", { name: new RegExp("^" + modality) })
          .check();
      if (profile.egocentric)
        await page
          .getByRole("checkbox", {
            name: "Egocentric / first-person capture",
            exact: true,
          })
          .check();
      await save(page);
      await step(page, "2. Files & contents");
      await page
        .getByRole("button", { name: "Set up files", exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("region", { name: "Full material", exact: true })
          .count(),
        choice === "SAMPLE_ONLY" ? 0 : 1
      );
      assert.equal(
        await page
          .getByRole("region", { name: "Sample material", exact: true })
          .count(),
        choice === "FULL_ONLY" ? 0 : 1
      );
      assert.equal(await page.locator('input[type="file"]').count(), 0);
      await step(page, "3. Dataset details");
      await page.getByLabel(profile.field, { exact: true }).fill(profile.value);
      if (profile.name === "Speech and other audio") {
        await page
          .getByLabel("What kind of audio does the collection contain?", {
            exact: true,
          })
          .selectOption("SPEECH");
        await page
          .getByLabel("Spoken languages", { exact: true })
          .pressSequentially("Mandarin Chinese, English");
        assert.equal(
          await page
            .getByLabel("Spoken languages", { exact: true })
            .inputValue(),
          "Mandarin Chinese, English"
        );
        await page
          .getByLabel("Transcript availability", { exact: true })
          .selectOption("ABSENT");
      }
      if (profile.name !== "Tables and spreadsheets")
        assert.equal(
          await page
            .getByLabel("What does one record represent?", { exact: true })
            .count(),
          0
        );
      await save(page);
      const id = page.url().split("/").at(-1);
      assert.equal(drafts.get(id).metadata.uploadChoice, choice);
      assert.equal(drafts.get(id).readiness.canSubmit, false);
      if (profile.name === "Speech and other audio")
        assert.deepEqual(drafts.get(id).metadata.profiles.audio.languages, [
          "Mandarin Chinese",
          "English",
        ]);
      await step(page, "4. Review draft");
      assert(
        await page
          .getByRole("button", {
            name: "Submit proposal for admin review",
            exact: true,
          })
          .isDisabled()
      );
      assert.equal(
        await page
          .getByRole("heading", { name: "Saved draft summary", exact: true })
          .count(),
        1
      );
    }
  console.log(
    "PASS all 21 upload-choice/profile paths, conditional questions, raw language typing and unavailable file/Submit controls"
  );

  await showNew(page);
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Backend files workspace");
  await page.locator('input[type="radio"][value="FULL_AND_SAMPLE"]').check();
  const beforeUnsavedFiles = requests.length;
  await step(page, "2. Files & contents");
  await page
    .getByText(
      "Save your draft and choose what you are uploading in Basics before setting up files.",
      { exact: true }
    )
    .waitFor();
  assert(
    !requests
      .slice(beforeUnsavedFiles)
      .some((request) => /\/files(?:-context)?$/.test(request.path)),
    "An unsaved form cannot create/read a files root"
  );
  await save(page);
  const filesId = page.url().split("/").at(-1);
  await page
    .getByRole("button", { name: "Set up files", exact: true })
    .waitFor();
  flags.filesAcknowledgement = "503";
  flags.filesAdvanceDuringAck = true;
  const beforeFilesInit = requests.length;
  await page.getByRole("button", { name: "Set up files", exact: true }).click();
  await page
    .getByRole("button", { name: "Retry file change", exact: true })
    .waitFor();
  assert(
    await page
      .getByRole("button", { name: "Save draft", exact: true })
      .isDisabled(),
    "An uncertain file write pauses other saves"
  );
  const content = fileContexts.get(filesId);
  fileMembers.set(
    filesId,
    Array.from({ length: 25 }, (_, index) => ({
      id: cuid(70_000 + index),
      contentId: content.id,
      uploadObjectId: cuid(80_000 + index),
      component: index % 2 ? "SAMPLE" : "FULL",
      role: "PRIMARY",
      relativePath: null,
      groupId: null,
      originalFileName:
        index === 0
          ? null
          : index === 1
            ? "sample-readable-01.csv"
            : index === 4
              ? "recording-session-".repeat(25) + ".wav"
              : "backend-file-" + String(index).padStart(2, "0") + ".txt",
      measuredSizeBytes: "1250000",
      inspection: {
        securityState: index === 2 ? "BLOCKED" : "ACCEPTED",
        currentEvidenceId: index === 0 ? null : cuid(90_000 + index),
        recordedOutcome: index === 0 ? "NONE" : "PASS",
        current: index !== 0,
        eligibility: "NOT_EVALUATED",
      },
    }))
  );
  await page
    .getByRole("button", { name: "Retry file change", exact: true })
    .click();
  await page
    .getByText("Original filename unavailable", { exact: true })
    .waitFor();
  const fileWrites = requests
    .slice(beforeFilesInit)
    .filter(
      (request) =>
        request.method === "POST" && request.path.endsWith("/files-context")
    );
  assert.equal(fileWrites.length, 2);
  assert.deepEqual(fileWrites[0].body, fileWrites[1].body);
  assert.equal(
    fileContexts.get(filesId).generation,
    1,
    "Original acknowledgment retry cannot undo a newer content generation"
  );
  assert.equal(
    fileReplays.size,
    1,
    "Preparation retry creates only one receipt"
  );
  assert(
    await page
      .getByRole("button", { name: "Save draft", exact: true })
      .isEnabled()
  );
  assert.equal(
    await page.getByText("Measured size: 1.25 MB", { exact: true }).count(),
    20
  );
  assert.equal(await page.getByText("Received", { exact: true }).count(), 20);
  assert(
    (await page
      .getByText("Recorded pass · eligibility not assessed", { exact: true })
      .count()) > 0
  );
  assert.equal(await page.getByText("Blocked", { exact: true }).count(), 1);
  assert.equal(await page.locator('input[type="file"]').count(), 0);
  assert.equal(
    await page
      .getByRole("button", { name: /^Upload (full|sample) files/ })
      .count(),
    2
  );
  assert(
    await page
      .getByRole("button", {
        name: "Upload full files — unavailable",
        exact: true,
      })
      .isDisabled()
  );
  assert.equal(
    await page
      .getByRole("list", { name: "Stored file references", exact: true })
      .getByText("backend-file-24.txt", { exact: true })
      .count(),
    0
  );
  await page
    .getByRole("button", { name: "Next files page", exact: true })
    .click();
  await page
    .getByRole("list", { name: "Stored file references", exact: true })
    .getByText("backend-file-24.txt", { exact: true })
    .waitFor();
  assert.equal(await page.getByText("Received", { exact: true }).count(), 5);
  await page
    .getByRole("button", { name: "Previous files page", exact: true })
    .click();
  await page
    .getByText("Original filename unavailable", { exact: true })
    .waitFor();
  fileContexts.get(filesId).generation++;
  const beforeChangedPage = requests.length;
  await page
    .getByRole("button", { name: "Next files page", exact: true })
    .click();
  await page
    .getByText(
      "The file inventory changed. Refresh files to restart from its first page.",
      { exact: true }
    )
    .waitFor();
  assert(
    !requests
      .slice(beforeChangedPage)
      .some((request) => request.path.endsWith("/files")),
    "A changed generation cannot reuse an older page cursor"
  );
  await page
    .getByRole("button", { name: "Refresh files", exact: true })
    .click();
  await page
    .getByText("Original filename unavailable", { exact: true })
    .waitFor();
  assert.equal(
    fileMembers.get(filesId).length,
    25,
    "Paging never deletes unseen file references"
  );
  for (const dark of [false, true]) {
    await setTheme(page, dark);
    await scrollMainToTop(page);
    await page.screenshot({
      path: `/tmp/kuinbee-files-workspace-combined-${dark ? "dark" : "light"}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await setTheme(page, false);
  console.log(
    "PASS acknowledged Files initialization, identical uncertain retry, latest-generation refresh, measured inventory and guarded bounded paging"
  );

  await step(page, "1. Basics");
  await page.locator('input[type="radio"][value="FULL_ONLY"]').check();
  await step(page, "2. Files & contents");
  await page
    .getByRole("region", { name: "Sample material", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("region", { name: "Full material", exact: true })
      .count(),
    1
  );
  assert.equal(
    await page
      .getByRole("region", { name: "Sample material", exact: true })
      .count(),
    1,
    "Unsaved local choice cannot reinterpret saved samples"
  );
  await save(page);
  await page
    .getByRole("button", { name: "Update files", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("region", { name: "Sample material", exact: true })
      .count(),
    0
  );
  await page.getByRole("button", { name: "Update files", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Retained files outside the saved upload choice",
      exact: true,
    })
    .waitFor();
  await page.getByText("sample-readable-01.csv", { exact: true }).waitFor();
  assert.equal(
    fileMembers.get(filesId).length,
    25,
    "Explicit choice synchronization retains mismatched selections"
  );

  await step(page, "1. Basics");
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Unsaved local title survives file reads");
  await step(page, "2. Files & contents");
  await page
    .getByRole("button", { name: "Refresh files", exact: true })
    .click();
  await page
    .getByText("Original filename unavailable", { exact: true })
    .waitFor();
  await step(page, "1. Basics");
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Unsaved local title survives file reads"
  );
  await save(page);
  await step(page, "2. Files & contents");
  await page
    .getByRole("button", { name: "Update files", exact: true })
    .waitFor();
  flags.filesReadDelay = 900;
  const delayedRead = page.waitForRequest(
    (request) =>
      request.method() === "GET" &&
      new URL(request.url()).pathname.endsWith("/files-context")
  );
  await page
    .getByRole("button", { name: "Refresh files", exact: true })
    .click();
  await delayedRead;
  await step(page, "1. Basics");
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Newer save fences slow file read");
  await save(page);
  await step(page, "2. Files & contents");
  await page
    .getByRole("button", { name: "Update files", exact: true })
    .waitFor();
  await page.waitForTimeout(1100);
  assert.equal(
    await page
      .getByText(
        "Saved details changed in another tab. Review the latest saved draft before changing its files.",
        { exact: true }
      )
      .count(),
    0
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Resolve the changed draft", exact: true })
      .count(),
    0
  );
  await page.getByRole("button", { name: "Update files", exact: true }).click();
  await page
    .getByText("Original filename unavailable", { exact: true })
    .waitFor();
  flags.filesMalformedPage = true;
  await page
    .getByRole("button", { name: "Refresh files", exact: true })
    .click();
  await page
    .getByText(
      "The files response does not match this draft. Refresh before continuing.",
      { exact: true }
    )
    .waitFor();
  assert.equal(
    await page
      .getByText("Original filename unavailable", { exact: true })
      .count(),
    0,
    "Mixed-generation page data is not displayed"
  );
  flags.filesMalformedPage = false;
  flags.filesMalformedContext = true;
  await page
    .getByRole("button", { name: "Refresh files", exact: true })
    .click();
  await page
    .getByText(
      "The files response does not match this draft. Refresh before continuing.",
      { exact: true }
    )
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Set up files", exact: true })
      .count(),
    0
  );
  flags.filesMalformedContext = false;
  await page
    .getByRole("button", { name: "Refresh files", exact: true })
    .click();
  await page
    .getByText("Original filename unavailable", { exact: true })
    .waitFor();
  assert.equal(fileMembers.get(filesId).length, 25);
  await step(page, "1. Basics");
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Local title kept through Files conflict");
  mutate(filesId, { overview: "A separate tab saved this overview" });
  await step(page, "2. Files & contents");
  await page
    .getByRole("button", { name: "Review latest saved draft", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Review latest saved draft", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await step(page, "1. Basics");
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Local title kept through Files conflict"
  );
  await save(page);
  assert.equal(
    drafts.get(filesId).metadata.overview,
    "A separate tab saved this overview"
  );
  await step(page, "2. Files & contents");
  await page
    .getByRole("button", { name: "Update files", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Update files", exact: true }).click();
  await page
    .getByText("Original filename unavailable", { exact: true })
    .waitFor();
  for (const [width, dark] of [
    [1280, false],
    [1280, true],
    [390, true],
    [390, false],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await setTheme(page, dark);
    await scrollMainToTop(page);
    assert(
      (await page.evaluate(() => document.documentElement.scrollWidth)) <=
        width,
      "Files workspace fits the viewport"
    );
    await page.screenshot({
      path: `/tmp/kuinbee-files-workspace-${dark ? "dark" : "light"}-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  console.log(
    "PASS saved-choice separation, retained mismatched components, dirty-answer preservation, stale reads, Files-detected metadata conflict and incompatible response rejection"
  );

  await showNew(page);
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Scoped sample declaration");
  await page.locator('input[type="radio"][value="FULL_AND_SAMPLE"]').check();
  await page
    .getByLabel("Dataset license", { exact: true })
    .fill("Supplier-stated license");
  await page.getByRole("checkbox", { name: /^Speech and other audio/ }).check();
  await page.getByRole("checkbox", { name: /^Healthcare content/ }).check();
  await step(page, "2. Files & contents");
  for (const [label, value, unit] of [
    ["Declared amount in prepared full material", "200", "HOUR"],
    ["Declared amount in prepared sample", "15", "MINUTE"],
  ]) {
    await page
      .getByLabel("Add a quantity to " + label, { exact: true })
      .selectOption("AUDIO_DURATION");
    await page
      .getByLabel(label + ": Audio duration answer", { exact: true })
      .selectOption("KNOWN");
    await page
      .getByLabel(label + ": Audio duration value", { exact: true })
      .fill(value);
    await page
      .getByLabel(label + ": Audio duration unit", { exact: true })
      .selectOption(unit);
  }
  await step(page, "3. Dataset details");
  await page
    .getByLabel("Add a quantity to Represented collection quantity", {
      exact: true,
    })
    .selectOption("AUDIO_DURATION");
  await page
    .getByLabel("Represented collection quantity: Audio duration answer", {
      exact: true,
    })
    .selectOption("ESTIMATED");
  await page
    .getByLabel("Represented collection quantity: Audio duration value", {
      exact: true,
    })
    .fill("200");
  await page
    .getByLabel("How were personal identifiers handled?", { exact: true })
    .fill("Handling unknown; supplier declaration for private review");
  await save(page);
  const scopedId = page.url().split("/").at(-1);
  assert.equal(
    drafts.get(scopedId).metadata.collectionMeasurements[0].state,
    "ESTIMATED"
  );
  assert.equal(drafts.get(scopedId).metadata.fullMeasurements[0].value, "200");
  assert.equal(drafts.get(scopedId).metadata.sampleMeasurements[0].value, "15");
  await step(page, "4. Review draft");
  await page.getByText("Supplier-stated license", { exact: true }).waitFor();
  await page
    .getByText("Audio duration: 200 hours (supplier estimate)", { exact: true })
    .waitFor();
  await page
    .getByText("Audio duration: 15 minutes (supplier-declared)", {
      exact: true,
    })
    .waitFor();
  console.log(
    "PASS separate represented/full/sample declarations, stated license and private healthcare preparation"
  );

  await step(page, "1. Basics");
  for (let pageIndex = 0; pageIndex < 5; pageIndex++) {
    await page
      .getByRole("button", { name: "Load more categories", exact: true })
      .click();
    await page
      .getByText(
        String(Math.min((pageIndex + 2) * 20, 113)) +
          " of 113 matching categories loaded.",
        { exact: true }
      )
      .waitFor();
  }
  await page
    .getByLabel("Primary category", { exact: true })
    .selectOption(categories[112].id);
  await page
    .getByRole("button", { name: "Load more sources", exact: true })
    .click();
  await page
    .getByText("40 of 42 matching sources loaded.", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Load more sources", exact: true })
    .click();
  await page
    .getByText("42 of 42 matching sources loaded.", { exact: true })
    .waitFor();
  await page
    .getByLabel("Data source", { exact: true })
    .selectOption(sources[41].id);
  await page.getByLabel("Search categories", { exact: true }).fill("Subject 2");
  await page
    .getByRole("button", { name: "Search categories", exact: true })
    .click();
  await page
    .getByText("11 of 11 matching categories loaded.", { exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Primary category", { exact: true }).inputValue(),
    categories[112].id
  );
  await save(page);
  await page.reload();
  await page
    .getByLabel("Primary category", { exact: true })
    .locator("option", { hasText: "Subject 113" })
    .waitFor({ state: "attached" });
  await page
    .getByLabel("Data source", { exact: true })
    .locator("option", { hasText: "Source 42" })
    .waitFor({ state: "attached" });
  assert.equal(
    await page.getByLabel("Data source", { exact: true }).inputValue(),
    sources[41].id
  );
  console.log(
    "PASS actual pageSize catalogue pagination beyond 100, selection retention through search and current-label readback"
  );

  await step(page, "3. Dataset details");
  const additional = page.getByLabel("Add an additional category", {
    exact: true,
  });
  await additional
    .locator("option", { hasText: /^Subject 1$/ })
    .waitFor({ state: "attached" });
  await additional.selectOption(categories[0].id);
  for (let pageIndex = 0; pageIndex < 5; pageIndex++) {
    await page
      .getByRole("button", { name: "Load more categories", exact: true })
      .click();
    await page
      .getByText(
        String(Math.min((pageIndex + 2) * 20, 113)) +
          " of 113 matching categories loaded.",
        { exact: true }
      )
      .waitFor();
  }
  await additional.selectOption(categories[111].id);
  for (const selectedId of [
    categories[0].id,
    categories[111].id,
    categories[112].id,
  ])
    assert.equal(
      await additional.locator('option[value="' + selectedId + '"]').count(),
      0
    );
  const tags = page.getByLabel("Tags (one per line)", { exact: true });
  await tags.fill("Marathi conversations");
  await tags.press("End");
  await tags.press("Enter");
  await tags.pressSequentially("Sensor context");
  assert.equal(
    await tags.inputValue(),
    "Marathi conversations\nSensor context"
  );
  await tags.fill("  Marathi conversations  \nSensor context\n\n");
  await save(page);
  assert.deepEqual(drafts.get(scopedId).metadata.secondaryCategoryIds, [
    categories[0].id,
    categories[111].id,
  ]);
  assert.deepEqual(drafts.get(scopedId).metadata.tags, [
    "Marathi conversations",
    "Sensor context",
  ]);
  const tagWrites = requests.filter((request) =>
    ["POST", "PATCH"].includes(request.method)
  ).length;
  await tags.fill("Repeated tag\nRepeated tag");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Tags must be unique" })
    .waitFor();
  assert.equal(
    requests.filter((request) => ["POST", "PATCH"].includes(request.method))
      .length,
    tagWrites
  );
  assert.equal(await tags.inputValue(), "Repeated tag\nRepeated tag");
  await tags.fill("Marathi conversations\nSensor context");
  await page.reload();
  await sleepReady(page);
  await step(page, "3. Dataset details");
  await page
    .getByRole("list", { name: "Additional categories", exact: true })
    .getByText("Subject 112", { exact: true })
    .waitFor();
  await page
    .getByRole("button", {
      name: "Remove additional category " + categories[0].id,
      exact: true,
    })
    .click();
  await tags.fill("");
  await save(page);
  assert.deepEqual(drafts.get(scopedId).metadata.secondaryCategoryIds, [
    categories[111].id,
  ]);
  assert.deepEqual(drafts.get(scopedId).metadata.tags, []);
  console.log(
    "PASS additional categories beyond 100 retain named selections and exclude primary/duplicates; multiline tags round-trip and explicit empty lists clear"
  );

  await page
    .getByLabel("Geographic coverage", { exact: true })
    .selectOption("KNOWN");
  await page
    .getByLabel("Collection or capture period", { exact: true })
    .selectOption("KNOWN");
  await save(page);
  assert.deepEqual(drafts.get(scopedId).metadata.geographicCoverage, {
    state: "KNOWN",
  });
  assert.deepEqual(drafts.get(scopedId).metadata.collectionPeriod, {
    state: "KNOWN",
  });
  await page
    .getByLabel("Places or regions represented", { exact: true })
    .fill("India, mainly Maharashtra");
  const coverageWrites = requests.filter((request) =>
    ["POST", "PATCH"].includes(request.method)
  ).length;
  await page.getByLabel("Collection start", { exact: true }).fill("2023-02-29");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "collectionPeriod.start.value" })
    .waitFor();
  assert.equal(
    await page.getByLabel("Collection start", { exact: true }).inputValue(),
    "2023-02-29"
  );
  await page.getByLabel("Collection start", { exact: true }).fill("2025");
  await page.getByLabel("Collection end", { exact: true }).fill("2024-06");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "cannot end before it starts" })
    .waitFor();
  assert.equal(
    requests.filter((request) => ["POST", "PATCH"].includes(request.method))
      .length,
    coverageWrites
  );
  assert.equal(
    await page.getByLabel("Collection start", { exact: true }).inputValue(),
    "2025"
  );
  await page.getByLabel("Collection start", { exact: true }).fill("2019");
  await page.getByLabel("Collection end", { exact: true }).fill("2024-06");
  await save(page);
  assert.deepEqual(drafts.get(scopedId).metadata.collectionPeriod, {
    state: "KNOWN",
    start: { precision: "YEAR", value: "2019" },
    end: { precision: "MONTH", value: "2024-06" },
  });
  await step(page, "4. Review draft");
  await page.getByText("India, mainly Maharashtra", { exact: true }).waitFor();
  await page
    .getByText("2019 (year) to 2024-06 (month)", { exact: true })
    .waitFor();
  await page.getByText("Subject 112", { exact: true }).waitFor();
  await step(page, "3. Dataset details");
  await page
    .getByLabel("Geographic coverage", { exact: true })
    .selectOption("UNKNOWN");
  await page
    .getByLabel("Collection or capture period", { exact: true })
    .selectOption("NOT_APPLICABLE");
  await save(page);
  await page.reload();
  await sleepReady(page);
  await step(page, "3. Dataset details");
  assert.equal(
    await page.getByLabel("Geographic coverage", { exact: true }).inputValue(),
    "UNKNOWN"
  );
  assert.equal(
    await page
      .getByLabel("Collection or capture period", { exact: true })
      .inputValue(),
    "NOT_APPLICABLE"
  );
  assert.deepEqual(drafts.get(scopedId).metadata.geographicCoverage, {
    state: "UNKNOWN",
  });
  assert.deepEqual(drafts.get(scopedId).metadata.collectionPeriod, {
    state: "NOT_APPLICABLE",
  });
  console.log(
    "PASS incomplete coverage claims save progressively, exact year/month precision reaches saved review and explicit unknown/not-applicable choices clear stale claims"
  );
  await step(page, "1. Basics");

  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Local title survives stale save");
  mutate(scopedId, { description: "A newer remote description" });
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByText(
      "Another save changed this draft. Your local answers have been kept.",
      { exact: true }
    )
    .waitFor();
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Local title survives stale save"
  );
  await page
    .getByRole("button", { name: "Review latest saved draft", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await save(page);
  assert.equal(
    drafts.get(scopedId).metadata.title,
    "Local title survives stale save"
  );
  assert.equal(
    drafts.get(scopedId).metadata.description,
    "A newer remote description"
  );
  console.log(
    "PASS conflict keeps local input and explicitly reapplies only edited fields over newer saved data"
  );

  for (const acknowledgement of ["malformed", "503", "network"]) {
    await page
      .getByLabel("Dataset title", { exact: true })
      .fill("Retry " + acknowledgement);
    flags.acknowledgement = acknowledgement;
    const start = requests.length;
    const originalGeneration = drafts.get(scopedId).generation;
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    try {
      await page
        .getByRole("button", { name: "Retry save", exact: true })
        .waitFor();
    } catch (error) {
      console.error("Uncertain-save diagnostic", {
        acknowledgement,
        requests: requests.slice(start),
        status: await page.getByRole("status").allTextContents(),
        alerts: await page.getByRole("alert").allTextContents(),
      });
      throw error;
    }
    assert(
      await page.getByLabel("Dataset title", { exact: true }).isDisabled()
    );
    flags.blockedNetworkRequestId = "";
    await save(page, "Retry save");
    const attempts = requests
      .slice(start)
      .filter((request) => request.method === "PATCH");
    if (acknowledgement === "network")
      assert(
        attempts.length >= 2,
        "Network retransmission and manual retry must share one mutation"
      );
    else assert.equal(attempts.length, 2);
    for (const attempt of attempts)
      assert.deepEqual(attempt.body, attempts[0].body);
    assert.equal(
      drafts.get(scopedId).generation,
      originalGeneration + 1,
      "All retries acknowledge one committed mutation"
    );
  }
  console.log(
    "PASS uncertain JSON/HTTP5xx/network results retry the identical request/body without duplicate saves"
  );

  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Intended delta after lost acknowledgement");
  flags.acknowledgement = "malformed";
  flags.newerDuringAck = true;
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await page
    .getByRole("heading", { name: "Resolve the changed draft", exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Intended delta after lost acknowledgement"
  );
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await save(page);
  assert.equal(
    drafts.get(scopedId).metadata.title,
    "Intended delta after lost acknowledgement"
  );
  assert.equal(
    drafts.get(scopedId).metadata.description,
    "Remote description after uncertain acknowledgement"
  );
  console.log(
    "PASS replayed older acknowledgement retains original edit delta and newer unedited fields"
  );

  flags.failRead = scopedId;
  const createCount = requests.filter(
    (request) => request.method === "POST"
  ).length;
  await page.reload();
  await page.getByText("Fixture read unavailable", { exact: true }).waitFor();
  assert(
    await page
      .getByRole("button", { name: "Save draft", exact: true })
      .isDisabled()
  );
  assert(await page.getByLabel("Dataset title", { exact: true }).isDisabled());
  assert.equal(
    requests.filter((request) => request.method === "POST").length,
    createCount
  );
  flags.failRead = "";
  await page
    .getByRole("button", { name: "Reload saved draft", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  console.log(
    "PASS failed existing-draft reads cannot silently create a new draft"
  );

  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Unsaved navigation input");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("link", { name: "Draft proposals", exact: true })
    .click();
  assert.equal(page.url().split("/").at(-1), scopedId);
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "Unsaved navigation input"
  );
  await save(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "3. Dataset details", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByLabel("What collection does this Dataset cover?", { exact: true })
    .waitFor();
  await page
    .getByLabel("What collection does this Dataset cover?", { exact: true })
    .fill("Mobile keyboard-accessible boundary");
  await save(page);
  assert(
    (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390,
    "Mobile form must not overflow horizontally"
  );
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-entry-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await step(page, "1. Basics");
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-entry-light.png",
    fullPage: true,
    animations: "disabled",
  });
  await setTheme(page, true);
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-entry-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await setTheme(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  console.log(
    "PASS dirty SPA navigation protection, keyboard steps and narrow-screen save with actual generated dashboard CSS"
  );

  await page.setViewportSize({ width: 1280, height: 900 });
  const beforeList = requests.length;
  await page.goto(origin + "/dashboard/datasets");
  await page.getByRole("heading", { name: "My Drafts", exact: true }).waitFor();
  const table = page.getByRole("table", {
    name: "Draft dataset proposals",
    exact: true,
  });
  await table.waitFor();
  const firstRows = workspaceRows().slice(0, 20);
  const displayedRows = await table.locator("tbody tr").evaluateAll((rows) =>
    rows.map((row) => {
      const link = row.querySelector("a");
      return {
        title: link.textContent.trim(),
        href: link.getAttribute("href"),
      };
    })
  );
  assert.deepEqual(
    displayedRows,
    firstRows.map((row) => ({
      title: row.title,
      href:
        row.kind === "PREPARATION"
          ? "/dashboard/datasets/drafts/" + row.id
          : "/dashboard/datasets/" + row.id,
    }))
  );
  const overview = page.getByRole("region", {
    name: "Draft overview",
    exact: true,
  });
  const total = workspaceRows().length;
  const attached = legacyDrafts.filter((row) => row.currentUploadId).length;
  for (const [label, value] of [
    ["All drafts", total],
    ["File attached", attached],
    ["Needs a file", total - attached],
  ])
    assert.equal(
      await overview
        .getByText(label, { exact: true })
        .locator("..")
        .locator("dd")
        .textContent(),
      String(value)
    );
  const listRequests = requests.slice(beforeList);
  assert.equal(
    listRequests.filter(
      (request) => request.path === "/api/v2/supplier/dataset-drafts/workspace"
    ).length,
    1
  );
  assert(
    !listRequests.some(
      (request) =>
        request.path === "/api/v1/supplier/dataset-proposals" ||
        request.path === "/api/v2/supplier/dataset-drafts"
    )
  );
  assert.equal(
    await page
      .getByRole("heading", { name: /Earlier|New draft|Saved drafts/ })
      .count(),
    0
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Create proposal", exact: true })
      .count(),
    1
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Prepare a Dataset", exact: true })
      .count(),
    0
  );
  const pageTwo = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
        "/api/v2/supplier/dataset-drafts/workspace" &&
      new URL(response.url()).searchParams.get("page") === "2"
  );
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await pageTwo;
  await page
    .getByText("Showing 21–" + total + " of " + total + " drafts", {
      exact: true,
    })
    .waitFor();
  const displayedPageTwo = await table
    .locator("tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) => row.querySelector("a").textContent.trim())
    );
  assert.deepEqual(
    displayedPageTwo,
    workspaceRows()
      .slice(20)
      .map((row) => row.title)
  );
  const returnFirst = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
        "/api/v2/supplier/dataset-drafts/workspace" &&
      new URL(response.url()).searchParams.get("page") === "1"
  );
  await page
    .getByRole("button", { name: "Previous page", exact: true })
    .click();
  await returnFirst;
  await page
    .getByText("Showing 1–20 of " + total + " drafts", { exact: true })
    .waitFor();
  flags.workspaceTake = 12;
  const beforeShrink = requests.length;
  const clamped = page.waitForResponse(async (response) => {
    const url = new URL(response.url());
    return (
      url.pathname === "/api/v2/supplier/dataset-drafts/workspace" &&
      url.searchParams.get("page") === "1" &&
      (await response.json()).data.total === 12
    );
  });
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await clamped;
  await page.getByText("12 drafts in this view", { exact: true }).waitFor();
  assert.equal(await table.locator("tbody tr").count(), 12);
  assert.deepEqual(
    requests.slice(beforeShrink).map((request) => ({
      path: request.path,
      page: new URLSearchParams(request.query).get("page"),
    })),
    [
      { path: "/api/v2/supplier/dataset-drafts/workspace", page: "2" },
      { path: "/api/v2/supplier/dataset-drafts/workspace", page: "1" },
    ]
  );
  flags.workspaceTake = null;
  await page.reload();
  await table.waitFor();
  console.log(
    "PASS shrinking draft inventories clamp to a freshly read valid page without an empty-inventory claim or cross-source fallback"
  );
  const lateSearch = page
    .waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          "/api/v2/supplier/dataset-drafts/workspace" &&
        new URL(response.url()).searchParams.get("q") === "Speech"
    )
    .catch(() => null);
  const slowRequest = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname ===
        "/api/v2/supplier/dataset-drafts/workspace" &&
      new URL(request.url()).searchParams.get("q") === "Speech"
  );
  await page
    .getByLabel("Search draft proposals", { exact: true })
    .fill("Speech");
  await slowRequest;
  await page
    .getByLabel("Search draft proposals", { exact: true })
    .fill("Only a title");
  await page.getByText("1 draft in this view", { exact: true }).waitFor();
  await lateSearch;
  assert.equal(
    await page.getByText("1 draft in this view", { exact: true }).count(),
    1
  );
  assert.equal(
    await page.getByRole("button", { name: "Next page", exact: true }).count(),
    0
  );
  for (const [query, id, title] of [
    ["KB-LEGACY-001", legacyDrafts[0].id, legacyDrafts[0].title],
    [titleOnlyId, titleOnlyId, "Only a title is needed"],
    ["%_", legacyDrafts[5].id, legacyDrafts[5].title],
  ]) {
    await page
      .getByLabel("Search draft proposals", { exact: true })
      .fill(query);
    const link = page.getByRole("link", { name: title, exact: true }).first();
    await link.waitFor();
    assert.equal(
      await link.getAttribute("href"),
      id.startsWith("legacy")
        ? "/dashboard/datasets/" + id
        : "/dashboard/datasets/drafts/" + id
    );
    assert.equal(
      await page.getByText("1 draft in this view", { exact: true }).count(),
      1
    );
  }
  await page
    .getByLabel("Search draft proposals", { exact: true })
    .fill(titleOnlyId);
  await page
    .getByRole("link", { name: "Only a title is needed", exact: true })
    .first()
    .click();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  assert.equal(
    new URL(page.url()).pathname,
    "/dashboard/datasets/drafts/" + titleOnlyId
  );
  flags.workspaceFailure = "FORBIDDEN";
  const beforeFailure = requests.length;
  await page.goto(origin + "/dashboard/datasets");
  await page
    .getByText("Fixture inventory access denied", { exact: true })
    .waitFor();
  assert(
    !requests
      .slice(beforeFailure)
      .some((request) => request.path === "/api/v1/supplier/dataset-proposals")
  );
  flags.workspaceFailure = "";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await table.waitFor();
  flags.workspaceMalformed = true;
  await page.reload();
  await page
    .getByText("The draft inventory response could not be read. Try again.", {
      exact: true,
    })
    .waitFor();
  flags.workspaceMalformed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await table.waitFor();
  console.log(
    "PASS single combined inventory/counts/search/paging, mixed resume identities, literal ID search, stale-response protection and fail-closed reads without legacy fallback"
  );
  for (const [oldPath, expected] of [
    ["/prepare", ""],
    ["/prepare/new", "/create"],
    ["/prepare/" + scopedId, "/drafts/" + scopedId],
  ]) {
    await page.goto(origin + "/dashboard/datasets" + oldPath);
    await page.waitForURL(origin + "/dashboard/datasets" + expected);
  }
  const beforeSubmitted = requests.length;
  await page.goto(origin + "/dashboard/datasets?status=submitted");
  await page
    .getByRole("link", { name: "Existing submitted proposal", exact: true })
    .first()
    .waitFor();
  assert(
    !requests
      .slice(beforeSubmitted)
      .some((request) =>
        request.path.startsWith("/api/v2/supplier/dataset-drafts")
      )
  );
  console.log(
    "PASS old preparation bookmarks redirect and historical submitted proposal view remains unchanged"
  );
  await showNew(page);
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("New draft with lost acknowledgement");
  const beforeCreateRetry = requests.length;
  const beforeDraftCount = drafts.size;
  flags.acknowledgement = "malformed";
  flags.newerDuringAck = true;
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await page
    .getByRole("heading", { name: "Resolve the changed draft", exact: true })
    .waitFor();
  const replayedCreateId = page.url().split("/").at(-1);
  assert(
    drafts.has(replayedCreateId),
    "A replayed create must reserve its stable resume URL before conflict resolution"
  );
  assert.equal(drafts.size, beforeDraftCount + 1);
  const createAttempts = requests
    .slice(beforeCreateRetry)
    .filter((request) => request.method === "POST");
  assert.equal(createAttempts.length, 2);
  assert.deepEqual(createAttempts[0].body, createAttempts[1].body);
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await save(page);
  assert.equal(
    drafts.get(replayedCreateId).metadata.title,
    "New draft with lost acknowledgement"
  );
  assert.equal(
    drafts.get(replayedCreateId).metadata.description,
    "Remote description after uncertain acknowledgement"
  );
  await page.reload();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  assert.equal(
    await page.getByLabel("Dataset title", { exact: true }).inputValue(),
    "New draft with lost acknowledgement"
  );
  console.log(
    "PASS uncertain CREATE replay retains stable URL and original delta across newer saves and reload"
  );

  await page.evaluate((id) => window.showEditor(id), titleOnlyId);
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  await page
    .getByRole("checkbox", { name: /^Tables and spreadsheets/ })
    .check();
  await step(page, "3. Dataset details");
  await page
    .getByLabel("What does one record represent?", { exact: true })
    .fill("A locally declared transaction");
  mutate(titleOnlyId, {
    profiles: { images: { subject: "Unedited remote image description" } },
  });
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("button", { name: "Review latest saved draft", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Reapply my changes to latest draft",
      exact: true,
    })
    .click();
  await save(page);
  assert.equal(
    drafts.get(titleOnlyId).metadata.profiles.tabular.recordUnit,
    "A locally declared transaction"
  );
  assert.equal(
    drafts.get(titleOnlyId).metadata.profiles.images.subject,
    "Unedited remote image description"
  );
  console.log(
    "PASS newly introduced nested answers reapply without losing unedited remote profile fields"
  );

  await showNew(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByLabel("Dataset title", { exact: true })
    .fill("Mixed first-person training collection");
  await page.locator('input[type="radio"][value="FULL_AND_SAMPLE"]').check();
  for (const name of ["Video", "Speech and other audio", "Sensor readings"])
    await page.getByRole("checkbox", { name: new RegExp("^" + name) }).check();
  for (const name of [
    "Healthcare content",
    "Egocentric / first-person capture",
  ])
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.getByLabel("Dataset license", { exact: true }).fill("CC BY 4.0");
  for (const width of [1280, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await assertTileLayout(page, "Basics", "Category, source & license", width);
    assert.equal(
      await page.getByLabel("Dataset title", { exact: true }).inputValue(),
      "Mixed first-person training collection"
    );
    assert.equal(
      await page
        .locator('input[type="radio"][value="FULL_AND_SAMPLE"]')
        .isChecked(),
      true
    );
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await save(page);
  const bentoId = page.url().split("/").at(-1);
  await assertNoDecorativeShadows(page);
  await assertVisibleKeyboardFocus(page);
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-basics-light.png",
    fullPage: true,
    animations: "disabled",
  });
  await setTheme(page, true);
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-basics-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  const categorySelect = page.getByLabel("Primary category", { exact: true });
  const darkMenuColours = await categorySelect.evaluate((select) => {
    const option = select.querySelector("option");
    const styles = getComputedStyle(option);
    return {
      scheme: getComputedStyle(select).colorScheme,
      background: styles.backgroundColor,
      foreground: styles.color,
      surface: getComputedStyle(select).getPropertyValue("--dashboard-surface"),
    };
  });
  assert.equal(darkMenuColours.scheme, "dark");
  assert.notEqual(darkMenuColours.background, "rgba(0, 0, 0, 0)");
  assert.notEqual(darkMenuColours.background, darkMenuColours.foreground);
  await categorySelect.click();
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-dark-native-select.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await setTheme(page, false);
  await step(page, "3. Dataset details");
  const bentoBoundary =
    "First-person hospital training recordings, with synchronized audio and sensor streams, covering the declared collection period.";
  await page
    .getByLabel("What collection does this Dataset cover?", { exact: true })
    .fill(bentoBoundary);
  await page
    .getByLabel("Short summary", { exact: true })
    .fill("Video, speech and motion signals in one represented collection.");
  await page
    .getByLabel("Quality checks and known quality", { exact: true })
    .fill("Supplier-described checks; file inspection remains pending.");
  await page
    .getByLabel("Recording context", { exact: true })
    .fill("Training conversations recorded alongside video");
  await page
    .getByLabel("What do the videos show?", { exact: true })
    .fill("Supervised training activities");
  await page
    .getByLabel("Sensor channels and units", { exact: true })
    .fill(
      "Acceleration in m/s squared; angular velocity in radians per second"
    );
  await page
    .getByLabel("Camera mounting position", { exact: true })
    .fill("Head-mounted");
  await page
    .getByLabel("How were personal identifiers handled?", { exact: true })
    .fill("Supplier declaration of pseudonymisation; inspection pending");
  await page
    .getByLabel("How was the sample selected?", { exact: true })
    .fill("A short continuous interval from the collection");
  await page
    .getByLabel("Add a quantity to Represented collection quantity", {
      exact: true,
    })
    .selectOption("AUDIO_DURATION");
  await page
    .getByLabel("Represented collection quantity: Audio duration answer", {
      exact: true,
    })
    .selectOption("ESTIMATED");
  await page
    .getByLabel("Represented collection quantity: Audio duration value", {
      exact: true,
    })
    .fill("200");
  await page
    .getByLabel("Represented collection quantity: Audio duration unit", {
      exact: true,
    })
    .selectOption("HOUR");
  await save(page);
  const bentoMetadata = copy(drafts.get(bentoId).metadata);
  for (const width of [1280, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await assertTileLayout(
      page,
      "Dataset details",
      "Represented collection quantity",
      width
    );
    assert.equal(
      await page
        .getByLabel("What collection does this Dataset cover?", { exact: true })
        .inputValue(),
      bentoBoundary
    );
    assert.equal(
      await page
        .getByLabel("Camera mounting position", { exact: true })
        .inputValue(),
      "Head-mounted"
    );
    assert.equal(
      await page
        .getByLabel("Represented collection quantity: Audio duration value", {
          exact: true,
        })
        .inputValue(),
      "200"
    );
  }
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-details-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-details-light.png",
    fullPage: true,
    animations: "disabled",
  });
  await setTheme(page, true);
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-details-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-details-mobile-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await setTheme(page, false);
  await step(page, "4. Review draft");
  await assertTileLayout(
    page,
    "Saved draft summary",
    "Saved declared quantities",
    1280
  );
  await page.getByText("CC BY 4.0", { exact: true }).waitFor();
  await step(page, "3. Dataset details");
  assert.deepEqual(
    drafts.get(bentoId).metadata,
    bentoMetadata,
    "Changing viewports and review steps must not mutate or reset saved answers"
  );
  await page.goto(origin + "/dashboard/datasets");
  await page.getByRole("heading", { name: "My Drafts", exact: true }).waitFor();
  await page
    .getByRole("link", { name: "Existing supplier proposal", exact: true })
    .first()
    .waitFor();
  for (const width of [1280, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const header = await page
      .getByLabel("Search draft proposals", { exact: true })
      .boundingBox();
    const guidance = await page
      .getByText(
        "Open a draft to continue its information and files. Saving stays separate from submitting it for admin review.",
        { exact: true }
      )
      .boundingBox();
    assert(header && guidance);
    if (width >= 1024)
      assert(
        guidance.x > header.x + 100 && Math.abs(guidance.y - header.y) <= 24,
        "Desktop inventory summary and guidance occupy aligned tiles"
      );
    else
      assert(
        guidance.y > header.y + 30,
        "Mobile inventory tiles preserve reading order"
      );
    assert(
      (await page.evaluate(() => document.documentElement.scrollWidth)) <=
        width,
      "Inventory layout must fit the viewport"
    );
    const records =
      width >= 1280
        ? page.getByRole("region", {
            name: "Draft dataset proposals",
            exact: true,
          })
        : page.getByRole("list", {
            name: "Draft dataset proposals",
            exact: true,
          });
    await records.waitFor();
    const clipped = await records
      .getByRole("link", { name: "Continue", exact: true })
      .evaluateAll(
        (links) =>
          links.filter((link) => {
            const rect = link.getBoundingClientRect();
            return (
              rect.right > document.documentElement.clientWidth + 1 ||
              rect.left < 0
            );
          }).length
      );
    assert.equal(
      clipped,
      0,
      `Every resume action must remain within the ${width}px viewport`
    );
    if (width === 1024 || width === 390) {
      await setTheme(page, true);
      await scrollMainToTop(page);
      await page.screenshot({
        path:
          width === 1024
            ? "/tmp/kuinbee-proposal-bento-drafts-1024-dark.png"
            : "/tmp/kuinbee-proposal-bento-drafts-mobile-dark.png",
        fullPage: true,
        animations: "disabled",
      });
      await setTheme(page, false);
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  const desktopFrame = page.getByRole("region", {
    name: "Draft dataset proposals",
    exact: true,
  });
  assert(
    await desktopFrame.evaluate(
      (node) => node.scrollWidth <= node.clientWidth + 1
    ),
    "Desktop draft table must keep actions visible without horizontal scrolling"
  );
  await assertNoDecorativeShadows(page);
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-drafts-light.png",
    fullPage: true,
    animations: "disabled",
  });
  await setTheme(page, true);
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-drafts-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Collapse navigation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand navigation", exact: true })
    .waitFor();
  assert(
    await desktopFrame.evaluate(
      (node) => node.scrollWidth <= node.clientWidth + 1
    ),
    "Collapsed navigation must retain visible table actions"
  );
  await scrollMainToTop(page);
  await page.screenshot({
    path: "/tmp/kuinbee-proposal-bento-drafts-collapsed-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Expand navigation", exact: true })
    .click();
  await setTheme(page, false);
  console.log(
    "PASS responsive bento placement, tile-contained controls, retained mixed modality/context state, mobile reading order and shadow-free panels with visible keyboard focus"
  );

  const stagingPage = await browser.newPage();
  stagingPage.on("pageerror", (error) => errors.push(error.message));
  await stagingPage.goto(origin + "/dashboard/datasets?environment=staging");
  await stagingPage
    .getByRole("heading", { name: "My Drafts", exact: true })
    .waitFor();
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 1280, height: 768 },
    { width: 1024, height: 600 },
  ]) {
    await stagingPage.setViewportSize(viewport);
    const strip = await stagingPage
      .locator('[data-environment="staging"]')
      .boundingBox();
    const shell = await stagingPage
      .locator('[data-ui-scope="supplier-dashboard"]')
      .boundingBox();
    const sidebar = await stagingPage
      .locator(".dashboard-shell-sidebar")
      .boundingBox();
    const toggle = stagingPage.getByRole("button", {
      name: "Collapse navigation",
      exact: true,
    });
    const toggleBox = await toggle.boundingBox();
    assert(strip && shell && sidebar && toggleBox);
    assert.equal(strip.height, 28);
    assert.equal(shell.y, 28);
    assert.equal(shell.height, viewport.height - 28);
    assert.equal(sidebar.height, shell.height);
    assert(
      toggleBox.y >= sidebar.y &&
        toggleBox.y + toggleBox.height <= viewport.height,
      "Staging navigation toggle must remain completely visible below the inline environment strip"
    );
    await toggle.click();
    const expand = stagingPage.getByRole("button", {
      name: "Expand navigation",
      exact: true,
    });
    const expandBox = await expand.boundingBox();
    assert(expandBox && expandBox.y + expandBox.height <= viewport.height);
    await expand.click();
  }
  await stagingPage.setViewportSize({ width: 1280, height: 900 });
  await setTheme(stagingPage, true);
  await scrollMainToTop(stagingPage);
  await stagingPage.screenshot({
    path: "/tmp/kuinbee-proposal-bento-staging-shell-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await stagingPage.close();
  console.log(
    "PASS staging sidebar inherits height below its 28px strip; navigation controls stay fully visible in expanded and collapsed desktop layouts"
  );

  const beforeProduction = requests.length;
  const productionPage = await browser.newPage();
  await productionPage.goto(
    origin + "/dashboard/datasets/create?environment=production"
  );
  await productionPage
    .getByRole("heading", { name: "Create a dataset proposal", exact: true })
    .waitFor();
  assert.equal(
    await productionPage.locator('[data-environment="staging"]').count(),
    0
  );
  assert.equal(
    (await productionPage.locator(".dashboard-shell-sidebar").boundingBox())
      .height,
    productionPage.viewportSize().height,
    "Production retains its full viewport sidebar height"
  );
  assert.equal(
    await productionPage
      .getByRole("heading", { name: "Prepare a Dataset" })
      .count(),
    0
  );
  assert.equal(
    await productionPage.evaluate(() => window.tryProductionWrite()),
    "NOT_ENABLED"
  );
  assert(
    !requests
      .slice(beforeProduction)
      .some((request) =>
        request.path.startsWith("/api/v2/supplier/dataset-drafts")
      )
  );
  for (const path of [
    "/prepare",
    "/prepare/new",
    "/drafts/" + scopedId,
    "/drafts/new",
    "/drafts/bad-id",
  ]) {
    await productionPage.goto(
      origin + "/dashboard/datasets" + path + "?environment=production"
    );
    await productionPage
      .getByRole("heading", { name: "Not found", exact: true })
      .waitFor();
  }
  await page.goto(origin + "/dashboard/datasets/drafts/bad-id");
  await page.getByRole("heading", { name: "Not found", exact: true }).waitFor();
  await productionPage.close();
  assert(
    !requests.some(
      (request) =>
        /submit|presign|publish|payment/.test(request.path) ||
        (request.method !== "GET" && /upload/.test(request.path))
    )
  );
  assert.deepEqual(fixtureErrors, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    "PASS production UI/API guard, pinned browser runtime and zero intake writes/submission/payment effects"
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolveClose) => server.close(resolveClose));
}
