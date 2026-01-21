'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, User, Briefcase, Mail, Globe } from 'lucide-react';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';
import { SectionHeader, StatusMessage } from '@/components/shared';
import { ProfileSection, FormField } from './shared';
import { getSupplierProfile, updateSupplierProfile, getOnboardingStatus } from '@/lib/api';
import {
  SupplierType,
  UpdateProfileRequest,
  BUSINESS_DOMAINS,
} from '@/types/onboarding.types';
import type { SupplierProfile as SupplierProfileType } from '@/types/onboarding.types';

interface SupplierProfileProps {
  onSave?: (profile: SupplierProfileType) => void;
}

/**
 * Supplier Profile Component
 * Handles supplier profile creation/update for onboarding flow
 * Supports both INDIVIDUAL and COMPANY supplier types
 */
export function SupplierProfile({ onSave }: SupplierProfileProps) {
  const tokens = useSupplierTokens();

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile Data
  const [profile, setProfile] = useState<SupplierProfileType | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  
  // Form State
  const [supplierType, setSupplierType] = useState<SupplierType>('COMPANY');
  const [individualName, setIndividualName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [businessDomains, setBusinessDomains] = useState<string[]>([]);
  const [primaryDomain, setPrimaryDomain] = useState('');
  const [naturesOfDataProvided, setNaturesOfDataProvided] = useState('');

  const [hasChanges, setHasChanges] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch onboarding status first
      try {
        const statusResponse = await getOnboardingStatus();
        setIsOnboardingComplete(statusResponse.onboarding.nextStep === 'DONE');
      } catch (err: any) {
        console.error('Failed to check onboarding status:', err);
      }

      // Fetch profile
      const response = await getSupplierProfile();
      
      if (response.profile) {
        const p = response.profile;
        setProfile(p);
        setSupplierType(p.supplierType);
        setIndividualName(p.individualName || '');
        setCompanyName(p.companyName || '');
        setWebsiteUrl(p.websiteUrl || '');
        setContactPersonName(p.contactPersonName);
        setBusinessDomains(p.businessDomains);
        setPrimaryDomain(p.primaryDomain || '');
        setNaturesOfDataProvided(p.naturesOfDataProvided || '');
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (setter: (v: any) => void) => (value: any) => {
    setter(value);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleBusinessDomainsChange = (value: string) => {
    const domains = value.split(',').map(d => d.trim()).filter(Boolean);
    setBusinessDomains(domains);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const validateForm = (): string | null => {
    if (supplierType === 'INDIVIDUAL') {
      if (!individualName.trim()) {
        return 'Individual name is required';
      }
    } else {
      if (!companyName.trim()) {
        return 'Company name is required';
      }
      if (!contactPersonName.trim()) {
        return 'Contact person name is required for companies';
      }
    }

    if (businessDomains.length === 0) {
      return 'At least one business domain is required';
    }

    return null;
  };

  const handleSave = async () => {
    setError(null);
    setSaveSuccess(false);

    // Validate
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      let requestData: UpdateProfileRequest;

      if (supplierType === 'INDIVIDUAL') {
        requestData = {
          supplierType: 'INDIVIDUAL',
          individualName: individualName.trim(),
          contactPersonName: contactPersonName.trim() || individualName.trim(),
          businessDomains,
          primaryDomain: primaryDomain.trim() || null,
          naturesOfDataProvided: naturesOfDataProvided.trim() || null,
        };
      } else {
        requestData = {
          supplierType: 'COMPANY',
          companyName: companyName.trim(),
          websiteUrl: websiteUrl.trim() || null,
          contactPersonName: contactPersonName.trim(),
          businessDomains,
          primaryDomain: primaryDomain.trim() || null,
          naturesOfDataProvided: naturesOfDataProvided.trim() || null,
        };
      }

      const response = await updateSupplierProfile(requestData);
      setProfile(response.profile);
      setHasChanges(false);
      setSaveSuccess(true);

      if (onSave) {
        onSave(response.profile);
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      
      if (err.code === 'ONBOARDING_ALREADY_COMPLETED') {
        setError('Your onboarding has been completed and finalized. Profile cannot be modified.');
        setIsOnboardingComplete(true);
      } else {
        setError(err.message || 'Failed to save profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-[1200px] mx-auto p-8">
          <SectionHeader
            title="Profile"
            subtitle="Loading your profile..."
            className="mb-8"
          />
          <div className="flex items-center justify-center py-12">
            <div className="text-center" style={{ color: tokens.textMuted }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto p-8">
        {/* Page Header */}
        <SectionHeader
          title="Supplier Profile"
          subtitle="Complete your profile to start the onboarding process."
          className="mb-8"
        />

        {/* Offline Contract Status Banner */}
        {profile && (
          <div
            className="rounded-lg p-4 border mb-6"
            style={{
              background: profile.isOfflineContractDone
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))'
                : 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.05))',
              borderColor: profile.isOfflineContractDone
                ? 'rgba(34, 197, 94, 0.3)'
                : 'rgba(251, 146, 60, 0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: profile.isOfflineContractDone ? '#22c55e' : '#fb923c',
                  boxShadow: profile.isOfflineContractDone
                    ? '0 0 8px rgba(34, 197, 94, 0.6)'
                    : '0 0 8px rgba(251, 146, 60, 0.6)',
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: profile.isOfflineContractDone ? '#22c55e' : '#fb923c',
                    }}
                  >
                    {profile.isOfflineContractDone ? '✓ Offline Contract Completed' : 'Offline Contract Pending'}
                  </span>
                </div>
                <p
                  className="text-xs"
                  style={{
                    color: tokens.textMuted,
                  }}
                >
                  {profile.isOfflineContractDone
                    ? 'Your offline contract documentation has been completed and verified.'
                    : 'Please complete your offline contract documentation to proceed with full onboarding.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Complete - Profile Locked Banner */}
        {isOnboardingComplete && (
          <div
            className="rounded-lg p-4 border mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(139, 92, 246, 0.05))',
              borderColor: 'rgba(168, 85, 247, 0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: '#a855f7',
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)',
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: '#a855f7',
                    }}
                  >
                    🔒 Profile Locked
                  </span>
                </div>
                <p
                  className="text-xs"
                  style={{
                    color: tokens.textMuted,
                  }}
                >
                  Your onboarding has been completed and finalized. Your profile information is now locked and cannot be modified for data integrity. Contact support if you need to make changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <StatusMessage variant="error" message={error} className="mb-6" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Supplier Type & Identity */}
            <ProfileSection
              icon={supplierType === 'COMPANY' ? Building2 : User}
              title="Supplier Identity"
              subtitle="Select your supplier type and provide identity details"
            >
              {/* Type Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                    Supplier Type
                  </label>
                  {profile && (
                    <span className="text-xs px-2 py-1 rounded font-medium" style={{ background: tokens.isDark ? 'rgba(217, 119, 6, 0.35)' : 'rgba(217, 119, 6, 0.15)', color: tokens.isDark ? '#fcd34d' : '#b45309' }}>
                      Cannot change
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {(['COMPANY', 'INDIVIDUAL'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => !profile && handleFieldChange(setSupplierType)(type)}
                      disabled={!!profile}
                      className="flex-1 rounded-lg p-3 transition-all font-medium"
                      style={{
                        background: supplierType === type 
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))'
                          : tokens.inputBg,
                        border: `2px solid ${supplierType === type ? '#3b82f6' : tokens.inputBorder}`,
                        color: supplierType === type ? '#3b82f6' : (profile ? tokens.textMuted : tokens.textPrimary),
                        opacity: profile ? 0.6 : 1,
                        cursor: profile ? 'not-allowed' : 'pointer',
                        boxShadow: supplierType === type ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {type === 'COMPANY' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        <span className="text-sm">{type === 'COMPANY' ? 'Company' : 'Individual'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Fields based on Type */}
              {supplierType === 'COMPANY' ? (
                <>
                  <FormField
                    label="Company Name *"
                    value={companyName}
                    onChange={handleFieldChange(setCompanyName)}
                    placeholder="Enter your company name"
                  />
                  <FormField
                    label="Website URL"
                    value={websiteUrl}
                    onChange={handleFieldChange(setWebsiteUrl)}
                    placeholder="https://example.com"
                    type="url"
                    hint="Optional"
                  />
                </>
              ) : (
                <FormField
                  label="Full Name *"
                  value={individualName}
                  onChange={handleFieldChange(setIndividualName)}
                  placeholder="Enter your full name"
                />
              )}

              {profile && (
                <div className="flex items-center gap-3 mt-4 text-xs" style={{ color: tokens.textMuted }}>
                  <span>Created: {new Date(profile.createdAt).toLocaleDateString()}</span>
                  {profile.updatedAt && (
                    <>
                      <span>•</span>
                      <span>Updated: {new Date(profile.updatedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              )}
            </ProfileSection>

            {/* Business Information */}
            <ProfileSection icon={Briefcase} title="Business Information">
              <div className="space-y-4">
                <FormField
                  label="Business Domains *"
                  value={businessDomains.join(', ')}
                  onChange={handleBusinessDomainsChange}
                  placeholder="e.g., HEALTHCARE, FINANCE, EDUCATION"
                  hint="Comma-separated. Available: HEALTHCARE, FINANCE, EDUCATION, ECOMMERCE, AGRICULTURE, TECHNOLOGY, GOVERNMENT, RESEARCH, MARKETING, SOCIAL_MEDIA, OTHER"
                  type="textarea"
                  rows={3}
                />
                <FormField
                  label="Primary Domain"
                  value={primaryDomain}
                  onChange={handleFieldChange(setPrimaryDomain)}
                  placeholder="Your main business domain"
                  hint="Optional"
                />
                <FormField
                  label="Nature of Data Provided"
                  value={naturesOfDataProvided}
                  onChange={handleFieldChange(setNaturesOfDataProvided)}
                  placeholder="Describe the nature of data you provide"
                  type="textarea"
                  rows={3}
                  hint="Optional"
                />
              </div>
            </ProfileSection>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Contact Information */}
            <ProfileSection icon={Mail} title="Contact Information">
              <div className="space-y-4">
                <FormField
                  label={supplierType === 'COMPANY' ? 'Contact Person Name *' : 'Contact Person Name'}
                  value={contactPersonName}
                  onChange={handleFieldChange(setContactPersonName)}
                  placeholder={supplierType === 'COMPANY' ? 'Name of primary contact person' : 'Optional - defaults to your name'}
                  hint={supplierType === 'INDIVIDUAL' ? 'Optional - will default to your name if not provided' : undefined}
                />
                <FormField
                  label="Contact Email"
                  value={profile?.contactEmail || 'Loading...'}
                  disabled
                  hint="This is your login email and cannot be changed here"
                />
              </div>
            </ProfileSection>

            {/* Info Card */}
            <div
              className="rounded-lg p-6 border"
              style={{
                background: tokens.glassBg,
                borderColor: tokens.glassBorder,
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: tokens.textSecondary }} />
                <div>
                  <h4 className="text-sm font-medium mb-2" style={{ color: tokens.textPrimary }}>
                    Profile Completion
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: tokens.textMuted }}>
                    Complete your profile to proceed with onboarding. Required fields are marked with *. 
                    Your profile can be updated anytime before onboarding is marked as complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex items-center gap-4">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving || isOnboardingComplete}
            size="lg"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
          
          {isOnboardingComplete && (
            <span className="text-sm px-3 py-1 rounded font-medium" style={{ background: tokens.isDark ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.15)', color: tokens.isDark ? '#e9d5ff' : '#9333ea' }}>
              Profile is locked - onboarding complete
            </span>
          )}
          
          {saveSuccess && (
            <StatusMessage variant="success" message="Profile saved successfully!" />
          )}
          
          {hasChanges && !saveSuccess && !isOnboardingComplete && (
            <span className="text-sm" style={{ color: tokens.textMuted }}>
              You have unsaved changes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
