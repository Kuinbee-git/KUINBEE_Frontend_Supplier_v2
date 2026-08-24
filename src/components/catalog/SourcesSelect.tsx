/**
 * SourcesSelect Component
 * Dropdown for selecting a source with option to create new
 */

"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { DashboardButton, DashboardInlineAlert } from "@/components/dashboard";
import { DatasetSelect } from "@/components/datasets/shared/DatasetSelect";
import { listMySources } from "@/lib/api/catalog";
import { SourcesDialog } from "./SourcesDialog";
import type { Source } from "@/types/catalog.types";
import { Loader2, Plus } from "lucide-react";

interface SourcesSelectProps {
  value: string;
  onValueChange: (sourceId: string) => void;
  onSourceCreated?: (source: Source) => void;
  disabled?: boolean;
  error?: string | null;
  triggerId?: string;
  tokens?: unknown;
  allowCreate?: boolean;
  isDark?: boolean;
}

export function SourcesSelect({
  value,
  onValueChange,
  onSourceCreated,
  disabled = false,
  error = null,
  triggerId,
  allowCreate = true,
}: SourcesSelectProps) {
  const generatedTriggerId = useId();
  const resolvedTriggerId = triggerId ?? generatedTriggerId;
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await listMySources({ pageSize: 100 });
      setSources(response.items || []);
    } catch (err: unknown) {
      console.error("Failed to fetch sources:", err);
      setFetchError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to load sources"
      );
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleSourceCreated = useCallback(
    (source: Source) => {
      setSources((prev) => [source, ...prev]);
      onValueChange(source.id);
      onSourceCreated?.(source);
    },
    [onValueChange, onSourceCreated]
  );

  const displayError = error || fetchError;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          htmlFor={resolvedTriggerId}
          className="text-sm font-medium text-foreground"
        >
          Source
          <span
            className="ml-1 text-[var(--dashboard-danger-foreground)]"
            aria-hidden="true"
          >
            *
          </span>
          <span className="sr-only"> (required)</span>
        </label>
        {loading && (
          <span role="status" className="inline-flex items-center">
            <Loader2
              className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span className="sr-only">Loading sources</span>
          </span>
        )}
      </div>

      <DatasetSelect
        value={value}
        onValueChange={onValueChange}
        triggerId={resolvedTriggerId}
        options={sources.map((source) => ({
          label: source.name,
          value: source.id,
        }))}
        placeholder={loading ? "Loading sources..." : "Select a source"}
        ariaLabel="Dataset source"
        disabled={disabled || loading}
      />

      {allowCreate && (
        <DashboardButton
          size="compact"
          variant="outline"
          onClick={() => setDialogOpen(true)}
          disabled={disabled}
          className="w-full"
        >
          <Plus aria-hidden="true" />
          {sources.length === 0 ? "Create first source" : "Create new source"}
        </DashboardButton>
      )}

      {displayError && (
        <DashboardInlineAlert
          tone="danger"
          title="Sources unavailable"
          message={displayError}
          className="py-2.5"
        />
      )}

      {/* Sources Dialog */}
      <SourcesDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSourceCreated}
      />
    </div>
  );
}
