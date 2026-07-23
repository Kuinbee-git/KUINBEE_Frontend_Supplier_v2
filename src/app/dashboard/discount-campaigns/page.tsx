"use client";

import { DiscountCampaigns } from "@/components/discounts";
import { useThemeStore } from "@/store";

export default function DiscountCampaignsPage() {
  const { theme } = useThemeStore();
  return <DiscountCampaigns isDark={theme === "dark"} />;
}
