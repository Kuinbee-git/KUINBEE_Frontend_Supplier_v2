"use client";
import { useId, useCallback, useEffect, useState } from "react";
import { type CatalogueEntryPatchBody } from "@kuinbee/dataset-preparation-contracts";
import {
  type CatalogueApi,
  type CatalogueEntry,
  catalogueError,
} from "@/lib/catalogue-imports";

export function CatalogueEntryPanel({
  api,
  draftId,
  generation,
  disabled = false,
  onSaved,
}: {
  api: CatalogueApi;
  draftId: string;
  generation: number;
  disabled?: boolean;
  onSaved?: () => Promise<void>;
}) {
  const fieldId = useId();
  const [entry, setEntry] = useState<CatalogueEntry | null>(null);
  const [identifier, setIdentifier] = useState(""),
    [state, setState] = useState<"UNCONFIRMED" | "DECLARED">("UNCONFIRMED");
  const [formats, setFormats] = useState(""),
    [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [pending, setPending] = useState<CatalogueEntryPatchBody | null>(null);
  const load = useCallback(async () => {
    setError("");
    try {
      const saved = await api.entry(draftId);
      if (!saved) {
        setEntry(null);
        setLoaded(true);
        return;
      }
      setEntry(saved);
      setIdentifier(saved.catalogueIdentifier);
      setState(saved.declaredFormats.state);
      setFormats(saved.declaredFormats.values?.join("\n") ?? "");
      setNotes(saved.declaredFormats.notes ?? "");
      setLoaded(true);
    } catch (e) {
      const status =
        e && typeof e === "object"
          ? "status" in e
            ? e.status
            : "statusCode" in e
              ? e.statusCode
              : null
          : null;
      if (status === 404) {
        setLoaded(true);
        setEntry(null);
      } else setError(catalogueError(e));
    }
  }, [api, draftId]);
  useEffect(() => {
    let active = true;
    void api
      .entry(draftId)
      .then((saved) => {
        if (!active) return;
        if (!saved) {
          setEntry(null);
          setLoaded(true);
          return;
        }
        setEntry(saved);
        setIdentifier(saved.catalogueIdentifier);
        setState(saved.declaredFormats.state);
        setFormats(saved.declaredFormats.values?.join("\n") ?? "");
        setNotes(saved.declaredFormats.notes ?? "");
        setLoaded(true);
      })
      .catch((e) => {
        if (!active) return;
        const status =
          e && typeof e === "object"
            ? "status" in e
              ? e.status
              : "statusCode" in e
                ? e.statusCode
                : null
            : null;
        if (status === 404) {
          setLoaded(true);
          setEntry(null);
        } else setError(catalogueError(e));
      });
    return () => {
      active = false;
    };
  }, [api, draftId]);
  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    const body = pending ?? {
      requestId: crypto.randomUUID(),
      expectedRevision: entry?.revision ?? null,
      expectedGeneration: generation,
      catalogueIdentifier: identifier,
      declaredFormats: {
        state,
        ...(state === "DECLARED"
          ? {
              values: formats
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean),
            }
          : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
    };
    setPending(body);
    try {
      const result = await api.saveEntry(draftId, body);
      setEntry(result);
      setPending(null);
      setNotice("Private catalogue details saved.");
      await onSaved?.();
    } catch (e) {
      setError(catalogueError(e));
      const status =
        e && typeof e === "object"
          ? "status" in e
            ? e.status
            : "statusCode" in e
              ? e.statusCode
              : null
          : null;
      if (typeof status === "number" && status >= 400 && status < 500)
        setPending(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="min-w-0 space-y-4 border-y border-border bg-muted/20 p-5 sm:p-6"
      aria-label="Private catalogue details"
    >
      <div>
        <h2 className="font-semibold">Private catalogue details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your collection identifier to match future imports. These details
          stay private. Reported formats are declarations; uploaded-file checks
          are separate.
        </p>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-sm" role="status">
          {notice}
        </p>
      )}
      {!loaded ? (
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => void load()}
        >
          Load catalogue details
        </button>
      ) : (
        <fieldset
          disabled={disabled || busy || Boolean(pending)}
          className="grid min-w-0 gap-4 sm:grid-cols-2"
        >
          <legend className="sr-only">Private catalogue fields</legend>
          <label
            htmlFor={`${fieldId}-control-1`}
            className="grid gap-2 text-sm font-medium"
          >
            Catalogue identifier
            <input
              id={`${fieldId}-control-1`}
              className="w-full rounded-md border bg-background px-3 py-2"
              maxLength={200}
              disabled={Boolean(entry)}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </label>
          <label
            htmlFor={`${fieldId}-control-2`}
            className="grid gap-2 text-sm font-medium"
          >
            File-format metadata
            <select
              id={`${fieldId}-control-2`}
              className="rounded-md border bg-background px-3 py-2"
              value={state}
              onChange={(e) => setState(e.target.value as typeof state)}
            >
              <option value="UNCONFIRMED">Unconfirmed</option>
              <option value="DECLARED">Supplier-declared formats</option>
            </select>
          </label>
          {state === "DECLARED" && (
            <label
              htmlFor={`${fieldId}-control-3`}
              className="grid gap-2 text-sm font-medium"
            >
              Documented formats, one per line
              <textarea
                id={`${fieldId}-control-3`}
                className="rounded-md border bg-background px-3 py-2"
                rows={3}
                value={formats}
                onChange={(e) => setFormats(e.target.value)}
              />
            </label>
          )}
          <label
            htmlFor={`${fieldId}-control-4`}
            className="grid gap-2 text-sm font-medium"
          >
            Format notes (optional)
            <textarea
              id={`${fieldId}-control-4`}
              className="rounded-md border bg-background px-3 py-2"
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </fieldset>
      )}
      {loaded && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            disabled={
              disabled ||
              busy ||
              !identifier.trim() ||
              (state === "DECLARED" && !formats.trim())
            }
            onClick={() => void save()}
          >
            {busy
              ? "Saving…"
              : pending
                ? "Retry catalogue save"
                : "Save private catalogue details"}
          </button>
          {disabled && (
            <p className="text-xs text-muted-foreground">
              Save pending draft changes first. Catalogue details are editable
              only for initial private drafts.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
