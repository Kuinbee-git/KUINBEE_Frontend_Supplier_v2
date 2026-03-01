/**
 * KDTS API — supplier side
 * Public route: GET /api/v1/datasets/:datasetId/kdts
 */

import { DATASET_API, API_BASE_URL } from "@/constants/api.constants";

export interface KdtsBreakdown {
  Q: number;
  L: number;
  P: number;
  U: number;
  F: number;
}

export interface DatasetKdtsResponse {
  currentScore: string | null;
  breakdown: KdtsBreakdown | null;
  history: Array<{
    id: string;
    finalScore: string;
    breakdown: KdtsBreakdown;
    createdAt: string;
    note: string;
    admin: { id: string; name: string } | null;
  }>;
  updatedAt: string | null;
}

export async function getDatasetKdts(
  datasetId: string
): Promise<DatasetKdtsResponse> {
  const endpoint = DATASET_API.KDTS_SCORE(datasetId);
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || `HTTP ${response.status}`);
  }

  const json: { success: boolean; data: DatasetKdtsResponse } = await response.json();
  return json.data;
}
