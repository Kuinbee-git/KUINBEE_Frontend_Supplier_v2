/** Narrow thrown values without assuming every failure is an Error instance. */
export function getErrorDetails(value: unknown): {
  message?: string;
  code?: string;
  status?: number;
} {
  if (value === null || typeof value !== "object") return {};
  const candidate = value as Record<string, unknown>;
  return {
    message:
      typeof candidate.message === "string" ? candidate.message : undefined,
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    status: typeof candidate.status === "number" ? candidate.status : undefined,
  };
}
