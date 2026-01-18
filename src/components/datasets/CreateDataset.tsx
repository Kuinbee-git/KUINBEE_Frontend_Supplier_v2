'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/shared';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { FileText, ArrowLeft, AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { createDatasetProposal, upsertAboutInfo, upsertDataFormatInfo, replaceFeatures } from '@/lib/api';
import { BasicInfoStep, AboutStep, DataFormatStep, FeaturesStep } from './create-steps';
import { DatasetUploadFlow } from './DatasetUploadFlow';
import type { 
  DatasetSuperType, 
  UpsertAboutInfoRequest, 
  UpsertDataFormatRequest,
  Feature,
  FileFormat
} from '@/types/dataset-proposal.types';

interface CreateDatasetProps {
  isDark?: boolean;
}

type Step = 'basic' | 'about' | 'format' | 'features' | 'upload';

export function CreateDataset({ isDark = false }: CreateDatasetProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);

  // Step 1: Basic Info
  const [basicData, setBasicData] = useState({
    title: '',
    superType: '' as DatasetSuperType | '',
    primaryCategoryId: '',
    sourceId: '',
    license: '',
  });

  // Step 2: About Dataset
  const [aboutData, setAboutData] = useState<UpsertAboutInfoRequest>({
    overview: '',
    description: '',
    dataQuality: '',
    useCases: null,
    limitations: null,
    methodology: null,
  });

  // Step 3: Data Format
  const [formatData, setFormatData] = useState<Omit<UpsertDataFormatRequest, 'fileFormat'> & { fileFormat: FileFormat | '' }>({
    fileFormat: '',
    fileSize: '',
    rows: 0,
    cols: 0,
    compressionType: undefined,
    encoding: 'UTF-8',
  });

  // Step 4: Features
  const [features, setFeatures] = useState<Feature[]>([
    { name: '', dataType: '', description: null, isNullable: false }
  ]);

  const tokens = getDatasetThemeTokens(isDark);

  const steps = [
    { id: 'basic' as Step, label: 'Basic Info', number: 1 },
    { id: 'about' as Step, label: 'About Dataset', number: 2 },
    { id: 'format' as Step, label: 'Data Format', number: 3 },
    { id: 'features' as Step, label: 'Features', number: 4 },
    { id: 'upload' as Step, label: 'Upload File', number: 5 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;

  const isBasicValid = () => {
    return (
      basicData.title.trim() !== '' && 
      basicData.superType !== '' &&
      basicData.primaryCategoryId !== '' &&
      basicData.sourceId !== '' &&
      basicData.license !== ''
    );
  };

  const isAboutValid = () => {
    return (
      aboutData.overview.trim() !== '' &&
      aboutData.description.trim() !== '' &&
      aboutData.dataQuality.trim() !== ''
    );
  };

  const isFormatValid = () => {
    return (
      formatData.fileFormat !== '' &&
      formatData.fileSize.trim() !== '' &&
      formatData.rows > 0 &&
      formatData.cols > 0
    );
  };

  const isFeaturesValid = () => {
    return features.length > 0 && features.every(f => f.name.trim() !== '' && f.dataType.trim() !== '');
  };

  const handleBasicChange = (field: string, value: any) => {
    setBasicData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAboutChange = (field: keyof UpsertAboutInfoRequest, value: string) => {
    setAboutData((prev) => ({ ...prev, [field]: value || null }));
    setError(null);
  };

  const handleFormatChange = (field: string, value: any) => {
    setFormatData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFeatureChange = (index: number, field: keyof Feature, value: any) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
    setError(null);
  };

  const addFeature = () => {
    setFeatures([...features, { name: '', dataType: '', description: null, isNullable: false }]);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const handleNext = async () => {
    setError(null);
    setSuccess(null);

    // Step 1: Create the basic proposal
    if (currentStep === 'basic') {
      if (!isBasicValid()) {
        setError('Please fill in all required fields');
        return;
      }

      setSubmitting(true);
      try {
        const response = await createDatasetProposal({
          title: basicData.title,
          superType: basicData.superType as DatasetSuperType,
          primaryCategoryId: basicData.primaryCategoryId,
          sourceId: basicData.sourceId,
          license: basicData.license,
        });
        
        setCreatedProposalId(response.dataset.id);
        setSuccess('Proposal created successfully!');
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep('about');
        }, 1000);
      } catch (err: any) {
        console.error('Failed to create proposal:', err);
        setError(err.message || 'Failed to create proposal');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 2: Add About information
    if (currentStep === 'about') {
      if (!isAboutValid()) {
        setError('Please fill in all required fields (Overview, Description, Data Quality)');
        return;
      }

      if (!createdProposalId) {
        setError('No proposal ID found');
        return;
      }

      setSubmitting(true);
      try {
        await upsertAboutInfo(createdProposalId, aboutData);
        setSuccess('About information saved!');
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep('format');
        }, 1000);
      } catch (err: any) {
        console.error('Failed to save about info:', err);
        setError(err.message || 'Failed to save about information');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 3: Add Data Format information
    if (currentStep === 'format') {
      if (!isFormatValid()) {
        setError('Please fill in all required fields');
        return;
      }

      if (!createdProposalId) {
        setError('No proposal ID found');
        return;
      }

      setSubmitting(true);
      try {
        await upsertDataFormatInfo(createdProposalId, {
          ...formatData,
          fileFormat: formatData.fileFormat as FileFormat
        });
        setSuccess('Data format information saved!');
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep('features');
        }, 1000);
      } catch (err: any) {
        console.error('Failed to save format info:', err);
        setError(err.message || 'Failed to save data format information');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 4: Add Features and complete
    if (currentStep === 'features') {
      if (!isFeaturesValid()) {
        setError('Please define at least one feature with name and data type');
        return;
      }

      if (!createdProposalId) {
        setError('No proposal ID found');
        return;
      }

      setSubmitting(true);
      try {
        await replaceFeatures(createdProposalId, { features });
        setSuccess('Features saved!');
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep('upload');
        }, 1000);
      } catch (err: any) {
        console.error('Failed to save features:', err);
        setError(err.message || 'Failed to save features');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 5: Upload file and complete
    if (currentStep === 'upload') {
      if (!fileUploaded) {
        setError('Please upload a file before completing');
        return;
      }

      if (!createdProposalId) {
        setError('No proposal ID found');
        return;
      }

      // Navigate to detail page
      setSuccess('Proposal created successfully! Redirecting...');
      setTimeout(() => {
        router.push(`/dashboard/datasets/${createdProposalId}`);
      }, 1500);
      return;
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
      setError(null);
      setSuccess(null);
    }
  };

  const canGoNext = () => {
    if (currentStep === 'basic') return isBasicValid();
    if (currentStep === 'about') return isAboutValid();
    if (currentStep === 'format') return isFormatValid();
    if (currentStep === 'features') return isFeaturesValid();
    if (currentStep === 'upload') return fileUploaded;
    return false;
  };

  return (
    <PageBackground withGrid>
      <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to datasets
        </Button>

        {/* Title Card */}
        <Card
          className="border overflow-hidden mb-6"
          style={{
            background: tokens.surfaceCard,
            borderColor: tokens.borderDefault,
            boxShadow: tokens.shadowCard,
          }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between gap-6 mb-5">
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 34, 64, 0.08)',
                  }}
                >
                  <FileText className="w-6 h-6" style={{ color: tokens.textSecondary }} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold mb-1" style={{ color: tokens.textPrimary }}>
                    Create new proposal
                  </h1>
                  <p className="text-sm" style={{ color: tokens.textMuted }}>
                    Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].label}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-5">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        background: idx <= currentStepIndex 
                          ? 'linear-gradient(135deg, #1a2240 0%, #2a3558 100%)'
                          : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 34, 64, 0.1)',
                        color: idx <= currentStepIndex ? '#fff' : tokens.textMuted,
                      }}
                    >
                      {idx < currentStepIndex ? '✓' : step.number}
                    </div>
                    <span className="text-xs font-medium" style={{ color: idx <= currentStepIndex ? tokens.textPrimary : tokens.textMuted }}>
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className="h-px flex-1 mx-2"
                      style={{
                        background: idx < currentStepIndex ? tokens.borderDefault : tokens.borderSubtle,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="rounded-lg border px-4 py-3 flex items-start gap-3 mb-4"
                style={{
                  background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <p className="text-xs" style={{ color: '#DC2626' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                className="rounded-lg border px-4 py-3 flex items-start gap-3 mb-4"
                style={{
                  background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                  borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
                }}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                <p className="text-xs" style={{ color: '#22c55e' }}>
                  {success}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Form Card */}
        <Card
          className="border overflow-hidden"
          style={{
            background: tokens.surfaceCard,
            borderColor: tokens.borderDefault,
          }}
        >
          <div className="p-6 space-y-6">
            {currentStep === 'basic' && (
              <BasicInfoStep
                data={basicData}
                onChange={handleBasicChange}
                disabled={submitting}
                tokens={tokens}
              />
            )}

            {currentStep === 'about' && (
              <AboutStep
                data={aboutData}
                onChange={handleAboutChange}
                disabled={submitting}
                tokens={tokens}
              />
            )}

            {currentStep === 'format' && (
              <DataFormatStep
                data={formatData}
                onChange={handleFormatChange}
                disabled={submitting}
                tokens={tokens}
              />
            )}

            {currentStep === 'features' && (
              <FeaturesStep
                features={features}
                onChange={handleFeatureChange}
                onAdd={addFeature}
                onRemove={removeFeature}
                disabled={submitting}
                isDark={isDark}
                tokens={tokens}
              />
            )}

            {currentStep === 'upload' && (
              <div className="space-y-6 py-8">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: tokens.textSecondary }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: tokens.textPrimary }}>
                    Upload your dataset file
                  </h3>
                  <p className="text-sm mb-6" style={{ color: tokens.textMuted }}>
                    {fileUploaded
                      ? 'File uploaded successfully! Click Complete to finish.'
                      : 'Click the button below to upload your dataset file'}
                  </p>

                  {fileUploaded ? (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                      style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        File uploaded successfully
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setUploadDialogOpen(true)}
                      size="lg"
                      className="text-white gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)',
                      }}
                    >
                      <FileText className="w-5 h-5" />
                      Upload Dataset File
                    </Button>
                  )}
                </div>

                {!fileUploaded && (
                  <div
                    className="rounded-lg border p-4 flex items-start gap-3"
                    style={{
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderColor: 'rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                    <div className="text-xs leading-relaxed" style={{ color: tokens.textSecondary }}>
                      <p className="font-medium mb-1">Upload requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>File upload is required to complete your proposal</li>
                        <li>Maximum file size: 500MB</li>
                        <li>Accepted formats: CSV, JSON, Parquet, XLSX</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div
            className="px-6 py-4 border-t flex items-center justify-between"
            style={{ borderColor: tokens.borderSubtle }}
          >
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0 || submitting}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canGoNext() || submitting}
              className="gap-2 text-white"
              style={{
                background: canGoNext() && !submitting
                  ? 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)'
                  : 'rgba(156, 163, 175, 0.3)',
              }}
            >
              {submitting ? (
                'Saving...'
              ) : isLastStep ? (
                fileUploaded ? 'Complete & View Proposal' : 'Upload file to continue'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Upload Dialog */}
      {createdProposalId && (
        <DatasetUploadFlow
          isOpen={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          datasetId={createdProposalId}
          isDark={isDark}
          onUploadComplete={() => {
            setFileUploaded(true);
            setUploadDialogOpen(false);
            setSuccess('File uploaded successfully!');
            setTimeout(() => setSuccess(null), 2000);
          }}
        />
      )}
    </PageBackground>
  );
}
