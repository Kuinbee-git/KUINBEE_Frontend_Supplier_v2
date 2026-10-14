/** New preparation is available only in isolated staging and local development. */
export const DATASET_PREPARATION_ENABLED =
  process.env.NEXT_PUBLIC_APP_ENV === "staging" ||
  process.env.NEXT_PUBLIC_APP_ENV === "local" ||
  (!process.env.NEXT_PUBLIC_APP_ENV && process.env.NODE_ENV !== "production");
