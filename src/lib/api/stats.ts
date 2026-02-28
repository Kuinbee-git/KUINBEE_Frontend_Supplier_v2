/**
 * Supplier Stats API Service
 * Handles fetching supplier dashboard statistics
 */

import { SUPPLIER_API, API_BASE_URL } from "@/constants/api.constants";
import type {
    StatsTimeRange,
    SupplierStatsResponse,
    RevenueTrendPoint,
    DatasetPerformanceItem,
    DatasetDetailStats,
    DatasetTimePoint,
    DatasetBuyer,
    TopBuyer,
    HighIntentNonBuyer,
} from "@/types/supplier-stats.types";

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
            const error: any = new Error(
                errorData?.message || `HTTP ${response.status}: ${response.statusText}`
            );
            error.status = response.status;
            error.code = errorData?.code || `HTTP_${response.status}`;
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
    } catch (err: any) {
        if (err.status) throw err;
        const error: any = new Error(err.message || "Network error");
        error.code = "NETWORK_ERROR";
        throw error;
    }
}

// ===== Get Supplier Stats =====

/**
 * Fetch supplier statistics for a given time range
 */
export async function getSupplierStats(
    range: StatsTimeRange = "30d"
): Promise<SupplierStatsResponse> {
    const response = await apiFetch<{ success: boolean; data: SupplierStatsResponse }>(
        SUPPLIER_API.STATS(range),
        { method: "GET" }
    );
    return response.data;
}

// ===== Mock Data Generator =====

function generateRevenueTrend(range: StatsTimeRange): RevenueTrendPoint[] {
    const points: RevenueTrendPoint[] = [];
    const now = new Date();
    let days: number;
    let aggregateMonthly = false;

    switch (range) {
        case "7d": days = 7; break;
        case "30d": days = 30; break;
        case "90d": days = 90; break;
        case "1y": days = 365; break;
        case "lifetime": days = 730; aggregateMonthly = true; break;
        default: days = 30;
    }

    if (aggregateMonthly) {
        const months = Math.ceil(days / 30);
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            points.push({
                date: date.toISOString().slice(0, 7), // YYYY-MM
                revenue: Math.floor(Math.random() * 50000) + 10000,
            });
        }
    } else {
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            points.push({
                date: date.toISOString().slice(0, 10), // YYYY-MM-DD
                revenue: Math.floor(Math.random() * 5000) + 500,
            });
        }
    }
    return points;
}

const mockDatasets: DatasetPerformanceItem[] = [
    {
        datasetId: "ds-001",
        title: "India Consumer Spending 2024",
        views: 1240,
        sales: 87,
        revenue: 43500,
        conversionRate: 7.02,
        qualityScore: 92,
        status: "published",
    },
    {
        datasetId: "ds-002",
        title: "E-Commerce Transaction Logs",
        views: 890,
        sales: 52,
        revenue: 26000,
        conversionRate: 5.84,
        qualityScore: 88,
        status: "published",
    },
    {
        datasetId: "ds-003",
        title: "Weather Patterns - South Asia",
        views: 2100,
        sales: 34,
        revenue: 17000,
        conversionRate: 1.62,
        qualityScore: 95,
        status: "published",
    },
    {
        datasetId: "ds-004",
        title: "Telecom Network Performance",
        views: 560,
        sales: 41,
        revenue: 20500,
        conversionRate: 7.32,
        qualityScore: 85,
        status: "published",
    },
    {
        datasetId: "ds-005",
        title: "Agricultural Yield Data 2023",
        views: 1800,
        sales: 12,
        revenue: 6000,
        conversionRate: 0.67,
        qualityScore: 78,
        status: "published",
    },
    {
        datasetId: "ds-006",
        title: "Urban Mobility Patterns",
        views: 320,
        sales: 8,
        revenue: 4000,
        conversionRate: 2.5,
        qualityScore: 82,
        status: "draft",
    },
];

const mockTopBuyers: TopBuyer[] = [
    {
        userId: "u-101",
        name: "Arjun Mehta",
        companyName: "DataVerse Analytics",
        totalSpent: 28500,
        totalPurchases: 14,
        lastPurchaseDate: "2026-02-25",
    },
    {
        userId: "u-102",
        name: "Priya Sharma",
        companyName: "InsightForge AI",
        totalSpent: 19200,
        totalPurchases: 9,
        lastPurchaseDate: "2026-02-22",
    },
    {
        userId: "u-103",
        name: "Rahul Gupta",
        companyName: "NexGen Research",
        totalSpent: 15800,
        totalPurchases: 7,
        lastPurchaseDate: "2026-02-18",
    },
    {
        userId: "u-104",
        name: "Sneha Patel",
        companyName: "Quantify Labs",
        totalSpent: 12100,
        totalPurchases: 6,
        lastPurchaseDate: "2026-02-14",
    },
    {
        userId: "u-105",
        name: "Vikram Singh",
        companyName: "TrueData Corp",
        totalSpent: 9500,
        totalPurchases: 4,
        lastPurchaseDate: "2026-02-10",
    },
];

const mockNonBuyers: HighIntentNonBuyer[] = [
    {
        userId: "u-201",
        name: "Ananya Roy",
        companyName: "BrightPath Solutions",
        totalViews: 145,
        viewedDatasets: ["India Consumer Spending 2024", "E-Commerce Transaction Logs", "Weather Patterns - South Asia"],
    },
    {
        userId: "u-202",
        name: "Karthik Iyer",
        companyName: "MetriQ Systems",
        totalViews: 112,
        viewedDatasets: ["Telecom Network Performance", "Urban Mobility Patterns"],
    },
    {
        userId: "u-203",
        name: "Divya Nair",
        companyName: "Infosight Global",
        totalViews: 98,
        viewedDatasets: ["Agricultural Yield Data 2023", "India Consumer Spending 2024"],
    },
];

/**
 * Returns realistic mock data for development
 * Use this until the backend API is ready
 */
export function getMockSupplierStats(range: StatsTimeRange): SupplierStatsResponse {
    const revenueTrend = generateRevenueTrend(range);

    // Find top and low performing
    const sortedByRevenue = [...mockDatasets].sort((a, b) => b.revenue - a.revenue);
    const topPerforming = sortedByRevenue[0] || null;

    // Low performing: high views but lowest conversion (minimum 500 views)
    const highViewDatasets = mockDatasets.filter((d) => d.views >= 500);
    const sortedByConversion = [...highViewDatasets].sort((a, b) => a.conversionRate - b.conversionRate);
    const lowPerforming = sortedByConversion[0] || null;

    return {
        overview: {
            totalRevenue: 117000,
            totalSales: 234,
            activeDatasets: 5,
            totalViews: 6910,
            averageQualityScore: 86.7,
            pendingValidationCount: 2,
            conversionRate: 3.39,
        },
        revenueTrend,
        datasetPerformance: mockDatasets,
        topPerformingDataset: topPerforming,
        lowPerformingDataset: lowPerforming,
        buyerInsights: {
            totalBuyers: 42,
            totalNonBuyingUsers: 187,
            topBuyers: mockTopBuyers,
            highIntentNonBuyers: mockNonBuyers,
        },
    };
}

/**
 * Returns mock per-dataset detail stats
 */
export function getMockDatasetDetail(
    datasetId: string,
    range: StatsTimeRange
): DatasetDetailStats | null {
    const dataset = mockDatasets.find((d) => d.datasetId === datasetId);
    if (!dataset) return null;

    const now = new Date();
    let days: number;
    let aggregateMonthly = false;

    switch (range) {
        case "7d": days = 7; break;
        case "30d": days = 30; break;
        case "90d": days = 90; break;
        case "1y": days = 365; break;
        case "lifetime": days = 730; aggregateMonthly = true; break;
        default: days = 30;
    }

    const timeSeries: DatasetTimePoint[] = [];

    if (aggregateMonthly) {
        const months = Math.ceil(days / 30);
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            const views = Math.floor(Math.random() * 200) + 20;
            const sales = Math.floor(Math.random() * Math.max(1, views * 0.1));
            timeSeries.push({
                date: date.toISOString().slice(0, 7),
                views,
                sales,
                revenue: sales * Math.floor(dataset.revenue / Math.max(dataset.sales, 1)),
            });
        }
    } else {
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const views = Math.floor(Math.random() * 60) + 5;
            const sales = Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0;
            timeSeries.push({
                date: date.toISOString().slice(0, 10),
                views,
                sales,
                revenue: sales * Math.floor(dataset.revenue / Math.max(dataset.sales, 1)),
            });
        }
    }

    const mockBuyerNames = [
        { name: "Arjun Mehta", company: "DataVerse Analytics" },
        { name: "Priya Sharma", company: "InsightForge AI" },
        { name: "Rahul Gupta", company: "NexGen Research" },
        { name: "Sneha Patel", company: "Quantify Labs" },
        { name: "Vikram Singh", company: "TrueData Corp" },
    ];

    const recentBuyers: DatasetBuyer[] = mockBuyerNames
        .slice(0, Math.min(dataset.sales, 5))
        .map((buyer, i) => {
            const date = new Date(now);
            date.setDate(date.getDate() - i * 3 - Math.floor(Math.random() * 5));
            return {
                userId: `u-${100 + i}`,
                name: buyer.name,
                companyName: buyer.company,
                purchaseDate: date.toISOString().slice(0, 10),
                amount: Math.floor(dataset.revenue / Math.max(dataset.sales, 1)),
            };
        });

    return { dataset, timeSeries, recentBuyers };
}

