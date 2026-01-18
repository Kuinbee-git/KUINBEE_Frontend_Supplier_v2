import { create } from "zustand";
import type { DashboardView } from "@/types";

/**
 * Dashboard Store
 * Manages dashboard view state and navigation
 */

interface DashboardState {
  activeView: DashboardView;
  sidebarCollapsed: boolean;
  
  // Actions
  setActiveView: (view: DashboardView) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  activeView: "overview",
  sidebarCollapsed: false,

  setActiveView: (view) => set({ activeView: view }),
  
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
