"use client";

import { ReactNode } from "react";
import { DashboardButton, DashboardCard } from "@/components/dashboard";
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
}: EditableSectionProps) {
  return (
    <DashboardCard className="overflow-hidden transition-shadow duration-200 hover:shadow-sm">
      {/* Header */}
      <div
        className={`flex w-full items-center justify-between gap-3 px-4 py-2 sm:px-5 ${
          isExpanded ? "border-b border-border" : ""
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2 text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="dashboard-tone-neutral flex size-9 shrink-0 items-center justify-center rounded-lg border">
            {icon}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
        <div className="flex items-center gap-3">
          {isEditable && isExpanded && !isEditing && !isEmpty && (
            <DashboardButton
              size="compact"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick();
              }}
              className="h-9 gap-2 px-3"
            >
              <Edit2 className="size-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </DashboardButton>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-1 p-4 duration-200 sm:p-5">
          {isEditing ? (
            editContent
          ) : isEmpty ? (
            <div className="text-center py-10">
              <div className="dashboard-tone-neutral mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border">
                {emptyIcon}
              </div>
              <p className="mb-5 text-sm font-medium text-muted-foreground">
                {emptyMessage}
              </p>
              {isEditable && emptyActionLabel && (
                <DashboardButton
                  size="compact"
                  onClick={onEditClick}
                  className="h-10 gap-2 px-5"
                  variant="outline"
                >
                  <Edit2 className="w-4 h-4" />
                  {emptyActionLabel}
                </DashboardButton>
              )}
            </div>
          ) : (
            displayContent
          )}
        </div>
      )}
    </DashboardCard>
  );
}
