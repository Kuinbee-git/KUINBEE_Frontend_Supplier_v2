/**
 * Theme Store (Zustand)
 * Light/Dark mode state management for Supplier Panel
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      isDark: false,

      setTheme: (theme) => {
        set({ theme, isDark: theme === 'dark' });
        applyThemeToDOM(theme);
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'kuinbee-supplier-theme-storage',
      onRehydrateStorage: () => (state) => {
        // Re-apply the persisted theme class on page load
        if (state) applyThemeToDOM(state.theme);
      },
    }
  )
);
