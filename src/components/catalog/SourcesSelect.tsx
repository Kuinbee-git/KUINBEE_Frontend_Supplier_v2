/**
 * SourcesSelect Component
 * Dropdown for selecting a source with option to create new
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled || loading || !!fetchError}
        >
          <SelectTrigger
              className="h-10 w-full rounded-lg transition-all duration-300"
              style={{
                background: tokens?.inputBg || (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.9)'),
                borderColor: displayError ? '#ef4444' : tokens?.inputBorder || (isDark ? 'rgba(255, 255, 255, 0.12)' : '#dde3f0'),
                color: tokens?.textPrimary || (isDark ? '#ffffff' : '#1a2240'),
                border: displayError ? '1px solid #ef4444' : `1px solid ${tokens?.inputBorder || (isDark ? 'rgba(255, 255, 255, 0.12)' : '#dde3f0')}`,
              }}
            >
            <SelectValue placeholder={loading ? 'Loading sources...' : 'Select a source'} />
          </SelectTrigger>
            <SelectContent
              className="rounded-lg shadow-lg overflow-hidden"
              style={{
                background: tokens?.surfaceCard || (isDark ? 'rgba(26, 34, 64, 0.98)' : 'rgba(255, 255, 255, 0.98)'),
                border: `1px solid ${tokens?.borderDefault || (isDark ? 'rgba(255, 255, 255, 0.12)' : '#dde3f0')}`,
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="py-1">
                {sources.length === 0 && !loading && !fetchError && (
                  <div className="px-4 py-2.5 text-sm" style={{ color: tokens?.textMuted }}>
                    No sources available
                  </div>
                )}
                {sources.length > 0 && sources.map((source) => (
                  <SelectItem 
                    key={source.id} 
                    value={source.id}
                    className="cursor-pointer px-4 py-2.5 transition-colors duration-200"
                    style={{
                      color: tokens?.textPrimary || (isDark ? '#ffffff' : '#1a2240'),
                      background: 'transparent',
                      borderRadius: '0.5rem',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = tokens?.navItemHover || (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 34, 64, 0.06)');
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {source.name}
                  </SelectItem>
                ))}
                {loading && (
                  <div className="px-4 py-2.5 text-sm" style={{ color: tokens?.textMuted }}>
                    Loading...
                  </div>
                )}
              </div>
            </SelectContent>
        </Select>

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
