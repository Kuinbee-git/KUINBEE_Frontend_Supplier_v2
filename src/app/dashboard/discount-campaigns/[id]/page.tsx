"use client";

import { useParams } from "next/navigation";

import { DiscountCampaignDetail } from "@/components/discounts";

export default function DiscountCampaignDetailPage() {
  const params = useParams<{ id: string }>();

  return <DiscountCampaignDetail datasetId={decodeURIComponent(params.id)} />;
}
