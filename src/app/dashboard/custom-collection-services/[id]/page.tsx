"use client";

import { use } from "react";

import { CustomCollectionServiceDetail } from "@/components/custom-collection/CustomCollectionServiceDetail";

export default function CustomCollectionServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CustomCollectionServiceDetail serviceId={id} />;
}
