import { z } from "zod";
import { BUSINESS_DOMAINS } from "@/types/onboarding.types";

/**
 * Validation Schemas using Zod
 * Form validation for onboarding and dashboard
 */

// ===== Supplier Identity Validation =====
export const supplierIdentitySchema = z
  .object({
    supplierType: z.enum(["individual", "company"], {
      message: "Please select a supplier type",
    }),
    individualName: z.string().optional(),
    companyName: z.string().optional(),
    website: z
      .string()
      .url({ message: "Please enter a valid URL" })
      .or(z.literal(""))
      .optional(),
    contactPersonName: z
      .string()
      .min(2, { message: "Contact person name must be at least 2 characters" }),
    designation: z
      .string()
      .min(2, { message: "Designation must be at least 2 characters" }),
    contactEmail: z
      .string()
      .email({ message: "Please enter a valid email address" }),
    emergencyContact: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, {
        message: "Please enter a valid phone number (E.164 format)",
      }),
  })
  .refine(
    (data) => {
      if (data.supplierType === "individual") {
        return data.individualName && data.individualName.length >= 2;
      }
      return true;
    },
    {
      message: "Individual name is required and must be at least 2 characters",
      path: ["individualName"],
    }
  )
  .refine(
    (data) => {
      if (data.supplierType === "company") {
        return data.companyName && data.companyName.length >= 2;
      }
      return true;
    },
    {
      message: "Company name is required and must be at least 2 characters",
      path: ["companyName"],
    }
  );

export type SupplierIdentityFormValues = z.infer<typeof supplierIdentitySchema>;

// ===== Business Data Context Validation =====
const businessDomainsList = BUSINESS_DOMAINS as unknown as readonly [string, ...string[]];

export const businessDataContextSchema = z.object({
  businessDomains: z
    .array(z.enum(businessDomainsList))
    .min(1, { message: "Please select at least one business domain" })
    .max(5, { message: "Please select no more than 5 business domains" }),
  primaryDomain: z
    .string()
    .min(1, { message: "Please select a primary business domain" }),
  natureOfData: z
    .string()
    .min(50, {
      message: "Please provide a detailed description (at least 50 characters)",
    })
    .max(1000, {
      message: "Description must not exceed 1000 characters",
    }),
});

export type BusinessDataContextFormValues = z.infer<typeof businessDataContextSchema>;

// ===== Dataset Upload Validation =====
export const datasetUploadSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Dataset name must be at least 3 characters" })
    .max(100, { message: "Dataset name must not exceed 100 characters" }),
  description: z
    .string()
    .min(20, { message: "Description must be at least 20 characters" })
    .max(500, { message: "Description must not exceed 500 characters" }),
  category: z.string().min(1, { message: "Please select a category" }),
  tags: z
    .array(z.string())
    .min(1, { message: "Please add at least one tag" })
    .max(10, { message: "Maximum 10 tags allowed" }),
  fileSize: z
    .number()
    .positive()
    .max(524288000, { message: "File size must not exceed 500MB" }), // 500MB in bytes
  fileType: z.enum(["csv", "json", "xml", "excel", "parquet", "other"], {
    message: "Please specify the file type",
  }),
});

export type DatasetUploadFormValues = z.infer<typeof datasetUploadSchema>;

// ===== Profile Update Validation =====
export const profileUpdateSchema = z.object({
  contactPersonName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  designation: z
    .string()
    .min(2, { message: "Designation must be at least 2 characters" }),
  contactEmail: z
    .string()
    .email({ message: "Please enter a valid email address" }),
  emergencyContact: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: "Please enter a valid phone number",
    }),
  website: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .or(z.literal(""))
    .optional(),
  businessDomains: z
    .array(z.string())
    .min(1, { message: "At least one business domain is required" }),
  primaryDomain: z.string().min(1, { message: "Primary domain is required" }),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

// ===== Account Settings Validation =====
export const accountSettingsSchema = z.object({
  marketingEmails: z.boolean().default(false),
  twoFactorAuth: z.boolean().default(false),
  sessionTimeout: z.enum(["15", "30", "60", "never"]).default("30"),
});

export type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>;

// ===== Password Change Validation =====
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    newPassword: z
      .string()
      .min(8, { message: "New password must be at least 8 characters" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message:
          "Password must contain uppercase, lowercase, number and special character",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

// ===== Support Ticket Validation =====
export const supportTicketSchema = z.object({
  subject: z
    .string()
    .min(5, { message: "Subject must be at least 5 characters" })
    .max(100, { message: "Subject must not exceed 100 characters" }),
  category: z.enum(
    ["technical", "billing", "account", "data", "verification", "other"],
    {
      message: "Please select a category",
    }
  ),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  description: z
    .string()
    .min(20, { message: "Description must be at least 20 characters" })
    .max(2000, { message: "Description must not exceed 2000 characters" }),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
      })
    )
    .max(5, { message: "Maximum 5 attachments allowed" })
    .optional(),
});

export type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;

// ===== Helper Functions =====

/**
 * Validate form data against a schema
 */
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const validated = schema.parse(data);
    return { success: true as const, data: validated, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        data: null,
        errors: error.flatten().fieldErrors,
      };
    }
    return {
      success: false as const,
      data: null,
      errors: { _errors: ["Validation failed"] },
    };
  }
}

/**
 * Get error message for a specific field
 */
export function getFieldError(
  errors: Record<string, string[] | undefined> | null,
  field: string
): string | undefined {
  return errors?.[field]?.[0];
}
