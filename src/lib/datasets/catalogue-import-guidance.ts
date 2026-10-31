export const CATALOGUE_IMPORT_PATH = "/dashboard/datasets/import";
export const CATALOGUE_IMPORT_GUIDE_PATH =
  "/dashboard/datasets/guide#catalogue-import";

export const CATALOGUE_IMPORT_STEPS = [
  {
    title: "Prepare your file",
    detail: "Download the Excel or CSV template. Enter one collection per row.",
  },
  {
    title: "Preview and match",
    detail:
      "Choose your file, check the proposed changes, and match existing drafts.",
  },
  {
    title: "Save private drafts",
    detail:
      "Save the reviewed rows, then continue each collection in My drafts.",
  },
] as const;
