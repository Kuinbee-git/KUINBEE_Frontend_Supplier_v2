/**
 * SourcesDialog Component
 * Dialog for creating/editing sources
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createSource, updateSource } from '@/lib/api/catalog';
import { SOURCE_CONFIG, CATALOG_ERROR_MESSAGES } from '@/constants/catalog.constants';
import type { Source, CreateSourceRequest, UpdateSourceRequest } from '@/types/catalog.types';
import { AlertCircle, Loader2 } from 'lucide-react';

interface SourcesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (source: Source) => void;
  existingSource?: Source | null;
  isDark?: boolean;
  tokens?: any;
}

export function SourcesDialog({
  isOpen,
  onClose,
  onSuccess,
  existingSource = null,
  isDark = false,
  tokens,
}: SourcesDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form if editing
  useEffect(() => {
    if (existingSource) {
      setName(existingSource.name);
      setDescription(existingSource.description || '');
      setWebsiteUrl(existingSource.websiteUrl || '');
    } else {
      resetForm();
    }
  }, [existingSource, isOpen]);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setWebsiteUrl('');
    setError(null);
  }, []);

  const validateForm = useCallback(() => {
    if (!name.trim()) {
      setError('Source name is required');
      return false;
    }

    if (name.trim().length < SOURCE_CONFIG.MIN_NAME_LENGTH) {
      setError(`Source name must be at least ${SOURCE_CONFIG.MIN_NAME_LENGTH} characters`);
      return false;
    }

    if (name.trim().length > SOURCE_CONFIG.MAX_NAME_LENGTH) {
      setError(`Source name must be less than ${SOURCE_CONFIG.MAX_NAME_LENGTH} characters`);
      return false;
    }

    if (description.length > SOURCE_CONFIG.MAX_DESCRIPTION_LENGTH) {
      setError(`Description must be less than ${SOURCE_CONFIG.MAX_DESCRIPTION_LENGTH} characters`);
      return false;
    }

    // Validate URL if provided
    if (websiteUrl && !isValidUrl(websiteUrl)) {
      setError('Please enter a valid website URL');
      return false;
    }

    return true;
  }, [name, description, websiteUrl]);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      let result;

      if (existingSource) {
        // Update existing source
        const updateData: UpdateSourceRequest = {
          name: name.trim(),
          description: description.trim() || null,
          websiteUrl: websiteUrl.trim() || null,
        };
        result = await updateSource(existingSource.id, updateData);
      } else {
        // Create new source
        const createData: CreateSourceRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
        };
        result = await createSource(createData);
      }

      // Extract source from nested response structure
      const sourceObj = result?.data?.source;
      if (sourceObj && sourceObj.id) {
        onSuccess?.(sourceObj);
        resetForm();
        onClose();
      } else {
        console.error('API did not return a valid source object:', result);
        setError('Failed to create source: invalid response from server.');
      }
    } catch (err: any) {
      console.error('Failed to save source:', err);

      // Map error codes to user-friendly messages
      if (err.code === 'SOURCE_NAME_TAKEN') {
        setError(CATALOG_ERROR_MESSAGES.SOURCE_NAME_TAKEN);
      } else {
        setError(err.message || CATALOG_ERROR_MESSAGES.VALIDATION_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }, [name, description, websiteUrl, existingSource, validateForm, resetForm, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const isEditing = !!existingSource;
  const bgColor = tokens?.surfaceCard || (isDark ? 'rgba(26, 34, 64, 0.95)' : 'rgba(255,255,255,0.95)');
  const borderColor = tokens?.borderDefault || (isDark ? 'rgba(255,255,255,0.08)' : '#e6eef8');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="backdrop-blur-sm rounded-lg border shadow-xl p-6 max-w-xl"
        style={{
          background: bgColor,
          borderColor,
          boxShadow: tokens?.shadow || undefined,
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: tokens?.textPrimary }}>
            {isEditing ? 'Edit Source' : 'Create New Source'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Name */}
          <div className="space-y-2">
            <Label style={{ color: tokens?.textPrimary }}>
              Source Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., Financial Systems, Market Data"
              disabled={loading}
              style={{
                background: tokens?.inputBg,
                borderColor: error ? '#ef4444' : tokens?.inputBorder,
                color: tokens?.textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: tokens?.textMuted }}>
              {name.length}/{SOURCE_CONFIG.MAX_NAME_LENGTH} characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label style={{ color: tokens?.textPrimary }}>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              placeholder="Describe this data source (optional)"
              disabled={loading}
              className="resize-none"
              rows={3}
              style={{
                background: tokens?.inputBg,
                borderColor: tokens?.inputBorder,
                color: tokens?.textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: tokens?.textMuted }}>
              {description.length}/{SOURCE_CONFIG.MAX_DESCRIPTION_LENGTH} characters
            </p>
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label style={{ color: tokens?.textPrimary }}>Website URL</Label>
            <Input
              value={websiteUrl}
              onChange={(e) => {
                setWebsiteUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://example.com (optional)"
              type="url"
              disabled={loading}
              style={{
                background: tokens?.inputBg,
                borderColor: error ? '#ef4444' : tokens?.inputBorder,
                color: tokens?.textPrimary,
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg"
              style={{ background: tokens?.dangerBg || (isDark ? 'rgba(254, 202, 202, 0.06)' : '#fff5f5') }}
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm" style={{ color: tokens?.dangerText || (isDark ? '#fecaca' : '#c53030') }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              style={{
                borderColor: tokens?.inputBorder,
                color: tokens?.textPrimary,
                background: tokens?.buttonBg || 'transparent',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: tokens?.primary || (isDark ? '#0f172a' : '#1f2937'),
                color: tokens?.buttonText || '#ffffff',
                borderColor: tokens?.primary || undefined,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Source' : 'Create Source'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
