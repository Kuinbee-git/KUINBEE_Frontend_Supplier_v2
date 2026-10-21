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
      "Save the draft first. Use the Full dataset and Sample areas offered for your upload choice, and select the received files you want to include.",
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
