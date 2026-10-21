import {
  DATASET_UPLOAD_FILE_LIMIT_BYTES,
  type DatasetUploadActionBody,
  type DatasetUploadAttemptStatusResponse,
  type DatasetUploadPartsPageResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { datasetIntakeApi } from "@/lib/api/dataset-intake";
import { PreparationApiError } from "@/lib/api/dataset-preparations";

type Status = DatasetUploadAttemptStatusResponse;
type Part = DatasetUploadPartsPageResponse["items"][number];
type Context = Omit<DatasetUploadActionBody, "requestId">;
export type DatasetUploadTransportClient = Pick<
  typeof datasetIntakeApi,
  "config" | "status" | "parts" | "putPart"
>;
export interface DatasetFileReceiptProgress {
  phase: "PREPARING" | "VERIFYING" | "UPLOADING" | "RECEIVED";
  receivedBytes: number;
  verifiedBytes: number;
  totalBytes: number;
  partNumber: number | null;
}
function fail(message: string, code: string): never {
  throw new PreparationApiError(message, code);
}
const unchanged = (initial: Status, current: Status) => {
  if (
    current.id !== initial.id ||
    current.rootId !== initial.rootId ||
    current.contentId !== initial.contentId ||
    current.recoveryEpoch !== initial.recoveryEpoch ||
    current.expectedBytes !== initial.expectedBytes ||
    current.partBytes !== initial.partBytes ||
    current.totalParts !== initial.totalParts ||
    current.component !== initial.component ||
    current.role !== initial.role ||
    current.originalName !== initial.originalName ||
    current.expiresAt !== initial.expiresAt ||
    JSON.stringify(current.inspectionProfile) !==
      JSON.stringify(initial.inspectionProfile) ||
    current.revision < initial.revision
  )
    fail(
      "This upload changed. Refresh its status before continuing.",
      "UPLOAD_CHANGED"
    );
  if (!["ADMITTED", "RECEIVING"].includes(current.state))
    fail(
      "This file is no longer receiving bytes. Refresh to see its current status.",
      "UPLOAD_NOT_RECEIVING"
    );
};
const pause = (signal: AbortSignal) => {
  if (signal.aborted)
    fail("Upload paused. Refresh its status before resuming.", "UPLOAD_PAUSED");
};
function delay(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(
        new PreparationApiError(
          "Upload paused. Refresh its status before resuming.",
          "UPLOAD_PAUSED"
        )
      );
    };
    const timer = setTimeout(done, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}
function geometry(status: Status, number: number) {
  const start = (number - 1) * status.partBytes;
  return {
    start,
    length: Math.min(status.partBytes, Number(status.expectedBytes) - start),
  };
}
async function digestSlice(
  file: Pick<File, "slice">,
  start: number,
  length: number,
  signal: AbortSignal
) {
  pause(signal);
  if (length < 1 || length > 8 * 1_024 * 1_024 || !globalThis.crypto?.subtle)
    fail(
      "This browser could not verify the selected file. No upload bytes were sent.",
      "FILE_VERIFICATION_UNAVAILABLE"
    );
  const blob = file.slice(start, start + length);
  if (blob.size !== length)
    fail("The selected file could not be read completely.", "FILE_READ_FAILED");
  let bytes: ArrayBuffer;
  try {
    bytes = await blob.arrayBuffer();
  } catch {
    return fail(
      "The selected file changed or could not be read. Reselect it before continuing.",
      "FILE_READ_FAILED"
    );
  }
  pause(signal);
  if (bytes.byteLength !== length)
    fail("The selected file could not be read completely.", "FILE_READ_FAILED");
  const sha = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (value) => value.toString(16).padStart(2, "0")
  ).join("");
  pause(signal);
  return { blob, sha };
}

// Receives one already-admitted file. No hidden admission, finalize, selection,
// submission, deletion or quota release occurs here. The caller retains exact
// command IDs for those separate operations and treats their ACKs separately.
// Reads and hashes one server-sized slice at a time (at most 8 MiB per read),
// never the entire local file.
export async function receiveDatasetFile(input: {
  draftId: string;
  attemptId: string;
  file: Pick<File, "name" | "size" | "slice">;
  context: Context;
  signal: AbortSignal;
  onProgress?: (progress: DatasetFileReceiptProgress) => void;
  api?: DatasetUploadTransportClient;
}): Promise<Status> {
  const { draftId, attemptId, file, signal } = input,
    context = { ...input.context },
    api = input.api ?? datasetIntakeApi;
  pause(signal);
  if (
    !Number.isSafeInteger(file.size) ||
    file.size < 1 ||
    BigInt(file.size) > BigInt(DATASET_UPLOAD_FILE_LIMIT_BYTES)
  )
    fail(
      "Choose a nonempty file no larger than 5 GB.",
      "FILE_SIZE_NOT_ALLOWED"
    );
  const progress: DatasetFileReceiptProgress = {
    phase: "PREPARING",
    receivedBytes: 0,
    verifiedBytes: 0,
    totalBytes: file.size,
    partNumber: null,
  };
  const report = (change: Partial<DatasetFileReceiptProgress>) => {
    Object.assign(progress, change);
    pause(signal);
    input.onProgress?.({ ...progress });
  };
  report({});
  const config = await api.config(
    draftId,
    context.expectedPreparationGeneration,
    signal
  );
  pause(signal);
  if (!config.admission.enabled || !config.transport)
    fail(
      "Uploads are currently paused by the backend. Refresh status before trying again.",
      "INTAKE_UNAVAILABLE"
    );
  if (
    !config.context.editable ||
    config.context.synchronizationRequired ||
    config.context.contentId !== context.expectedContentId ||
    config.context.contentGeneration !== context.expectedContentGeneration
  )
    fail(
      "Saved details or file selection changed. Refresh the files view before continuing.",
      "DRAFT_CHANGED"
    );
  let status = await api.status(draftId, attemptId, signal),
    initial = status;
  if (
    status.rootId !== draftId ||
    status.id !== attemptId ||
    status.contentId !== context.expectedContentId ||
    status.originalName !== file.name ||
    status.expectedBytes !== String(file.size)
  )
    fail(
      "Reselect the original file with the same name and size. Its received bytes will also be checked.",
      "LOCAL_FILE_MISMATCH"
    );
  const capability = config.capabilities.find(
    (item) => item.profileId === status.inspectionProfile.profileId
  );
  const choice = config.context.serverUploadChoice;
  if (
    !capability ||
    BigInt(file.size) > BigInt(capability.maximumObjectBytes) ||
    !choice ||
    !capability.choices.includes(choice) ||
    (choice === "SAMPLE_ONLY" && status.component !== "SAMPLE") ||
    (choice === "FULL_ONLY" && status.component !== "FULL")
  )
    fail(
      "This file is outside the formats, size or upload choice currently enabled by the backend.",
      "FORMAT_NOT_ENABLED"
    );
  if (
    status.partBytes !== config.transport.partBytes ||
    status.totalParts !== Math.ceil(file.size / status.partBytes)
  )
    fail(
      "Upload part geometry changed. Refresh before continuing.",
      "INCOMPATIBLE_RESPONSE"
    );
  unchanged(initial, status);
  for (let polls = 0; status.state === "ADMITTED"; polls++) {
    if (polls >= 60)
      fail(
        "The upload is still being prepared. Refresh and resume this upload; do not start another copy.",
        "UPLOAD_PREPARING"
      );
    await delay(1000, signal);
    const next = await api.status(draftId, attemptId, signal);
    unchanged(status, next);
    status = next;
  }
  initial = status;
  const parts: Part[] = [];
  let afterPartNumber = 0;
  do {
    pause(signal);
    const page = await api.parts(
      draftId,
      attemptId,
      {
        expectedAttemptRevision: initial.revision,
        expectedRecoveryEpoch: initial.recoveryEpoch,
        afterPartNumber,
        limit: 50,
      },
      signal
    );
    if (
      page.preparationId !== draftId ||
      page.attemptId !== attemptId ||
      page.attemptRevision !== initial.revision ||
      page.recoveryEpoch !== initial.recoveryEpoch ||
      page.totalParts !== initial.totalParts ||
      !page.items.length
    )
      fail(
        "Upload progress changed while it was loading. Refresh before resuming.",
        "UPLOAD_CHANGED"
      );
    for (const part of page.items) {
      if (
        part.partNumber !== parts.length + 1 ||
        part.expectedBytes !== geometry(initial, part.partNumber).length ||
        parts.length >= initial.totalParts
      )
        fail(
          "The upload inventory is incomplete or out of order. Refresh before resuming.",
          "INCOMPATIBLE_RESPONSE"
        );
      parts.push(part);
    }
    if (
      page.nextCursor &&
      (page.nextCursor.afterPartNumber !== parts.length ||
        parts.length >= initial.totalParts)
    )
      fail(
        "The upload inventory cursor changed. Refresh before resuming.",
        "INCOMPATIBLE_RESPONSE"
      );
    afterPartNumber = page.nextCursor?.afterPartNumber ?? 0;
  } while (afterPartNumber);
  if (parts.length !== initial.totalParts)
    fail(
      "The upload inventory is incomplete. Refresh before resuming.",
      "INCOMPATIBLE_RESPONSE"
    );
  if (
    parts.some((part) => part.state === "CLAIMED" || part.state === "UNCERTAIN")
  )
    fail(
      "A previous upload request is still settling. Refresh its status before resuming.",
      "PART_RECONCILIATION_REQUIRED"
    );
  report({
    phase: "VERIFYING",
    receivedBytes: parts.reduce(
      (sum, part) => sum + (part.state === "RECEIVED" ? part.expectedBytes : 0),
      0
    ),
  });
  // Verify ALL existing receipts before sending ANY missing part, including
  // receipts on later pages and holes in the middle of the part inventory.
  for (const part of parts)
    if (part.state === "RECEIVED") {
      const { start, length } = geometry(initial, part.partNumber),
        local = await digestSlice(file, start, length, signal);
      if (part.checksumSha256 !== local.sha)
        fail(
          "The selected file differs from bytes already received. No new parts were sent. Reselect the original file or cancel this upload.",
          "LOCAL_FILE_MISMATCH"
        );
      report({
        partNumber: part.partNumber,
        verifiedBytes: progress.verifiedBytes + length,
      });
    }
  const next = await api.status(draftId, attemptId, signal);
  unchanged(initial, next);
  if (next.revision !== initial.revision)
    fail(
      "Upload progress changed during local verification. Refresh before resuming.",
      "UPLOAD_CHANGED"
    );
  status = next;
  for (const part of parts)
    if (part.state === "PENDING") {
      pause(signal);
      const { start, length } = geometry(initial, part.partNumber),
        local = await digestSlice(file, start, length, signal);
      report({ phase: "UPLOADING", partNumber: part.partNumber });
      let originalError: unknown;
      try {
        const result = await api.putPart(
          draftId,
          attemptId,
          part.partNumber,
          { ...context, requestId: crypto.randomUUID() },
          local.blob,
          signal
        );
        unchanged(status, result);
        status = result;
      } catch (error) {
        pause(signal);
        const recoverable =
          error instanceof PreparationApiError &&
          ([
            "NETWORK_ERROR",
            "INCOMPATIBLE_RESPONSE",
            "PART_ALREADY_RECEIVED",
          ].includes(error.code) ||
            (error.status ?? 0) >= 500);
        if (!recoverable) throw error;
        // Only read to resolve a lost ACK. Never automatically repeat a PUT.
        originalError = error;
        const result = await api.status(draftId, attemptId, signal);
        unchanged(status, result);
        status = result;
      }
      const receipt = await api.parts(
        draftId,
        attemptId,
        {
          expectedAttemptRevision: status.revision,
          expectedRecoveryEpoch: status.recoveryEpoch,
          afterPartNumber: part.partNumber - 1,
          limit: 1,
        },
        signal
      );
      const committed = receipt.items[0];
      if (
        receipt.preparationId !== draftId ||
        receipt.attemptId !== attemptId ||
        receipt.attemptRevision !== status.revision ||
        receipt.recoveryEpoch !== initial.recoveryEpoch ||
        receipt.totalParts !== initial.totalParts ||
        !committed ||
        committed.partNumber !== part.partNumber ||
        committed.state !== "RECEIVED"
      ) {
        if (originalError) throw originalError;
        fail(
          "The server has not confirmed this part. Refresh its status before resuming.",
          "PART_RECEIPT_UNCONFIRMED"
        );
      }
      if (
        committed.expectedBytes !== length ||
        committed.measuredBytes !== length ||
        committed.checksumSha256 !== local.sha
      )
        fail(
          "The received bytes do not match the selected file. Upload stopped; no completion was requested.",
          "PART_RECEIPT_MISMATCH"
        );
      report({
        receivedBytes: progress.receivedBytes + length,
        verifiedBytes: progress.verifiedBytes + length,
      });
    }
  const final = await api.status(draftId, attemptId, signal);
  unchanged(status, final);
  if (
    final.retainedBytes !== String(file.size) ||
    final.reservedBytes !== "0" ||
    progress.verifiedBytes !== file.size
  )
    fail(
      "The backend has not confirmed the complete file. Refresh its status before requesting checks.",
      "UPLOAD_INCOMPLETE"
    );
  report({ phase: "RECEIVED", partNumber: null });
  return final;
}
