/**
 * Catalog Constants
 * UI constants for sources and categories
 */

// ===== Source Config =====
export const SOURCE_CONFIG = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  DEFAULT_PAGE_SIZE: 20,
  SORT_OPTIONS: [
    { value: "name:asc", label: "Name (A-Z)" },
    { value: "name:desc", label: "Name (Z-A)" },
    { value: "createdAt:desc", label: "Recently Created" },
    { value: "createdAt:asc", label: "Oldest First" },
    { value: "updatedAt:desc", label: "Recently Updated" },
  ] as const,
} as const;

// ===== Category Config =====
export const CATEGORY_CONFIG = {
  DEFAULT_PAGE_SIZE: 100, // Load all categories by default
} as const;

// ===== Error Messages =====
export const CATALOG_ERROR_MESSAGES = {
  SOURCE_NAME_TAKEN: "A source with this name already exists. Please choose a different name.",
  SOURCE_IN_USE: "This source is in use by existing datasets and cannot be deleted.",
  SOURCE_NOT_FOUND: "Source not found. It may have been deleted.",
  CATEGORY_NOT_FOUND: "Category not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NETWORK_ERROR: "Network error. Please try again.",
} as const;
