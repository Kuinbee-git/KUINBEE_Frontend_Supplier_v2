import { API_BASE_URL } from "@/constants/api.constants";
import type { SupplierWorkspaceDto, SupplierApplicationSave } from "@/lib/supplier-onboarding-contracts";

const root = "/api/v1/supplier/application";
export async function onboardingRequest<T>(path: string, body?: unknown, method = body === undefined ? "GET" : "POST", headers?: HeadersInit): Promise<T> {
  const raw = typeof File !== "undefined" && body instanceof File;
  const response = await fetch(`${API_BASE_URL}${root}${path}`, {method, credentials: "include", cache: "no-store",
    headers: {...(!raw && body !== undefined ? {"Content-Type": "application/json"} : {}), ...headers},
    body: body === undefined ? undefined : raw ? body as File : JSON.stringify(body), signal: AbortSignal.timeout(raw ? 60_000 : 20_000)});
  const payload = await response.json().catch(() => ({error: {message: "The server could not complete this request"}}));
  if (!response.ok) throw Object.assign(new Error(payload.error?.message || "Request failed"), {status: response.status, code: payload.error?.code});
  return payload.data as T;
}
export const loadSupplierWorkspace = () => onboardingRequest<SupplierWorkspaceDto>("/workspace");
export const saveSupplierWorkspace = (body: SupplierApplicationSave, capabilitiesOnly = false) => onboardingRequest<SupplierWorkspaceDto>(capabilitiesOnly ? "/profile/capabilities" : "/workspace", body, "PUT");
export const submitSupplierWorkspace = (version: number) => onboardingRequest<SupplierWorkspaceDto>("/workspace/submit", {version});
export const uploadVerificationDocument = (file: File, key: string, version: number) => onboardingRequest<SupplierWorkspaceDto>("/workspace/documents", file, "POST", {
  "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name), "X-Requirement-Key": key, "X-Workspace-Version": String(version),
});
export async function supplierSignOut() {
  await onboardingRequest("/logout", {});
  const { useAuthStore } = await import("@/store/auth.store"); useAuthStore.getState().logout();
}
