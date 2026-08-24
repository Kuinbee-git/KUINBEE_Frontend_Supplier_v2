"use client";

import { useState } from "react";
import { DashboardButton } from "@/components/dashboard";
import { DashboardInput } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { Save, X, AlertCircle, CheckCircle } from "lucide-react";
import { setProposalTags, upsertLocationInfo } from "@/lib/api";
import type {
  LocationInfo,
  SetTagsRequest,
  SetTagsResponse,
  UpsertLocationInfoRequest,
  UpsertLocationInfoResponse,
} from "@/types/dataset-proposal.types";
import { toDatasetUiError } from "../shared/datasetUiError";

interface LocationFormData {
  country: string;
  state: string;
  city: string;
  region: string;
  coordinates: string;
  coverage: string;
}

interface LocationTagsEditFormProps {
  datasetId: string;
  initialData?: {
    locationInfo?: LocationInfo | null;
    tags?: string[];
  };
  isDark?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  onUpsertLocation?: (
    datasetId: string,
    data: UpsertLocationInfoRequest
  ) => Promise<UpsertLocationInfoResponse>;
  onSetTags?: (
    datasetId: string,
    data: SetTagsRequest
  ) => Promise<SetTagsResponse>;
}

const DEFAULT_LOCATION_INFO: LocationFormData = {
  country: "",
  state: "",
  city: "",
  region: "",
  coordinates: "",
  coverage: "",
};

const normalizeLocationInfo = (
  location?: LocationFormData | LocationInfo | null
): LocationFormData => ({
  country: (location?.country ?? "").trim(),
  state: (location?.state ?? "").trim(),
  city: (location?.city ?? "").trim(),
  region: (location?.region ?? "").trim(),
  coordinates: (location?.coordinates ?? "").trim(),
  coverage: (location?.coverage ?? "").trim(),
});

const parseTagsText = (value: string) => {
  const unique = new Map<string, string>();

  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .forEach((tag) => {
      const key = tag.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, tag);
      }
    });

  return Array.from(unique.values());
};

export function LocationTagsEditForm({
  datasetId,
  initialData,
  isDark = false,
  onSuccess,
  onCancel,
  onUpsertLocation,
  onSetTags,
}: LocationTagsEditFormProps) {
  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initialLocation = normalizeLocationInfo(
    initialData?.locationInfo ?? DEFAULT_LOCATION_INFO
  );
  const initialTags = parseTagsText((initialData?.tags ?? []).join(", "));

  const [locationInfo, setLocationInfo] =
    useState<LocationFormData>(initialLocation);
  const [tagsText, setTagsText] = useState(
    (initialData?.tags ?? []).join(", ")
  );

  const handleLocationChange = (
    field: keyof LocationFormData,
    value: string
  ) => {
    setLocationInfo((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const isFormValid = () => {
    const normalizedLocation = normalizeLocationInfo(locationInfo);
    const hasAnyLocationField = Object.values(normalizedLocation).some(Boolean);

    if (hasAnyLocationField && !normalizedLocation.country) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Country is required when location fields are provided");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const normalizedLocation = normalizeLocationInfo(locationInfo);
      const locationChanged =
        normalizedLocation.country !== initialLocation.country ||
        normalizedLocation.state !== initialLocation.state ||
        normalizedLocation.city !== initialLocation.city ||
        normalizedLocation.region !== initialLocation.region ||
        normalizedLocation.coordinates !== initialLocation.coordinates ||
        normalizedLocation.coverage !== initialLocation.coverage;

      const nextTags = parseTagsText(tagsText);
      const tagsChanged =
        nextTags.length !== initialTags.length ||
        nextTags.some((tag, index) => tag !== initialTags[index]);

      if (!locationChanged && !tagsChanged) {
        setError("No changes detected");
        setSubmitting(false);
        return;
      }

      const tasks: Array<
        Promise<UpsertLocationInfoResponse | SetTagsResponse>
      > = [];

      if (locationChanged) {
        if (!normalizedLocation.country) {
          setError("Country is required to save location details");
          setSubmitting(false);
          return;
        }

        const locationPayload: UpsertLocationInfoRequest = {
          country: normalizedLocation.country,
          ...(normalizedLocation.state
            ? { state: normalizedLocation.state }
            : {}),
          ...(normalizedLocation.city ? { city: normalizedLocation.city } : {}),
          ...(normalizedLocation.region
            ? { region: normalizedLocation.region }
            : {}),
          ...(normalizedLocation.coordinates
            ? { coordinates: normalizedLocation.coordinates }
            : {}),
          ...(normalizedLocation.coverage
            ? { coverage: normalizedLocation.coverage }
            : {}),
        };

        tasks.push(
          onUpsertLocation
            ? onUpsertLocation(datasetId, locationPayload)
            : upsertLocationInfo(datasetId, locationPayload)
        );
      }

      if (tagsChanged) {
        const tagsPayload: SetTagsRequest = { tags: nextTags };
        tasks.push(
          onSetTags
            ? onSetTags(datasetId, tagsPayload)
            : setProposalTags(datasetId, tagsPayload)
        );
      }

      await Promise.all(tasks);
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
      }, 1200);
    } catch (err: unknown) {
      console.error("Failed to update location/tags:", err);
      const apiError = toDatasetUiError(err);
      setError(apiError.message || "Failed to update location and tags");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div
              className="rounded-xl border px-4 py-3 flex items-center gap-3"
              style={{
                background: isDark
                  ? "color-mix(in srgb, var(--dashboard-danger) 10%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-danger) 5%, transparent)",
                borderColor: isDark
                  ? "color-mix(in srgb, var(--dashboard-danger) 30%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-danger) 20%, transparent)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "color-mix(in srgb, var(--dashboard-danger) 15%, transparent)",
                }}
              >
                <AlertCircle
                  className="w-4 h-4"
                  style={{ color: "var(--dashboard-danger-foreground)" }}
                />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--dashboard-danger-foreground)" }}
              >
                {error}
              </p>
            </div>
          )}

          {success && (
            <div
              className="rounded-xl border px-4 py-3 flex items-center gap-3"
              style={{
                background: isDark
                  ? "color-mix(in srgb, var(--dashboard-success) 10%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-success) 5%, transparent)",
                borderColor: isDark
                  ? "color-mix(in srgb, var(--dashboard-success) 30%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-success) 20%, transparent)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "color-mix(in srgb, var(--dashboard-success) 15%, transparent)",
                }}
              >
                <CheckCircle
                  className="w-4 h-4"
                  style={{ color: "var(--dashboard-success-foreground)" }}
                />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--dashboard-success-foreground)" }}
              >
                Location and tags updated successfully!
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className="rounded-xl border p-5 space-y-5"
        style={{
          background: tokens.surfaceCard,
          borderColor: tokens.borderSubtle || tokens.inputBorder,
        }}
      >
        <div>
          <h4
            className="text-sm font-semibold"
            style={{ color: tokens.textPrimary }}
          >
            Location
          </h4>
          <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
            Geographic details for dataset coverage and discovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="country" style={{ color: tokens.textPrimary }}>
              Country
            </Label>
            <DashboardInput
              id="country"
              value={locationInfo.country}
              onChange={(e) => handleLocationChange("country", e.target.value)}
              placeholder="e.g., India"
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" style={{ color: tokens.textPrimary }}>
              State
            </Label>
            <DashboardInput
              id="state"
              value={locationInfo.state}
              onChange={(e) => handleLocationChange("state", e.target.value)}
              placeholder="e.g., Karnataka"
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="city" style={{ color: tokens.textPrimary }}>
              City
            </Label>
            <DashboardInput
              id="city"
              value={locationInfo.city}
              onChange={(e) => handleLocationChange("city", e.target.value)}
              placeholder="e.g., Bengaluru"
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region" style={{ color: tokens.textPrimary }}>
              Region
            </Label>
            <DashboardInput
              id="region"
              value={locationInfo.region}
              onChange={(e) => handleLocationChange("region", e.target.value)}
              placeholder="e.g., South Asia"
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="coordinates" style={{ color: tokens.textPrimary }}>
              Coordinates
            </Label>
            <DashboardInput
              id="coordinates"
              value={locationInfo.coordinates}
              onChange={(e) =>
                handleLocationChange("coordinates", e.target.value)
              }
              placeholder="e.g., 12.9716,77.5946"
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverage" style={{ color: tokens.textPrimary }}>
              Coverage
            </Label>
            <DashboardInput
              id="coverage"
              value={locationInfo.coverage}
              onChange={(e) => handleLocationChange("coverage", e.target.value)}
              placeholder="e.g., Pan-India"
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="rounded-xl border p-5 space-y-3"
        style={{
          background: tokens.surfaceCard,
          borderColor: tokens.borderSubtle || tokens.inputBorder,
        }}
      >
        <div>
          <h4
            className="text-sm font-semibold"
            style={{ color: tokens.textPrimary }}
          >
            Tags
          </h4>
          <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
            Comma-separated tags. New tags are created automatically if missing.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagsText" style={{ color: tokens.textPrimary }}>
            Tags
          </Label>
          <DashboardInput
            id="tagsText"
            value={tagsText}
            onChange={(e) => {
              setTagsText(e.target.value);
              setError(null);
              setSuccess(false);
            }}
            placeholder="e.g., finance, time-series, consumer-data"
            disabled={submitting}
            style={{
              background: tokens.inputBg,
              borderColor: tokens.inputBorder,
              color: tokens.textPrimary,
            }}
          />
        </div>
      </div>

      <div
        className="flex items-center gap-3 pt-4 border-t"
        style={{ borderColor: tokens.borderSubtle || tokens.inputBorder }}
      >
        <DashboardButton
          type="submit"
          disabled={!isFormValid() || submitting}
          className="h-11 px-6 font-medium"
          style={{
            background:
              isFormValid() && !submitting
                ? "var(--dashboard-button-primary-background)"
                : "color-mix(in srgb, var(--dashboard-text-muted) 30%, transparent)",
            color: "var(--dashboard-button-primary-foreground)",
          }}
        >
          <Save className="w-4 h-4 mr-2" />
          {submitting ? "Saving..." : "Save Changes"}
        </DashboardButton>

        <DashboardButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 px-5 font-medium"
          style={{
            background: tokens.glassBg || "transparent",
            border: `1px solid ${tokens.glassBorder || tokens.inputBorder}`,
            color: tokens.textPrimary,
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </DashboardButton>
      </div>
    </form>
  );
}
