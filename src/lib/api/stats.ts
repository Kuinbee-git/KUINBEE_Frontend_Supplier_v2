/**
 * Supplier Stats API Service
 * Handles fetching supplier dashboard statistics
 */

import { SUPPLIER_API, API_BASE_URL } from "@/constants/api.constants";
import type {
    BuyerInsights,
    CurrencyBreakdownItem,
    DatasetBuyer,
    DatasetDetailStats,
    DatasetPerformanceItem,
    RevenueTrendPoint,
    StatsOverview,
    StatsTimeRange,
    SupplierStatsResponse,
    TopBuyer,
} from "@/types/supplier-stats.types";

type ApiCurrencyBreakdownItem = Omit<CurrencyBreakdownItem, "revenue"> & {
    revenue: string;
};

type ApiStatsOverview = Omit<
    StatsOverview,
    "totalRevenue" | "totalRevenueByCurrency" | "averageQualityScore"
> & {
    // Older local backend builds did not include this aggregate. Keep the
    // transport boundary compatible while the deployed contract remains a
    // decimal string.
    totalRevenue?: string | number | null;
    totalRevenueByCurrency?: ApiCurrencyBreakdownItem[];
    averageQualityScore: string | number | null;
};

type ApiRevenueTrendPoint = Omit<RevenueTrendPoint, "revenue"> & {
    revenue: string;
};

type ApiDatasetPerformanceItem = Omit<
    DatasetPerformanceItem,
    "revenue" | "qualityScore"
> & {
    revenue: string;
    qualityScore: string | null;
};

type ApiTopBuyer = Omit<TopBuyer, "totalSpent"> & {
    totalSpent: string;
};

type ApiBuyerInsights = Omit<BuyerInsights, "topBuyers"> & {
    topBuyers: ApiTopBuyer[];
};

interface ApiSupplierStatsResponse {
    overview: ApiStatsOverview;
    revenueTrend: ApiRevenueTrendPoint[];
    datasetPerformance: ApiDatasetPerformanceItem[];
    topPerformingDataset: ApiDatasetPerformanceItem | null;
    lowPerformingDataset: ApiDatasetPerformanceItem | null;
    buyerInsights: ApiBuyerInsights;
}

type ApiDatasetBuyer = Omit<DatasetBuyer, "amount"> & {
    amount: string;
};

interface ApiDatasetDetailStats {
    dataset: ApiDatasetPerformanceItem;
    timeSeries: DatasetDetailStats["timeSeries"];
    revenueTrend: ApiRevenueTrendPoint[];
    recentBuyers: ApiDatasetBuyer[];
}

const parseDecimal = (value: unknown, field: string): number => {
    if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(`Invalid decimal value returned for ${field}`);
    }

    if (typeof value === "string" && value.trim() === "") {
        throw new Error(`Invalid decimal value returned for ${field}`);
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid decimal value returned for ${field}`);
    }
    return parsed;
};

const normalizeRevenuePoint = (point: ApiRevenueTrendPoint): RevenueTrendPoint => ({
    ...point,
    revenue: parseDecimal(point.revenue, "revenue"),
});

const normalizeDatasetPerformance = (
    dataset: ApiDatasetPerformanceItem
): DatasetPerformanceItem => ({
    ...dataset,
    revenue: parseDecimal(dataset.revenue, "dataset revenue"),
    qualityScore:
        dataset.qualityScore === null
            ? null
            : parseDecimal(dataset.qualityScore, "quality score"),
});

const normalizeTopBuyer = (buyer: ApiTopBuyer): TopBuyer => ({
    ...buyer,
    totalSpent: parseDecimal(buyer.totalSpent, "buyer total spent"),
});

const normalizeOverview = (overview: ApiStatsOverview): StatsOverview => {
    const totalRevenueByCurrency = overview.totalRevenueByCurrency?.map((item) => ({
        ...item,
        revenue: parseDecimal(item.revenue, "currency revenue"),
    }));

    const fallbackTotalRevenue = totalRevenueByCurrency?.reduce(
        (total, item) => total + item.revenue,
        0
    ) ?? 0;

    return {
        ...overview,
        totalRevenue:
            overview.totalRevenue === undefined || overview.totalRevenue === null
                ? fallbackTotalRevenue
                : parseDecimal(overview.totalRevenue, "total revenue"),
        averageQualityScore:
            overview.averageQualityScore === null
                ? null
                : parseDecimal(overview.averageQualityScore, "average quality score"),
        totalRevenueByCurrency,
    };
};

const normalizeSupplierStats = (
    data: ApiSupplierStatsResponse
): SupplierStatsResponse => ({
    overview: normalizeOverview(data.overview),
    revenueTrend: data.revenueTrend.map(normalizeRevenuePoint),
    datasetPerformance: data.datasetPerformance.map(normalizeDatasetPerformance),
    topPerformingDataset: data.topPerformingDataset
        ? normalizeDatasetPerformance(data.topPerformingDataset)
        : null,
    lowPerformingDataset: data.lowPerformingDataset
        ? normalizeDatasetPerformance(data.lowPerformingDataset)
        : null,
    buyerInsights: {
        ...data.buyerInsights,
        topBuyers: data.buyerInsights.topBuyers.map(normalizeTopBuyer),
    },
});

// ===== Helper: API Fetch =====
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const error = new Error(
                errorData?.error?.message ||
                errorData?.message ||
                `HTTP ${response.status}: ${response.statusText}`
            ) as Error & { status?: number; code?: string; data?: unknown };
            error.status = response.status;
            error.code =
                errorData?.error?.code ||
                errorData?.code ||
                `HTTP_${response.status}`;
            error.data = errorData;

            if (response.status === 401 || response.status === 403) {
                if (typeof window !== "undefined") {
                    try {
                        localStorage.removeItem("auth-storage");
                        localStorage.removeItem("kuinbee-supplier-storage");
                        localStorage.removeItem("onboarding-storage");
                    } catch {
                        // Ignore localStorage errors
                    }
                    if (!window.location.pathname.includes("/auth/login")) {
                        window.location.href = "/auth/login";
                    }
                }
            }

            throw error;
        }

        return response.json();
    } catch (caught: unknown) {
        const error = caught as Error & { status?: number; code?: string };
        if (error.status) throw error;
        const networkError = new Error(error.message || "Network error") as Error & {
            code?: string;
        };
        networkError.code = "NETWORK_ERROR";
        throw networkError;
    }
}

/** Fetch supplier statistics for a given time range. */
export async function getSupplierStats(
    range: StatsTimeRange = "30d"
): Promise<SupplierStatsResponse> {
    const response = await apiFetch<{
        success: boolean;
        data: ApiSupplierStatsResponse;
    }>(SUPPLIER_API.STATS(range), { method: "GET" });

    return normalizeSupplierStats(response.data);
}

/** Fetch analytics for one dataset owned by the authenticated supplier. */
export async function getSupplierDatasetStats(
    datasetId: string,
    range: StatsTimeRange = "30d"
): Promise<DatasetDetailStats> {
    const response = await apiFetch<{
        success: boolean;
        data: ApiDatasetDetailStats;
    }>(SUPPLIER_API.DATASET_STATS(datasetId, range), { method: "GET" });

    return {
        dataset: normalizeDatasetPerformance(response.data.dataset),
        timeSeries: response.data.timeSeries,
        revenueTrend: response.data.revenueTrend.map(normalizeRevenuePoint),
        recentBuyers: response.data.recentBuyers.map((buyer) => ({
            ...buyer,
            amount: parseDecimal(buyer.amount, "buyer purchase amount"),
        })),
    };
}
