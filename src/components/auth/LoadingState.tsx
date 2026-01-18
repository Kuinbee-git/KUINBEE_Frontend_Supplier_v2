"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  email: string;
  isDark?: boolean;
  message?: string;
}

function LoadingStateComponent({
  email,
  isDark = false,
  message = "Checking...",
}: LoadingStateProps) {
  const tokens = {
    textPrimary: isDark ? "#ffffff" : "#1a2240",
    textMuted: isDark ? "rgba(255, 255, 255, 0.5)" : "#7a8494",
    inputBg: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.5)",
    inputBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "#dde3f0",
    divider: isDark ? "rgba(255, 255, 255, 0.1)" : "#dde3f0",
  };

  return (
    <div className="space-y-5">
      {/* Email field - disabled */}
      <div className="space-y-2">
        <Label 
          htmlFor="email"
          className="text-sm transition-colors duration-300"
          style={{ color: tokens.textPrimary, fontWeight: 500 }}
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="h-12 transition-all duration-300 cursor-not-allowed"
          style={{
            borderColor: tokens.inputBorder,
            backgroundColor: tokens.inputBg,
            color: tokens.textMuted,
            opacity: 0.6,
          }}
        />
      </div>

      {/* Loading button */}
      <Button 
        disabled
        className="w-full h-12 mt-8 text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #1a2240 0%, #2a3250 100%)",
          fontWeight: 600,
          opacity: 0.8,
        }}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {message}
      </Button>

      {/* Disabled secondary actions */}
      <div className="space-y-2.5 text-center pt-4 opacity-40">
        <span 
          className="text-sm block w-full cursor-not-allowed"
          style={{ color: tokens.textMuted }}
        >
          New supplier? Create account
        </span>
        <span 
          className="text-sm block w-full cursor-not-allowed"
          style={{ color: tokens.textMuted }}
        >
          Having trouble signing in?
        </span>
      </div>

      {/* Security notice */}
      <div 
        className="mt-8 pt-6 transition-colors duration-300"
        style={{ borderTop: `1px solid ${tokens.divider}` }}
      >
        <p 
          className="text-xs text-center leading-relaxed"
          style={{ color: tokens.textMuted }}
        >
          Access monitored · Additional verification may be required
        </p>
      </div>
    </div>
  );
}

export const LoadingState = memo(LoadingStateComponent);
export default LoadingState;
