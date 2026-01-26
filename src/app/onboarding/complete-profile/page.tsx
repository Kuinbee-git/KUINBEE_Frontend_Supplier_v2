"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCircle, Building2 } from "lucide-react";
import { getSupplierProfile, updateSupplierProfile, completeOnboarding, getOnboardingStatus } from "@/lib/api";
import { LogoHeader, GlassCard, PageBackground, StatusMessage } from "@/components/shared";
import { StyledSelect } from "@/components/datasets/shared/StyledSelect";
import { BUSINESS_DOMAINS } from "@/types/onboarding.types";
import { ProgressStepper } from "@/components/onboarding";
import { useSupplierTokens } from "@/hooks";
import { useThemeStore } from "@/store";
import type { SupplierProfile, UpdateProfileRequest, SupplierType } from "@/types";

export default function CompleteProfilePage() {
  const router = useRouter();
  const tokens = useSupplierTokens();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [supplierType, setSupplierType] = useState<SupplierType>("INDIVIDUAL");
  const [individualName, setIndividualName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [businessDomains, setBusinessDomains] = useState<string[]>([]);
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [naturesOfDataProvided, setNaturesOfDataProvided] = useState("");

  const steps = [
    { id: 1, label: "Type", status: "completed" as const },
    { id: 2, label: "Email", status: "completed" as const },
    { id: 3, label: "Verification", status: "completed" as const },
    { id: 4, label: "Profile", status: "active" as const },
  ];

  // Fetch existing profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        
        // Get onboarding status to know supplier type
        const status = await getOnboardingStatus();
        const type = status.onboarding.supplierType;
        if (type) {
          setSupplierType(type);
        }

        // Get profile data
        const { profile } = await getSupplierProfile();
        if (profile) {
          setIndividualName(profile.individualName || "");
          setCompanyName(profile.companyName || "");
          setWebsiteUrl(profile.websiteUrl || "");
          setContactPersonName(profile.contactPersonName);
          
          // Filter out old invalid domain values
          const validDomains = profile.businessDomains.filter(domain => 
            (BUSINESS_DOMAINS as readonly string[]).includes(domain)
          );
          setBusinessDomains(validDomains);
          
          // Clear primary domain if it's no longer valid
          const validPrimary = profile.primaryDomain && (BUSINESS_DOMAINS as readonly string[]).includes(profile.primaryDomain)
            ? profile.primaryDomain
            : "";
          setPrimaryDomain(validPrimary);
          
          setNaturesOfDataProvided(profile.naturesOfDataProvided || "");
        }
      } catch (err) {
        // Failed to fetch profile (logged silently)
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleDomainToggle = useCallback((domain: string) => {
    const updated = businessDomains.includes(domain)
      ? businessDomains.filter((d) => d !== domain)
      : [...businessDomains, domain];
    
    setBusinessDomains(updated);
    
    // Clear primary domain if it's no longer selected
    if (!updated.includes(primaryDomain)) {
      setPrimaryDomain("");
    }
    
    // Auto-set primary domain if only one is selected
    if (updated.length === 1) {
      setPrimaryDomain(updated[0]);
    }
  }, [businessDomains, primaryDomain]);

  const isFormValid = useCallback(() => {
    if (supplierType === "INDIVIDUAL") {
      return individualName.trim() !== "" && 
             businessDomains.length > 0;
    } else {
      return companyName.trim() !== "" && 
             contactPersonName.trim() !== "" &&
             businessDomains.length > 0;
    }
  }, [supplierType, individualName, companyName, contactPersonName, businessDomains]);

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Updating profile

      // Prepare request based on supplier type
      let request: UpdateProfileRequest;
      
      if (supplierType === "INDIVIDUAL") {
        request = {
          supplierType: "INDIVIDUAL",
          individualName,
          contactPersonName: contactPersonName || individualName,
          businessDomains,
          primaryDomain: primaryDomain || undefined,
          naturesOfDataProvided: naturesOfDataProvided || undefined,
        };
      } else {
        request = {
          supplierType: "COMPANY",
          companyName,
          websiteUrl: websiteUrl || undefined,
          contactPersonName,
          businessDomains,
          primaryDomain: primaryDomain || undefined,
          naturesOfDataProvided: naturesOfDataProvided || undefined,
        };
      }

      // Update profile
      await updateSupplierProfile(request);
      // Profile updated successfully

      // Complete onboarding
      await completeOnboarding();
      // Onboarding completed

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      // Failed to complete profile (logged silently)
      setError(err.message || "Failed to complete profile");
    } finally {
      setSubmitting(false);
    }
  }, [supplierType, individualName, companyName, websiteUrl, contactPersonName, businessDomains, primaryDomain, naturesOfDataProvided, router]);

  const handleLogout = useCallback(() => {
    // Clear all stores
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('kuinbee-supplier-storage');
      localStorage.removeItem('onboarding-storage');
    }
    // Hard redirect to ensure clean state
    window.location.href = '/auth/login';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <PageBackground withGrid>
      <LogoHeader
        title="Supplier Onboarding"
        subtitle="Complete your profile"
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-[720px]">
          {/* Progress Stepper */}
          <div className="mb-10">
            <ProgressStepper steps={steps} />
          </div>

          {/* Info Message */}
          <StatusMessage
            variant="info"
            title="Almost done!"
            message="Complete your profile to unlock full access to the Kuinbee marketplace."
            className="mb-6"
          />

          <GlassCard>
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  {supplierType === "INDIVIDUAL" ? (
                    <UserCircle className="w-6 h-6" style={{ color: tokens.textPrimary }} />
                  ) : (
                    <Building2 className="w-6 h-6" style={{ color: tokens.textPrimary }} />
                  )}
                  <h2 
                    className="text-2xl font-semibold"
                    style={{ color: tokens.textPrimary }}
                  >
                    {supplierType === "INDIVIDUAL" ? "Individual Profile" : "Company Profile"}
                  </h2>
                </div>
                <p style={{ color: tokens.textSecondary }} className="text-sm">
                  Provide your business details
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Identity Section */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: tokens.textPrimary }}
                  >
                    Identity
                  </h3>
                  
                  {supplierType === "INDIVIDUAL" ? (
                    <>
                      <div className="space-y-2">
                        <Label 
                          htmlFor="individualName"
                          style={{ 
                            color: tokens.textPrimary,
                            '--label-color': tokens.textPrimary,
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          } as React.CSSProperties & { '--label-color': string }}
                        >
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="individualName"
                          value={individualName}
                          onChange={(e) => setIndividualName(e.target.value)}
                          placeholder="John Doe"
                          className="h-11 transition-all duration-300 autofill-fix"
                          style={{
                            borderColor: tokens.inputBorder,
                            backgroundColor: tokens.inputBg,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            "--placeholder-color": tokens.textMuted,
                            "--input-text-color": tokens.textPrimary,
                          } as React.CSSProperties & { "--placeholder-color": string; "--input-text-color": string }}
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label 
                          htmlFor="contactPersonName"
                          style={{ 
                            color: tokens.textPrimary,
                            '--label-color': tokens.textPrimary,
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          } as React.CSSProperties & { '--label-color': string }}
                        >
                          Contact Person Name (Optional)
                        </Label>
                        <Input
                          id="contactPersonName"
                          value={contactPersonName}
                          onChange={(e) => setContactPersonName(e.target.value)}
                          placeholder={individualName || "Same as above"}
                          className="h-11 transition-all duration-300 autofill-fix"
                          style={{
                            borderColor: tokens.inputBorder,
                            backgroundColor: tokens.inputBg,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            "--placeholder-color": tokens.textMuted,
                            "--input-text-color": tokens.textPrimary,
                          } as React.CSSProperties & { "--placeholder-color": string; "--input-text-color": string }}
                          autoComplete="off"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label 
                          htmlFor="companyName"
                          style={{ 
                            color: tokens.textPrimary,
                            '--label-color': tokens.textPrimary,
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          } as React.CSSProperties & { '--label-color': string }}
                        >
                          Company Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Acme Data Corp"
                          className="h-11 transition-all duration-300 autofill-fix"
                          style={{
                            borderColor: tokens.inputBorder,
                            backgroundColor: tokens.inputBg,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            "--placeholder-color": tokens.textMuted,
                            "--input-text-color": tokens.textPrimary,
                          } as React.CSSProperties & { "--placeholder-color": string; "--input-text-color": string }}
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label 
                          htmlFor="websiteUrl"
                          style={{ 
                            color: tokens.textPrimary,
                            '--label-color': tokens.textPrimary,
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          } as React.CSSProperties & { '--label-color': string }}
                        >
                          Website URL (Optional)
                        </Label>
                        <Input
                          id="websiteUrl"
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="h-11 transition-all duration-300 autofill-fix"
                          style={{
                            borderColor: tokens.inputBorder,
                            backgroundColor: tokens.inputBg,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            "--placeholder-color": tokens.textMuted,
                            "--input-text-color": tokens.textPrimary,
                          } as React.CSSProperties & { "--placeholder-color": string; "--input-text-color": string }}
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label 
                          htmlFor="contactPersonName"
                          style={{ 
                            color: tokens.textPrimary,
                            '--label-color': tokens.textPrimary,
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          } as React.CSSProperties & { '--label-color': string }}
                        >
                          Contact Person Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contactPersonName"
                          value={contactPersonName}
                          onChange={(e) => setContactPersonName(e.target.value)}
                          placeholder="John Doe"
                          className="h-11 transition-all duration-300 autofill-fix"
                          style={{
                            borderColor: tokens.inputBorder,
                            backgroundColor: tokens.inputBg,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            "--placeholder-color": tokens.textMuted,
                            "--input-text-color": tokens.textPrimary,
                          } as React.CSSProperties & { "--placeholder-color": string; "--input-text-color": string }}
                          autoComplete="off"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Business Domains Section */}
                <div className="space-y-4">
                  <div>
                    <h3 
                      className="text-lg font-semibold mb-1"
                      style={{ color: tokens.textPrimary }}
                    >
                      Business Domains
                    </h3>
                    <p style={{ color: tokens.textSecondary }} className="text-sm">
                      Select all domains relevant to your business <span className="text-destructive">*</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BUSINESS_DOMAINS.map((domain) => (
                      <div
                        key={domain}
                        className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200"
                        style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                          borderColor: businessDomains.includes(domain) 
                            ? tokens.borderDefault
                            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 34, 64, 0.1)'),
                          borderWidth: '1px'
                        }}
                      >
                        <Checkbox
                          id={`domain-${domain}`}
                          checked={businessDomains.includes(domain)}
                          onCheckedChange={() => handleDomainToggle(domain)}
                          style={{
                            borderColor: businessDomains.includes(domain) ? (isDark ? '#ffffff' : '#1a2240') : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1'),
                            backgroundColor: businessDomains.includes(domain)
                              ? (isDark ? '#ffffff' : '#1a2240')
                              : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff'),
                            color: businessDomains.includes(domain) ? (isDark ? '#1a2240' : '#ffffff') : 'transparent',
                            borderWidth: '2px',
                            width: '18px',
                            height: '18px',
                            minWidth: '18px',
                            minHeight: '18px',
                          }}
                        />
                        <Label
                          htmlFor={`domain-${domain}`}
                          style={{ 
                            color: tokens.textPrimary,
                            '--label-color': tokens.textPrimary,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            letterSpacing: '0.5px'
                          } as React.CSSProperties & { '--label-color': string }}
                          className="cursor-pointer flex-1 uppercase"
                        >
                          {domain}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Domain */}
                {businessDomains.length > 1 && (
                  <div className="space-y-2">
                    <Label 
                      htmlFor="primaryDomain"
                      style={{ 
                        color: tokens.textPrimary,
                        '--label-color': tokens.textPrimary,
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      } as React.CSSProperties & { '--label-color': string }}
                    >
                      Primary Domain (Optional)
                    </Label>
                    <StyledSelect
                      value={primaryDomain}
                      onValueChange={(value) => setPrimaryDomain(value)}
                      options={businessDomains.map((domain) => ({
                        label: domain,
                        value: domain,
                      }))}
                      placeholder="Select primary domain"
                      isDark={isDark}
                      tokens={{
                        inputBg: tokens.inputBg,
                        inputBorder: tokens.inputBorder,
                        textPrimary: tokens.textPrimary,
                        textSecondary: tokens.textSecondary,
                        textMuted: tokens.textMuted,
                        surfaceCard: isDark ? 'rgba(26, 34, 64, 0.95)' : '#ffffff',
                        borderDefault: tokens.borderDefault,
                      }}
                    />
                  </div>
                )}

                {/* Nature of Data */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="naturesOfDataProvided"
                    style={{ 
                      color: tokens.textPrimary,
                      '--label-color': tokens.textPrimary,
                      fontWeight: 500,
                      fontSize: '0.875rem'
                    } as React.CSSProperties & { '--label-color': string }}
                  >
                    Nature of Data Provided (Optional)
                  </Label>
                  <Textarea
                    id="naturesOfDataProvided"
                    value={naturesOfDataProvided}
                    onChange={(e) => setNaturesOfDataProvided(e.target.value)}
                    placeholder="Describe the types of data you provide..."
                    className="h-28 resize-none transition-all duration-300"
                    style={{
                      borderColor: tokens.inputBorder,
                      backgroundColor: tokens.inputBg,
                      color: tokens.textPrimary,
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                    }}
                  />
                  <p style={{ color: tokens.textMuted }} className="text-xs">
                    Help buyers understand what kind of data you offer
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div 
                  className="mt-6 p-4 rounded-lg text-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                    borderColor: tokens.errorBorder,
                    border: `1px solid ${tokens.errorBorder}`,
                    color: tokens.errorText
                  }}
                >
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || submitting}
                  className="flex-1"
                  style={{
                    background: !isFormValid() || submitting 
                      ? 'rgba(26, 34, 64, 0.5)'
                      : 'linear-gradient(135deg, #1a2240 0%, #2a3250 100%)',
                  }}
                >
                  {submitting ? "Completing..." : "Complete Onboarding"}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageBackground>
  );
}
