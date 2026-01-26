/**
 * Design tokens for dataset components
 */
export function getDatasetThemeTokens(isDark: boolean) {
  return {
    // Surface colors
    surfaceCard: isDark ? 'rgba(26, 34, 64, 0.4)' : '#ffffff',
    
    // Input colors
    inputBg: isDark ? 'rgba(26, 34, 64, 0.6)' : '#f3f5fb',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e3e6f3',
    
    // Border colors
    borderDefault: isDark ? 'rgba(255, 255, 255, 0.1)' : '#dde3f0',
    borderSubtle: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(26, 34, 64, 0.06)',
    
    // Text colors
    textPrimary: isDark ? '#ffffff' : '#1a2240',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : '#525d6f',
    textMuted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#7a8494',
    
    // Interactive colors
    rowHover: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(26, 34, 64, 0.02)',
    
    // Dropzone colors
    dropzoneBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(26, 34, 64, 0.03)',
    dropzoneBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(26, 34, 64, 0.15)',
    dropzoneHover: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(26, 34, 64, 0.06)',
    
    // Status colors
    infoBg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
    infoBorder: 'rgba(59, 130, 246, 0.3)',
    infoText: '#3b82f6',
    
    successBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
    successBorder: 'rgba(34, 197, 94, 0.3)',
    successText: '#22c55e',
    
    // Banner colors (success)
    bannerBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
    bannerBorder: 'rgba(34, 197, 94, 0.3)',
    bannerText: '#22c55e',
    
    // Warning/Error colors
    warningBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
    warningBorder: 'rgba(239, 68, 68, 0.3)',
    warningText: '#ef4444',
    
    // Shadows
    shadowCard: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
      : '0 8px 24px rgba(26, 34, 64, 0.12)',
    // Glass morphism (align with supplier tokens)
    glassBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.88)',
    glassBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
    glassShadow: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.3)'
      : '0 8px 24px rgba(26, 34, 64, 0.08)',
  };
}

/**
 * File upload constraints
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_EXTENSIONS: ['.csv', '.json', '.parquet', '.xlsx'],
  ALLOWED_MIME_TYPES: [
    'text/csv',
    'application/json',
    'application/vnd.apache.parquet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

/**
 * Dataset type (superType) options - API enum values
 */
export const DATASET_TYPES = [
  { value: 'CROSS_SECTIONAL', label: 'Cross-Sectional' },
  { value: 'TIME_SERIES', label: 'Time Series' },
  { value: 'PANEL', label: 'Panel Data' },
  { value: 'POOLED_CROSS_SECTIONAL', label: 'Pooled Cross-Sectional' },
  { value: 'REPEATED_CROSS_SECTIONS', label: 'Repeated Cross-Sections' },
  { value: 'SPATIAL', label: 'Spatial Data' },
  { value: 'SPATIO_TEMPORAL', label: 'Spatio-Temporal' },
  { value: 'EXPERIMENTAL', label: 'Experimental' },
  { value: 'OBSERVATIONAL', label: 'Observational' },
  { value: 'BIG_DATA', label: 'Big Data' },
  { value: 'EVENT_HISTORY_SURVIVAL', label: 'Event History / Survival' },
  { value: 'HIERARCHICAL_MULTILEVEL', label: 'Hierarchical / Multilevel' },
] as const;

/**
 * Category options for dataset creation
 */
export const DATASET_CATEGORIES = [
  { value: 'cat_financial', label: 'Financial Data' },
  { value: 'cat_research', label: 'Market Research' },
  { value: 'cat_analytics', label: 'Consumer Analytics' },
  { value: 'cat_logistics', label: 'Logistics' },
  { value: 'cat_sales', label: 'Sales' },
] as const;

/**
 * Update frequency options
 */
export const UPDATE_FREQUENCIES = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

/**
 * Pricing model options
 */
export const PRICING_MODELS = [
  { value: 'free', label: 'Free' },
  { value: 'one_time', label: 'One-time Purchase' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'usage_based', label: 'Usage-based' },
  { value: 'contact', label: 'Contact for Pricing' },
] as const;
