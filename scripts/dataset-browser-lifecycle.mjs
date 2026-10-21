// Test instrumentation only. No requests, signals or responses are replaced.
export function installDatasetReadDiagnostics() {
  const documentId = crypto.randomUUID();
  window.__datasetReadDocument = documentId;
  const nativeFetch = window.fetch;
  window.fetch = function (input, options) {
    const result = nativeFetch.call(this, input, options);
    const signal = options?.signal ?? (input instanceof Request ? input.signal : undefined);
    const method = (options?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = new URL(input instanceof Request ? input.url : String(input), location.href).href;
    // Rethrow the identical rejection. Returning the original promise after
    // adding a rejection observer would mask an otherwise unhandled fetch.
    return result.catch(error => {
      console.log("FAILED_FIXTURE_READ " + JSON.stringify({ documentId, url, method,
        aborted: Boolean(signal?.aborted), name: error.name, message: error.message, at: Date.now() }));
      throw error;
    });
  };
}

export async function recordDatasetNavigation(page, transitions, navigate) {
  const fromDocument = await page.evaluate(() => window.__datasetReadDocument ?? null);
  const transition = { fromDocument, startedAt: Date.now(), completedAt: null };
  transitions.push(transition);
  try { return await navigate(); }
  finally { transition.completedAt = Date.now(); }
}

export function classifyDatasetBrowserErrors({ engine, origin, errors, readFailures, transitions }) {
  const unexpected = [], expectedCancellations = [];
  for (const error of errors) {
    const signature = error.stack?.split("\n")[0].match(/^Fetch API cannot load (\S+) due to access control checks\.$/);
    let url;
    try { url = signature && new URL(signature[1]); } catch { /* Unrecognized error stays fatal. */ }
    const paired = engine === "webkit" && url?.origin === origin &&
      /^\/api\/v2\/supplier\/dataset-drafts\/c[a-z0-9]{24}(\/|$)/.test(url.pathname) &&
      readFailures.find(failure => failure.url === url.href && failure.method === "GET" &&
        Math.abs(failure.at - error.at) <= 1000 &&
        (failure.aborted || transitions.some(transition => transition.fromDocument &&
          transition.fromDocument === failure.documentId && transition.completedAt !== null &&
          failure.at >= transition.startedAt && failure.at <= transition.completedAt)));
    if (paired) expectedCancellations.push({ url: url.href,
      proof: paired.aborted ? "REJECTED_READ_WITH_ABORTED_SIGNAL" : "REJECTED_READ_FROM_NAVIGATING_DOCUMENT" });
    else unexpected.push(error);
  }
  return { unexpected, expectedCancellations };
}
