export const PROPOSAL_GUIDE_PATH = "/dashboard/datasets/guide";

export const PROPOSAL_STEP_GUIDANCE = [
  {
    title: "Basics",
    summary: "Introduce the collection and choose what you plan to upload.",
    instructions: [
      "Start with a clear title. You can save with just a title and complete the rest later.",
      "Choose Sample only, Full dataset only, or Full dataset + sample. Choose the subject category separately from the types of data.",
      "Select your data source, state the dataset license, and select additional context only when it applies.",
    ],
    example:
      "Hospital conversations: Healthcare is the subject; speech/audio is the data type. Add healthcare context for the relevant questions.",
  },
  {
    title: "Files & contents",
    summary:
      "Upload your prepared files and put them in the correct full or sample area.",
    instructions: [
      "Save the draft first. Choose files or a folder, choose Full dataset or Sample, then start the queue. Files are uploaded and added to that draft area; folder paths are preserved and empty folders are not stored.",
      "Keep buyer samples separate from private full material. Link transcripts, annotations or other companion files to the content they describe.",
      "Wait for each upload to finish and confirm its result. To replace a file, remove the eligible old file before uploading its replacement; removing a selection alone does not free storage.",
    ],
    example:
      "For 200 hours of recordings with a 15-minute sample, upload the full recordings in Full dataset and the prepared 15-minute file in Sample.",
  },
  {
    title: "Dataset details",
    summary:
      "Explain what the collection represents and what a buyer can understand from it.",
    instructions: [
      "Define the collection boundary: what one record or recording represents, what is included, and the relevant place or capture period.",
      "Collection size describes the whole represented collection. Full dataset size and Sample size describe those prepared materials separately. Choose Known, Estimate or Unknown honestly; use Remove to cancel a quantity.",
      "Complete the questions for your selected data types, describe quality and limitations, and explain how any sample was selected or changed.",
    ],
    example:
      "A sample-only proposal may describe a 200-hour collection while supplying 15 minutes. The sample does not show that all 200 hours were uploaded or reviewed.",
  },
  {
    title: "Review draft",
    summary:
      "Review the saved proposal, prepare pricing and submit explicitly when ready.",
    instructions: [
      "Save your answers and check the saved summary, selected files and any missing information. Refresh review checks after changes.",
      "Save pricing. For a paid proposal, submit pricing for its separate review before submitting the proposal; saving pricing alone is not that action.",
      "Use Submit for admin review only when the backend checks pass. Saving, uploading and opening this screen do not submit or publish anything.",
    ],
    example:
      "You can leave an incomplete draft and return through My drafts. After Submit, track it under Submitted proposals; previously published corrections stay under My datasets.",
  },
] as const;

// Numbered explanations beside the illustrated version of each live editor screen.
// The illustrations use fictional content and are never a saved draft or receipt.
export const PROPOSAL_VISUAL_NOTES = [
  [
    [
      "Name the collection",
      "A clear title is enough to save your first draft.",
    ],
    [
      "Choose the material",
      "Pick sample, full, or both. This controls the file areas on the next screen.",
    ],
    [
      "Describe the data",
      "Select every actual data type. Add Healthcare or Egocentric context only when it applies.",
    ],
    [
      "Record subject and rights",
      "Category, source and stated license are separate from file format and upload choice.",
    ],
  ],
  [
    [
      "Set up and upload",
      "Save Basics first, then choose files or a folder. Confirm the destination and start the queue; wait until all selected files are added.",
    ],
    [
      "Place the material",
      "Select accepted files into Full dataset or Sample. Only the relevant areas appear for your choice.",
    ],
    [
      "Connect companions",
      "Link a transcript, annotation or other companion to the material it explains.",
    ],
    [
      "Confirm the inventory",
      "Refresh files and check the selected list. Backend file and storage limits still apply.",
    ],
  ],
  [
    [
      "Define the boundary",
      "Say exactly which items belong to the represented collection.",
    ],
    [
      "Keep quantities separate",
      "Collection size, prepared full material and prepared sample describe different scopes.",
    ],
    [
      "Answer relevant questions",
      "The selected data types reveal their own questions; optional context adds its own questions.",
    ],
    [
      "Explain the sample",
      "Describe coverage, omissions and limitations without treating the sample as proof of unseen material.",
    ],
  ],
  [
    [
      "Read the saved summary",
      "Check what was saved, including scope, stated license and selected files.",
    ],
    [
      "Handle pricing separately",
      "Choose free or paid access where offered. Save pricing and submit paid pricing for its own review.",
    ],
    [
      "Refresh review checks",
      "The backend checks saved answers, files, capacity, pricing and current proposal state.",
    ],
    [
      "Submit explicitly",
      "Submit requests admin review; approval and marketplace publication are later actions.",
    ],
  ],
] as const;

// Each row names a control that exists on the matching proposal screen.
// Keep this walkthrough aligned with DatasetPreparationEditor, FilesPanel,
// ProfileFields and WorkflowPanel when those controls change.
export const PROPOSAL_SCREEN_WALKTHROUGH = [
  {
    goal: "Give the proposal its identity and choose the material you will supply.",
    fields: [
      [
        "Dataset title",
        "Use a name a buyer can recognize. A title is enough for the first Save draft.",
        "English and Hindi customer-support calls",
      ],
      [
        "What are you uploading?",
        "Choose Sample only, Full dataset only, or Full dataset + sample. This decides which file areas appear; it does not submit anything.",
        "Choose Full dataset + sample if you have both the complete defined collection and a prepared buyer sample.",
      ],
      [
        "Main types of data",
        "Tick every type actually present: tables, audio, images, video, text or sensors. Mixed collections use multiple ticks.",
        "Calls with transcripts: audio and text.",
      ],
      [
        "Additional context (optional)",
        "Healthcare adds healthcare questions; egocentric adds first-person capture questions. Leave both clear if neither applies.",
        "A chest X-ray collection uses Healthcare; it does not need Egocentric.",
      ],
      [
        "Primary category",
        "Choose the closest subject from the specific category list. Category describes the subject, while data type describes the files.",
        "Medical Audio for clinical speech; Call Center for customer-support calls.",
      ],
      [
        "Data source",
        "Choose the source you own or have authority to use. Create a source if yours is missing.",
        "Your organization's consented support-call collection.",
      ],
      [
        "Dataset license",
        "Enter the stated standard license or existing license text. Kuinbee displays it; agreements are handled outside the platform.",
        "CC BY 4.0, only if that is the license that actually applies.",
      ],
    ],
    finish:
      "Select Save draft to keep partial answers. Return through My drafts at any time. Complete the applicable fields before the separate Submit action.",
  },
  {
    goal: "Upload files and place each accepted file in the material buyers may inspect or receive.",
    fields: [
      [
        "Set up files",
        "Save Basics first. Then use Set up files or Update files so the file inventory follows the saved upload choice.",
        "A Full dataset + sample proposal opens both the Full dataset and Sample areas.",
      ],
      [
        "Upload",
        "Choose files or a folder and select Full dataset or Sample. Start the queue and wait for all files to appear in the selected material inventory. Pause and reselect the original files to continue an interrupted queue.",
        "Upload the full audio archive under Full dataset and a prepared clip under Sample.",
      ],
      [
        "File purpose and relationships",
        "Mark main data, transcript, annotation, documentation or other relevant purpose. Link companions to the file or group they explain.",
        "Link a transcript to its matching call, not to every call in the collection.",
      ],
      [
        "Full dataset and Sample",
        "Review the two areas separately. A ZIP is packaging; its entries do not become separate buyer downloads just because the ZIP contains them.",
        "A 15-minute sample stays in Sample; the private full archive stays in Full dataset.",
      ],
      [
        "Full dataset size and Sample size",
        "Add optional declared quantities for the uploaded materials. These are separate from the represented Collection size on the next screen.",
        "Full: 2 hours of audio. Sample: 15 minutes of audio.",
      ],
      [
        "Storage and corrections",
        "The backend enforces a maximum of 5 GB per file, 5 GB per Dataset and 100 GB per supplier. Files & contents shows the current limit for each file type. To replace an eligible file, delete the old stored file before uploading the correction.",
        "Removing a file from the selected list alone does not free its stored bytes.",
      ],
    ],
    finish:
      "Use Refresh files to confirm the saved inventory. Resolve interrupted upload or file changes with the shown Retry/Resume action before moving on.",
  },
  {
    goal: "Explain the whole collection and keep its scope separate from uploaded material.",
    fields: [
      [
        "What collection does this Dataset cover?",
        "State the exact boundary: what one item is, which items belong, and what the proposal excludes.",
        "All 120 consented support calls collected for a defined September 2026 release.",
      ],
      [
        "Full collection boundary",
        "When full material is supplied, confirm it covers the boundary you just defined. This is your declaration, not a platform proof.",
        "The uploaded 120 calls are all calls in that release.",
      ],
      [
        "Short summary and Detailed description",
        "Write a short buyer-facing summary, then explain organization and how to interpret records and companions.",
        "Two hours of bilingual calls; one recording and matched transcript per call ID.",
      ],
      [
        "Collection size",
        "Describe the represented collection, even when you upload only a sample. Use Known, Estimate or Unknown honestly. Remove cancels an added quantity.",
        "200 supplier-declared hours in the collection; do not enter zero when the amount is unknown.",
      ],
      [
        "Questions for selected data types",
        "Complete only the relevant table, audio, image, video, text or sensor questions. Some answers reveal follow-up questions.",
        "For audio, state languages, recording context, speaker coverage and transcript timing.",
      ],
      [
        "How the sample represents the collection",
        "When a sample is supplied, explain selection, coverage, omissions, changes and its relation to the full material.",
        "The 15-minute sample spans both languages but omits most calls.",
      ],
      [
        "Quality, limitations and optional enrichment",
        "State what you checked, what remains unknown, collection method, possible uses, tags, additional categories, geography and capture period where applicable.",
        "Some calls contain noise; one organization and month limit representativeness.",
      ],
    ],
    finish:
      "Save these answers before changing file organization or reviewing submission checks. Supplier-declared quantities do not replace measured upload bytes.",
  },
  {
    goal: "Check the saved proposal, set access pricing and explicitly request admin review.",
    fields: [
      [
        "Saved summary",
        "Read the title, collection boundary, full/sample quantities, selected files and stated license as a buyer or reviewer would.",
        "Check that a 15-minute sample is never described as a fully uploaded 200-hour collection.",
      ],
      [
        "Access & pricing",
        "Choose free or paid access where offered. Save pricing separately from the metadata draft.",
        "A sample-only proposal displays a sample and has no on-platform sample purchase.",
      ],
      [
        "Submit pricing for review",
        "For paid access, submit the saved price for its separate review. Save pricing by itself does not request that review.",
        "A paid full dataset needs its pricing review action before proposal Submit.",
      ],
      [
        "Refresh review checks",
        "Refresh after saving or changing files. The backend checks saved answers, selected files, capacity, pricing and current proposal state.",
        "If a required file is missing, return to Files & contents and fix that exact item.",
      ],
      [
        "Submit for admin review",
        "Use Submit only when the current checks permit it. This freezes the submitted content for admin review; it does not publish the listing.",
        "After Submit, follow the proposal under Submitted proposals.",
      ],
    ],
    finish:
      "Changes requested require a correction and another explicit Submit. Approval and marketplace publication remain separate actions.",
  },
] as const;

export const PROPOSAL_DATA_TYPE_GUIDANCE = [
  [
    "Tables",
    "What one row represents, column meanings, units, missing values and relationships between tables.",
  ],
  [
    "Speech & other audio",
    "What is recorded, languages where relevant, recording setting, speakers, transcripts and other labels.",
  ],
  [
    "Images",
    "What the images show, capture conditions, coverage and the meaning of any annotations.",
  ],
  [
    "Video",
    "Recorded activities, viewpoint, audio, annotations and any time or frame references.",
  ],
  [
    "Text",
    "What one document or record represents, languages where relevant, labels and their record or offset conventions.",
  ],
  [
    "Sensors",
    "Channels, units, timestamps, session relationships, synchronization and calibration where available.",
  ],
] as const;

export const PROPOSAL_REVIEW_GUIDANCE = [
  [
    "Draft",
    "Edit, upload and save step by step. Complete all applicable requirements before Submit.",
  ],
  [
    "Submitted / under review",
    "Kuinbee reviews the submitted content. Submitted content is read-only; follow the actions available for its current state.",
  ],
  [
    "Changes requested",
    "Read the feedback, open the correction, save the changes and submit again explicitly.",
  ],
  [
    "Rejected",
    "Read the decision and any available next action on the proposal. Rejection is not publication.",
  ],
  [
    "Verified / ready to publish",
    "After the required approvals and assessments, use the available Publish action in My datasets. Approval does not publish automatically.",
  ],
  [
    "Published",
    "Buyers see the approved listing and any supplied sample. Full-file access follows the existing purchase or access process. Use the existing delist/edit/review process for managed updates.",
  ],
] as const;
