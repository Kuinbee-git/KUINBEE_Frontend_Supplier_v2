'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: tokens.textPrimary }}>
            Data Format & Structure
          </h2>
          <p className="text-sm" style={{ color: tokens.textMuted }}>
            Specify the format and structural details of your dataset
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div
            className="mb-4 rounded-lg border px-4 py-3 flex items-center gap-3"
            style={{
              background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
              borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
            }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
            <p className="text-sm" style={{ color: '#22c55e' }}>
              Data format saved successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 rounded-lg border px-4 py-3 flex items-center gap-3"
            style={{
              background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: '#ef4444' }}>
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* File Format */}
            <div className="space-y-2">
              <Label htmlFor="fileFormat" style={{ color: tokens.textPrimary }}>
                File Format <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.fileFormat}
                onValueChange={(value) => handleFieldChange('fileFormat', value as FileFormat)}
                disabled={submitting}
              >
                <SelectTrigger
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Size */}
            <div className="space-y-2">
              <Label htmlFor="fileSize" style={{ color: tokens.textPrimary }}>
                File Size <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fileSize"
                value={formData.fileSize}
                onChange={(e) => handleFieldChange('fileSize', e.target.value)}
                placeholder="e.g., 10.5 MB, 2.3 GB"
                disabled={submitting}
                required
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            {/* Rows */}
            <div className="space-y-2">
              <Label htmlFor="rows" style={{ color: tokens.textPrimary }}>
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
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            {/* Columns */}
            <div className="space-y-2">
              <Label htmlFor="cols" style={{ color: tokens.textPrimary }}>
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
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            {/* Compression Type */}
            <div className="space-y-2">
              <Label htmlFor="compressionType" style={{ color: tokens.textPrimary }}>
                Compression Type
              </Label>
              <Select
                value={formData.compressionType}
                onValueChange={(value) => handleFieldChange('compressionType', value as CompressionType)}
                disabled={submitting}
              >
                <SelectTrigger
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPRESSION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Encoding */}
            <div className="space-y-2">
              <Label htmlFor="encoding" style={{ color: tokens.textPrimary }}>
                Encoding
              </Label>
              <Input
                id="encoding"
                value={formData.encoding || ''}
                onChange={(e) => handleFieldChange('encoding', e.target.value)}
                placeholder="e.g., UTF-8, ASCII"
                disabled={submitting}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="text-white"
              style={{
                background: isFormValid() && !submitting
                  ? 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)'
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
