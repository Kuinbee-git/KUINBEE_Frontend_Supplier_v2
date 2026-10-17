"use client";

import { useCallback, useRef, useState } from "react";
import type { DatasetPreparationMetadata } from "@kuinbee/dataset-preparation-contracts";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { preparationApi } from "@/lib/api/dataset-preparations";
import { DashboardButton } from "@/components/dashboard";
import { PreparationCatalogPicker } from "./PreparationCatalogPicker";
import { PreparationField, type PreparationUpdate } from "./PreparationFields";

// Current lookup labels for editable metadata only. Frozen review/library views
// use their captured category facts instead of resolving today's names.
export function PreparationCategoryName({ id }: { id: string }) {
  const [state, setState] = useState<{
      id: string;
      name: string | null;
    } | null>(null),
    epoch = useRef(0);
  const load = useCallback(async () => {
    const ticket = ++epoch.current;
    try {
      const result = await preparationApi.labels({ primaryCategoryId: id });
      if (ticket === epoch.current)
        setState({
          id,
          name:
            result.primaryCategory?.id === id
              ? result.primaryCategory.name
              : null,
        });
    } catch {
      if (ticket === epoch.current) setState({ id, name: null });
    }
  }, [id]);
  useComponentRequest(load, [id]);
  return (
    <span className="break-words [overflow-wrap:anywhere]">
      {state?.id === id
        ? (state.name ?? `Current label unavailable; category ${id} retained`)
        : "Loading current category label…"}
    </span>
  );
}

export function PreparationDiscoveryFields({
  metadata,
  onUpdate,
  disabled = false,
}: {
  metadata: DatasetPreparationMetadata;
  onUpdate: PreparationUpdate;
  disabled?: boolean;
}) {
  const selected = metadata.secondaryCategoryIds ?? [];
  return (
    <div className="space-y-4 border-t border-border pt-5">
      <div>
        <h3 className="text-sm font-semibold">Categories and tags</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional subjects and descriptive tags. They do not enable file
          formats or change the collection&apos;s main data types.
        </p>
      </div>
      {selected.length > 0 && (
        <ul
          aria-label="Additional categories"
          className="divide-y divide-border"
        >
          {selected.map((id) => (
            <li
              key={id}
              className="flex min-w-0 flex-wrap items-start justify-between gap-2 py-2"
            >
              <div className="min-w-0 flex-1">
                <PreparationCategoryName id={id} />
              </div>
              <DashboardButton
                type="button"
                size="compact"
                variant="outline"
                disabled={disabled}
                aria-label={`Remove additional category ${id}`}
                onClick={() =>
                  onUpdate((previous) => ({
                    ...previous,
                    secondaryCategoryIds: (
                      previous.secondaryCategoryIds ?? []
                    ).filter((value) => value !== id),
                  }))
                }
              >
                Remove
              </DashboardButton>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        {selected.length} of 10 additional categories selected.
      </p>
      {selected.length < 10 && (
        <PreparationCatalogPicker
          field="secondaryCategoryIds"
          kind="categories"
          label="Add an additional category"
          value={null}
          disabled={disabled}
          excludedValues={[
            ...(metadata.primaryCategoryId ? [metadata.primaryCategoryId] : []),
            ...selected,
          ]}
          help="Choose an existing subject category. The primary category and categories already selected are excluded. Search and loading more results keep all selections."
          onChange={(id) => {
            if (!id) return;
            onUpdate((previous) => {
              const ids = previous.secondaryCategoryIds ?? [];
              return ids.length >= 10 ||
                ids.includes(id) ||
                previous.primaryCategoryId === id
                ? previous
                : { ...previous, secondaryCategoryIds: [...ids, id] };
            });
          }}
        />
      )}
      <PreparationField
        field="tags"
        label="Tags (one per line)"
        value={metadata.tags?.join("\n")}
        maxLength={1619}
        disabled={disabled}
        onChange={(value) =>
          onUpdate((previous) => ({
            ...previous,
            tags: value?.split("\n") ?? [],
          }))
        }
        help="Optional. Up to 20 tags, 80 characters each. Put one tag on each line; spaces inside a tag are kept. Saving an empty list clears the tags."
      />
    </div>
  );
}
