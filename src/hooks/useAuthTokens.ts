import { useMemo } from 'react';

/**
 * Design tokens hook for auth components
 * Provides consistent theming across all auth screens
 */
export function useAuthTokens(isDark: boolean) {
  return useMemo(
    () => ({
      textPrimary: isDark ? '#f8fafc' : '#1a2240',
      textSecondary: isDark ? 'rgba(226, 232, 240, 0.8)' : '#525d6f',
      textMuted: isDark ? 'rgba(203, 213, 225, 0.6)' : '#7a8494',
      borderDefault: isDark ? 'rgba(255, 255, 255, 0.12)' : '#dde3f0',
      borderFocus: isDark ? 'rgba(139, 92, 246, 0.5)' : '#8b5cf6',
      borderError: '#ef4444',
      borderSuccess: '#10b981',
      inputBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
      inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : '#dde3f0',
      buttonBg: 'linear-gradient(135deg, #1a2240 0%, #2a3250 100%)',
      buttonBgHover: 'linear-gradient(135deg, #2a3350 0%, #3a4360 100%)',
      cardBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.9)',
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : '#dde3f0',
    }),
    [isDark]
  );
}
