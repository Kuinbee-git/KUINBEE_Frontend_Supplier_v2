"use client";

import { DatasetList } from "@/components/datasets";
import { useThemeStore } from "@/store";
import { DatasetPreparationEntry } from "@/components/datasets/preparation/DatasetPreparationEntry";

export default function ProposalsPage() {
  const { isDark } = useThemeStore();

  return <><DatasetPreparationEntry /><DatasetList isDark={isDark} /></>;
}

