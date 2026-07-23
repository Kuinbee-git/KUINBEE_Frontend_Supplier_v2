"use client";

import { useParams } from "next/navigation";

import { DiscountCampaignDetail } from "@/components/discounts";
import { useThemeStore } from "@/store";

export default function DiscountCampaignDetailPage() {
  const { theme } = useThemeStore();
  const params = useParams<{ id: string }>();

  return (
    <DiscountCampaignDetail
      datasetId={decodeURIComponent(params.id)}
      isDark={theme === "dark"}
    />
  );
}
