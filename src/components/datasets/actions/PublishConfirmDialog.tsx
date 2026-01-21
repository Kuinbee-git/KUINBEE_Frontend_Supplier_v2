'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Upload, CheckCircle } from 'lucide-react';
import { publishDataset } from '@/lib/api/datasets';
import { toast } from 'sonner';

interface PublishConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetTitle: string;
  uploadFileName?: string | null;
  onSuccess: () => void;
  isDark?: boolean;
}

export function PublishConfirmDialog({
  isOpen,
  onClose,
  datasetId,
  datasetTitle,
  uploadFileName,
  onSuccess,
  isDark = false,
}: PublishConfirmDialogProps) {
  const [publishing, setPublishing] = useState(false);

  const handleConfirm = async () => {
    setPublishing(true);
    try {
      await publishDataset(datasetId);
      
      toast.success('Dataset published successfully', {
        description: 'Your dataset is now live on the marketplace.',
      });
      
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to publish dataset:', error);
      
      const errorMessages: Record<string, string> = {
        'INVALID_STATE': 'Dataset is not in VERIFIED state.',
        'NOT_VERIFIED': 'Dataset verification is not complete.',
        'NO_UPLOAD': 'No verified upload available to publish.',
        'UPLOAD_NOT_READY': 'Upload is not ready for publishing.',
        'NOT_FOUND': 'Dataset not found.',
        'FORBIDDEN': 'You do not have permission to publish this dataset.',
      };
      
      const message = errorMessages[error.code] || error.message || 'Failed to publish dataset';
      
      toast.error('Failed to publish dataset', {
        description: message,
        duration: 6000,
      });
    } finally {
      setPublishing(false);
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
                background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
              }}
            >
              <Upload className="w-5 h-5" style={{ color: '#3b82f6' }} />
            </div>
            <DialogTitle>Publish Dataset</DialogTitle>
          </div>
          <DialogDescription>
            Are you ready to publish this dataset to the marketplace?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dataset Info */}
          <div
            className="rounded-lg p-4 space-y-2"
            style={{
              background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              borderLeft: '3px solid #3b82f6',
            }}
          >
            <p className="text-sm font-medium">Dataset Information:</p>
            <ul className="text-xs space-y-1 opacity-80">
              <li>• Title: <span className="font-medium">{datasetTitle}</span></li>
              {uploadFileName && (
                <li>• File: <span className="font-medium">{uploadFileName}</span></li>
              )}
            </ul>
          </div>

          {/* Important Notice */}
          <div
            className="rounded-lg p-3 flex items-start gap-2"
            style={{
              background: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#eab308' }} />
            <div className="text-xs" style={{ color: isDark ? '#fde047' : '#ca8a04' }}>
              <p className="font-medium mb-1">Important:</p>
              <ul className="space-y-1 opacity-90">
                <li>• Once published, you cannot change pricing directly</li>
                <li>• Pricing changes require a support request</li>
                <li>• You can still change visibility after publishing</li>
              </ul>
            </div>
          </div>

          {/* Success Info */}
          <div
            className="rounded-lg p-3 flex items-start gap-2"
            style={{
              background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
            <div className="text-xs" style={{ color: isDark ? '#86efac' : '#16a34a' }}>
              <p className="font-medium mb-1">After Publishing:</p>
              <ul className="space-y-1 opacity-90">
                <li>• Dataset will be visible on the marketplace</li>
                <li>• Users can discover and download your data</li>
                <li>• You will receive notifications for downloads</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={publishing}
            className="text-white"
            style={{
              background: publishing
                ? 'rgba(156, 163, 175, 0.3)'
                : 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #3b82f6 100%)',
            }}
          >
            {publishing ? 'Publishing...' : 'Confirm & Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
