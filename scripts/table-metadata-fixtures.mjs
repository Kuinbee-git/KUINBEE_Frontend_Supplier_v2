// Explicit synthetic schema fixtures; never native inspection or hosted acceptance.

export async function captureTableMetadataViews(page, output, prefix, anchor) {
  if (!output) return;
  const { mkdir } = await import("node:fs/promises"),
    { resolve } = await import("node:path");
  await mkdir(resolve(output), { recursive: true });
  const before = page.viewportSize(),
    wasDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
  for (const width of [1366, 390])
    for (const dark of [false, true]) {
      await page.setViewportSize({ width, height: 900 });
      const toggle = page.getByRole("button", {
        name: dark ? "Use dark theme" : "Use light theme",
        exact: true,
      });
      if (await toggle.count()) await toggle.click();
      else
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle("dark", dark),
          dark
        );
      await page.waitForFunction(
        (dark) =>
          document.documentElement.classList.contains("dark") === dark &&
          document.documentElement.dataset.dashboardThemeTransition !== "true",
        dark
      );
      await anchor.scrollIntoViewIfNeeded();
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          )
      );
      const fits = await page.evaluate(() => {
        const main = document.querySelector("#supplier-dashboard-main");
        return (
          document.documentElement.scrollWidth <= innerWidth &&
          (!main || main.scrollWidth <= main.clientWidth)
        );
      });
      if (!fits)
        throw Error("Table metadata overflows at " + width + " " + dark);
      await page.screenshot({
        path: resolve(
          output,
          prefix + "-" + width + "-" + (dark ? "dark" : "light") + ".png"
        ),
        fullPage: false,
      });
    }
  await page.setViewportSize(before);
  const toggle = page.getByRole("button", {
    name: wasDark ? "Use dark theme" : "Use light theme",
    exact: true,
  });
  if (await toggle.count()) await toggle.click();
  else
    await page.evaluate(
      (dark) => document.documentElement.classList.toggle("dark", dark),
      wasDark
    );
  await page.waitForFunction(
    (dark) =>
      document.documentElement.classList.contains("dark") === dark &&
      document.documentElement.dataset.dashboardThemeTransition !== "true",
    wasDark
  );
}

const id = (n) => "c" + String(n).padStart(24, "0");
export function tableMetadataFixture(
  context,
  memberId = id(8000),
  columns = false
) {
  const table = {
    kind: "TABLE",
    id: id(8001),
    component: context.component,
    displayName: "Event measurements",
    recordUnit: "One recorded event",
    missingValues: { state: "UNKNOWN", value: null },
    observed: {
      origin: "BACKEND_OBSERVED",
      scope: "EXACT_TABLE",
      dataRecordCount: "200",
      columnCount: 3,
      headerConvention: "PRESENT",
    },
  };
  const items = columns
    ? [null, "", "value"].map((observedName, index) => ({
        kind: "COLUMN",
        id: id(8010 + index),
        tableId: table.id,
        position: index + 1,
        observedName,
        storageRepresentation: "UTF8_TEXT",
        meaning: { state: "UNKNOWN", value: null },
        declaredType: "UNKNOWN",
        unit: { state: "NOT_APPLICABLE", value: null },
      }))
    : [table];
  return {
    context,
    memberId,
    page: {
      contentId: context.contentId,
      contentGeneration: context.contentGeneration,
      frozen: context.frozen,
      frozenAt: context.frozen ? "2026-10-16T00:00:00.000Z" : null,
      component: context.component,
      tableId: columns ? table.id : null,
      table: columns ? table : null,
      items,
      nextCursor: null,
    },
    targets: [
      {
        id: table.id,
        memberId,
        observedTableId: id(8020),
        evidenceId: id(8021),
        locator: { kind: "ARCHIVE_ENTRY", path: "private-session/events.csv" },
      },
    ],
  };
}
