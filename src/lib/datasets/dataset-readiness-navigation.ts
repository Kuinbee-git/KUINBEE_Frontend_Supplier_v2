// These paths identify existing controls. They never determine requiredness,
// upload eligibility or submission permission; the backend owns those checks.
export function datasetPreparationStepForField(field?: string): 0 | 1 | 2 | 3 {
  const root = field?.split(".")[0];
  if (root === "pricing") return 3;
  if (
    !root ||
    ["files", "fullMeasurements", "sampleMeasurements"].includes(root)
  )
    return 1;
  if (
    [
      "title",
      "uploadChoice",
      "modalities",
      "contexts",
      "primaryCategoryId",
      "sourceId",
      "license",
    ].includes(root)
  )
    return 0;
  return 2;
}

export function focusDatasetPreparationField(root: HTMLElement, field: string) {
  // Compare attribute values directly: a server field path is never interpolated
  // into a CSS selector, interpreted as HTML, or used to fetch another record.
  const controls = Array.from(
    root.querySelectorAll<HTMLElement>("[data-dataset-field]")
  ).filter(
    (node) =>
      !node.closest("[hidden]") &&
      (node.getClientRects().length > 0 || node.closest("details:not([open])"))
  );
  const exact = controls.find((node) => node.dataset.datasetField === field);
  const parent = controls
    .filter((node) => field.startsWith(node.dataset.datasetField + "."))
    .sort(
      (a, b) => b.dataset.datasetField!.length - a.dataset.datasetField!.length
    )[0];
  const section = Array.from(
    root.querySelectorAll<HTMLElement>(
      `[data-dataset-step="${datasetPreparationStepForField(field)}"]`
    )
  ).find(
    (node) => !node.closest("[hidden]") && node.getClientRects().length > 0
  );
  const target = exact ?? parent ?? section;
  if (!target || target.closest("[hidden]")) return false;
  for (
    let node: HTMLElement | null = target;
    node && node !== root;
    node = node.parentElement
  )
    if (node instanceof HTMLDetailsElement) node.open = true;
  const selector =
    "input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)";
  const control = target.matches(selector)
    ? target
    : Array.from(target.querySelectorAll<HTMLElement>(selector)).find(
        (node) => !node.closest("[hidden]") && node.getClientRects().length > 0
      );
  // A permitted read-only/managed field can still be explained and located;
  // focusing its container never enables it or changes the supplier's answers.
  const focus =
    control ??
    (target.matches("input,select,textarea,button")
      ? target.parentElement!
      : target);
  if (focus !== control && !focus.hasAttribute("tabindex")) focus.tabIndex = -1;
  focus.focus({ preventScroll: true });
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  focus.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "center",
  });
  return true;
}
