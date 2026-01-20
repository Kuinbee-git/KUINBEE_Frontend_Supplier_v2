/**
 * Kuinbee Supplier Panel - Design Tokens
 * Unified design system aligned with Admin Panel
 */

export const DESIGN_TOKENS = {
  // ===== BRAND COLORS =====
  brand: {
    primary: '#1a2240',
    primaryHover: '#2a3250',
    secondary: '#4e5a7e',
  },

  // ===== DARK MODE TOKENS =====
  dark: {
    // Backgrounds
    surfaceUnified: 'linear-gradient(135deg, #1a2240 0%, #2a3250 50%, #1f2847 100%)',
    surfaceBase: '#0f1428',
    surfaceElevated: '#141b36',
    surfaceCard: 'rgba(26, 34, 64, 0.65)',
    surfaceHover: 'rgba(255, 255, 255, 0.04)',

    // Glass Surfaces (Enterprise Glassmorphism)
    glassBg: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
    glassHover: 'rgba(255, 255, 255, 0.12)',

    // Text Hierarchy
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    textDisabled: 'rgba(255, 255, 255, 0.3)',

    // Borders
    borderDefault: 'rgba(255, 255, 255, 0.1)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    borderFocus: 'rgba(255, 255, 255, 0.2)',

    // Grid Pattern
    gridPattern: 'rgba(255, 255, 255, 0.04)',
    gridOpacity: 0.6,
  },

  // ===== LIGHT MODE TOKENS =====
  light: {
    // Backgrounds
    surfaceUnified: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f5f7fb 100%)',
    surfaceBase: '#ffffff',
    surfaceBackground: '#f7f8fa',
    surfaceHover: '#f3f5fb',
    surfaceSelected: '#eef1fb',

    // Glass Surfaces
    glassBg: 'rgba(255, 255, 255, 0.88)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    glassShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
    glassHover: 'rgba(255, 255, 255, 0.95)',

    // Text Hierarchy
    textPrimary: '#1a2240',
    textSecondary: '#525d6f',
    textMuted: '#6b7280',
    textDisabled: '#9ca3af',

    // Borders
    borderDefault: '#dde3f0',
    borderSubtle: '#edf0f7',
    borderFocus: '#1a2240',

    // Grid Pattern
    gridPattern: 'rgba(26, 34, 64, 0.35)',
    gridOpacity: 0.8,
  },

  // ===== SEMANTIC COLORS =====
  semantic: {
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.1)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.1)',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.1)',
  },

  // ===== LAYOUT CONSTANTS =====
  layout: {
    // Auth Screen Split
    authLeftWidth: '55%',
    authRightWidth: '45%',

    // Sidebar
    sidebarWidth: '260px',
    sidebarCollapsedWidth: '80px',

    // Grid Pattern
    gridSize: '32px',

    // Spacing
    headerHeight: '64px',
    contentPadding: '32px',
  },

  // ===== EFFECTS =====
  effects: {
    // Backdrop Blur
    backdropBlur: {
      sm: 'blur(8px)',
      md: 'blur(16px)',
      lg: 'blur(24px)',
    },

    // Rim Light (Top edge highlight)
    rimLight: {
      dark: 'linear-gradient(to right, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08))',
      light: 'linear-gradient(to right, rgba(26, 34, 64, 0.06), rgba(26, 34, 64, 0.12), rgba(26, 34, 64, 0.06))',
    },

    // Transitions
    transition: {
      fast: '200ms ease-out',
      normal: '300ms ease-out',
      slow: '500ms ease-out',
    },
  },

  // ===== TYPOGRAPHY =====
  typography: {
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
    },
  },

  // ===== COMPONENT SIZES =====
  components: {
    button: {
      height: {
        sm: '36px',
        md: '44px',
        lg: '48px',
      },
      padding: {
        sm: '0 16px',
        md: '0 24px',
        lg: '0 32px',
      },
    },

    input: {
      height: {
        sm: '36px',
        md: '44px',
        lg: '48px',
      },
    },

    card: {
      borderRadius: {
        sm: '12px',
        md: '16px',
        lg: '20px',
      },
    },
  },
} as const;

// ===== HELPER FUNCTIONS =====

/**
 * Get grid pattern background style
 */
export const getGridPatternStyle = (isDark: boolean) => ({
  backgroundImage: `
    linear-gradient(${isDark ? DESIGN_TOKENS.dark.gridPattern : DESIGN_TOKENS.light.gridPattern} 1px, transparent 1px),
    linear-gradient(90deg, ${isDark ? DESIGN_TOKENS.dark.gridPattern : DESIGN_TOKENS.light.gridPattern} 1px, transparent 1px)
  `,
  backgroundSize: `${DESIGN_TOKENS.layout.gridSize} ${DESIGN_TOKENS.layout.gridSize}`,
  opacity: isDark ? DESIGN_TOKENS.dark.gridOpacity : DESIGN_TOKENS.light.gridOpacity,
});

/**
 * Get glass card style
 */
export const getGlassCardStyle = (isDark: boolean) => ({
  background: isDark ? DESIGN_TOKENS.dark.glassBg : DESIGN_TOKENS.light.glassBg,
  border: `1px solid ${isDark ? DESIGN_TOKENS.dark.glassBorder : DESIGN_TOKENS.light.glassBorder}`,
  boxShadow: isDark ? DESIGN_TOKENS.dark.glassShadow : DESIGN_TOKENS.light.glassShadow,
  backdropFilter: DESIGN_TOKENS.effects.backdropBlur.md,
});

/**
 * Get rim light style (top edge highlight)
 */
export const getRimLightStyle = (isDark: boolean) => ({
  background: isDark ? DESIGN_TOKENS.effects.rimLight.dark : DESIGN_TOKENS.effects.rimLight.light,
  height: '1px',
  width: '100%',
});

/**
 * Type exports for TypeScript support
 */
export type DesignTokens = typeof DESIGN_TOKENS;
export type SemanticColor = keyof typeof DESIGN_TOKENS.semantic;
