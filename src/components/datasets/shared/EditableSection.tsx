'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Edit2 } from 'lucide-react';

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
    <Card
      className="border overflow-hidden"
      style={{
        background: tokens.surfaceCard,
        borderColor: tokens.borderDefault,
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 border-b transition-colors duration-200"
        style={{ borderColor: tokens.borderSubtle }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: tokens.textSecondary }}>{icon}</span>
          <div className="text-left">
            <h3 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs" style={{ color: tokens.textMuted }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditable && isExpanded && !isEditing && !isEmpty && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick();
              }}
              className="h-8 px-3"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" style={{ color: tokens.textMuted }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: tokens.textMuted }} />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {isEditing ? (
            editContent
          ) : isEmpty ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3" style={{ color: tokens.textMuted }}>
                {emptyIcon}
              </div>
              <p className="text-sm mb-4" style={{ color: tokens.textMuted }}>
                {emptyMessage}
              </p>
              {isEditable && emptyActionLabel && (
                <Button
                  size="sm"
                  onClick={onEditClick}
                  className="gap-2"
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
