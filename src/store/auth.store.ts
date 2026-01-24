import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Auth Store
 * Manages authentication state and user session
 */

interface User {
  id: string;
  email: string;
  name: string;
  role: "supplier";
}

interface AuthState {
  user: User | null;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      login: (user) =>
        set({
          user,
        }),

      logout: () => {
        // Clear auth state
        set({
          user: null,
        });
        
        // Clear all persisted storage
        if (typeof window !== 'undefined') {
          // Clear auth storage
          localStorage.removeItem('auth-storage');
          // Clear supplier storage
          localStorage.removeItem('kuinbee-supplier-storage');
          // Clear onboarding storage
          localStorage.removeItem('onboarding-storage');
          // Clear theme storage (optional, user preference)
          // localStorage.removeItem('kuinbee-supplier-theme-storage');
        }
      },

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: "auth-storage",
      skipHydration: false,
    }
  )
);
