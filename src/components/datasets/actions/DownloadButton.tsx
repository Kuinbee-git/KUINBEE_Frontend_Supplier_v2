'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { getPublishedFileDownloadUrl } from '@/lib/api/datasets';
import { toast } from 'sonner';

interface DownloadButtonProps {
  datasetId: string;
  fileName?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function DownloadButton({
  datasetId,
  fileName,
  variant = 'outline',
  size = 'default',
  className = '',
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await getPublishedFileDownloadUrl(datasetId);
      
      // Open the presigned URL in a new tab to trigger download
      window.open(response.url, '_blank');
      
      toast.success('Download started', {
        description: fileName || 'Your file download should begin shortly.',
      });
    } catch (error: any) {
      console.error('Failed to get download URL:', error);
      
      const errorMessages: Record<string, string> = {
        'NOT_PUBLISHED': 'Dataset is not published yet.',
        'NOT_FOUND': 'Dataset or file not found.',
        'FORBIDDEN': 'You do not have permission to download this file.',
        'STORAGE_UNAVAILABLE': 'Storage service is temporarily unavailable.',
      };
      
      const message = errorMessages[error.code] || error.message || 'Failed to generate download link';
      
      toast.error('Download failed', {
        description: message,
        duration: 6000,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
      className={`gap-2 ${className}`}
      style={{
        ...(variant === 'default' ? {
          background: downloading 
            ? '#6b7280' 
            : 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #3b82f6 100%)',
          color: '#ffffff',
        } : {})
      }}
    >
      {downloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {downloading ? 'Preparing...' : 'Download File'}
    </Button>
  );
}
