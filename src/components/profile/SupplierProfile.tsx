'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, User, Briefcase, Mail, Globe, ImageIcon, Upload } from 'lucide-react';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';
import { SectionHeader, StatusMessage } from '@/components/shared';
import { ProfileSection, FormField } from './shared';
import { completeSupplierLogoUpload, getSupplierProfile, presignSupplierLogoUpload, updateSupplierProfile, getOnboardingStatus, uploadFileToS3 } from '@/lib/api';
import {
  SupplierType,
  UpdateProfileRequest,
  SupplierLogoContentType,
} from '@/types/onboarding.types';
import type { SupplierProfile as SupplierProfileType } from '@/types/onboarding.types';

interface SupplierProfileProps {
  onSave?: (profile: SupplierProfileType) => void;
}

const LOGO_ALLOWED_TYPES: SupplierLogoContentType[] = ['image/png', 'image/jpeg', 'image/webp'];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_MIN_DIMENSION = 256;
const LOGO_MAX_DIMENSION = 2048;

const getSupplierInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
};

const readImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions'));
    };
    image.src = url;
  });
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : null;

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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile Data
  const [profile, setProfile] = useState<SupplierProfileType | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
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
      } catch (err: unknown) {
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
        setLogoPreviewUrl(p.logoUrl || null);
      }
    } catch (err: unknown) {
      console.error('Failed to load profile:', err);
      setError(getErrorMessage(err, 'Failed to load profile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = <T,>(setter: (value: T) => void) => (value: T) => {
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

  const getSupplierDisplayName = () => {
    if (supplierType === 'COMPANY') return companyName.trim() || profile?.companyName || 'Supplier';
    return individualName.trim() || profile?.individualName || profile?.contactPersonName || 'Supplier';
  };

  const validateLogoFile = async (file: File): Promise<string | null> => {
    if (!LOGO_ALLOWED_TYPES.includes(file.type as SupplierLogoContentType)) {
      return 'Logo must be a PNG, JPEG, or WebP image.';
    }

    if (file.size > LOGO_MAX_BYTES) {
      return 'Logo must be 2 MB or smaller.';
    }

    const dimensions = await readImageDimensions(file);
    if (dimensions.width !== dimensions.height) {
      return 'Logo must be square. Use a padded square canvas for wide logos.';
    }

    if (
      dimensions.width < LOGO_MIN_DIMENSION ||
      dimensions.height < LOGO_MIN_DIMENSION ||
      dimensions.width > LOGO_MAX_DIMENSION ||
      dimensions.height > LOGO_MAX_DIMENSION
    ) {
      return 'Logo dimensions must be between 256x256 and 2048x2048 pixels.';
    }

    return null;
  };

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLogoError(null);

    if (!profile) {
      setLogoError('Save your supplier profile before uploading a logo.');
      return;
    }

    setIsUploadingLogo(true);
    const localPreview = URL.createObjectURL(file);

    try {
      const validationError = await validateLogoFile(file);
      if (validationError) {
        URL.revokeObjectURL(localPreview);
        setLogoError(validationError);
        return;
      }

      const presign = await presignSupplierLogoUpload({
        originalFileName: file.name,
        contentType: file.type as SupplierLogoContentType,
      });

      await uploadFileToS3(presign.putUrl, file);
      const complete = await completeSupplierLogoUpload({
        s3Key: presign.s3Key,
        sizeBytes: file.size.toString(),
      });

      setProfile(complete.profile);
      setLogoPreviewUrl(complete.profile.logoUrl || localPreview);
      if (complete.profile.logoUrl) URL.revokeObjectURL(localPreview);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      URL.revokeObjectURL(localPreview);
      console.error('Failed to upload supplier logo:', err);
      setLogoError(getErrorMessage(err, 'Failed to upload logo'));
    } finally {
      setIsUploadingLogo(false);
    }
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
    } catch (err: unknown) {
      console.error('Failed to save profile:', err);
      
      if (getErrorCode(err) === 'ONBOARDING_ALREADY_COMPLETED') {
        setError('Your onboarding has been completed and finalized. Profile cannot be modified.');
        setIsOnboardingComplete(true);
      } else {
        setError(getErrorMessage(err, 'Failed to save profile'));
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
            <ProfileSection
              icon={ImageIcon}
              title="Marketplace Logo"
              subtitle="This logo appears on dataset discovery cards."
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div
                  className="w-24 h-24 rounded-xl border flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                >
                  {logoPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreviewUrl}
                      alt={`${getSupplierDisplayName()} logo`}
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <span className="text-2xl font-semibold">
                      {getSupplierInitials(getSupplierDisplayName())}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium mb-1" style={{ color: tokens.textPrimary }}>
                    Supplier logo
                  </p>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: tokens.textMuted }}>
                    Upload a square PNG, JPEG, or WebP logo. Recommended 512x512 px, accepted 256x256 to 2048x2048 px, max 2 MB.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="supplier-logo-upload"
                      type="file"
                      accept={LOGO_ALLOWED_TYPES.join(',')}
                      className="hidden"
                      onChange={handleLogoFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!profile || isUploadingLogo}
                      onClick={() => document.getElementById('supplier-logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploadingLogo ? 'Uploading...' : logoPreviewUrl ? 'Replace Logo' : 'Upload Logo'}
                    </Button>
                    {!profile && (
                      <span className="text-xs" style={{ color: tokens.textMuted }}>
                        Save profile first
                      </span>
                    )}
                  </div>
                  {profile?.logoUpdatedAt && (
                    <p className="text-xs mt-3" style={{ color: tokens.textMuted }}>
                      Updated: {new Date(profile.logoUpdatedAt).toLocaleDateString()}
                    </p>
                  )}
                  {logoError && (
                    <p className="text-xs mt-3" style={{ color: '#ef4444' }}>
                      {logoError}
                    </p>
                  )}
                </div>
              </div>
            </ProfileSection>

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
