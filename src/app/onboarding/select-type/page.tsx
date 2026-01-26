"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Building2, User } from "lucide-react";
import { selectSupplierType, getOnboardingStatus } from "@/lib/api";
import { ONBOARDING_STEP_ROUTES, SUPPLIER_TYPE_LABELS } from "@/constants";
import { LogoHeader, GlassCard, PageBackground } from "@/components/shared";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { SupplierType } from "@/types";

export default function SelectTypePage() {
  const router = useRouter();
  const tokens = useSupplierTokens();
  const [selectedType, setSelectedType] = useState<SupplierType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!selectedType) return;

    try {
      setLoading(true);
      setError(null);

      // Selecting supplier type

      // Call API to set supplier type
      await selectSupplierType({ supplierType: selectedType });

      // Type set successfully

      // Fetch updated status and navigate to next step
      const status = await getOnboardingStatus();
      const nextRoute = ONBOARDING_STEP_ROUTES[status.onboarding.nextStep];

      // Navigating to next route
      router.push(nextRoute);
    } catch (err: any) {
      // Failed to set type (logged silently)
      setError(err.message || "Failed to set supplier type");
    } finally {
      setLoading(false);
    }
  }, [selectedType, router]);

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

  return (
    <PageBackground withGrid>
      <LogoHeader
        title="Supplier Onboarding"
        subtitle="Let's get you set up"
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-[600px]">
          <GlassCard>
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h2 
                  className="text-2xl font-semibold mb-2"
                  style={{ color: tokens.textPrimary }}
                >
                  Select Supplier Type
                </h2>
                <p style={{ color: tokens.textSecondary }}>
                  Choose the type that best describes your business
                </p>
              </div>

              {/* Type Selection */}
              <RadioGroup
                value={selectedType || ""}
                onValueChange={(value: string) => setSelectedType(value as SupplierType)}
                className="space-y-4"
              >
                {/* Individual Option */}
                <div
                  className={`relative flex items-center space-x-4 p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                    selectedType === "INDIVIDUAL"
                      ? "border-white/40"
                      : "border-white/15 hover:border-white/25"
                  }`}
                  style={{
                    background: selectedType === "INDIVIDUAL" 
                      ? "rgba(255, 255, 255, 0.12)"
                      : "transparent",
                    backdropFilter: selectedType === "INDIVIDUAL" ? "blur(16px)" : "none",
                  }}
                  onClick={() => setSelectedType("INDIVIDUAL")}
                >
                  <RadioGroupItem value="INDIVIDUAL" id="individual" />
                  <div className="flex-1">
                    <Label
                      htmlFor="individual"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <User 
                        className="w-6 h-6" 
                        style={{ color: tokens.textPrimary }}
                      />
                      <div>
                        <div 
                          className="font-semibold"
                          style={{ color: tokens.textPrimary }}
                        >
                          {SUPPLIER_TYPE_LABELS.INDIVIDUAL}
                        </div>
                        <div 
                          className="text-sm"
                          style={{ color: tokens.textSecondary }}
                        >
                          For individual suppliers and freelancers
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>

                {/* Company Option */}
                <div
                  className={`relative flex items-center space-x-4 p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                    selectedType === "COMPANY"
                      ? "border-white/40"
                      : "border-white/15 hover:border-white/25"
                  }`}
                  style={{
                    background: selectedType === "COMPANY" 
                      ? "rgba(255, 255, 255, 0.12)"
                      : "transparent",
                    backdropFilter: selectedType === "COMPANY" ? "blur(16px)" : "none",
                  }}
                  onClick={() => setSelectedType("COMPANY")}
                >
                  <RadioGroupItem value="COMPANY" id="company" />
                  <div className="flex-1">
                    <Label
                      htmlFor="company"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Building2 
                        className="w-6 h-6"
                        style={{ color: tokens.textPrimary }}
                      />
                      <div>
                        <div 
                          className="font-semibold"
                          style={{ color: tokens.textPrimary }}
                        >
                          {SUPPLIER_TYPE_LABELS.COMPANY}
                        </div>
                        <div 
                          className="text-sm"
                          style={{ color: tokens.textSecondary }}
                        >
                          For registered companies and organizations
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {/* Error Message */}
              {error && (
                <div 
                  className="mt-4 p-4 border rounded-lg text-sm"
                  style={{
                    background: tokens.errorBg,
                    borderColor: tokens.errorBorder,
                    color: tokens.errorText,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedType || loading}
                  className="flex-1"
                >
                  {loading ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageBackground>
  );
}
