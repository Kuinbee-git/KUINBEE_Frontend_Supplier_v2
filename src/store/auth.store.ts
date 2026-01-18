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
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      logout: () => {
        // Clear auth state
        set({
          user: null,
          isAuthenticated: false,
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
    }
  )
);
