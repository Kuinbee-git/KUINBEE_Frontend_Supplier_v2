"use client";

import { reloadAt } from "@/lib/utils/reload-navigation";

import { SupplierAccount } from "@/components/profile";
import { useAuthStore } from "@/store";

export default function AccountPage() {
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    const {supplierSignOut} = await import("@/lib/api/supplier-onboarding");
    await supplierSignOut();
    logout();
    reloadAt("/auth/login");
  };

  return (
    <SupplierAccount fallbackEmail={user?.email} onLogout={handleLogout} />
  );
}
