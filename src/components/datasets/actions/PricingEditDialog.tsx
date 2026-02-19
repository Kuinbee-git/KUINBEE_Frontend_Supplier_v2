'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StyledSelect } from '@/components/datasets/shared/StyledSelect';
import { DollarSign, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { upsertProposalPricing, submitProposalPricing } from '@/lib/api';
import { toast } from 'sonner';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';
import type { DatasetPricingVersion, UpsertPricingRequest, DatasetPricingStatus } from '@/types/dataset-proposal.types';

interface PricingEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  currentPricing: DatasetPricingVersion | null;
  onSuccess: () => void;
  isDark?: boolean;
  feedbackMessage?: string;
  pricingStatus?: DatasetPricingStatus;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export function PricingEditDialog({
  isOpen,
  onClose,
  datasetId,
  currentPricing,
  onSuccess,
  isDark = false,
  feedbackMessage,
  pricingStatus,
}: PricingEditDialogProps) {
  const tokens = useSupplierTokens();
  const [isPaid, setIsPaid] = useState(currentPricing?.isPaid ?? false);
  const [price, setPrice] = useState(currentPricing?.price ?? '');
  const [currency, setCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>(currentPricing?.currency ?? 'USD');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentPricing) {
      setIsPaid(currentPricing.isPaid);
      setPrice(currentPricing.price ?? '');
      setCurrency(currentPricing.currency);
    }
  }, [currentPricing]);

  const handleSaveAndSubmit = async () => {
    if (!isPaid && !price) {
      // Free dataset - no price needed
      setSubmitting(true);
      try {
        // Save first
        await upsertProposalPricing(datasetId, { isPaid: false, price: null, currency });
        
        // Then submit
        await submitProposalPricing(datasetId);
        
        toast.success('Pricing submitted successfully', {
          description: 'Admin will review your pricing now.',
        });
        
        onClose();
        onSuccess();
      } catch (error: any) {
        console.error('Failed to submit pricing:', error);
        toast.error('Failed to submit pricing', {
          description: error.message || 'Please try again later.',
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (isPaid && !price) {
      toast.error('Price is required', {
        description: 'Please enter a price for paid datasets.',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Save first
      await upsertProposalPricing(datasetId, {
        isPaid,
        price: isPaid ? price : null,
        currency,
      });

      // Then submit
      await submitProposalPricing(datasetId);

      toast.success('Pricing submitted successfully', {
        description: 'Admin will review your pricing now.',
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to submit pricing:', error);
      toast.error('Failed to submit pricing', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (isPaid && !price) {
      toast.error('Price is required', {
        description: 'Please enter a price for paid datasets.',
      });
      return;
    }

    setSaving(true);
    try {
      await upsertProposalPricing(datasetId, {
        isPaid,
        price: isPaid ? price : null,
        currency,
      });

      toast.success('Pricing saved', {
        description: 'Your changes are saved as draft.',
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save pricing:', error);
      toast.error('Failed to save pricing', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setSaving(false);
    }
  };

  const isChangesRequested = pricingStatus === 'CHANGES_REQUESTED';
  const isResubmitting = isChangesRequested;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto border backdrop-blur-sm rounded-lg"
        style={{
          background: tokens.isDark ? 'rgba(26, 34, 64, 0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: tokens.borderDefault,
          boxShadow: tokens.glassShadow,
        }}
      >
        <DialogHeader>
          <div className="flex items-start gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: tokens.infoBg }}
            >
              <DollarSign className="w-5 h-5" style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <DialogTitle style={{ color: tokens.textPrimary }}>
                Edit Pricing
              </DialogTitle>
              <DialogDescription style={{ color: tokens.textSecondary }}>
                Update your dataset pricing
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Feedback Message */}
          {feedbackMessage && isChangesRequested && (
            <div
              className="rounded-lg p-4 flex items-start gap-3"
              style={{
                background: tokens.warningBg,
                border: `1px solid ${tokens.warningBorder}`,
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
              <div>
                <p className="text-xs font-medium" style={{ color: tokens.textPrimary }}>
                  Admin Feedback
                </p>
                <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
                  {feedbackMessage}
                </p>
              </div>
            </div>
          )}

          {/* Current Status */}
          {currentPricing && (
            <div
              className="rounded-lg p-3"
              style={{ background: tokens.infoBg }}
            >
              <p className="text-xs" style={{ color: tokens.textMuted }}>Status</p>
              <p className="text-sm font-medium mt-1" style={{ color: tokens.textPrimary }}>
                {pricingStatus === 'DRAFT' && '📝 Draft'}
                {pricingStatus === 'CHANGES_REQUESTED' && '🔄 Changes Requested'}
                {pricingStatus === 'SUBMITTED' && '⏳ Submitted for Review'}
                {pricingStatus === 'ACTIVE' && '✓ Active'}
              </p>
            </div>
          )}

          {/* Paid Toggle */}
          <div className="space-y-3">
            <Label className="flex items-center gap-3 cursor-pointer" style={{ color: tokens.textPrimary }}>
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                disabled={submitting || saving}
                className="w-4 h-4 rounded cursor-pointer"
                style={{
                  background: isPaid ? '#3b82f6' : tokens.inputBg,
                  borderColor: isPaid ? '#3b82f6' : tokens.inputBorder,
                }}
              />
              <span className="font-medium">This dataset is paid</span>
            </Label>

            {isPaid && (
              <div className="space-y-3 pt-2 border-t" style={{ borderColor: tokens.borderDefault }}>
                {/* Price Input */}
                <div className="space-y-2">
                  <Label htmlFor="price" style={{ color: tokens.textPrimary }}>
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: tokens.textMuted }}
                    />
                    <Input
                      id="price"
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="99.99"
                      disabled={submitting || saving}
                      className="pl-10"
                      style={{
                        background: tokens.inputBg,
                        borderColor: tokens.inputBorder,
                        color: tokens.textPrimary,
                      }}
                    />
                  </div>
                </div>

                {/* Currency Select */}
                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>Currency</Label>
                  <StyledSelect
                    value={currency}
                    onValueChange={(value) => setCurrency(value as any)}
                    options={CURRENCY_OPTIONS}
                    placeholder="Select currency"
                    isDark={tokens.isDark}
                    tokens={{
                      inputBg: tokens.inputBg,
                      inputBorder: tokens.inputBorder,
                      textPrimary: tokens.textPrimary,
                      textSecondary: tokens.textSecondary,
                      textMuted: tokens.textMuted,
                      surfaceCard: tokens.glassBg,
                      borderDefault: tokens.borderDefault,
                    }}
                  />
                </div>

                {/* Price Preview */}
                {price && (
                  <div
                    className="rounded-lg p-3"
                    style={{ background: tokens.successBg }}
                  >
                    <p className="text-xs" style={{ color: tokens.textMuted }}>Preview</p>
                    <p className="text-lg font-bold mt-1" style={{ color: tokens.textPrimary }}>
                      {currency === 'USD' && '$'}
                      {currency === 'EUR' && '€'}
                      {currency === 'GBP' && '£'}
                      {currency === 'INR' && '₹'}
                      {price}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isPaid && (
              <div
                className="rounded-lg p-3"
                style={{ background: tokens.successBg }}
              >
                <p className="text-sm font-medium" style={{ color: tokens.successText }}>
                  ✓ Free Dataset
                </p>
                <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
                  No payment required for access
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting || saving}
            className="h-10 font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: tokens.glassBg || 'transparent',
              border: `1.5px solid ${tokens.glassBorder || tokens.borderSubtle}`,
              color: tokens.textPrimary,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={submitting || saving}
            className="h-10 font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: tokens.glassBg || 'transparent',
              border: `1.5px solid ${tokens.glassBorder || tokens.borderSubtle}`,
              color: tokens.textPrimary,
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </Button>
          <Button
            onClick={handleSaveAndSubmit}
            disabled={submitting || saving}
            className="h-10 font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{
              background: submitting || saving
                ? 'rgba(156, 163, 175, 0.2)'
                : tokens.glassBg || 'transparent',
              border: `1.5px solid ${tokens.glassBorder || tokens.borderSubtle}`,
              color: tokens.textPrimary,
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : isResubmitting ? (
              'Resubmit'
            ) : (
              'Submit for Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
