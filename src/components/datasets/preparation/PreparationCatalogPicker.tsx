"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import {
  listPreparationOptions,
  preparationApi,
  type PreparationCatalogOption,
} from "@/lib/api/dataset-preparations";
import { SourcesDialog } from "@/components/catalog/SourcesDialog";
import { DashboardButton, DashboardInput } from "@/components/dashboard";
import { preparationControl } from "./PreparationFields";

export function PreparationCatalogPicker({
  field,
  kind,
  value,
  onChange,
  disabled = false,
  label: suppliedLabel,
  help,
  excludedValues = [],
}: {
  field?: string;
  kind: "categories" | "sources";
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  label?: string;
  help?: string;
  excludedValues?: readonly string[];
}) {
  const id = useId();
  const label =
    suppliedLabel ??
    (kind === "categories" ? "Primary category" : "Data source");
  const [items, setItems] = useState<PreparationCatalogOption[]>([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceDialog, setSourceDialog] = useState(false);
  const [resolved, setResolved] = useState<{
    id: string;
    name: string | null;
    error?: string;
  } | null>(null);
  const known = useRef(new Map<string, PreparationCatalogOption>());
  const [knownOptions, setKnownOptions] = useState<
    Record<string, PreparationCatalogOption>
  >({});
  const ticket = useRef(0);
  const labelTicket = useRef(0);
  const load = useCallback(async () => {
    const current = ++ticket.current;
    setLoading(true);
    setError("");
    try {
      const data = await listPreparationOptions(kind, page, query);
      if (current !== ticket.current) return;
      data.items.forEach((item) => known.current.set(item.id, item));
      setKnownOptions((previous) => ({
        ...previous,
        ...Object.fromEntries(data.items.map((item) => [item.id, item])),
      }));
      setItems((previous) =>
        page === 1
          ? data.items
          : [
              ...new Map(
                [...previous, ...data.items].map((item) => [item.id, item])
              ).values(),
            ]
      );
      setTotal(data.total);
    } catch (failure) {
      if (current === ticket.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Options could not be loaded."
        );
    } finally {
      if (current === ticket.current) setLoading(false);
    }
  }, [kind, page, query]);
  useComponentRequest(load, [kind, page, query]);
  const loadSelected = useCallback(async () => {
    if (!value) return;
    if (known.current.has(value)) return;
    const current = ++labelTicket.current;
    try {
      const result = await preparationApi.labels(
        kind === "categories"
          ? { primaryCategoryId: value }
          : { sourceId: value }
      );
      if (current !== labelTicket.current) return;
      const option =
        kind === "categories" ? result.primaryCategory : result.source;
      if (option) {
        known.current.set(option.id, option);
        setKnownOptions((previous) => ({ ...previous, [option.id]: option }));
      }
      setResolved({ id: value, name: option?.name ?? null });
    } catch {
      if (current === labelTicket.current)
        setResolved({
          id: value,
          name: null,
          error:
            "The selected label could not be refreshed. Its selection is retained.",
        });
    }
  }, [kind, value]);
  useComponentRequest(
    loadSelected,
    ["selected-label", kind, value],
    Boolean(value)
  );
  const selected = value ? knownOptions[value] : undefined;
  const selectedOutsideResults =
    value && !items.some((item) => item.id === value);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <p id={`${id}-help`} className="text-xs text-muted-foreground">
        {help ??
          (kind === "categories"
            ? "Choose the subject of the collection. Data type is selected separately."
            : "Select your owned source. Changing the search preserves your saved selection.")}
      </p>
      <select
        id={id}
        data-dataset-field={field}
        className={preparationControl}
        value={value ?? ""}
        disabled={disabled}
        aria-describedby={`${id}-help`}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Choose later</option>
        {selectedOutsideResults && (
          <option value={value}>
            {selected?.name ??
              (resolved && resolved.id === value
                ? resolved.error
                  ? "Selected label could not be loaded (selection retained)"
                  : (resolved.name ??
                    `Selected ${kind === "categories" ? "category" : "source"} no longer available`)
                : `Loading selected ${kind === "categories" ? "category" : "source"}…`)}
          </option>
        )}
        {items
          .filter((item) => !excludedValues.includes(item.id))
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <DashboardInput
          className="min-w-0 flex-1"
          aria-label={`Search ${kind}`}
          value={search}
          disabled={disabled}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              setPage(1);
              setQuery(search.trim());
            }
          }}
        />
        <DashboardButton
          variant="outline"
          type="button"
          disabled={disabled || loading}
          onClick={() => {
            setPage(1);
            setQuery(search.trim());
          }}
        >
          Search {kind}
        </DashboardButton>
      </div>
      {loading && (
        <p role="status" className="text-xs">
          Loading {kind}…
        </p>
      )}
      {error && (
        <div role="alert" className="text-sm text-destructive">
          {error}{" "}
          <DashboardButton
            variant="link"
            size="compact"
            type="button"
            className="h-auto p-0"
            onClick={load}
          >
            Retry {kind}
          </DashboardButton>
        </div>
      )}
      {resolved && resolved.id === value && resolved.error && (
        <p role="status" className="text-xs">
          {resolved.error}{" "}
          <DashboardButton
            variant="link"
            size="compact"
            type="button"
            className="h-auto p-0"
            onClick={loadSelected}
          >
            Retry selected label
          </DashboardButton>
        </p>
      )}
      {!loading && !error && (
        <p className="text-xs text-muted-foreground">
          {items.length} of {total} matching {kind} loaded.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {items.length < total && (
          <DashboardButton
            variant="outline"
            type="button"
            disabled={loading || disabled}
            onClick={() => setPage((previous) => previous + 1)}
          >
            Load more {kind}
          </DashboardButton>
        )}
        {kind === "sources" && (
          <>
            <DashboardButton
              variant="outline"
              type="button"
              disabled={disabled}
              onClick={() => setSourceDialog(true)}
            >
              Create a source
            </DashboardButton>
            <SourcesDialog
              isOpen={sourceDialog}
              onClose={() => setSourceDialog(false)}
              onSuccess={(source) => {
                known.current.set(source.id, source);
                setKnownOptions((previous) => ({
                  ...previous,
                  [source.id]: source,
                }));
                setItems((previous) => [
                  source,
                  ...previous.filter((item) => item.id !== source.id),
                ]);
                onChange(source.id);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
