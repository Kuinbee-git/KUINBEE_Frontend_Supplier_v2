"use client";

import { useParams } from "next/navigation";
import { ContentDatasetManagement } from "@/components/datasets/ContentDatasetManagement";
import { useThemeStore } from "@/store";

export default function MyDatasetDetailPage() {
  const { theme } = useThemeStore();
  const params = useParams();
  const isDark = theme === "dark";
  const datasetId = params.id as string;

  return (
    <ContentDatasetManagement
      key={datasetId}
      datasetId={datasetId}
      isDark={isDark}
    />
  );
}
