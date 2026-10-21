import { z } from "zod";
import {
  DatasetPortableRelativePathSchema,
  DatasetInspectionProfileSchema,
  type DatasetIntakeConfigResponse,
  type DatasetMaterialComponent,
} from "@kuinbee/dataset-preparation-contracts";
import { datasetIntakeApi } from "@/lib/api/dataset-intake";
import {
  DatasetUploadCommandSchema,
  dispatchDatasetUploadCommand,
  storeDatasetUploadCommand,
  clearDatasetUploadCommand,
  ambiguousDatasetUploadFailure,
} from "./dataset-upload-commands";
import {
  receiveDatasetFile,
  type DatasetFileReceiptProgress,
} from "./receive-dataset-file";

const id = z.string().cuid();
const item = z
  .object({
    path: DatasetPortableRelativePathSchema,
    name: z.string().min(1).max(255),
    bytes: z.number().int().min(1).max(5_000_000_000),
    modified: z.number().int().nonnegative(),
    role: z.enum([
      "PRIMARY",
      "TRANSCRIPT",
      "ANNOTATION",
      "SENSOR",
      "CALIBRATION",
      "DOCUMENTATION",
    ]),
    profile: DatasetInspectionProfileSchema,
    state: z.enum(["QUEUED", "RECEIVING", "WAITING", "ACCEPTED", "SELECTED"]),
    attemptId: id.optional(),
    uploadObjectId: id.optional(),
    memberId: id.optional(),
  })
  .strict();
export const DatasetFolderPlanSchema = z
  .object({
    version: z.literal(1),
    actorId: id,
    draftId: id,
    component: z.enum(["FULL", "SAMPLE"]),
    preparationGeneration: z.number().int().nonnegative(),
    contentId: id,
    contentGeneration: z.number().int().nonnegative(),
    items: z.array(item).min(1).max(1_000),
    command: DatasetUploadCommandSchema.nullable(),
  })
  .strict()
  .refine(
    (plan) =>
      plan.items.every(
        (entry) =>
          entry.path.split("/").at(-1) === entry.name &&
          (entry.state === "QUEUED" || Boolean(entry.attemptId)) &&
          (entry.state !== "SELECTED" ||
            Boolean(entry.uploadObjectId && entry.memberId))
      ) &&
      (!plan.command ||
        (plan.command.draftId === plan.draftId &&
          ["ADMIT", "FINALIZE", "MEMBERS"].includes(plan.command.kind))),
    "The queue must retain exact file and command identities"
  );
export type DatasetFolderPlan = z.infer<typeof DatasetFolderPlanSchema>;
const storageKey = (actorId: string, draftId: string) =>
  `kuinbee:dataset-folder:v1:${id.parse(actorId)}:${id.parse(draftId)}`;
const maximumPlanBytes = 1_048_576;
export function saveDatasetFolderPlan(plan: DatasetFolderPlan) {
  const value = JSON.stringify(DatasetFolderPlanSchema.parse(plan));
  if (new TextEncoder().encode(value).length > maximumPlanBytes)
    throw Error(
      "This folder's saved file list is too large. Select a smaller folder."
    );
  sessionStorage.setItem(storageKey(plan.actorId, plan.draftId), value);
  if (sessionStorage.getItem(storageKey(plan.actorId, plan.draftId)) !== value)
    throw Error(
      "This browser could not retain the upload queue. No new request was sent."
    );
}
export function readDatasetFolderPlan(
  actorId: string,
  draftId: string
): DatasetFolderPlan | null {
  const text = sessionStorage.getItem(storageKey(actorId, draftId));
  if (!text) return null;
  if (new TextEncoder().encode(text).length > maximumPlanBytes)
    throw Error("The retained folder queue is too large.");
  const plan = DatasetFolderPlanSchema.parse(JSON.parse(text));
  if (plan.actorId !== actorId || plan.draftId !== draftId)
    throw Error(
      "The retained folder queue belongs to another account or draft."
    );
  return plan;
}
export function clearDatasetFolderPlan(plan: DatasetFolderPlan) {
  if (plan.command)
    throw Error("Confirm the pending file request before clearing the queue.");
  sessionStorage.removeItem(storageKey(plan.actorId, plan.draftId));
}
export function folderFilePath(
  file: Pick<File, "name"> & { webkitRelativePath?: string }
) {
  return DatasetPortableRelativePathSchema.parse(
    (file.webkitRelativePath || file.name).normalize("NFC")
  );
}
export function prepareDatasetFolderPlan(input: {
  actorId: string;
  draftId: string;
  config: DatasetIntakeConfigResponse;
  files: File[];
  component: DatasetMaterialComponent;
  role: DatasetFolderPlan["items"][number]["role"];
  header: "PRESENT" | "ABSENT" | "";
  recordKind: "OBJECT" | "OBJECT_OR_ARRAY" | "";
}) {
  const { config } = input,
    context = config.context;
  if (
    !config.admission.enabled ||
    !context.contentId ||
    context.contentGeneration === null ||
    !context.editable ||
    context.synchronizationRequired ||
    context.preparationId !== input.draftId ||
    input.files.length < 1 ||
    input.files.length > 1_000
  )
    throw Error(
      "Select 1–1,000 files in a saved, editable draft with uploads enabled."
    );
  const selected: DatasetFolderPlan["items"] = [];
  let total = BigInt(0);
  const paths: string[] = [];
  for (const file of input.files) {
    const path = folderFilePath(file),
      key = path.toLowerCase();
    if (
      path.split("/").at(-1) !== file.name.normalize("NFC") ||
      paths.some(
        (other) =>
          key === other ||
          key.startsWith(other + "/") ||
          other.startsWith(key + "/")
      )
    )
      throw Error(
        `Duplicate file/folder path: ${path}. Rename it before uploading.`
      );
    paths.push(key);
    const matches = config.capabilities.filter((capability) =>
      capability.extensions.some((extension) =>
        file.name.toLowerCase().endsWith(extension)
      )
    );
    if (matches.length !== 1)
      throw Error(
        `Unsupported or ambiguous file type: ${path}. Remove it from the selection or use a supported file type.`
      );
    const capability = matches[0]!;
    if (
      !Number.isSafeInteger(file.size) ||
      file.size < 1 ||
      BigInt(file.size) > BigInt(capability.maximumObjectBytes) ||
      BigInt(file.size) > BigInt(config.maximumFileBytes)
    )
      throw Error(
        `File size is not allowed: ${path}. Empty files cannot be uploaded.`
      );
    total += BigInt(file.size);
    const profileId = capability.profileId;
    let profile: DatasetFolderPlan["items"][number]["profile"];
    if (
      profileId === "UTF8_CSV_SYNTAX_V1" ||
      profileId === "UTF8_TSV_SYNTAX_V1"
    ) {
      if (!input.header)
        throw Error(
          "Choose whether the CSV/TSV first row contains column names before starting the queue."
        );
      profile = { profileId, header: input.header };
    } else if (profileId === "UTF8_JSONL_SYNTAX_V1") {
      if (!input.recordKind)
        throw Error(
          "Choose the JSON Lines record structure before starting the queue."
        );
      profile = { profileId, recordKind: input.recordKind };
    } else if (profileId === "ZIP32_CONTAINER_V1") {
      if (capability.archiveContents !== "PACKAGED_FILE")
        throw Error(
          "This ZIP needs individual content declarations. Upload it separately."
        );
      profile = { profileId, leafProfiles: [] };
    } else profile = { profileId };
    selected.push({
      path,
      name: file.name.normalize("NFC"),
      bytes: file.size,
      modified: file.lastModified,
      role: input.role,
      profile,
      state: "QUEUED",
    });
  }
  if (
    context.usage.state !== "ACCOUNTED" ||
    total > BigInt(context.usage.dataset.remainingBytes!) ||
    total > BigInt(context.usage.supplier.remainingBytes!)
  )
    throw Error(
      "The selected files exceed the backend's remaining Dataset or supplier storage. Remove eligible old files first."
    );
  return DatasetFolderPlanSchema.parse({
    version: 1,
    actorId: input.actorId,
    draftId: input.draftId,
    component: input.component,
    preparationGeneration: context.preparationGeneration,
    contentId: context.contentId,
    contentGeneration: context.contentGeneration,
    items: selected,
    command: null,
  });
}

type Dependencies = {
  intake: typeof datasetIntakeApi;
  receive: typeof receiveDatasetFile;
  dispatch: typeof dispatchDatasetUploadCommand;
  persist: (plan: DatasetFolderPlan) => void;
  retain: typeof storeDatasetUploadCommand;
  clear: typeof clearDatasetUploadCommand;
  wait: (signal: AbortSignal) => Promise<void>;
};
const wait = (signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(Error("Upload queue paused."));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 1_000);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });

// One serial queue per owned draft; all original request UUIDs survive retries.
// Every HTTP step still uses the existing backend-authoritative intake service.
// No local File bytes or credentials are persisted.
export async function runDatasetFolderUpload(input: {
  plan: DatasetFolderPlan;
  files: File[];
  signal: AbortSignal;
  assertActor: () => void;
  onChange: (plan: DatasetFolderPlan) => void;
  onProgress?: (path: string, progress: DatasetFileReceiptProgress) => void;
  dependencies?: Partial<Dependencies>;
}) {
  const d: Dependencies = {
    intake: datasetIntakeApi,
    receive: receiveDatasetFile,
    dispatch: dispatchDatasetUploadCommand,
    persist: saveDatasetFolderPlan,
    retain: storeDatasetUploadCommand,
    clear: clearDatasetUploadCommand,
    wait,
    ...input.dependencies,
  };
  const plan = structuredClone(DatasetFolderPlanSchema.parse(input.plan));
  const files = new Map(
    input.files.map((file) => [folderFilePath(file), file])
  );
  if (files.size !== input.files.length)
    throw Error("The selected files contain duplicate paths.");
  const checked = () => {
    input.assertActor();
    if (input.signal.aborted)
      throw Error(
        "Upload queue paused. Reselect the original files to continue."
      );
  };
  const save = () => {
    checked();
    d.persist(plan);
    input.onChange(structuredClone(plan));
  };
  const basis = () => ({
    expectedPreparationGeneration: plan.preparationGeneration,
    expectedContentId: plan.contentId,
    expectedContentGeneration: plan.contentGeneration,
  });
  async function command(proposed: NonNullable<DatasetFolderPlan["command"]>) {
    checked();
    if (!plan.command) {
      plan.command = DatasetUploadCommandSchema.parse(proposed);
      save();
    }
    const retained = plan.command;
    d.retain(retained);
    try {
      const result = await d.dispatch(retained);
      input.assertActor();
      // Preserve the acknowledgement in the queue BEFORE clearing the shared
      // request. A lost acknowledgement replays the same request, never a new one.
      return { result, retained };
    } catch (error) {
      if (!ambiguousDatasetUploadFailure(error, retained.kind)) {
        d.clear(retained);
        plan.command = null;
        save();
      }
      throw error;
    }
  }
  function acknowledge(retained: NonNullable<DatasetFolderPlan["command"]>) {
    input.assertActor();
    plan.command = null;
    d.persist(plan);
    input.onChange(structuredClone(plan));
    d.clear(retained);
  }
  if (plan.command) {
    const { result, retained } = await command(plan.command);
    if (retained.kind === "ADMIT") {
      const entry = plan.items.find(
        (value) => value.path === retained.body.relativePath
      );
      if (!entry || !("id" in result))
        throw Error("The retained admission does not match this queue.");
      entry.attemptId = result.id;
      entry.state = "RECEIVING";
    } else if (retained.kind === "FINALIZE") {
      const entry = plan.items.find(
        (value) => value.attemptId === retained.attemptId
      );
      if (!entry)
        throw Error("The retained finalization does not match this queue.");
      entry.state = "WAITING";
    } else if (
      retained.kind === "MEMBERS" &&
      "generation" in result &&
      "results" in result
    ) {
      for (const [index, operation] of retained.body.operations.entries()) {
        if (operation.operation !== "ADD_MEMBER")
          throw Error("The retained folder selection is invalid.");
        const entry = plan.items.find(
          (value) => value.uploadObjectId === operation.uploadObjectId
        );
        if (!entry)
          throw Error("The retained selection does not match this queue.");
        const receipt = result.results[index];
        if (
          !receipt ||
          !("id" in receipt) ||
          receipt.operation !== "ADD_MEMBER"
        )
          throw Error("The retained selection receipt is incompatible.");
        entry.state = "SELECTED";
        entry.memberId = receipt.id;
      }
      plan.contentGeneration = result.generation;
    } else throw Error("The retained folder request is incompatible.");
    acknowledge(retained);
  }
  for (const entry of plan.items) {
    checked();
    if (entry.state === "SELECTED") continue;
    const file = files.get(entry.path);
    if (
      entry.state !== "ACCEPTED" &&
      (!file ||
        file.name.normalize("NFC") !== entry.name ||
        file.size !== entry.bytes ||
        file.lastModified !== entry.modified)
    )
      throw Error(
        `Reselect the original file or folder for ${entry.path}. Already uploaded files are retained.`
      );
    if (!entry.attemptId) {
      const { result, retained } = await command({
        kind: "ADMIT",
        draftId: plan.draftId,
        body: {
          requestId: crypto.randomUUID(),
          ...basis(),
          component: plan.component,
          role: entry.role,
          originalName: entry.name,
          relativePath: entry.path,
          expectedBytes: String(entry.bytes),
          inspectionProfile: entry.profile,
        },
      });
      if (!("id" in result))
        throw Error("The backend returned an incompatible upload receipt.");
      entry.attemptId = result.id;
      entry.state = "RECEIVING";
      acknowledge(retained);
    }
    let status = await d.intake.status(
      plan.draftId,
      entry.attemptId!,
      input.signal
    );
    checked();
    if (
      (status.relativePath ?? null) !== entry.path ||
      status.contentId !== plan.contentId ||
      status.component !== plan.component ||
      status.originalName !== entry.name ||
      status.expectedBytes !== String(entry.bytes)
    )
      throw Error("The retained upload no longer matches this folder entry.");
    if (["ADMITTED", "RECEIVING"].includes(status.state)) {
      if (!file) throw Error(`Reselect the original file for ${entry.path}.`);
      await d.receive({
        draftId: plan.draftId,
        attemptId: entry.attemptId!,
        file,
        context: basis(),
        signal: input.signal,
        onProgress: (progress) => input.onProgress?.(entry.path, progress),
      });
      checked();
      const { retained } = await command({
        kind: "FINALIZE",
        draftId: plan.draftId,
        attemptId: entry.attemptId!,
        body: { requestId: crypto.randomUUID(), ...basis() },
      });
      entry.state = "WAITING";
      acknowledge(retained);
    }
    // A bounded status-only wait never repeats uncertain writes or skips a failed file.
    for (let poll = 0; poll < 120; poll++) {
      checked();
      status = await d.intake.status(
        plan.draftId,
        entry.attemptId!,
        input.signal
      );
      if (status.state === "ACCEPTED") break;
      if (!["FINALIZING", "RECEIVED", "CHECKING"].includes(status.state))
        throw Error(
          `${entry.path}: upload is ${status.state.toLowerCase()}. Resolve it before continuing.`
        );
      await d.wait(input.signal);
    }
    if (status.state !== "ACCEPTED" || !status.uploadObjectId)
      throw Error(
        `${entry.path} is still being prepared. Resume the queue after its status updates.`
      );
    entry.uploadObjectId = status.uploadObjectId;
    entry.state = "ACCEPTED";
    save();
  }
  const unselected = plan.items.filter((entry) => entry.state !== "SELECTED");
  for (let start = 0; start < unselected.length; ) {
    const batch: typeof unselected = [];
    let requestBytes = 1_024;
    for (const entry of unselected.slice(start, start + 50)) {
      const bytes =
        new TextEncoder().encode(JSON.stringify(entry.path)).length + 256;
      if (batch.length && requestBytes + bytes > 24_576) break;
      batch.push(entry);
      requestBytes += bytes;
    }
    const { result, retained } = await command({
      kind: "MEMBERS",
      draftId: plan.draftId,
      body: {
        requestId: crypto.randomUUID(),
        expectedPreparationGeneration: plan.preparationGeneration,
        expectedContentId: plan.contentId,
        expectedGeneration: plan.contentGeneration,
        operations: batch.map((entry) => ({
          operation: "ADD_MEMBER",
          uploadObjectId: entry.uploadObjectId!,
          component: plan.component,
          role: entry.role,
          relativePath: entry.path,
        })),
      },
    });
    if (!("generation" in result) || !("results" in result))
      throw Error(
        "The backend returned an incompatible file selection receipt."
      );
    plan.contentGeneration = result.generation;
    batch.forEach((entry, index) => {
      const receipt = result.results[index];
      if (!receipt || !("id" in receipt) || receipt.operation !== "ADD_MEMBER")
        throw Error("The selection receipt is incompatible.");
      entry.memberId = receipt.id;
      entry.state = "SELECTED";
    });
    acknowledge(retained);
    start += batch.length;
  }
  save();
  return plan;
}
