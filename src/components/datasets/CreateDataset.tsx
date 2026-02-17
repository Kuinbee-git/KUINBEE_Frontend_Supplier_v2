'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { FileText, ArrowLeft, AlertCircle, CheckCircle, ChevronRight, ChevronLeft, Loader2, Upload } from 'lucide-react';
import { createDatasetProposal, upsertAboutInfo, upsertDataFormatInfo, replaceFeatures, upsertProposalPricing } from '@/lib/api';
import { BasicInfoStep, AboutStep, DataFormatStep, FeaturesStep, PricingStep } from './create-steps';
import { DatasetUploadFlow } from './DatasetUploadFlow';
import type { 
  DatasetSuperType, 
  UpsertAboutInfoRequest, 
  UpsertDataFormatRequest,
  Feature,
  FileFormat,
  UpsertPricingRequest,
  DatasetPricingVersion,
} from '@/types/dataset-proposal.types';
import type { Source } from '@/types/catalog.types';

interface CreateDatasetProps {
  isDark?: boolean;
}

type Step = 'basic' | 'about' | 'format' | 'features' | 'pricing' | 'upload';

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

  // Step 5: Pricing
  const [pricingData, setPricingData] = useState<UpsertPricingRequest>({
    isPaid: false,
    price: null,
    currency: 'USD',
  });
  const [pricingLoaded, setPricingLoaded] = useState(false);

  const tokens = getDatasetThemeTokens(isDark);

  const steps = [
    { id: 'basic' as Step, label: 'Basic Info', number: 1 },
    { id: 'about' as Step, label: 'About Dataset', number: 2 },
    { id: 'format' as Step, label: 'Data Format', number: 3 },
    { id: 'features' as Step, label: 'Features', number: 4 },
    { id: 'pricing' as Step, label: 'Pricing', number: 5 },
    { id: 'upload' as Step, label: 'Upload File', number: 6 },
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

  const isPricingValid = () => {
    if (!pricingData.isPaid) return true; // Free datasets don't need a price
    return !!(pricingData.price && pricingData.price.trim() !== '');
  };

  const handleBasicChange = (field: string, value: any) => {
    setBasicData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSourceCreated = useCallback((source: Source) => {
    // Source was created and auto-selected in SourcesSelect
    // We can show a success message or handle additional logic
    setSuccess(`Source "${source.name}" created successfully`);
    setTimeout(() => setSuccess(null), 3000);
  }, []);

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

  const handlePricingChange = (field: keyof UpsertPricingRequest, value: any) => {
    setPricingData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleNext = async () => {
    setError(null);
    setSuccess(null);

    // Step 1: Create the basic proposal (or navigate if already created)
    if (currentStep === 'basic') {
      if (!isBasicValid()) {
        setError('Please fill in all required fields');
        return;
      }

      // Smart check: If proposal already exists, just navigate forward
      // This prevents duplicate proposals when user navigates back and clicks Next again
      if (createdProposalId) {
        setSuccess('Continuing with existing proposal');
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep('about');
        }, 500);
        return;
      }

      // Only create new proposal if one doesn't exist yet
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
          setCurrentStep('pricing');
        }, 1000);
      } catch (err: any) {
        console.error('Failed to save features:', err);
        setError(err.message || 'Failed to save features');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 5: Configure Pricing
    if (currentStep === 'pricing') {
      if (!isPricingValid()) {
        setError('Please enter a valid price for paid datasets');
        return;
      }

      if (!createdProposalId) {
        setError('No proposal ID found');
        return;
      }

      setSubmitting(true);
      try {
        await upsertProposalPricing(createdProposalId, pricingData);
        setSuccess('Pricing saved!');
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep('upload');
        }, 1000);
      } catch (err: any) {
        console.error('Failed to save pricing:', err);
        setError(err.message || 'Failed to save pricing');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 6: Upload file and complete
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
    if (currentStep === 'pricing') return isPricingValid();
    if (currentStep === 'upload') return fileUploaded;
    return false;
  };

  return (
    <>
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-6 transition-all duration-200 hover:translate-x-[-4px] rounded-lg"
            style={{
              color: tokens.textSecondary,
              padding: '0.625rem 1.25rem',
              background: tokens.glassBg,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1.5px solid ${tokens.glassBorder}`,
              boxShadow: tokens.glassShadow,
            }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200" />
            Back to datasets
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: tokens.textPrimary }}>
              Create new proposal
            </h1>
            <p className="text-base" style={{ color: tokens.textMuted }}>
              Complete the steps to submit your dataset proposal for review
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="flex gap-8 items-start">
            {/* Left: Form Content (Wider) */}
            <div className="flex-1 space-y-6">
              {/* Error Message */}
              {error && (
                <div
                  className="rounded-lg border px-4 py-3 flex items-start gap-3 animate-in fade-in duration-200"
                  style={{
                    background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                  <p className="text-sm" style={{ color: '#DC2626' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div
                  className="rounded-lg border px-4 py-3 flex items-start gap-3 animate-in fade-in duration-200"
                  style={{
                    background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                    borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
                  }}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                  <p className="text-sm" style={{ color: '#22c55e' }}>
                    {success}
                  </p>
                </div>
              )}

              {/* Form Card */}
              <Card
                className="border overflow-hidden"
                style={{
                  background: tokens.surfaceCard,
                  borderColor: tokens.borderDefault,
                }}
              >
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-1" style={{ color: tokens.textPrimary }}>
                      {steps[currentStepIndex].label}
                    </h2>
                    <p className="text-sm" style={{ color: tokens.textMuted }}>
                      Step {currentStepIndex + 1} of {steps.length}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {currentStep === 'basic' && (
                      <BasicInfoStep
                        data={basicData}
                        onChange={handleBasicChange}
                        onSourceCreated={handleSourceCreated}
                        disabled={submitting}
                        tokens={tokens}
                        isDark={isDark}
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
                        isDark={isDark}
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

                    {currentStep === 'pricing' && (
                      <PricingStep
                        data={pricingData}
                        onChange={handlePricingChange}
                        disabled={submitting}
                        tokens={tokens}
                        isDark={isDark}
                      />
                    )}

                    {currentStep === 'upload' && (
                      <div className="space-y-8 py-8">
                        <div className="text-center space-y-6">
                          <div 
                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                            style={{
                              background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                              border: `2px dashed ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                            }}
                          >
                            <FileText className="w-10 h-10" style={{ color: tokens.textSecondary }} />
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold mb-2" style={{ color: tokens.textPrimary }}>
                              {fileUploaded ? 'File uploaded successfully!' : 'Upload your dataset file'}
                            </h3>
                            <p className="text-sm max-w-md mx-auto" style={{ color: tokens.textMuted }}>
                              {fileUploaded
                                ? 'Your file has been uploaded. Click Complete below to finish creating your proposal.'
                                : 'Upload your dataset file to complete the proposal. Accepted formats: CSV, JSON, Parquet, XLSX.'}
                            </p>
                          </div>

                          {fileUploaded ? (
                            <div
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg"
                              style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                              }}
                            >
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                Upload complete
                              </span>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setUploadDialogOpen(true)}
                              size="lg"
                              className="text-white gap-2 px-8 py-6 text-base rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95"
                              style={{
                                background: '#1a2240',
                                color: '#ffffff',
                              }}
                            >
                              <Upload className="w-5 h-5" />
                              Upload Dataset File
                            </Button>
                          )}
                        </div>

                        {!fileUploaded && (
                          <div
                            className="rounded-lg border p-5 max-w-md mx-auto"
                            style={{
                              background: 'rgba(59, 130, 246, 0.05)',
                              borderColor: 'rgba(59, 130, 246, 0.2)',
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
                              <div className="text-sm leading-relaxed" style={{ color: tokens.textSecondary }}>
                                <p className="font-semibold mb-2" style={{ color: tokens.textPrimary }}>Upload requirements:</p>
                                <ul className="space-y-1.5 list-none">
                                  <li className="flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>Maximum file size: 500MB</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>Supported formats: CSV, JSON, Parquet, XLSX</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>File upload is required to complete your proposal</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div
                  className="px-8 py-6 border-t flex items-center justify-between gap-4"
                  style={{ borderColor: tokens.borderDefault }}
                >
                  {currentStepIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={submitting}
                      className="gap-2 px-6 h-11 font-medium transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                      style={{
                        background: tokens.glassBg,
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: `1.5px solid ${tokens.glassBorder}`,
                        boxShadow: tokens.glassShadow,
                        color: tokens.textPrimary,
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
                      Back
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext() || submitting}
                    className="gap-2 text-white px-8 h-11 font-medium transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    style={{
                      background: canGoNext() && !submitting ? '#1a2240' : '#9ca3af',
                      color: '#ffffff',
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : isLastStep ? (
                      fileUploaded ? (
                  <>
                    Complete & View Proposal
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  'Upload file to continue'
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Right: Progress Stepper (Wider, Sticky) */}
      <div className="w-96 flex-shrink-0">
        <div className="sticky top-0 w-full flex flex-col px-6">
          <h3 className="text-lg font-bold mb-10" style={{ color: tokens.textPrimary }}>
            Progress
          </h3>
          <div className="space-y-14 w-full relative flex flex-col">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-row items-start w-full relative">
                {/* Step Circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0 transition-all duration-300 relative z-10 shadow-md"
                  style={{
                    background: idx <= currentStepIndex 
                      ? 'linear-gradient(135deg, #1a2240 0%, #2a3558 100%)'
                      : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(26, 34, 64, 0.05)',
                    color: idx <= currentStepIndex ? '#fff' : tokens.textMuted,
                    border: idx === currentStepIndex ? '2px solid rgba(59, 130, 246, 0.5)' : 'none',
                  }}
                >
                  {idx < currentStepIndex ? '✓' : step.number}
                </div>

                {/* Step Label & Status */}
                <div className="ml-4 pt-1 flex flex-col">
                  <div 
                    className="text-lg font-semibold"
                    style={{ color: idx <= currentStepIndex ? tokens.textPrimary : tokens.textMuted }}
                  >
                    {step.label}
                  </div>
                  <div className="text-base" style={{ color: tokens.textMuted }}>
                    {idx < currentStepIndex ? 'Complete' : idx === currentStepIndex ? 'In progress' : 'Pending'}
                  </div>
                </div>

                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className="absolute w-1 transition-all duration-300"
                    style={{
                      left: '1.5rem',
                      top: '3rem',
                      height: '3.5rem',
                      background: idx < currentStepIndex 
                        ? 'linear-gradient(to bottom, #1a2240, #2a3558)'
                        : tokens.borderSubtle,
                      zIndex: 0,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
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
    </>
  );
}
