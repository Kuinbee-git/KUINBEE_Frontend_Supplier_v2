/**
 * SourcesDialog Component
 * Dialog for creating/editing sources
 */

"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import {
  DashboardButton,
  DashboardDialog,
  DashboardDialogContent,
  DashboardField,
  DashboardInlineAlert,
  DashboardInput,
  DashboardTextarea,
} from "@/components/dashboard";
import { createSource, updateSource } from "@/lib/api/catalog";
import {
  SOURCE_CONFIG,
  CATALOG_ERROR_MESSAGES,
} from "@/constants/catalog.constants";
import type {
  Source,
  CreateSourceRequest,
  UpdateSourceRequest,
} from "@/types/catalog.types";
import { Loader2 } from "lucide-react";

interface SourcesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (source: Source) => void;
  existingSource?: Source | null;
  isDark?: boolean;
  tokens?: unknown;
}

interface SourceFieldErrors {
  name?: string;
  description?: string;
  websiteUrl?: string;
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function readCatalogError(error: unknown): {
  code?: string;
  message?: string;
} {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  const errorRecord = error as Record<string, unknown>;
  return {
    code: typeof errorRecord.code === "string" ? errorRecord.code : undefined,
    message:
      error instanceof Error && error.message
        ? error.message
        : typeof errorRecord.message === "string"
          ? errorRecord.message
          : undefined,
  };
}

export function SourcesDialog({
  isOpen,
  onClose,
  onSuccess,
  existingSource = null,
}: SourcesDialogProps) {
  const generatedId = useId().replaceAll(":", "");
  const formId = `source-form-${generatedId}`;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SourceFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setWebsiteUrl("");
    setFieldErrors({});
    setFormError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (existingSource) {
      setName(existingSource.name);
      setDescription(existingSource.description || "");
      setWebsiteUrl(existingSource.websiteUrl || "");
      setFieldErrors({});
      setFormError(null);
      return;
    }

    resetForm();
  }, [existingSource, isOpen, resetForm]);

  const validateForm = useCallback(() => {
    const nextErrors: SourceFieldErrors = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      nextErrors.name = "Source name is required";
    } else if (trimmedName.length < SOURCE_CONFIG.MIN_NAME_LENGTH) {
      nextErrors.name = `Source name must be at least ${SOURCE_CONFIG.MIN_NAME_LENGTH} characters`;
    } else if (trimmedName.length > SOURCE_CONFIG.MAX_NAME_LENGTH) {
      nextErrors.name = `Source name must be less than ${SOURCE_CONFIG.MAX_NAME_LENGTH} characters`;
    }

    if (description.length > SOURCE_CONFIG.MAX_DESCRIPTION_LENGTH) {
      nextErrors.description = `Description must be less than ${SOURCE_CONFIG.MAX_DESCRIPTION_LENGTH} characters`;
    }

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      nextErrors.websiteUrl = "Please enter a valid website URL";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [description, name, websiteUrl]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);

      if (!validateForm()) return;

      try {
        setSaving(true);

        const result = existingSource
          ? await updateSource(existingSource.id, {
              name: name.trim(),
              description: description.trim() || null,
              websiteUrl: websiteUrl.trim() || null,
            } satisfies UpdateSourceRequest)
          : await createSource({
              name: name.trim(),
              description: description.trim() || undefined,
              websiteUrl: websiteUrl.trim() || undefined,
            } satisfies CreateSourceRequest);

        const source = result?.data?.source;
        if (!source?.id) {
          console.error("API did not return a valid source object:", result);
          setFormError(
            "The source could not be saved because the response was invalid."
          );
          return;
        }

        onSuccess?.(source);
        resetForm();
        onClose();
      } catch (error: unknown) {
        console.error("Failed to save source:", error);
        const catalogError = readCatalogError(error);

        if (catalogError.code === "SOURCE_NAME_TAKEN") {
          setFieldErrors((current) => ({
            ...current,
            name: CATALOG_ERROR_MESSAGES.SOURCE_NAME_TAKEN,
          }));
        } else {
          setFormError(
            catalogError.message || CATALOG_ERROR_MESSAGES.VALIDATION_ERROR
          );
        }
      } finally {
        setSaving(false);
      }
    },
    [
      description,
      existingSource,
      name,
      onClose,
      onSuccess,
      resetForm,
      validateForm,
      websiteUrl,
    ]
  );

  const handleClose = useCallback(() => {
    if (saving) return;
    resetForm();
    onClose();
  }, [onClose, resetForm, saving]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleClose();
    },
    [handleClose]
  );

  const isEditing = Boolean(existingSource);

  return (
    <DashboardDialog open={isOpen} onOpenChange={handleOpenChange}>
      <DashboardDialogContent
        size="md"
        title={isEditing ? "Edit source" : "Create new source"}
        description={
          isEditing
            ? "Update the source details used by your dataset proposals."
            : "Add a reusable data source for this dataset proposal."
        }
        showCloseButton={!saving}
        onEscapeKeyDown={(event) => {
          if (saving) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (saving) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (saving) event.preventDefault();
        }}
        footer={
          <>
            <DashboardButton
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </DashboardButton>
            <DashboardButton type="submit" form={formId} disabled={saving}>
              {saving ? (
                <>
                  <Loader2
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update source"
              ) : (
                "Create source"
              )}
            </DashboardButton>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <DashboardField
            id={`${formId}-name`}
            label="Source name"
            required
            error={fieldErrors.name}
            description={`${name.length}/${SOURCE_CONFIG.MAX_NAME_LENGTH} characters`}
          >
            {(controlProps) => (
              <DashboardInput
                {...controlProps}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    name: undefined,
                  }));
                  setFormError(null);
                }}
                placeholder="e.g., Financial Systems, Market Data"
                disabled={saving}
                autoComplete="organization"
              />
            )}
          </DashboardField>

          <DashboardField
            id={`${formId}-description`}
            label="Description"
            error={fieldErrors.description}
            description={`${description.length}/${SOURCE_CONFIG.MAX_DESCRIPTION_LENGTH} characters`}
          >
            {(controlProps) => (
              <DashboardTextarea
                {...controlProps}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    description: undefined,
                  }));
                  setFormError(null);
                }}
                placeholder="Describe this data source (optional)"
                disabled={saving}
                className="resize-none"
                rows={3}
              />
            )}
          </DashboardField>

          <DashboardField
            id={`${formId}-website-url`}
            label="Website URL"
            error={fieldErrors.websiteUrl}
            description="Optional. Include the full URL, such as https://example.com."
          >
            {(controlProps) => (
              <DashboardInput
                {...controlProps}
                value={websiteUrl}
                onChange={(event) => {
                  setWebsiteUrl(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    websiteUrl: undefined,
                  }));
                  setFormError(null);
                }}
                placeholder="https://example.com"
                type="url"
                disabled={saving}
                autoComplete="url"
              />
            )}
          </DashboardField>

          {formError && (
            <DashboardInlineAlert
              tone="danger"
              title="Source could not be saved"
              message={formError}
            />
          )}
        </form>
      </DashboardDialogContent>
    </DashboardDialog>
  );
}
