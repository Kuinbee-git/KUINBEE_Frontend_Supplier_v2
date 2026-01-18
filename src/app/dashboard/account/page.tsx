'use client';

import { useRouter } from 'next/navigation';
import { SupplierAccount } from '@/components/profile';
import { useAuthStore } from '@/store';

export default function AccountPage() {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleVerifyEmail = () => {
    // TODO: Implement email verification flow
    console.log('Verify email');
  };

  const handleChangePassword = (currentPassword: string, newPassword: string) => {
    // TODO: Implement password change API call
    console.log('Change password', { currentPassword, newPassword });
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
