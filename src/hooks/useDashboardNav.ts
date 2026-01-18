import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard.store";
import type { DashboardView } from "@/types";

/**
 * Custom hook for dashboard navigation
 * Manages view switching and route navigation
 */
export function useDashboardNav() {
  const router = useRouter();
  const { activeView, setActiveView } = useDashboardStore();

  // Navigate to a dashboard view
  const navigateTo = (view: DashboardView) => {
    setActiveView(view);
    
    // Map view to route
    const route = view === "overview" ? "/dashboard" : `/dashboard/${view}`;
    router.push(route);
  };

  // Check if a view is active
  const isActive = (view: DashboardView) => activeView === view;

  // Navigate back to dashboard home
  const goToDashboard = () => {
    navigateTo("overview");
  };

  return {
    activeView,
    navigateTo,
    isActive,
    goToDashboard,
  };
}
