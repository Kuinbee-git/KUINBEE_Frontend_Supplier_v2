'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getDatasetThemeTokens, FILE_UPLOAD_CONSTRAINTS } from '@/constants/dataset.constants';
import { formatFileSize, validateDatasetFile } from '@/utils/dataset.utils';
import { presignCurrentUpload, uploadFileToS3, completeCurrentUpload } from '@/lib/api';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';

interface DatasetUploadFlowProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  isDark?: boolean;
  onUploadComplete?: (fileInfo: { fileName: string; fileSize: string }) => void;
}

type UploadStep = 'select' | 'uploading' | 'complete' | 'error';

export function DatasetUploadFlow({ 
  isOpen, 
  onClose, 
  datasetId, 
  isDark = false,
  onUploadComplete 
}: DatasetUploadFlowProps) {
  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ fileName: string; fileSize: string } | null>(null);

  const tokens = getDatasetThemeTokens(isDark);

  const handleFileSelect = (file: File) => {
    const validation = validateDatasetFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setStep('error');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStep('uploading');
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from backend
      const presignResponse = await presignCurrentUpload(datasetId, {
        originalFileName: selectedFile.name,
        contentType: selectedFile.type || 'application/octet-stream',
      });

      // Step 2: Upload file directly to S3 with progress tracking
      await uploadFileToS3(
        presignResponse.putUrl,
        selectedFile,
        (progress) => setUploadProgress(progress)
      );

      // Step 3: Notify backend that upload is complete
      await completeCurrentUpload(datasetId, {
        sizeBytes: selectedFile.size.toString(),
      });

      // Success!
      const fileInfo = {
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
      };
      setUploadedFileInfo(fileInfo);
      setStep('complete');
      onUploadComplete?.(fileInfo);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setErrorMessage(error.message || 'Failed to upload file. Please try again.');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMessage('');
    setUploadedFileInfo(null);
    onClose();
  };

  const handleRetry = () => {
    setStep('select');
    setSelectedFile(null);
    setErrorMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[600px]"
        style={{
          background: tokens.surfaceCard,
          borderColor: tokens.borderDefault,
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle style={{ color: tokens.textPrimary }}>
              {step === 'select' && 'Upload dataset file'}
              {step === 'uploading' && 'Uploading...'}
              {step === 'complete' && 'Upload complete'}
              {step === 'error' && 'Upload failed'}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: tokens.textMuted }} />
            </button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Step 1: Select File */}
          {step === 'select' && (
            <div className="space-y-6">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer"
                  style={{
                    background: tokens.dropzoneBg,
                    borderColor: tokens.dropzoneBorder,
                  }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: tokens.textMuted }} />
                  <p className="text-sm font-medium mb-2" style={{ color: tokens.textPrimary }}>
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs mb-4" style={{ color: tokens.textMuted }}>
                    Supported formats: CSV, JSON, Parquet, XLSX (max 500MB)
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept={FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.join(',')}
                    onChange={handleFileInputChange}
                  />
                </div>
              ) : (
                <div
                  className="p-6 rounded-lg border"
                  style={{
                    background: tokens.dropzoneBg,
                    borderColor: tokens.borderDefault,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                    >
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate mb-1" style={{ color: tokens.textPrimary }}>
                        {selectedFile.name}
                      </p>
                      <p className="text-xs" style={{ color: tokens.textMuted }}>
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div
                className="rounded-lg border p-4 flex items-start gap-3"
                style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                <div className="text-xs leading-relaxed" style={{ color: tokens.textSecondary }}>
                  <p className="font-medium mb-1">File requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Maximum file size: 500MB</li>
                    <li>Accepted formats: CSV, JSON, Parquet, XLSX</li>
                    <li>Files will be validated after upload</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="text-white"
                  style={{
                    background: selectedFile
                      ? 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)'
                      : 'rgba(156, 163, 175, 0.3)',
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload file
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Uploading */}
          {step === 'uploading' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                >
                  <Upload className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
                <p className="text-sm font-medium mb-2" style={{ color: tokens.textPrimary }}>
                  Uploading {selectedFile?.name}
                </p>
                <p className="text-xs" style={{ color: tokens.textMuted }}>
                  Please don't close this window
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs" style={{ color: tokens.textMuted }}>
                  <span>Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-medium mb-2" style={{ color: tokens.textPrimary }}>
                  File uploaded successfully
                </p>
                <p className="text-xs" style={{ color: tokens.textMuted }}>
                  Your file is being processed and will be reviewed by admins
                </p>
              </div>

              {uploadedFileInfo && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    background: tokens.dropzoneBg,
                    borderColor: tokens.borderDefault,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                        {uploadedFileInfo.fileName}
                      </p>
                      <p className="text-xs" style={{ color: tokens.textMuted }}>
                        {uploadedFileInfo.fileSize}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleClose}
                  className="text-white"
                  style={{
                    background: 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)',
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Error */}
          {step === 'error' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-sm font-medium mb-2" style={{ color: tokens.textPrimary }}>
                  Upload failed
                </p>
                <p className="text-xs" style={{ color: tokens.textMuted }}>
                  {errorMessage}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRetry}
                  className="text-white"
                  style={{
                    background: 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)',
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
