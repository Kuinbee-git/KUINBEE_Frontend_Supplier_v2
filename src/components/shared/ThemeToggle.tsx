"use client";

import React, { memo } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

function ThemeToggleComponent({ isDark, onToggle, className = "" }: ThemeToggleProps) {
  return (
    <button 
      onClick={onToggle} 
      className={`group ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div 
        className="relative w-[52px] h-[52px] rounded-2xl transition-all duration-300 ease-out transform group-hover:scale-105 group-active:scale-95"
        style={{
          background: isDark 
            ? "linear-gradient(135deg, rgba(42, 52, 84, 0.8), rgba(26, 34, 64, 0.6))"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 244, 248, 0.7))",
          border: isDark 
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(26, 34, 64, 0.12)",
          boxShadow: isDark 
            ? "0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.06)"
            : "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Moon icon (dark mode) */}
          <div 
            className="transition-all duration-300 ease-out absolute"
            style={{ 
              transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.8)",
              opacity: isDark ? 1 : 0,
            }}
          >
            <Moon className="w-5 h-5" style={{ color: "#e5e7eb" }} />
          </div>
          {/* Sun icon (light mode) */}
          <div 
            className="transition-all duration-300 ease-out absolute"
            style={{ 
              transform: isDark ? "rotate(90deg) scale(0.8)" : "rotate(0deg) scale(1)",
              opacity: isDark ? 0 : 1,
            }}
          >
            <Sun className="w-5 h-5" style={{ color: "#1a2240" }} />
          </div>
        </div>
      </div>
    </button>
  );
}

export const ThemeToggle = memo(ThemeToggleComponent);
export default ThemeToggle;
