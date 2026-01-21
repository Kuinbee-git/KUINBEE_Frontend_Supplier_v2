'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, AlertCircle } from 'lucide-react';
import { requestPricingChange } from '@/lib/api/datasets';
import { toast } from 'sonner';
import type { Currency } from '@/types/dataset-proposal.types';

interface PricingChangeRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetTitle: string;
  currentIsPaid: boolean;
  currentPrice?: string | null;
  currentCurrency?: Currency;
  onSuccess: () => void;
  isDark?: boolean;
}

export function PricingChangeRequestDialog({
  isOpen,
  onClose,
  datasetId,
  datasetTitle,
  currentIsPaid,
  currentPrice,
  currentCurrency = 'USD',
  onSuccess,
  isDark = false,
}: PricingChangeRequestDialogProps) {
  const [requestedIsPaid, setRequestedIsPaid] = useState(currentIsPaid);
  const [requestedPrice, setRequestedPrice] = useState(currentPrice || '');
  const [requestedCurrency, setRequestedCurrency] = useState<Currency>(currentCurrency);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Reason is required', {
        description: 'Please provide a reason for this pricing change.',
      });
      return;
    }

    if (requestedIsPaid && !requestedPrice) {
      toast.error('Price is required', {
        description: 'Please enter the requested price.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await requestPricingChange(datasetId, {
        requestedIsPaid,
        requestedPrice: requestedIsPaid ? requestedPrice : null,
        requestedCurrency: requestedIsPaid ? requestedCurrency : undefined,
        reason: reason.trim(),
      });
      
      toast.success('Pricing change request submitted', {
        description: 'Support team will review your request and contact you soon.',
      });
      
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to submit pricing change request:', error);
      toast.error('Failed to submit request', {
        description: error.message || 'Please try again later.',
        duration: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
              }}
            >
              <DollarSign className="w-5 h-5" style={{ color: '#3b82f6' }} />
            </div>
            <DialogTitle>Request Pricing Change</DialogTitle>
          </div>
          <DialogDescription>
            Submit a request to change your dataset pricing. The support team will review and process your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Important Notice */}
          <div
            className="rounded-lg p-3 flex items-start gap-2"
            style={{
              background: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#eab308' }} />
            <p className="text-xs" style={{ color: isDark ? '#fde047' : '#ca8a04' }}>
              Pricing changes require approval and cannot be applied immediately. Support will contact you via email.
            </p>
          </div>

          {/* Current Pricing */}
          <div
            className="rounded-lg p-3"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(26, 34, 64, 0.05)',
            }}
          >
            <Label className="text-xs opacity-70">Current Pricing</Label>
            <p className="text-sm font-medium mt-1">
              {currentIsPaid ? `${currentPrice} ${currentCurrency}` : 'Free'}
            </p>
          </div>

          {/* Requested Pricing Type */}
          <div>
            <Label className="mb-2 block">Pricing Type</Label>
            <Select
              value={requestedIsPaid ? 'paid' : 'free'}
              onValueChange={(value) => setRequestedIsPaid(value === 'paid')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price & Currency (if paid) */}
          {requestedIsPaid && (
            <>
              <div>
                <Label htmlFor="price" className="mb-2 block">Price</Label>
                <Input
                  id="price"
                  type="text"
                  placeholder="99.99"
                  value={requestedPrice}
                  onChange={(e) => setRequestedPrice(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-2 block">Currency</Label>
                <Select
                  value={requestedCurrency}
                  onValueChange={(value) => setRequestedCurrency(value as Currency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason" className="mb-2 block">
              Reason for Change <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why you need to change the pricing..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs opacity-70 mt-1">
              Be specific about your business needs and market conditions.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
