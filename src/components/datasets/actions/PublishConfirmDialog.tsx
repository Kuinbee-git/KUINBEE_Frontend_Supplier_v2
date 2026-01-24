'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { publishDataset } from '@/lib/api/datasets';
import { toast } from 'sonner';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';

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
}: PublishConfirmDialogProps) {
  const [publishing, setPublishing] = useState(false);
  const tokens = useSupplierTokens();

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
        'OFFLINE_CONTRACT_NOT_DONE': 'Offline contracting is required before publishing. Please contact support to complete your offline contract.',
        'HTTP_403': 'Offline contracting is required before publishing. Please contact support to complete your offline contract.',
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
              style={{ background: tokens.infoBg }}
            >
              <Upload className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <DialogTitle className="text-lg mb-1" style={{ color: tokens.textPrimary }}>
                Publish Dataset
              </DialogTitle>
              <DialogDescription style={{ color: tokens.textSecondary }}>
                Make your dataset available on the marketplace
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dataset Info */}
          <div
            className="rounded-xl p-4"
            style={{
              background: tokens.infoBg,
              borderLeft: '3px solid #3b82f6',
            }}
          >
            <p className="text-xs mb-2" style={{ color: tokens.textMuted }}>Dataset to publish</p>
            <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>{datasetTitle}</p>
            {uploadFileName && (
              <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
                File: {uploadFileName}
              </p>
            )}
          </div>

          {/* Important Notice */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: tokens.warningBg,
              border: `1px solid ${tokens.warningBorder}`,
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div className="text-xs" style={{ color: tokens.textPrimary }}>
              <p className="font-medium mb-1.5">Important</p>
              <ul className="space-y-1 opacity-80">
                <li>• Pricing cannot be changed directly after publishing</li>
                <li>• You can still change visibility settings</li>
                <li>• Contact support for pricing modifications</li>
              </ul>
            </div>
          </div>

          {/* Success Info */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: tokens.successBg,
              border: `1px solid ${tokens.successBorder}`,
            }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
            <div className="text-xs" style={{ color: tokens.textPrimary }}>
              <p className="font-medium mb-1.5">After Publishing</p>
              <ul className="space-y-1 opacity-80">
                <li>• Dataset will be visible on the marketplace</li>
                <li>• Users can discover and access your data</li>
                <li>• You'll receive download notifications</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={publishing}
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
            disabled={publishing}
            className="gap-2 text-white transition-all duration-300 hover:shadow-lg disabled:opacity-60"
            style={{
              background: publishing
                ? tokens.textMuted
                : '#2a3558',
            }}
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Publish Dataset
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
