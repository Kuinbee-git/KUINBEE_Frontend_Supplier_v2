"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
    <div className="custom-collection-scope mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
          <Link href="/dashboard/custom-collection-services">
            <ArrowLeft /> Back to services
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <span className="mt-1 hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Create a custom collection service
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
              Describe a capability your team can deliver consistently. You can
              add the cover image and review the marketplace presentation after
              creating the draft.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900 backdrop-blur-lg dark:border-blue-400/20 dark:bg-blue-400/[0.07] dark:text-blue-100 sm:grid-cols-[auto_1fr]">
        <Info className="mt-0.5 size-4" />
        <div>
          <p className="font-medium">This creates a private draft.</p>
          <p className="mt-1 text-blue-800/80 dark:text-blue-200/80">
            A JPEG, PNG, or WebP cover image under 5 MB is required before
            submission. Your service becomes public only after Kuinbee approves
            it.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium">
            <ImagePlus className="size-3.5" /> Cover setup comes next
          </p>
        </div>
      </div>

      <CustomCollectionForm
        submitLabel="Create draft"
        busy={saving}
        onSubmit={create}
      />
    </div>
  );
}
