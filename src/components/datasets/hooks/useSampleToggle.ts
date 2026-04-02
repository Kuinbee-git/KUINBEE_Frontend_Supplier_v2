'use client';

import { useState } from 'react';
import { updateProposalMetadata } from '@/lib/api/dataset-proposals';
import { toast } from 'sonner';
import type {
  ProposalDetailsResponse,
  Currency,
  SampleDeliveryMechanism,
} from '@/types/dataset-proposal.types';

interface UseSampleToggleOptions {
  proposal: ProposalDetailsResponse;
  isEditable: boolean;
  onRefresh?: () => void;
}

export function useSampleToggle({ proposal, isEditable, onRefresh }: UseSampleToggleOptions) {
  const [sampleConfirmOpen, setSampleConfirmOpen] = useState(false);
  const [sampleToggleSubmitting, setSampleToggleSubmitting] = useState(false);
  const [pendingSampleValue, setPendingSampleValue] = useState<boolean | null>(null);
  const [sampleToggleError, setSampleToggleError] = useState<string | null>(null);
  const [sampleWhy, setSampleWhy] = useState('');
  const [sampleSize, setSampleSize] = useState('');
  const [sampleCompleteness, setSampleCompleteness] = useState('');
  const [sampleDelivery, setSampleDelivery] = useState<SampleDeliveryMechanism>('API');
  const [sampleDeliveryNotes, setSampleDeliveryNotes] = useState('');
  const [sampleActualPrice, setSampleActualPrice] = useState('');
  const [sampleActualPriceCurrency, setSampleActualPriceCurrency] = useState<Currency>('USD');
  const [sampleNegotiable, setSampleNegotiable] = useState<'yes' | 'no'>('no');

  const isValidSamplePrice = (value: string) => {
    if (!value.trim()) return false;
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 0;
  };

  const resetSampleDialogFields = () => {
    setSampleWhy('');
    setSampleSize('');
    setSampleCompleteness('');
    setSampleDelivery('API');
    setSampleDeliveryNotes('');
    setSampleActualPrice('');
    setSampleActualPriceCurrency((proposal.dataset.actualPriceCurrency as Currency | undefined) ?? 'USD');
    setSampleNegotiable('no');
    setSampleToggleError(null);
  };

  const handleOpenSampleToggle = (nextValue: boolean) => {
    if (!isEditable) return;

    setPendingSampleValue(nextValue);
    setSampleToggleError(null);

    if (nextValue) {
      setSampleWhy(proposal.dataset.sampleNotes?.whySample ?? '');
      setSampleSize(proposal.dataset.sampleNotes?.actualDataSize ?? '');
      setSampleCompleteness(proposal.dataset.sampleNotes?.completeness ?? '');
      setSampleDelivery((proposal.dataset.sampleNotes?.deliveryMechanism as SampleDeliveryMechanism | undefined) ?? 'API');
      setSampleDeliveryNotes(proposal.dataset.sampleNotes?.deliveryMechanismNotes ?? '');
      setSampleActualPrice(proposal.dataset.actualPrice != null ? String(proposal.dataset.actualPrice) : '');
      setSampleActualPriceCurrency((proposal.dataset.actualPriceCurrency as Currency | undefined) ?? 'USD');
      setSampleNegotiable(proposal.dataset.isNegotiable === true ? 'yes' : 'no');
    } else {
      resetSampleDialogFields();
    }

    setSampleConfirmOpen(true);
  };

  const handleConfirmSampleToggle = async () => {
    if (pendingSampleValue === null) return;

    if (pendingSampleValue) {
      if (!sampleWhy.trim()) {
        setSampleToggleError('Why sample is required');
        return;
      }
      if (!sampleSize.trim()) {
        setSampleToggleError('Actual dataset size is required');
        return;
      }
      if (!isValidSamplePrice(sampleActualPrice)) {
        setSampleToggleError('Actual full price must be a valid non-negative integer');
        return;
      }
      if (sampleDelivery === 'OTHER' && !sampleDeliveryNotes.trim()) {
        setSampleToggleError('Delivery mechanism notes are required for OTHER');
        return;
      }
    }

    setSampleToggleSubmitting(true);
    setSampleToggleError(null);

    try {
      if (pendingSampleValue) {
        await updateProposalMetadata(proposal.dataset.id, {
          isSample: true,
          sampleNotes: {
            whySample: sampleWhy.trim(),
            actualDataSize: sampleSize.trim(),
            ...(sampleCompleteness.trim() ? { completeness: sampleCompleteness.trim() } : {}),
            deliveryMechanism: sampleDelivery,
            ...(sampleDelivery === 'OTHER' && sampleDeliveryNotes.trim()
              ? { deliveryMechanismNotes: sampleDeliveryNotes.trim() }
              : {}),
          },
          actualPrice: Number.parseInt(sampleActualPrice, 10),
          actualPriceCurrency: sampleActualPriceCurrency,
          isNegotiable: sampleNegotiable === 'yes',
        });
      } else {
        await updateProposalMetadata(proposal.dataset.id, { isSample: false });
      }

      toast.success(
        pendingSampleValue
          ? 'Sample mode enabled for this proposal'
          : 'Sample mode disabled for this proposal'
      );

      setSampleConfirmOpen(false);
      setPendingSampleValue(null);
      resetSampleDialogFields();
      onRefresh?.();
    } catch (error: any) {
      const message = error?.message || 'Failed to update sample mode';
      setSampleToggleError(message);
      toast.error('Failed to update sample mode', { description: message });
    } finally {
      setSampleToggleSubmitting(false);
    }
  };

  const handleCancelSampleToggle = () => {
    setSampleConfirmOpen(false);
    setPendingSampleValue(null);
    setSampleToggleError(null);
  };

  return {
    // Modal state
    sampleConfirmOpen,
    sampleToggleSubmitting,
    pendingSampleValue,
    sampleToggleError,

    // Form fields
    sampleWhy,
    setSampleWhy,
    sampleSize,
    setSampleSize,
    sampleCompleteness,
    setSampleCompleteness,
    sampleDelivery,
    setSampleDelivery,
    sampleDeliveryNotes,
    setSampleDeliveryNotes,
    sampleActualPrice,
    setSampleActualPrice,
    sampleActualPriceCurrency,
    setSampleActualPriceCurrency,
    sampleNegotiable,
    setSampleNegotiable,

    // Handlers
    handleOpenSampleToggle,
    handleConfirmSampleToggle,
    handleCancelSampleToggle,
  };
}
