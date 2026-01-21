/**
 * SourcesSelect Component
 * Dropdown for selecting a source with option to create new
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { StyledSelect } from '@/components/datasets/shared';
import { Button } from '@/components/ui/button';
import { listMySources } from '@/lib/api/catalog';
import { SourcesDialog } from './SourcesDialog';
import type { Source } from '@/types/catalog.types';
import { AlertCircle, Loader2, Plus } from 'lucide-react';

interface SourcesSelectProps {
  value: string;
  onValueChange: (sourceId: string) => void;
  onSourceCreated?: (source: Source) => void;
  disabled?: boolean;
  error?: string | null;
  tokens?: any;
  allowCreate?: boolean;
  isDark?: boolean;
}

export function SourcesSelect({
  value,
  onValueChange,
  onSourceCreated,
  disabled = false,
  error = null,
  tokens,
  allowCreate = true,
  isDark = false,
}: SourcesSelectProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await listMySources({ pageSize: 100 });
      console.log('Sources fetched:', response.items);
      setSources(response.items || []);
    } catch (err: any) {
      console.error('Failed to fetch sources:', err);
      setFetchError(err.message || 'Failed to load sources');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleSourceCreated = useCallback((source: Source) => {
    setSources((prev) => [source, ...prev]);
    onValueChange(source.id);
    onSourceCreated?.(source);
  }, [onValueChange, onSourceCreated]);

  const displayError = error || fetchError;
  const hasNoSources = sources.length === 0 && !loading;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium" style={{ color: tokens?.textPrimary }}>
          Source <span className="text-red-500">*</span>
        </label>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>

      {/* Show dropdown */}
      <>
        <StyledSelect
          value={value}
          onValueChange={onValueChange}
          options={sources.map(source => ({ label: source.name, value: source.id }))}
          placeholder={loading ? 'Loading sources...' : 'Select a source'}
          isDark={isDark}
          tokens={tokens}
        />

        {/* Create New Button */}
        {allowCreate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="w-full justify-center gap-2 h-10 rounded-lg transition-all duration-300"
            style={{
              background: tokens?.inputBg || (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)'),
              border: `1px solid ${tokens?.inputBorder || (isDark ? 'rgba(255, 255, 255, 0.1)' : '#dde3f0')}`,
              color: tokens?.textPrimary || (isDark ? '#ffffff' : '#1a2240'),
            }}
          >
            <Plus className="w-4 h-4" />
            {sources.length === 0 ? 'Create First Source' : 'Create New Source'}
          </Button>
        )}
      </>

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Sources Dialog */}
      <SourcesDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSourceCreated}
        isDark={tokens?.isDark}
        tokens={tokens}
      />
    </div>
  );
}
