// Canonical onboarding contract. Frontend copies are checked by scripts/supplier-onboarding-contracts.mjs.
import { z } from "zod";

const text = (max = 200) => z.string().trim().max(max).default("");
const list = z.array(z.string().trim().min(1).max(160)).max(30).default([]);
export const SupplierIdentitySchema = z.object({
  supplierType: z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
  name: text(), contactName: text(), country: text(100), phone: text(40),
  website: text(500).refine(v => !v || /^https?:\/\//i.test(v), "Use an http or https website"),
  role: text(120),
}).strict();
export const SupplierCapabilitiesSchema = z.object({
  offerings: list, domains: list, modalities: list, formats: list, countries: list, languages: list,
  description: text(5000), collectionMethods: text(2000), capacity: text(500),
  availability: text(500), equipment: text(2000), experience: text(3000),
  rights: text(2000), compliance: text(2000), portfolio: text(2000), notes: z.string().max(5000).default(""),
}).strict();
export const SupplierVerificationDetailsSchema = z.object({
  legalName: text(), registrationCountry: text(100), registrationNumber: text(160),
  address: text(1000), notes: text(3000),
}).strict();
export const SupplierDocumentRequirementSchema = z.object({
  key: z.string().regex(/^[a-z0-9_-]{1,60}$/), label: z.string().trim().min(3).max(160),
  required: z.boolean().default(true),
  acceptedAlternatives: list,
}).strict();
export const SupplierDocumentChecklistSchema = z.array(SupplierDocumentRequirementSchema).max(10)
  .refine(items => new Set(items.map(i => i.key)).size === items.length, "Document keys must be unique");
export const SupplierApplicationSaveSchema = z.object({
  version: z.number().int().nonnegative(), identity: SupplierIdentitySchema,
  capabilities: SupplierCapabilitiesSchema, verificationDetails: SupplierVerificationDetailsSchema.optional(),
}).strict();
export const SupplierApplicationVersionSchema = z.object({ version: z.number().int().nonnegative() }).strict();
export const SupplierApplicationStartSchema = z.object({
  email: z.email().max(254).transform(v => v.trim().toLowerCase()),
  source: text(200), requirementRef: text(160),
}).strict();
export const SupplierOnboardingExchangeSchema = z.object({ token: z.string().regex(/^[a-zA-Z0-9_-]{43}$/) }).strict();
export const SupplierInvitationAcceptSchema = z.object({ password: z.string().min(12).max(128).optional() }).strict();
export const SupplierReviewDecisionSchema = z.object({
  version: z.number().int().nonnegative(), reviewId: z.string().min(1).max(100),
  decision: z.enum(["INVITE", "REQUEST_INFORMATION", "REJECT", "APPROVE", "REQUEST_CHANGES"]),
  reason: text(2000), internalNotes: text(3000),
  reapplyAt: z.iso.datetime().nullable().optional(),
  documentChecklist: SupplierDocumentChecklistSchema.optional(),
}).strict();
export type SupplierIdentity = z.infer<typeof SupplierIdentitySchema>;
export type SupplierCapabilities = z.infer<typeof SupplierCapabilitiesSchema>;
export type SupplierVerificationDetails = z.infer<typeof SupplierVerificationDetailsSchema>;
export type SupplierDocumentRequirement = z.infer<typeof SupplierDocumentRequirementSchema>;
export type SupplierApplicationSave = z.infer<typeof SupplierApplicationSaveSchema>;
export type SupplierReviewDecision = z.infer<typeof SupplierReviewDecisionSchema>;

// Approved global policy: each slot accepts alternatives, without country locks.
export function getSupplierDocumentChecklist(type: "INDIVIDUAL" | "COMPANY"): SupplierDocumentRequirement[] {
  const rows: [string, string, boolean, string[]][] = type === "INDIVIDUAL" ? [
    ["identity", "Identity Verification", true, ["Passport", "National ID", "Driving Licence", "Other Government ID"]],
    ["address", "Address Verification", true, ["Utility Bill", "Bank Statement", "Government Letter", "Other Address Proof"]],
    ["rights", "Data Ownership & Licensing Declaration", true, ["Signed Kuinbee Declaration", "Existing Licensing Agreement", "Ownership Authorization"]],
    ["tax", "Tax Identification", false, ["Local Tax ID", "Tax Registration", "Equivalent", "Not Applicable"]],
    ["bank", "Bank Account Verification", false, ["Bank Statement", "Bank Letter", "Account Confirmation", "Equivalent"]],
  ] : [
    ["registration", "Business Registration", true, ["Certificate of Incorporation", "Business Licence", "Trade Licence", "Government Registry Extract", "Other Recognized Registration Evidence"]],
    ["representative", "Authorized Representative Verification", true, ["Director's ID", "Authorized Signatory's ID", "Government-issued ID of Representative"]],
    ["rights", "Data Ownership & Licensing Authorization", true, ["Signed Kuinbee Declaration", "Existing Licensing Agreement", "Authorization Letter", "Rights Holder Agreement"]],
    ["address", "Business Address Verification", false, ["Utility Bill", "Bank Statement", "Government Correspondence", "Registry Record", "Other Address Proof"]],
    ["tax-bank", "Tax or Bank Verification", false, ["Tax Certificate", "Business Tax ID", "Bank Statement", "Account Confirmation", "Equivalent"]],
  ];
  return rows.map(([key, label, required, acceptedAlternatives]) => ({key, label, required, acceptedAlternatives}));
}

export interface SupplierOnboardingDocumentDto {
  id: string; requirementKey: string; name: string; contentType: string; size: number; createdAt: string;
}
export interface SupplierOnboardingReviewDto {
  id: string; phase: "APPLICATION" | "VERIFICATION"; version: number; snapshot: {
    identity: SupplierIdentity; capabilities: SupplierCapabilities; verificationDetails: SupplierVerificationDetails;
    documentChecklist: SupplierDocumentRequirement[]; documents: SupplierOnboardingDocumentDto[];
  }; decision: string | null; reason: string | null; submittedAt: string; reviewedAt: string | null;
  pickedByAdminId?: string | null; internalNotes?: string | null;
}
export interface SupplierWorkspaceDto {
  id: string; email: string; version: number; emailVerified: boolean; userId: string | null;
  applicationStatus: "DRAFT" | "SUBMITTED" | "INFORMATION_REQUESTED" | "INVITED" | "REJECTED";
  verificationStatus: "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
  identity: SupplierIdentity; capabilities: SupplierCapabilities; verificationDetails: SupplierVerificationDetails;
  documentChecklist: SupplierDocumentRequirement[]; documents: SupplierOnboardingDocumentDto[];
  reviews: SupplierOnboardingReviewDto[]; reason: string | null; reapplyAt: string | null;
  access: "APPLICATION" | "VERIFICATION" | "APPROVED"; canEdit: boolean;
  invitation: { id: string; expiresAt: string; acceptedAt: string | null; revokedAt: string | null } | null;
  notifications?: { id: string; queuedAt: string | null; attempts: number; nextAttemptAt: string; deliveryState?: string }[];
}
