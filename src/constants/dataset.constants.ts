/**
 * Design tokens for dataset components
 */
export function getDatasetThemeTokens(_isDark: boolean) {
  return {
    // Compatibility aliases for dataset workflows that now render inside the
    // authenticated dashboard. Values deliberately reference the scoped
    // dashboard system so nested editors cannot create a second palette.
    surfaceCard: "var(--dashboard-glass-background)",

    inputBg: "var(--dashboard-control-background)",
    inputBorder: "var(--dashboard-control-border)",

    borderDefault: "var(--dashboard-border)",
    borderSubtle: "var(--dashboard-glass-border)",

    textPrimary: "var(--dashboard-text)",
    textSecondary: "var(--dashboard-text-muted)",
    textMuted: "var(--dashboard-text-muted)",

    rowHover: "var(--dashboard-control-background-hover)",

    dropzoneBg: "var(--dashboard-control-background)",
    dropzoneBorder: "var(--dashboard-control-border)",
    dropzoneHover: "var(--dashboard-control-background-hover)",

    infoBg:
      "color-mix(in srgb, var(--dashboard-action) 10%, var(--dashboard-surface))",
    infoBorder:
      "color-mix(in srgb, var(--dashboard-action) 28%, var(--dashboard-border))",
    infoText: "var(--dashboard-info-foreground)",

    successBg:
      "color-mix(in srgb, var(--dashboard-success) 10%, var(--dashboard-surface))",
    successBorder:
      "color-mix(in srgb, var(--dashboard-success) 28%, var(--dashboard-border))",
    successText: "var(--dashboard-success-foreground)",

    bannerBg:
      "color-mix(in srgb, var(--dashboard-success) 10%, var(--dashboard-surface))",
    bannerBorder:
      "color-mix(in srgb, var(--dashboard-success) 28%, var(--dashboard-border))",
    bannerText: "var(--dashboard-success-foreground)",

    warningBg:
      "color-mix(in srgb, var(--dashboard-danger) 9%, var(--dashboard-surface))",
    warningBorder:
      "color-mix(in srgb, var(--dashboard-danger) 28%, var(--dashboard-border))",
    warningText: "var(--dashboard-danger-foreground)",
    errorBg:
      "color-mix(in srgb, var(--dashboard-danger) 9%, var(--dashboard-surface))",
    errorBorder:
      "color-mix(in srgb, var(--dashboard-danger) 28%, var(--dashboard-border))",
    errorText: "var(--dashboard-danger-foreground)",

    shadowCard: "var(--dashboard-glass-shadow)",
    glassBg: "var(--dashboard-glass-background)",
    glassBorder: "var(--dashboard-glass-border)",
    glassShadow: "var(--dashboard-glass-shadow)",
    isDark: _isDark,
  };
}

export type DatasetThemeTokens = ReturnType<typeof getDatasetThemeTokens>;

/**
 * File upload constraints
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_EXTENSIONS: [".csv", ".json", ".parquet", ".xlsx", ".zip"],
  ALLOWED_MIME_TYPES: [
    "text/csv",
    "application/json",
    "application/vnd.apache.parquet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed",
  ],
} as const;

/**
 * Dataset type (superType) options - API enum values
 */
export const DATASET_TYPES = [
  { value: "CROSS_SECTIONAL", label: "Cross-Sectional" },
  { value: "TIME_SERIES", label: "Time Series" },
  { value: "PANEL", label: "Panel Data" },
  { value: "POOLED_CROSS_SECTIONAL", label: "Pooled Cross-Sectional" },
  { value: "REPEATED_CROSS_SECTIONS", label: "Repeated Cross-Sections" },
  { value: "SPATIAL", label: "Spatial Data" },
  { value: "SPATIO_TEMPORAL", label: "Spatio-Temporal" },
  { value: "EXPERIMENTAL", label: "Experimental" },
  { value: "OBSERVATIONAL", label: "Observational" },
  { value: "BIG_DATA", label: "Big Data" },
  { value: "EVENT_HISTORY_SURVIVAL", label: "Event History / Survival" },
  { value: "HIERARCHICAL_MULTILEVEL", label: "Hierarchical / Multilevel" },
] as const;

/**
 * Category options for dataset creation
 */
export const DATASET_CATEGORIES = [
  { value: "cat_financial", label: "Financial Data" },
  { value: "cat_research", label: "Market Research" },
  { value: "cat_analytics", label: "Consumer Analytics" },
  { value: "cat_logistics", label: "Logistics" },
  { value: "cat_sales", label: "Sales" },
] as const;

/**
 * Update frequency options
 */
export const UPDATE_FREQUENCIES = [
  { value: "realtime", label: "Real-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

/**
 * Pricing model options
 */
export const PRICING_MODELS = [
  { value: "free", label: "Free" },
  { value: "one_time", label: "One-time Purchase" },
  { value: "subscription", label: "Subscription" },
  { value: "usage_based", label: "Usage-based" },
  { value: "contact", label: "Contact for Pricing" },
] as const;

/**
 * Pricing status configuration
 */
export const PRICING_STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    color: "var(--dashboard-text-muted)",
    bgColor: "var(--dashboard-surface-muted)",
    icon: "📝",
  },
  SUBMITTED: {
    label: "Submitted",
    color: "var(--dashboard-info-foreground)",
    bgColor:
      "color-mix(in srgb, var(--dashboard-action) 10%, var(--dashboard-surface))",
    icon: "⏳",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    color: "var(--dashboard-danger-foreground)",
    bgColor:
      "color-mix(in srgb, var(--dashboard-danger) 9%, var(--dashboard-surface))",
    icon: "🔄",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    color: "var(--dashboard-info-foreground)",
    bgColor:
      "color-mix(in srgb, var(--dashboard-action) 10%, var(--dashboard-surface))",
    icon: "📤",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "var(--dashboard-warning-foreground)",
    bgColor:
      "color-mix(in srgb, var(--dashboard-warning) 10%, var(--dashboard-surface))",
    icon: "👀",
  },
  ACTIVE: {
    label: "Active",
    color: "var(--dashboard-success-foreground)",
    bgColor:
      "color-mix(in srgb, var(--dashboard-success) 10%, var(--dashboard-surface))",
    icon: "✓",
  },
  REJECTED: {
    label: "Rejected",
    color: "var(--dashboard-danger-foreground)",
    bgColor:
      "color-mix(in srgb, var(--dashboard-danger) 9%, var(--dashboard-surface))",
    icon: "✕",
  },
  INACTIVE: {
    label: "Inactive",
    color: "var(--dashboard-text-muted)",
    bgColor: "var(--dashboard-surface-muted)",
    icon: "🔒",
  },
} as const;

/**
 * Currency options
 */
export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
] as const;
