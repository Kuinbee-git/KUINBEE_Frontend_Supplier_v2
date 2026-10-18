"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { toast } from "sonner";

import {
  DashboardButton,
  DashboardFormLayout,
  DashboardPage,
  DashboardRegion,
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
    <DashboardPage width="wide">
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
      />
      <DashboardFormLayout
        asideAriaLabel="Service draft guidance"
        aside={
          <DashboardRegion className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-base font-semibold">
                From draft to marketplace
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Complete the four steps, then create your private draft. Moving
                between steps does not save it.
              </p>
            </div>
            <ol className="space-y-4 text-sm leading-6">
              <li>
                <strong className="block font-medium">
                  1. Create your draft
                </strong>
                <span className="text-muted-foreground">
                  Review your service details before saving.
                </span>
              </li>
              <li>
                <strong className="block font-medium">
                  2. Add a cover and submit
                </strong>
                <span className="text-muted-foreground">
                  Submission for Kuinbee review is a separate action.
                </span>
              </li>
              <li>
                <strong className="block font-medium">
                  3. Publish after approval
                </strong>
                <span className="text-muted-foreground">
                  Your service can become public after Kuinbee approves it.
                </span>
              </li>
            </ol>
            <div className="space-y-2 border-t border-border pt-5">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <ImagePlus aria-hidden="true" className="size-4" /> Cover image
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Add a JPEG, PNG or WebP image up to 5 MB after creating the
                draft. It is required before submission.
              </p>
            </div>
          </DashboardRegion>
        }
      >
        <CustomCollectionForm
          submitLabel="Create draft"
          busy={saving}
          onSubmit={create}
        />
      </DashboardFormLayout>
    </DashboardPage>
  );
}
