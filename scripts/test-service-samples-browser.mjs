import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
const ROLE = "supplier";
const require = createRequire(import.meta.url);
const postcss = require(
  require.resolve("postcss", {
    paths: [require.resolve("@tailwindcss/postcss")],
  })
);
const css = (
  await postcss([
    require("@tailwindcss/postcss")({ base: process.cwd() }),
  ]).process(await readFile("src/app/globals.css", "utf8"), {
    from: resolve("src/app/globals.css"),
  })
).css;
const ready = {
  id: "ready-sample",
  fileName: "sample.csv",
  contentType: "text/csv",
  sizeBytes: "12",
  status: "READY",
};
const pending = {
  ...ready,
  id: "pending-sample",
  fileName: "pending.csv",
  status: "STAGED",
};
const long = {
  ...ready,
  id: "long-sample",
  fileName:
    "Representative engineering and multilingual collection example " +
    "long-name-".repeat(10) +
    ".csv",
};
const actorModule =
  ROLE === "buyer" ? "@/core/providers/AuthProvider" : "@/store/auth.store";
const initialActor =
  ROLE === "supplier"
    ? `useAuthStore.getState().login({id:'fixture-supplier',email:'supplier@example.test',name:'Fixture supplier',role:'supplier'});`
    : ROLE === "admin"
      ? `useAuthStore.getState().setUser({id:'fixture-admin',email:'admin@example.test',userType:'SUPERADMIN',status:'ACTIVE',emailVerified:true});`
      : "";
const signIn =
  ROLE === "buyer"
    ? "setTestActor('fixture-buyer')"
    : ROLE === "supplier"
      ? "useAuthStore.getState().login({id:'fixture-supplier',email:'supplier@example.test',name:'Fixture supplier',role:'supplier'})"
      : "useAuthStore.getState().setUser({id:'fixture-admin',email:'admin@example.test',userType:'SUPERADMIN',status:'ACTIVE',emailVerified:true})";
const signOut =
  ROLE === "buyer"
    ? "setTestActor(undefined)"
    : ROLE === "supplier"
      ? "useAuthStore.getState().logout()"
      : "useAuthStore.getState().setUser(null)";
const component =
  ROLE === "buyer"
    ? "./src/features/custom-collection/ServiceSampleFiles"
    : "./src/components/custom-collection/ServiceSampleFiles";
const entry = `import React,{useState}from'react';import{createRoot}from'react-dom/client';import{ServiceSampleFiles}from'${component}';import{${ROLE === "buyer" ? "setTestActor" : "useAuthStore"}}from'${actorModule}';${ROLE === "supplier" ? "import{customCollectionApi}from'./src/lib/api/custom-collection';" : ""}${initialActor}const readonly=new URLSearchParams(location.search).has('readonly');function App(){const[files,setFiles]=useState(${ROLE === "supplier" ? `readonly?${JSON.stringify([ready, long])}:[]` : JSON.stringify([ready, pending, long])});return <div style={{padding:24,maxWidth:1100,margin:'0 auto'}}><div style={{display:'flex',gap:12,marginBottom:20}}><button onClick={()=>{${signIn}}}>Test sign in</button><button onClick={()=>{${signOut}}}>Test sign out</button></div><ServiceSampleFiles ${ROLE === "buyer" ? `slug="synthetic-service" revisionId="synthetic-revision" files={files}` : `serviceId="synthetic-service" revisionId="synthetic-revision" files={files} ${ROLE === "supplier" ? `editable={!readonly} onChanged={async()=>{const d=await customCollectionApi.get('synthetic-service');setFiles(d.service.workingRevision.sampleFiles)}}` : ""}`}/></div>}createRoot(document.getElementById('root')).render(<App/>);`;
const bundle = await build({
  stdin: { contents: entry, loader: "jsx", resolveDir: process.cwd() },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: {
    "process.env": JSON.stringify({
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_ENV: "local",
      NEXT_PUBLIC_API_URL: "",
    }),
  },
  plugins: [
    {
      name: "sample-fixture",
      setup(b) {
        b.onResolve(
          {
            filter:
              /^@\/(core\/api\/client|lib\/api\/client|constants\/api.constants|core\/providers\/(AuthProvider|ModalProvider))$/,
          },
          (args) => ({ path: args.path, namespace: "fixture" })
        );
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          loader: "js",
          resolveDir: process.cwd(),
          contents: args.path.endsWith("api.constants")
            ? 'export const API_BASE_URL="";export const API_ROUTES={};'
            : args.path.endsWith("AuthProvider")
              ? `import{useSyncExternalStore}from'react';let actor;const listeners=new Set;export const setTestActor=value=>{actor=value;for(const fn of listeners)fn()};export function useAuth(){const value=useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>actor);return{user:value?{id:value}:null,isAuthenticated:!!value}}`
              : args.path.endsWith("ModalProvider")
                ? `export function useModal(){return{openModal:name=>{window.__loginOpened=(window.__loginOpened||0)+1;window.dispatchEvent(new CustomEvent('fixture-login',{detail:name}))}}}`
                : `async function request(path,method,body){const r=await fetch(${ROLE === "admin" ? "'/api'+path" : "path"},{method,credentials:'include',headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error?.message||'Request failed');return ${ROLE === "admin" ? "{data}" : "data.data"}};export const apiClient={post:(path,body)=>request(path,'POST',body),get:path=>request(path,'GET')};`,
        }));
      },
    },
  ],
});
let files = [],
  requests = [],
  transfers = [],
  configFailures = 0,
  delayDownload = false,
  slowStorage = false,
  badLink = false,
  expired = false;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://fixture.test");
    if (url.pathname === "/style.css") {
      res.writeHead(200, { "content-type": "text/css" });
      return res.end(css);
    }
    if (url.pathname === "/bundle.js") {
      res.writeHead(200, { "content-type": "application/javascript" });
      return res.end(bundle.outputFiles[0].text);
    }
    if (url.pathname.startsWith("/download/")) {
      res.writeHead(200, {
        "content-type": "application/octet-stream",
        "content-disposition": 'attachment; filename="sample.csv"',
      });
      return res.end("sample bytes");
    }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const bytes = Buffer.concat(chunks);
    if (url.pathname.startsWith("/storage/")) {
      assert.equal(req.headers["if-none-match"], "*");
      transfers.push(bytes);
      if (slowStorage)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      res.writeHead(200);
      return res.end();
    }
    if (!url.pathname.startsWith("/api/")) {
      files =
        ROLE === "supplier"
          ? url.searchParams.has("readonly")
            ? [ready, long]
            : []
          : [ready, pending, long];
      configFailures = url.searchParams.has("failConfig") ? 1 : 0;
      badLink = url.searchParams.has("badLink");
      expired = url.searchParams.has("expired");
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(
        '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><main id="root"></main><script src="/bundle.js"></script></body></html>'
      );
    }
    const body = bytes.length ? JSON.parse(bytes.toString()) : {};
    requests.push({ path: url.pathname, method: req.method, body });
    let data;
    if (url.pathname.endsWith("/sample-upload-config")) {
      if (configFailures-- > 0) {
        res.writeHead(503, { "content-type": "application/json" });
        return res.end(
          JSON.stringify({
            success: false,
            error: { message: "Upload limits temporarily unavailable" },
          })
        );
      }
      data = {
        maxFiles: 10,
        maximumTotalBytes: "5000000000",
        formats: [
          {
            extensions: [".csv", ".zip"],
            mimeTypes: ["text/csv", "application/zip"],
          },
        ],
      };
    } else if (url.pathname.endsWith("/download-url")) {
      if (delayDownload)
        await new Promise((resolve) => setTimeout(resolve, 500));
      data = {
        url: badLink
          ? "javascript:window.__badDownload=true"
          : `http://${req.headers.host}/download/sample`,
        expiresAt: new Date(
          Date.now() + (expired ? -1000 : 60000)
        ).toISOString(),
        fileName: "sample.csv",
      };
    } else if (url.pathname.endsWith("/samples") && req.method === "POST") {
      const file = {
        id: "upload-" + files.length,
        fileName: body.fileName,
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
        status: "STAGED",
      };
      files.push(file);
      data = {
        sample: file,
        upload: {
          uploadUrl: `http://${req.headers.host}/storage/${file.id}`,
          headers: { "content-type": file.contentType, "if-none-match": "*" },
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      };
    } else if (url.pathname.endsWith("/complete")) {
      const file = files.find((f) => f.id === url.pathname.split("/").at(-2));
      assert(file);
      file.status = "READY";
      data = { sample: file };
    } else if (req.method === "DELETE") {
      files = files.filter(
        (file) => file.id !== url.pathname.split("/").at(-1)
      );
      data = { removed: true };
    } else if (url.pathname.endsWith("/synthetic-service"))
      data = { service: { workingRevision: { sampleFiles: files } } };
    else throw Error("Unexpected fixture route " + url.pathname);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ success: true, data }));
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ success: false, error: { message: error.message } })
    );
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port;
const artifacts = resolve(".artifacts/service-samples");
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let downloads = 0;
page.on("download", () => downloads++);
try {
  await page.goto(base);
  if (ROLE === "supplier") {
    await page
      .getByRole("button", { name: "Add sample files", exact: true })
      .waitFor();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent.includes("Add sample files") && !b.disabled
      )
    );
    await page
      .getByLabel("Service sample files", { exact: true })
      .setInputFiles({
        name: "example.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("sample bytes"),
      });
    await page.getByText("example.csv", { exact: true }).waitFor();
    await page.getByText(/Uploaded/).waitFor();
    assert.equal(transfers[0].toString(), "sample bytes");
    assert(
      requests.some(
        (r) =>
          r.method === "POST" &&
          r.path.endsWith("/samples") &&
          r.body.fileName === "example.csv" &&
          r.body.sizeBytes === "12"
      )
    );
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /View sample|Download sample/ })
      .first()
      .click();
    const d = await downloaded;
    assert.equal(await readFile(await d.path(), "utf8"), "sample bytes");
    await page
      .getByRole("button", { name: "Remove example.csv", exact: true })
      .click();
    await page.getByText("No samples added.", { exact: true }).waitFor();
    await page.goto(base + "/?failConfig=1");
    await page
      .getByText("Upload limits temporarily unavailable", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Retry upload setup", exact: true })
      .click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent.includes("Add sample files") && !b.disabled
      )
    );
    slowStorage = true;
    const started = page.waitForRequest((r) => r.url().includes("/storage/"));
    await page
      .getByLabel("Service sample files", { exact: true })
      .setInputFiles({
        name: "interrupt.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("sample bytes"),
      });
    await started;
    await page
      .getByRole("button", { name: "Test sign out", exact: true })
      .click();
    await page.waitForTimeout(1200);
    assert(
      !requests.some(
        (r) =>
          r.path.endsWith("/complete") &&
          r.path.includes("upload-0") &&
          requests.findLastIndex((x) => x.path === r.path) >
            requests.findLastIndex((x) => x.body.fileName === "interrupt.csv")
      ),
      "Signing out must stop finalization"
    );
    slowStorage = false;
    await page.goto(base + "/?readonly=1");
    assert.equal(
      await page
        .getByRole("button", { name: "Add sample files", exact: true })
        .count(),
      0
    );
    assert.equal(
      await page.getByRole("button", { name: /^Remove / }).count(),
      0
    );
  } else {
    if (ROLE === "buyer") {
      assert.equal(
        await page.getByText("pending.csv", { exact: true }).count(),
        0
      );
      await page
        .getByRole("button", { name: "Sign in to download", exact: true })
        .first()
        .click();
      assert.equal(await page.evaluate(() => window.__loginOpened), 1);
      assert.equal(
        requests.filter((r) => r.path.endsWith("/download-url")).length,
        0
      );
      await page
        .getByRole("button", { name: "Test sign in", exact: true })
        .click();
    } else
      assert.equal(
        await page
          .locator("li")
          .filter({ hasText: "pending.csv" })
          .getByRole("button")
          .isDisabled(),
        true
      );
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download sample", exact: true })
      .first()
      .click();
    const d = await downloaded;
    assert.equal(await readFile(await d.path(), "utf8"), "sample bytes");
    const post = requests.find((r) => r.path.endsWith("/download-url"));
    assert(post.path.includes(ROLE === "admin" ? "/admin/" : "/marketplace/"));
    if (ROLE === "buyer")
      assert.deepEqual(post.body, {
        revisionId: "synthetic-revision",
        sampleId: "ready-sample",
      });
    const before = downloads;
    delayDownload = true;
    const pendingLink = page.waitForRequest((r) =>
      r.url().endsWith("/download-url")
    );
    await page
      .getByRole("button", { name: "Download sample", exact: true })
      .first()
      .click();
    await pendingLink;
    await page
      .getByRole("button", { name: "Test sign out", exact: true })
      .click();
    await page.waitForTimeout(700);
    assert.equal(
      downloads,
      before,
      "Account change must discard the pending link"
    );
    delayDownload = false;
    await page.goto(base + "/?badLink=1");
    await page
      .getByRole("button", { name: "Test sign in", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Download sample", exact: true })
      .first()
      .click();
    await page.getByRole("alert").waitFor();
    assert.equal(await page.evaluate(() => window.__badDownload), undefined);
  }
  for (const theme of ["light", "dark"])
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(
        (theme) =>
          document.documentElement.classList.toggle("dark", theme === "dark"),
        theme
      );
      await page.screenshot({
        path: resolve(artifacts, `${ROLE}-${theme}-${width}.png`),
        fullPage: true,
      });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        ),
        "Sample files must fit the viewport"
      );
    }
  assert.deepEqual(errors, []);
  console.log(
    `PASS ${ROLE} service samples: actual component and API adapters, revision/asset identities, controlled downloads, session changes and responsive themes`
  );
} catch (error) {
  await page.screenshot({
    path: resolve(artifacts, "failure.png"),
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
