'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Shield, LogOut, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';
import { useThemeStore } from '@/store/theme.store';
import { SectionHeader, StatusMessage, InfoCard } from '@/components/shared';
import { ProfileSection, FormField, StatusBadge } from './shared';
import { PanVerificationHistory } from './PanVerificationHistory';

import { getOnboardingStatus } from '@/lib/api';
import type { OnboardingStatusResponse } from '@/types/onboarding.types';

interface SupplierAccountData {
  email: string;
  emailVerified: boolean;
  lastLogin?: string;
  currentSession: boolean;
}

interface SupplierAccountProps {
  initialData?: SupplierAccountData;
  onVerifyEmail?: () => void;
  onChangePassword?: (currentPassword: string, newPassword: string) => void;
  onLogout?: () => void;
}

const defaultData: SupplierAccountData = {
  email: 'supplier@company.com',
  emailVerified: true,
  lastLogin: 'Jan 5, 2026 - 9:30 AM',
  currentSession: true,
};

export function SupplierAccount({
  initialData = defaultData,
  onVerifyEmail,
  onChangePassword,
  onLogout,
}: SupplierAccountProps) {
  const tokens = useSupplierTokens();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  // Onboarding Status
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  
  // Memoized load function to prevent duplicate calls
  const loadOnboardingStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      const response = await getOnboardingStatus();
      setOnboardingStatus(response);
    } catch (err: any) {
      console.error('Failed to load onboarding status:', err);
      setStatusError(err.message || 'Failed to load onboarding status');
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);
  
  // Load onboarding status on mount (only once)
  useEffect(() => {
    loadOnboardingStatus();
  }, [loadOnboardingStatus]);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handlePasswordChange = () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    if (onChangePassword) {
      onChangePassword(currentPassword, newPassword);
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return null;
    if (password.length < 8) return { label: 'Too short', color: '#ef4444' };
    if (password.length < 12) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto p-8">
        {/* Page Header */}
        <SectionHeader
          title="Account"
          subtitle="Manage your login and security settings."
          className="mb-8"
        />

        {/* Onboarding Status - Full Width Top */}
        {!isLoadingStatus && onboardingStatus && (
          <div className="mb-8">
            <ProfileSection icon={Shield} title="Onboarding Status">
              <div className="space-y-4">
                {/* Overall Status */}
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: tokens.inputBg }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>Status</p>
                    <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>Supplier Type: {onboardingStatus.onboarding.supplierType}</p>
                  </div>
                  <StatusBadge 
                    status={onboardingStatus.onboarding.nextStep === 'DONE' ? 'verified' : 'pending'} 
                    size="sm" 
                  />
                </div>

                {/* Steps Progress - Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-medium mb-3" style={{ color: tokens.textSecondary }}>ONBOARDING STEPS</p>
                    <div className="space-y-3">
                      {/* Supplier Type */}
                      <div className="flex items-center gap-3 text-sm" style={{ color: tokens.textPrimary }}>
                        {onboardingStatus.onboarding.steps.supplierTypeSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4" style={{ color: tokens.textMuted }} />
                        )}
                        <span>Supplier Type Selected</span>
                      </div>

                      {/* Email OTP */}
                      <div className="flex items-center gap-3 text-sm" style={{ color: tokens.textPrimary }}>
                        {onboardingStatus.onboarding.steps.emailOtpVerified ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4" style={{ color: tokens.textMuted }} />
                        )}
                        <span>Email Verified</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-3">
                      {/* Individual PAN (if required) */}
                      {onboardingStatus.onboarding.steps.individualPan.required && (
                        <div className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 mt-0.5">
                            {onboardingStatus.onboarding.steps.individualPan.status === 'VERIFIED' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : onboardingStatus.onboarding.steps.individualPan.status === 'PENDING' ? (
                              <Clock className="w-4 h-4" style={{ color: tokens.textMuted }} />
                            ) : onboardingStatus.onboarding.steps.individualPan.status === 'FAILED' ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4" style={{ color: tokens.textMuted }} />
                            )}
                          </div>
                          <div style={{ color: tokens.textPrimary }}>
                            <p>PAN Verification</p>
                            <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
                              Status: <span style={{ color: 
                                onboardingStatus.onboarding.steps.individualPan.status === 'VERIFIED' ? '#10b981' : 
                                onboardingStatus.onboarding.steps.individualPan.status === 'FAILED' ? '#ef4444' : 
                                '#f59e0b'
                              }}>{onboardingStatus.onboarding.steps.individualPan.status}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Profile Completed */}
                      <div className="flex items-center gap-3 text-sm" style={{ color: tokens.textPrimary }}>
                        {onboardingStatus.onboarding.steps.profileCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4" style={{ color: tokens.textMuted }} />
                        )}
                        <span>Profile Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ProfileSection>
          </div>
        )}
        
        {statusError && (
          <StatusMessage variant="error" message={statusError} className="mb-8" />
        )}
        
        {/* PAN Verification History - Only for Individual suppliers */}
        {onboardingStatus?.onboarding.supplierType === 'INDIVIDUAL' && 
         onboardingStatus.onboarding.steps.individualPan.required && (
          <div className="mb-8">
            <PanVerificationHistory isDark={isDark} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Email Address */}
            <ProfileSection icon={Mail} title="Email Address">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: tokens.inputBg }}>
                  <div>
                    <p className="font-medium" style={{ color: tokens.textPrimary }}>
                      {onboardingStatus?.supplier.email || initialData.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {(onboardingStatus?.supplier.emailVerified ?? initialData.emailVerified) ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-500">Verified</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs" style={{ color: tokens.textMuted }}>Not verified</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!(onboardingStatus?.supplier.emailVerified ?? initialData.emailVerified) && onVerifyEmail && (
                    <Button variant="outline" size="sm" onClick={onVerifyEmail}>
                      Verify Email
                    </Button>
                  )}
                </div>
              </div>
            </ProfileSection>

            {/* Change Password */}
            <ProfileSection icon={Lock} title="Change Password">
              <div className="space-y-4">
                <FormField
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  type="password"
                />
                <FormField
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  type="password"
                />
                {passwordStrength && (
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: tokens.textMuted }}>Strength:</span>
                    <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                )}
                <FormField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  error={passwordError}
                />

                {passwordSuccess && (
                  <StatusMessage variant="success" message="Password changed successfully!" />
                )}

                <Button onClick={handlePasswordChange}>
                  Update Password
                </Button>
              </div>
            </ProfileSection>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* Session Info */}
            <ProfileSection icon={Shield} title="Session Information">
              <div className="space-y-3">
                {onboardingStatus?.supplier && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: tokens.textMuted }}>Account Status</span>
                      <StatusBadge 
                        status={onboardingStatus.supplier.status === 'ACTIVE' ? 'verified' : 'pending'} 
                        size="sm" 
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: tokens.textMuted }}>User Type</span>
                      <span style={{ color: tokens.textPrimary }}>{onboardingStatus.supplier.userType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: tokens.textMuted }}>Current Session</span>
                      <StatusBadge status="verified" size="sm" />
                    </div>
                  </>
                )}
              </div>
            </ProfileSection>

            {/* Logout */}
            <ProfileSection icon={LogOut} title="Sign Out">
              <div className="space-y-4">
                <p className="text-sm" style={{ color: tokens.textSecondary }}>
                  Sign out of your account on this device.
                </p>

                {showLogoutConfirm ? (
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: tokens.textPrimary }}>
                      Are you sure you want to sign out?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={onLogout}>
                        Yes, Sign Out
                      </Button>
                      <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setShowLogoutConfirm(true)}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                )}
              </div>
            </ProfileSection>

            {/* Info */}
            <InfoCard
              icon="check"
              title="Security Tips"
              description="Use a strong password with at least 12 characters, including numbers and special characters. Enable two-factor authentication for extra security."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
