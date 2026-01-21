'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StyledSelect } from '@/components/datasets/shared/StyledSelect';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { changeDatasetVisibility } from '@/lib/api/datasets';
import { toast } from 'sonner';
import type { DatasetVisibility } from '@/types/dataset-proposal.types';

interface ChangeVisibilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  currentVisibility: DatasetVisibility;
  onSuccess: () => void;
  isDark?: boolean;
}

const VISIBILITY_OPTIONS = [
  {
    value: 'PUBLIC' as const,
    label: 'Public',
    description: 'Visible to all users on the marketplace',
    icon: Eye,
    color: '#22c55e',
  },
  {
    value: 'PRIVATE' as const,
    label: 'Private',
    description: 'Only visible to users you specifically grant access',
    icon: Lock,
    color: '#ef4444',
  },
  {
    value: 'UNLISTED' as const,
    label: 'Unlisted',
    description: 'Not shown in marketplace, accessible via direct link only',
    icon: EyeOff,
    color: '#f59e0b',
  },
];

export function ChangeVisibilityDialog({
  isOpen,
  onClose,
  datasetId,
  currentVisibility,
  onSuccess,
  isDark = false,
}: ChangeVisibilityDialogProps) {
  const [visibility, setVisibility] = useState<DatasetVisibility>(currentVisibility);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (visibility === currentVisibility) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await changeDatasetVisibility(datasetId, { visibility });
      
      toast.success('Visibility changed successfully', {
        description: `Dataset is now ${visibility.toLowerCase()}.`,
      });
      
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to change visibility:', error);
      toast.error('Failed to change visibility', {
        description: error.message || 'Please try again later.',
        duration: 6000,
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = VISIBILITY_OPTIONS.find(opt => opt.value === visibility);
  const Icon = selectedOption?.icon || Eye;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: selectedOption?.color || '#3b82f6' }} />
            </div>
            <DialogTitle>Change Visibility</DialogTitle>
          </div>
          <DialogDescription>
            Control who can discover and view your dataset on the marketplace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Visibility Setting</Label>
            <StyledSelect
              options={VISIBILITY_OPTIONS.map(option => ({ label: option.label, value: option.value }))}
              value={visibility}
              onValueChange={(value) => setVisibility(value as DatasetVisibility)}
              isDark={isDark}
              tokens={{
                inputBg: isDark ? 'rgba(26, 34, 64, 0.6)' : '#ffffff',
                inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(26, 34, 64, 0.15)',
                textPrimary: isDark ? '#ffffff' : '#1a2240',
                textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
                textMuted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af',
                surfaceCard: isDark ? 'rgba(26, 34, 64, 0.95)' : '#ffffff',
                borderDefault: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb',
              }}
            />
          </div>

          {/* Selected Option Description */}
          {selectedOption && (
            <div
              className="rounded-lg p-3"
              style={{
                background: isDark ? `${selectedOption.color}15` : `${selectedOption.color}10`,
                border: `1px solid ${selectedOption.color}40`,
              }}
            >
              <p className="text-sm" style={{ color: selectedOption.color }}>
                <strong>{selectedOption.label}:</strong> {selectedOption.description}
              </p>
            </div>
          )}

          {/* Current vs New */}
          {visibility !== currentVisibility && (
            <div className="pt-2 border-t text-xs opacity-70">
              <p>
                Changing from <strong>{currentVisibility}</strong> to <strong>{visibility}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || visibility === currentVisibility}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
