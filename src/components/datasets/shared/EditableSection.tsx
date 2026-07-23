"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Edit2 } from "lucide-react";

interface EditableSectionProps {
  // Section metadata
  title: string;
  icon: ReactNode;
  subtitle?: string;

  // Expansion state
  isExpanded: boolean;
  onToggle: () => void;

  // Edit mode
  isEditable: boolean;
  isEditing: boolean;
  onEditClick: () => void;

  // Content states
  isEmpty: boolean;
  emptyIcon: ReactNode;
  emptyMessage: string;
  emptyActionLabel?: string;

  // Children
  editContent?: ReactNode;
  displayContent?: ReactNode;

  // Theming
  isDark?: boolean;
  tokens: {
    surfaceCard: string;
    borderDefault: string;
    borderSubtle: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
}

export function EditableSection({
  title,
  icon,
  subtitle,
  isExpanded,
  onToggle,
  isEditable,
  isEditing,
  onEditClick,
  isEmpty,
  emptyIcon,
  emptyMessage,
  emptyActionLabel,
  editContent,
  displayContent,
  isDark = false,
  tokens,
}: EditableSectionProps) {
  return (
    <Card className="supplier-glass-card overflow-hidden rounded-xl border transition-shadow duration-200 hover:shadow-sm">
      {/* Header */}
      <div
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between border-b px-4 py-4 transition-colors duration-200 hover:bg-foreground/[0.025] sm:px-5"
        style={{
          borderColor: isExpanded ? tokens.borderSubtle : "transparent",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span>{icon}</span>
          </div>
          <div className="text-left">
            <h3
              className="text-sm font-semibold"
              style={{ color: tokens.textPrimary }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditable && isExpanded && !isEditing && !isEmpty && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick();
              }}
              className="h-9 gap-2 px-3"
            >
              <Edit2 className="size-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200"
            style={{
              background: isDark
                ? "rgba(255, 255, 255, 0.03)"
                : "rgba(26, 34, 64, 0.03)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ChevronDown
              className="w-4 h-4"
              style={{ color: tokens.textMuted }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-1 p-4 duration-200 sm:p-5">
          {isEditing ? (
            editContent
          ) : isEmpty ? (
            <div className="text-center py-10">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{
                  background: isDark
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(26, 34, 64, 0.03)",
                  color: tokens.textMuted,
                }}
              >
                {emptyIcon}
              </div>
              <p
                className="text-sm mb-5 font-medium"
                style={{ color: tokens.textMuted }}
              >
                {emptyMessage}
              </p>
              {isEditable && emptyActionLabel && (
                <Button
                  size="sm"
                  onClick={onEditClick}
                  className="h-10 gap-2 px-5"
                  variant="outline"
                >
                  <Edit2 className="w-4 h-4" />
                  {emptyActionLabel}
                </Button>
              )}
            </div>
          ) : (
            displayContent
          )}
        </div>
      )}
    </Card>
  );
}
