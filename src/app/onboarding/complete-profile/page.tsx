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
import type { SupplierProfile, UpdateProfileRequest, SupplierType } from "@/types";

export default function CompleteProfilePage() {
  const router = useRouter();
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
                    <UserCircle className="w-6 h-6 text-primary" />
                  ) : (
                    <Building2 className="w-6 h-6 text-primary" />
                  )}
                  <h2 className="text-2xl font-semibold">
                    {supplierType === "INDIVIDUAL" ? "Individual Profile" : "Company Profile"}
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  Provide your business details
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Identity Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Identity</h3>
                  
                  {supplierType === "INDIVIDUAL" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="individualName">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="individualName"
                          value={individualName}
                          onChange={(e) => setIndividualName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPersonName">
                          Contact Person Name (Optional)
                        </Label>
                        <Input
                          id="contactPersonName"
                          value={contactPersonName}
                          onChange={(e) => setContactPersonName(e.target.value)}
                          placeholder={individualName || "Same as above"}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="companyName">
                          Company Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Acme Data Corp"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="websiteUrl">
                          Website URL (Optional)
                        </Label>
                        <Input
                          id="websiteUrl"
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPersonName">
                          Contact Person Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contactPersonName"
                          value={contactPersonName}
                          onChange={(e) => setContactPersonName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Business Domains Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Business Domains</h3>
                    <p className="text-sm text-muted-foreground">
                      Select all domains relevant to your business <span className="text-destructive">*</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BUSINESS_DOMAINS.map((domain) => (
                      <div
                        key={domain}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`domain-${domain}`}
                          checked={businessDomains.includes(domain)}
                          onCheckedChange={() => handleDomainToggle(domain)}
                        />
                        <Label
                          htmlFor={`domain-${domain}`}
                          className="text-sm cursor-pointer flex-1"
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
                    <Label htmlFor="primaryDomain">
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
                      tokens={{
                        inputBg: '#f8f9fa',
                        inputBorder: '#e0e0e0',
                        textPrimary: '#000000',
                        textSecondary: '#6b7280',
                        textMuted: '#9ca3af',
                        surfaceCard: '#ffffff',
                        borderDefault: '#e5e7eb',
                      }}
                    />
                  </div>
                )}

                {/* Nature of Data */}
                <div className="space-y-2">
                  <Label htmlFor="naturesOfDataProvided">
                    Nature of Data Provided (Optional)
                  </Label>
                  <Textarea
                    id="naturesOfDataProvided"
                    value={naturesOfDataProvided}
                    onChange={(e) => setNaturesOfDataProvided(e.target.value)}
                    placeholder="Describe the types of data you provide..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Help buyers understand what kind of data you offer
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || submitting}
                  className="flex-1"
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
