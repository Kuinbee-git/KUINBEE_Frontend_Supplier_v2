"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  DashboardButton,
  DashboardInlineAlert,
  DashboardPage,
  DashboardPageHeader,
} from "@/components/dashboard";
import { customCollectionApi } from "@/lib/api/custom-collection";
import type { CustomCollectionRevisionInput } from "@/types/custom-collection.types";
import { CustomCollectionForm } from "./CustomCollectionForm";

export function CustomCollectionCreateView() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const create = async (values: CustomCollectionRevisionInput) => {
    setSaving(true);
    try {
      const result = await customCollectionApi.create(values);
      toast.success("Draft created", {
        description:
          "Add a cover image, review the details, and submit it when ready.",
      });
      router.push(`/dashboard/custom-collection-services/${result.service.id}`);
    } catch (error) {
      toast.error("Could not create the service", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardPage width="standard">
      <DashboardPageHeader
        breadcrumbs={
          <DashboardButton
            asChild
            variant="ghost"
            size="compact"
            className="-ml-3"
          >
            <Link href="/dashboard/custom-collection-services">
              <ArrowLeft aria-hidden="true" /> Back to services
            </Link>
          </DashboardButton>
        }
        title="Create a custom collection service"
        description="Describe a capability your team can deliver consistently. You can add the cover image and review the marketplace presentation after creating the draft."
        meta={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-4" aria-hidden="true" /> Private draft
          </span>
        }
      />

      <DashboardInlineAlert tone="info" title="This creates a private draft">
        <div>
          <p>
            A JPEG, PNG, or WebP cover image under 5 MB is required before
            submission. Your service becomes public only after Kuinbee approves
            it.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium">
            <ImagePlus className="size-3.5" aria-hidden="true" /> Cover setup
            comes next
          </p>
        </div>
      </DashboardInlineAlert>

      <CustomCollectionForm
        submitLabel="Create draft"
        busy={saving}
        onSubmit={create}
      />
    </DashboardPage>
  );
}
