'use client';

import { SupplierAccount } from '@/components/profile';
import { useAuthStore } from '@/store';

export default function AccountPage() {
  const { logout, user } = useAuthStore();

  const handleVerifyEmail = () => {
    // TODO: Implement email verification flow
  };

  const handleChangePassword = (currentPassword: string, newPassword: string) => {
    void currentPassword;
    void newPassword;
    // TODO: Implement password change API call
  };

  const handleLogout = () => {
    // Clear all stores and state
    logout();
    // Force a hard redirect to ensure clean state
    window.location.href = '/auth/login';
  };

  return (
    <SupplierAccount 
      initialData={{
        email: user?.email || 'supplier@company.com',
        emailVerified: true,
        lastLogin: 'Jan 8, 2026 - 9:30 AM',
        currentSession: true,
      }}
      onVerifyEmail={handleVerifyEmail}
      onChangePassword={handleChangePassword}
      onLogout={handleLogout}
    />
  );
}
