'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileText } from 'lucide-react';

interface SampleUploadSectionProps {
  sampleUpload: {
    id: string;
    status: string;
    originalFileName: string | null;
    contentType: string | null;
    sizeBytes: string | null;
    updatedAt: string;
  } | null | undefined;
  onUploadClick: () => void;
  isDark: boolean;
  tokens: any;
  formatDate: (dateStr: string) => string;
  formatFileSize: (bytes: string | null) => string;
}

export function SampleUploadSection({
  sampleUpload,
  onUploadClick,
  isDark,
  tokens,
  formatDate,
  formatFileSize,
}: SampleUploadSectionProps) {
  return (
    <Card
      className="border overflow-hidden"
      style={{
        background: tokens.surfaceCard,
        borderColor: tokens.borderDefault,
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: '#22c55e' }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                Sample File Upload
              </h3>
              <p className="text-xs" style={{ color: tokens.textMuted }}>
                Buyers can download this file freely before purchase
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onUploadClick}
            className="h-10 px-5 font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: tokens.glassBg || 'transparent',
              border: `1px solid ${tokens.glassBorder || tokens.borderSubtle}`,
              color: tokens.textPrimary,
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            {sampleUpload ? 'Replace sample file' : 'Upload sample file'}
          </Button>
        </div>

        {sampleUpload ? (
          <div
            className="p-4 rounded-lg border"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
              borderColor: tokens.borderSubtle,
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label style={{ color: tokens.textSecondary }}>File Name</Label>
                  <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                    {sampleUpload.originalFileName || 'N/A'}
                  </p>
                </div>
                <span
                  className="px-3 py-1 text-xs font-medium rounded-full"
                  style={{
                    background:
                      sampleUpload.status === 'UPLOADED' ? 'rgba(34, 197, 94, 0.1)' :
                        sampleUpload.status === 'UPLOADING' ? 'rgba(234, 179, 8, 0.1)' :
                          sampleUpload.status === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' :
                            'rgba(59, 130, 246, 0.1)',
                    color:
                      sampleUpload.status === 'UPLOADED' ? '#22c55e' :
                        sampleUpload.status === 'UPLOADING' ? '#eab308' :
                          sampleUpload.status === 'FAILED' ? '#ef4444' :
                            '#3b82f6',
                  }}
                >
                  {sampleUpload.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: tokens.textSecondary }}>Content Type</Label>
                  <p className="text-sm" style={{ color: tokens.textPrimary }}>
                    {sampleUpload.contentType || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label style={{ color: tokens.textSecondary }}>File Size</Label>
                  <p className="text-sm" style={{ color: tokens.textPrimary }}>
                    {formatFileSize(sampleUpload.sizeBytes)}
                  </p>
                </div>
              </div>

              <div>
                <Label style={{ color: tokens.textSecondary }}>Last Updated</Label>
                <p className="text-sm" style={{ color: tokens.textPrimary }}>
                  {formatDate(sampleUpload.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm" style={{ color: tokens.textMuted }}>
            No sample file uploaded yet.
          </div>
        )}
      </div>
    </Card>
  );
}
