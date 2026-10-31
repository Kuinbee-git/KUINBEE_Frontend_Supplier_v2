import {
  PROPOSAL_SCREEN_WALKTHROUGH,
  PROPOSAL_STEP_GUIDANCE,
  PROPOSAL_VISUAL_NOTES,
} from "./proposal-guidance";

export type GuideFlow = "import" | "proposal";
export type GuideScene = {
  id: string;
  shortTitle: string;
  title: string;
  goal: string;
  takeaway: string;
  actions: readonly (readonly [string, string])[];
};

export const IMPORT_GUIDE_SCENES: readonly GuideScene[] = [
  {
    id: "catalogue-import",
    shortTitle: "Prepare file",
    title: "Prepare your catalogue file",
    goal: "Start with our Excel or CSV template and describe one collection per row.",
    takeaway:
      "Your spreadsheet is metadata only. Add original dataset files later in each draft.",
    actions: [
      [
        "Download the template",
        "Choose Get Excel template or Get CSV templates, then download the file. Read Instructions, FieldDictionary and Lookups before filling it in.",
      ],
      [
        "Fill the template columns",
        "Keep the template column headers and Excel worksheet names unchanged. catalogueIdentifier and title are required. Keep IDs as text; leave undocumented answers blank or unconfirmed.",
      ],
      [
        "Choose your completed file",
        "Select one .xlsx workbook, or UTF-8 catalogue.csv with optional measurements.csv and sensor_channels.csv. Use values only, without formulas, macros or external links. Lists use semicolons.",
      ],
      [
        "Validate and preview",
        "Use Create missing drafts; preserve matched metadata for a first import. Choose Validate and preview to check your rows before any drafts are saved.",
      ],
    ],
  },
  {
    id: "import-preview",
    shortTitle: "Preview & match",
    title: "Review and match your collections",
    goal: "See what will be created, what will be preserved, and what needs your attention.",
    takeaway:
      "A preview does not change dataset drafts. Review every proposed match before saving.",
    actions: [
      [
        "Read the proposed changes",
        "In this example, 270 collections contain 50 existing matches and 220 new entries. Check Create, Bind existing, Update and Unchanged against your own catalogue.",
      ],
      [
        "Match existing drafts",
        "Exact catalogue identifiers match automatically; case and punctuation matter. Use Find drafts for older entries without identifiers. Match them explicitly so they are preserved instead of duplicated.",
      ],
      [
        "Resolve errors; retain honest unknowns",
        "Correct duplicate identifiers and other selected errors, or exclude those rows. Undocumented file formats can stay UNCONFIRMED. The 20 format warnings in this example do not block otherwise valid drafts.",
      ],
      [
        "Apply your preview choices",
        "After changing a match or exclusion, choose Update preview. Recheck the result before saving. The update option changes matched metadata only when you explicitly select and review it.",
      ],
    ],
  },
  {
    id: "import-save",
    shortTitle: "Save drafts",
    title: "Save the reviewed rows privately",
    goal: "Save your approved rows, confirm the result, and continue from My drafts.",
    takeaway:
      "Saving drafts does not submit for review, publish, grant buyer access or authorize downloads or sample sharing.",
    actions: [
      [
        "Save private drafts",
        "Choose Save private drafts after reviewing matches and resolving selected errors. Acknowledge unmatched entries only when you have confirmed that the new collections are separate.",
      ],
      [
        "Confirm the import result",
        "Watch progress and check each row's result. Use the shown Retry or Resume action if interrupted; confirm the outcome before starting a replacement import.",
      ],
      [
        "Continue in My drafts",
        "Open the saved collections to finish their details or add files. Unconfirmed formats remain unconfirmed; the import does not invent missing answers.",
      ],
      [
        "Return through Import history",
        "Reopen a batch or download its row report. Cancellation preserves drafts already saved. Reimporting the same identifiers in the default mode preserves existing drafts.",
      ],
    ],
  },
];

export const PROPOSAL_GUIDE_SCENES: readonly GuideScene[] =
  PROPOSAL_STEP_GUIDANCE.map((step, index) => ({
    id: `step-${index + 1}`,
    shortTitle: [
      "Basics",
      "Files & contents",
      "Dataset details",
      "Review draft",
    ][index],
    title: step.title,
    goal: PROPOSAL_SCREEN_WALKTHROUGH[index].goal,
    takeaway: PROPOSAL_SCREEN_WALKTHROUGH[index].finish,
    actions: PROPOSAL_VISUAL_NOTES[index],
  }));

export function guideSelection(hash: string): {
  flow: GuideFlow;
  index: number;
} {
  const id = hash.replace(/^#/, "");
  const proposal = PROPOSAL_GUIDE_SCENES.findIndex((scene) => scene.id === id);
  if (proposal >= 0) return { flow: "proposal", index: proposal };
  const imported = IMPORT_GUIDE_SCENES.findIndex((scene) => scene.id === id);
  return { flow: "import", index: Math.max(0, imported) };
}
