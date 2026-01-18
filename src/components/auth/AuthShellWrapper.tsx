"use client";

import React, { ReactNode, memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BrandIllustration } from "./BrandIllustration";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PageBackground } from "@/components/shared";
import Image from "next/image";

interface AuthShellWrapperProps {
  isDark: boolean;
  onToggleDark: () => void;
  children: ReactNode;
  showNav?: ReactNode;
}

function AuthShellWrapperComponent({ 
  isDark, 
  onToggleDark, 
  children, 
  showNav 
}: AuthShellWrapperProps) {
  // Memoize tokens to prevent recalculation
  const tokens = useMemo(() => ({
    dark: {
      surfaceUnified: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      glassBg: "rgba(255, 255, 255, 0.06)",
      glassBorder: "rgba(255, 255, 255, 0.12)",
      glassShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1) inset",
      textPrimary: "#f8fafc",
      textSecondary: "rgba(226, 232, 240, 0.7)",
      borderSubtle: "rgba(255, 255, 255, 0.06)",
      gridPattern: "rgba(255, 255, 255, 0.03)",
      rimLight: "linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.2) 50%, transparent 100%)",
    },
    light: {
      surfaceUnified: "linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f5f7fb 100%)",
      glassBg: "rgba(255, 255, 255, 0.88)",
      glassBorder: "rgba(255, 255, 255, 0.5)",
      glassShadow: "0 20px 60px rgba(0, 0, 0, 0.12)",
      textPrimary: "#1a2240",
      textSecondary: "#525d6f",
      borderSubtle: "rgba(26, 34, 64, 0.06)",
      gridPattern: "rgba(26, 34, 64, 0.06)",
      rimLight: "linear-gradient(90deg, transparent 0%, rgba(26, 34, 64, 0.12) 50%, transparent 100%)",
    },
  }), []);

  const currentTokens = isDark ? tokens.dark : tokens.light;

  return (
    <PageBackground withGrid>
      {/* Optional navigation */}
      {showNav}

      <div className="relative z-0 flex min-h-screen">
        {/* Theme toggle - fixed position */}
        <ThemeToggle 
          isDark={isDark} 
          onToggle={onToggleDark}
          className="fixed top-6 right-6 z-50"
        />

        {/* Left panel - Brand illustration (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-[55%] items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <BrandIllustration isDark={isDark} />
          </div>
        </div>

        {/* Right panel - Auth content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
          <div className="w-full max-w-[480px] relative z-10">
            {/* Logo badge */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-6">
                <div 
                  className="h-14 px-2 border rounded-xl flex items-center justify-center shadow-lg transition-all duration-500"
                  style={{
                    background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.88)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(26, 34, 64, 0.12)",
                  }}
                >
                  <Image 
                    src={isDark ? "/logo-dark.png" : "/logo-light.png"}
                    alt="Kuinbee"
                    width={96}
                    height={96}
                    className="h-24 w-auto transition-opacity duration-500"
                    style={{ opacity: isDark ? 0.9 : 1 }}
                    priority
                  />
                </div>
              </div>
              
              {/* Heading */}
              <h1 
                className="text-3xl mb-3 transition-colors duration-500 font-semibold"
                style={{ color: currentTokens.textPrimary }}
              >
                Supplier Access
              </h1>
              <p 
                className="text-sm transition-colors duration-500"
                style={{ color: currentTokens.textSecondary }}
              >
                Manage and publish your datasets
              </p>
            </div>

            {/* Glass card */}
            <Card 
              className="relative overflow-hidden border-0 shadow-2xl transition-all duration-500 ease-out"
              style={{
                background: currentTokens.glassBg,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid ${currentTokens.glassBorder}`,
                boxShadow: currentTokens.glassShadow,
              }}
            >
              {/* Rim light effect */}
              <div 
                className="absolute top-0 left-0 right-0 h-px transition-opacity duration-500"
                style={{ background: currentTokens.rimLight }}
              />
              
              <div className="relative z-10">
                <CardContent className="p-8">
                  {children}
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}

export const AuthShellWrapper = memo(AuthShellWrapperComponent);
export default AuthShellWrapper;
