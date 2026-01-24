'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Archive, AlertTriangle, Loader2, Database } from 'lucide-react';
import { archiveDataset } from '@/lib/api/datasets';
import { toast } from 'sonner';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';

interface ArchiveConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetTitle: string;
  onSuccess: () => void;
  isDark?: boolean;
}

export function ArchiveConfirmDialog({
  isOpen,
  onClose,
  datasetId,
  datasetTitle,
  onSuccess,
}: ArchiveConfirmDialogProps) {
  const [archiving, setArchiving] = useState(false);
  const tokens = useSupplierTokens();

  const handleConfirm = async () => {
    setArchiving(true);
    try {
      await archiveDataset(datasetId);
      
      toast.success('Dataset archived successfully', {
        description: 'The dataset is now hidden from the marketplace.',
      });
      
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to archive dataset:', error);
      
      const errorMessages: Record<string, string> = {
        'INVALID_STATE': 'Dataset cannot be archived in its current state.',
        'NOT_FOUND': 'Dataset not found.',
        'FORBIDDEN': 'You do not have permission to archive this dataset.',
      };
      
      const message = errorMessages[error.code] || error.message || 'Failed to archive dataset';
      
      toast.error('Failed to archive dataset', {
        description: message,
        duration: 6000,
      });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md border backdrop-blur-sm rounded-lg"
        style={{
          background: tokens.isDark ? 'rgba(26, 34, 64, 0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: tokens.borderDefault,
          boxShadow: tokens.glassShadow,
        }}
      >
        <DialogHeader>
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: tokens.errorBg }}
            >
              <Archive className="w-6 h-6" style={{ color: tokens.errorText }} />
            </div>
            <div>
              <DialogTitle className="text-lg mb-1" style={{ color: tokens.textPrimary }}>
                Archive Dataset
              </DialogTitle>
              <DialogDescription style={{ color: tokens.textSecondary }}>
                Remove this dataset from the marketplace
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dataset Info */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: tokens.infoBg }}
          >
            <Database className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tokens.textSecondary }} />
            <div>
              <p className="text-xs mb-1" style={{ color: tokens.textMuted }}>Dataset to archive</p>
              <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>{datasetTitle}</p>
            </div>
          </div>

          {/* Warning */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: tokens.errorBg,
              border: `1px solid ${tokens.errorBorder}`,
            }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tokens.errorText }} />
            <div className="text-xs" style={{ color: tokens.textPrimary }}>
              <p className="font-medium mb-1.5">What happens when you archive</p>
              <ul className="space-y-1 opacity-80">
                <li>• Dataset will be hidden from marketplace listings</li>
                <li>• Users will no longer be able to discover it</li>
                <li>• Existing downloads remain accessible to buyers</li>
                <li>• Contact support to restore if needed</li>
              </ul>
            </div>
          </div>

          <p className="text-xs px-1" style={{ color: tokens.textMuted }}>
            This action moves the dataset to archived status. It won't be deleted, but will no longer be visible to users.
          </p>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={archiving}
            className="transition-all duration-300 hover:shadow-md"
            style={{ 
              borderColor: tokens.borderDefault,
              color: tokens.textPrimary,
              background: tokens.glassBg,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={archiving}
            className="gap-2 text-white transition-all duration-300 hover:shadow-lg disabled:opacity-60"
            style={{
              background: archiving 
                ? tokens.textMuted 
                : '#dc2626',
            }}
          >
            {archiving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Archive Dataset
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
