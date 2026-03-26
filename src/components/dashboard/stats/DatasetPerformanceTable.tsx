"use client";

import { useState, useMemo } from "react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DatasetPerformanceTableProps {
    data: DatasetPerformanceItem[];
    loading?: boolean;
}

type SortKey = keyof DatasetPerformanceItem;
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

const statusColors: Record<string, { bg: string; text: string }> = {
    PUBLISHED: { bg: "rgba(16, 185, 129, 0.12)", text: "#10b981" },
    VERIFIED: { bg: "rgba(16, 185, 129, 0.12)", text: "#10b981" },
    SUBMITTED: { bg: "rgba(74, 144, 226, 0.12)", text: "#4a90e2" },
    UNDER_REVIEW: { bg: "rgba(139, 92, 246, 0.12)", text: "#8b5cf6" },
    ARCHIVED: { bg: "rgba(107, 114, 128, 0.12)", text: "#6b7280" },
    REJECTED: { bg: "rgba(239, 68, 68, 0.12)", text: "#ef4444" },
    DRAFT: { bg: "rgba(245, 158, 11, 0.12)", text: "#f59e0b" },
};

function getStatusStyle(status: string) {
    return statusColors[status.toUpperCase()] || statusColors.DRAFT;
}

function formatStatusLabel(status: string): string {
    return status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DatasetPerformanceTable({ data, loading }: DatasetPerformanceTableProps) {
    const tokens = useSupplierTokens();
    const [sortKey, setSortKey] = useState<SortKey>("revenue");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [page, setPage] = useState(0);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
        setPage(0); // reset to first page on re-sort
    };

    const sorted = useMemo(() =>
        [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortDir === "asc" ? aVal - bVal : bVal - aVal;
            }
            return sortDir === "asc"
                ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
                : String(bVal ?? "").localeCompare(String(aVal ?? ""));
        }), [data, sortKey, sortDir]);

    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    if (loading) {
        return (
            <div
                className="rounded-xl animate-pulse"
                style={{ background: "var(--muted)", height: "300px" }}
            />
        );
    }

    const columns: { key: SortKey; label: string; align?: "right" }[] = [
        { key: "title", label: "Dataset" },
        { key: "views", label: "Views", align: "right" },
        { key: "sales", label: "Sales", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "conversionRate", label: "Conv. Rate", align: "right" },
        { key: "qualityScore", label: "Quality", align: "right" },
        { key: "status", label: "Status" },
    ];

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr
                            style={{
                                borderBottom: `1px solid ${tokens.borderDefault}`,
                            }}
                        >
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 select-none ${col.align === "right" ? "text-right" : "text-left"}`}
                                    style={{ color: tokens.textMuted }}
                                    onClick={() => handleSort(col.key)}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.label}
                                        <ArrowUpDown
                                            className="w-3 h-3"
                                            style={{
                                                opacity: sortKey === col.key ? 1 : 0.3,
                                            }}
                                        />
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((item, idx) => {
                            const statusStyle = getStatusStyle(item.status);
                            return (
                                <tr
                                    key={item.datasetId}
                                    className="transition-colors duration-200"
                                    style={{
                                        borderBottom:
                                            idx < pageData.length - 1
                                                ? `1px solid ${tokens.borderSubtle}`
                                                : undefined,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = tokens.isDark
                                            ? "rgba(255,255,255,0.03)"
                                            : "rgba(26,34,64,0.02)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <td className="px-4 py-3.5">
                                        <p
                                            className="text-sm font-medium truncate max-w-[220px]"
                                            style={{ color: tokens.textPrimary }}
                                            title={item.title}
                                        >
                                            {item.title}
                                        </p>
                                    </td>
                                    <td
                                        className="px-4 py-3.5 text-right text-sm"
                                        style={{ color: tokens.textSecondary }}
                                    >
                                        {item.views.toLocaleString()}
                                    </td>
                                    <td
                                        className="px-4 py-3.5 text-right text-sm"
                                        style={{ color: tokens.textSecondary }}
                                    >
                                        {item.sales.toLocaleString()}
                                    </td>
                                    <td
                                        className="px-4 py-3.5 text-right text-sm font-medium"
                                        style={{ color: tokens.textPrimary }}
                                    >
                                        {formatCurrencyValue(item.revenue, item.revenueCurrency)}
                                    </td>
                                    <td
                                        className="px-4 py-3.5 text-right text-sm"
                                        style={{ color: tokens.textSecondary }}
                                    >
                                        {(item.conversionRate * 100).toFixed(2)}%
                                    </td>
                                    <td
                                        className="px-4 py-3.5 text-right text-sm font-medium"
                                        style={{ color: tokens.textPrimary }}
                                    >
                                        {item.qualityScore != null ? Number(item.qualityScore).toFixed(0) : "—"}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span
                                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                                            style={{
                                                background: statusStyle.bg,
                                                color: statusStyle.text,
                                            }}
                                        >
                                            {formatStatusLabel(item.status)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div
                    className="flex items-center justify-between pt-4 mt-4"
                    style={{ borderTop: `1px solid ${tokens.borderSubtle}` }}
                >
                    <p className="text-xs" style={{ color: tokens.textMuted }}>
                        Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length} datasets
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-30"
                            style={{
                                color: tokens.textSecondary,
                                background: tokens.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i)}
                                className="w-7 h-7 rounded-lg text-xs font-medium transition-all duration-200"
                                style={{
                                    background: i === page
                                        ? tokens.isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.15)"
                                        : "transparent",
                                    color: i === page ? "#6366f1" : tokens.textMuted,
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-30"
                            style={{
                                color: tokens.textSecondary,
                                background: tokens.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            }}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
