'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Archive, AlertTriangle } from 'lucide-react';
import { archiveDataset } from '@/lib/api/datasets';
import { toast } from 'sonner';

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
  isDark = false,
}: ArchiveConfirmDialogProps) {
  const [archiving, setArchiving] = useState(false);

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              }}
            >
              <Archive className="w-5 h-5" style={{ color: '#ef4444' }} />
            </div>
            <DialogTitle>Archive Dataset</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to archive this dataset?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dataset Info */}
          <div
            className="rounded-lg p-3"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(26, 34, 64, 0.05)',
            }}
          >
            <p className="text-sm font-medium">{datasetTitle}</p>
          </div>

          {/* Warning */}
          <div
            className="rounded-lg p-3 flex items-start gap-2"
            style={{
              background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
            <div className="text-xs" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>
              <p className="font-medium mb-1">What happens when you archive:</p>
              <ul className="space-y-1 opacity-90">
                <li>• Dataset will be hidden from marketplace listings</li>
                <li>• Users will no longer be able to discover or download it</li>
                <li>• Existing downloads will still be accessible to buyers</li>
                <li>• You can contact support to restore it later if needed</li>
              </ul>
            </div>
          </div>

          <p className="text-sm opacity-70">
            This action will move the dataset to archived status. It won't be deleted, but it will no longer be visible to users.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={archiving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={archiving}
            variant="destructive"
          >
            {archiving ? 'Archiving...' : 'Archive Dataset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
