"use client";

import { SupplierAccount } from "@/components/profile";
import { useAuthStore } from "@/store";

export default function AccountPage() {
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = "/auth/login";
  };

  return (
    <SupplierAccount fallbackEmail={user?.email} onLogout={handleLogout} />
  );
}
