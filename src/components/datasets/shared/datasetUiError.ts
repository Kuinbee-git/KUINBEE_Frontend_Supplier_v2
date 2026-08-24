export interface DatasetUiError {
  code?: string;
  message?: string;
  status?: number;
}

export function toDatasetUiError(error: unknown): DatasetUiError {
  return error && typeof error === "object" ? (error as DatasetUiError) : {};
}
