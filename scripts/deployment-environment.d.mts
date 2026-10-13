export const app: "buyer" | "supplier" | "admin";
export function deploymentEnvironment(
  source?: Record<string, string | undefined>
): {
  environment: string;
  isStaging: boolean;
  apiBase: string | undefined;
  buyerUrl: string | undefined;
};
