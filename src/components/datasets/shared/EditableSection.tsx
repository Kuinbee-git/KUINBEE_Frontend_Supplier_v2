'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Edit2 } from 'lucide-react';

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
      className="border overflow-hidden transition-shadow duration-200 hover:shadow-sm"
      style={{
        background: tokens.surfaceCard,
        borderColor: tokens.borderDefault,
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 border-b transition-all duration-200 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
        style={{ borderColor: isExpanded ? tokens.borderSubtle : 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(26, 34, 64, 0.05)',
            }}
          >
            <span style={{ color: tokens.textSecondary }}>{icon}</span>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
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
              className="h-9 px-4 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: (tokens as any).glassBg || 'transparent',
                border: `1px solid ${(tokens as any).glassBorder || tokens.borderSubtle}`,
                color: tokens.textPrimary,
                minWidth: 'fit-content',
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(26, 34, 64, 0.03)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronDown className="w-4 h-4" style={{ color: tokens.textMuted }} />
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 animate-in fade-in slide-in-from-top-1 duration-200">
          {isEditing ? (
            editContent
          ) : isEmpty ? (
            <div className="text-center py-10">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(26, 34, 64, 0.03)',
                  color: tokens.textMuted,
                }}
              >
                {emptyIcon}
              </div>
              <p className="text-sm mb-5 font-medium" style={{ color: tokens.textMuted }}>
                {emptyMessage}
              </p>
              {isEditable && emptyActionLabel && (
                <Button
                  size="sm"
                  onClick={onEditClick}
                  className="h-10 px-5 gap-2 font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  variant="outline"
                  style={{
                    background: (tokens as any).glassBg || 'transparent',
                    border: `1px solid ${(tokens as any).glassBorder || tokens.borderSubtle}`,
                    color: tokens.textPrimary,
                    minWidth: 'fit-content',
                  }}
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
