"use client";

import { DatasetList } from "@/components/datasets";
import { useThemeStore } from "@/store";

export default function ProposalsPage() {
  const { isDark } = useThemeStore();

  return <DatasetList isDark={isDark} />;
}

