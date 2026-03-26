/**
 * Supplier Stats Types
 * Type definitions for the supplier stats dashboard API
 */

// ===== Time Range =====
export type StatsTimeRange = "7d" | "30d" | "90d" | "1y" | "lifetime";

// ===== Currency =====
export type Currency = "INR" | "USD" | "EUR" | "GBP";

export interface CurrencyBreakdownItem {
    currency: Currency;
    revenue: string | number;
}

// ===== Overview =====
export interface StatsOverview {
    totalRevenue: number;
    totalSales: number;
    activeDatasets: number;
    totalViews: number;
    averageQualityScore: number | null;
    pendingValidationCount: number;
    conversionRate: number;
    /** Currency of totalRevenue — null when mixed currencies */
    totalRevenueCurrency?: Currency | null;
    /** Per-currency breakdown of revenue */
    totalRevenueByCurrency?: CurrencyBreakdownItem[];
}

// ===== Revenue Trend =====
export interface RevenueTrendPoint {
    date: string;
    revenue: number;
    /** Currency for this data point */
    currency?: Currency;
}

// ===== Dataset Performance =====
export interface DatasetPerformanceItem {
    datasetId: string;
    title: string;
    views: number;
    sales: number;
    revenue: number;
    /** Currency of revenue — null when mixed currencies */
    revenueCurrency?: Currency | null;
    conversionRate: number;
    qualityScore: number;
    status: string;
}

// ===== Performing Dataset (Top / Low) =====
export interface PerformingDataset extends DatasetPerformanceItem { }

// ===== Buyer Insights =====
export interface TopBuyer {
    userId: string;
    name: string;
    companyName: string;
    totalSpent: number;
    /** Currency of totalSpent — null when mixed */
    totalSpentCurrency?: Currency | null;
    totalPurchases: number;
    lastPurchaseDate: string;
}

export interface HighIntentNonBuyer {
    userId: string;
    name: string;
    companyName: string;
    totalViews: number;
    viewedDatasets: string[];
}

export interface BuyerInsights {
    totalBuyers: number;
    totalNonBuyingUsers: number;
    topBuyers: TopBuyer[];
    highIntentNonBuyers: HighIntentNonBuyer[];
}

// ===== Full Stats Response =====
export interface SupplierStatsResponse {
    overview: StatsOverview;
    revenueTrend: RevenueTrendPoint[];
    datasetPerformance: DatasetPerformanceItem[];
    topPerformingDataset: PerformingDataset | null;
    lowPerformingDataset: PerformingDataset | null;
    buyerInsights: BuyerInsights;
}

// ===== Per-Dataset Detail =====
export interface DatasetTimePoint {
    date: string;
    views: number;
    sales: number;
    revenue: number;
}

export interface DatasetBuyer {
    userId: string;
    name: string;
    companyName: string;
    purchaseDate: string;
    amount: number;
}

export interface DatasetDetailStats {
    dataset: DatasetPerformanceItem;
    timeSeries: DatasetTimePoint[];
    recentBuyers: DatasetBuyer[];
}
