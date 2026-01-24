'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { StyledSelect } from '@/components/datasets/shared/StyledSelect';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { upsertDataFormatInfo } from '@/lib/api';
import type { DataFormatInfo, UpsertDataFormatRequest, FileFormat, CompressionType } from '@/types/dataset-proposal.types';

interface DataFormatFormProps {
  datasetId: string;
  initialData?: DataFormatInfo;
  isDark?: boolean;
  onSuccess?: (data: DataFormatInfo) => void;
  onCancel?: () => void;
}

const FILE_FORMATS: FileFormat[] = [
  'CSV', 'JSON', 'EXCEL', 'PARQUET', 'SQL', 'XML', 'TSV', 'AVRO', 'HDF5', 'PICKLE', 'FEATHER', 'OTHER'
];

const COMPRESSION_TYPES: CompressionType[] = [
  'NONE', 'ZIP', 'GZIP', 'BZIP2', 'TAR', 'RAR'
];

export function DataFormatForm({
  datasetId,
  initialData,
  isDark = false,
  onSuccess,
  onCancel,
}: DataFormatFormProps) {
  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<UpsertDataFormatRequest>({
    fileFormat: initialData?.fileFormat || 'CSV',
    rows: initialData?.rows || 0,
    cols: initialData?.cols || 0,
    fileSize: initialData?.fileSize || '',
    compressionType: initialData?.compressionType || 'NONE',
    encoding: initialData?.encoding || 'UTF-8',
  });

  const handleFieldChange = (field: keyof UpsertDataFormatRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const isFormValid = () => {
    return (
      formData.fileFormat &&
      formData.rows > 0 &&
      formData.cols > 0 &&
      formData.fileSize.trim() !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please fill in all required fields with valid values');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await upsertDataFormatInfo(datasetId, formData);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(response.dataFormat);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save data format:', err);
      setError(err.message || 'Failed to save data format');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset to initial data
      setFormData({
        fileFormat: initialData?.fileFormat || 'CSV',
        rows: initialData?.rows || 0,
        cols: initialData?.cols || 0,
        fileSize: initialData?.fileSize || '',
        compressionType: initialData?.compressionType || 'NONE',
        encoding: initialData?.encoding || 'UTF-8',
      });
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Card
      className="border overflow-hidden"
      style={{
        background: tokens.surfaceCard,
        borderColor: tokens.borderDefault,
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 pb-4 border-b" style={{ borderColor: tokens.borderSubtle }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: tokens.textPrimary }}>
            Data Format & Structure
          </h2>
          <p className="text-sm" style={{ color: tokens.textMuted }}>
            Specify the format and structural details of your dataset file
          </p>
        </div>

        {/* Status Messages */}
        {(success || error) && (
          <div className="mb-6 space-y-3">
            {/* Success Message */}
            {success && (
              <div
                className="rounded-xl border px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
                style={{
                  background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                  borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                  Data format saved successfully!
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="rounded-xl border px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
                style={{
                  background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                  <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                  {error}
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Information Section */}
          <div
            className="rounded-xl border p-5 space-y-5"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
              borderColor: tokens.borderSubtle,
            }}
          >
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: tokens.borderSubtle }}>
              <span className="text-sm font-medium" style={{ color: tokens.textPrimary }}>File Information</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* File Format */}
              <div className="space-y-2">
                <Label htmlFor="fileFormat" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                  File Format <span className="text-red-500">*</span>
                </Label>
                <StyledSelect
                  options={FILE_FORMATS.map(format => ({ label: format, value: format }))}
                  value={formData.fileFormat}
                  onValueChange={(value) => handleFieldChange('fileFormat', value as FileFormat)}
                  disabled={submitting}
                  tokens={tokens}
                />
              </div>

              {/* File Size */}
              <div className="space-y-2">
                <Label htmlFor="fileSize" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                  File Size <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fileSize"
                  value={formData.fileSize}
                  onChange={(e) => handleFieldChange('fileSize', e.target.value)}
                  placeholder="e.g., 10.5 MB, 2.3 GB"
                  disabled={submitting}
                  required
                  className="h-11 transition-colors focus-visible:ring-2"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Data Structure Section */}
          <div
            className="rounded-xl border p-5 space-y-5"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
              borderColor: tokens.borderSubtle,
            }}
          >
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: tokens.borderSubtle }}>
              <span className="text-sm font-medium" style={{ color: tokens.textPrimary }}>Data Structure</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Rows */}
              <div className="space-y-2">
                <Label htmlFor="rows" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                  Number of Rows <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  value={formData.rows}
                  onChange={(e) => handleFieldChange('rows', parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g., 10000"
                  disabled={submitting}
                  required
                  className="h-11 transition-colors focus-visible:ring-2"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>

              {/* Columns */}
              <div className="space-y-2">
                <Label htmlFor="cols" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                  Number of Columns <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cols"
                  type="number"
                  min="1"
                  value={formData.cols}
                  onChange={(e) => handleFieldChange('cols', parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g., 25"
                  disabled={submitting}
                  required
                  className="h-11 transition-colors focus-visible:ring-2"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Technical Details Section */}
          <div
            className="rounded-xl border p-5 space-y-5"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
              borderColor: tokens.borderSubtle,
            }}
          >
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: tokens.borderSubtle }}>
              <span className="text-sm font-medium" style={{ color: tokens.textPrimary }}>Technical Details</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: tokens.inputBg, color: tokens.textMuted }}>Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Compression Type */}
              <div className="space-y-2">
                <Label htmlFor="compressionType" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                  Compression Type
                </Label>
                <StyledSelect
                  options={COMPRESSION_TYPES.map(type => ({ label: type === 'NONE' ? 'None' : type, value: type }))}
                  value={formData.compressionType || 'NONE'}
                  onValueChange={(value) => handleFieldChange('compressionType', value as CompressionType)}
                  disabled={submitting}
                  tokens={tokens}
                />
              </div>

              {/* Encoding */}
              <div className="space-y-2">
                <Label htmlFor="encoding" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                  Encoding
                </Label>
                <Input
                  id="encoding"
                  value={formData.encoding || ''}
                  onChange={(e) => handleFieldChange('encoding', e.target.value)}
                  placeholder="e.g., UTF-8, ASCII"
                  disabled={submitting}
                  className="h-11 transition-colors focus-visible:ring-2"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t" style={{ borderColor: tokens.borderSubtle }}>
            <Button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="h-11 px-6 font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] text-white"
              style={{
                background: isFormValid() && !submitting
                  ? '#2a3558'
                  : 'rgba(156, 163, 175, 0.3)',
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Format'}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={submitting}
                className="h-11 px-5 font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: tokens.glassBg || 'transparent',
                  border: `1px solid ${tokens.glassBorder || tokens.inputBorder}`,
                  color: tokens.textPrimary,
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}
