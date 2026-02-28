"use client";

import { useState } from "react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";
import { ArrowUpDown } from "lucide-react";

interface DatasetPerformanceTableProps {
    data: DatasetPerformanceItem[];
    loading?: boolean;
    onRowClick?: (datasetId: string) => void;
}

type SortKey = keyof DatasetPerformanceItem;
type SortDir = "asc" | "desc";

const statusColors: Record<string, { bg: string; text: string }> = {
    published: { bg: "rgba(16, 185, 129, 0.12)", text: "#10b981" },
    draft: { bg: "rgba(245, 158, 11, 0.12)", text: "#f59e0b" },
    pending: { bg: "rgba(74, 144, 226, 0.12)", text: "#4a90e2" },
    archived: { bg: "rgba(107, 114, 128, 0.12)", text: "#6b7280" },
};

export function DatasetPerformanceTable({ data, loading, onRowClick }: DatasetPerformanceTableProps) {
    const tokens = useSupplierTokens();
    const [sortKey, setSortKey] = useState<SortKey>("revenue");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const sorted = [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "number" && typeof bVal === "number") {
            return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortDir === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });

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
                    {sorted.map((item, idx) => {
                        const statusStyle = statusColors[item.status] || statusColors.draft;
                        return (
                            <tr
                                key={item.datasetId}
                                className="transition-colors duration-200"
                                style={{
                                    borderBottom:
                                        idx < sorted.length - 1
                                            ? `1px solid ${tokens.borderSubtle}`
                                            : undefined,
                                    cursor: onRowClick ? "pointer" : undefined,
                                }}
                                onClick={() => onRowClick?.(item.datasetId)}
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
                                    ₹{item.revenue.toLocaleString("en-IN")}
                                </td>
                                <td
                                    className="px-4 py-3.5 text-right text-sm"
                                    style={{ color: tokens.textSecondary }}
                                >
                                    {item.conversionRate.toFixed(2)}%
                                </td>
                                <td
                                    className="px-4 py-3.5 text-right text-sm font-medium"
                                    style={{ color: tokens.textPrimary }}
                                >
                                    {item.qualityScore}
                                </td>
                                <td className="px-4 py-3.5">
                                    <span
                                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                                        style={{
                                            background: statusStyle.bg,
                                            color: statusStyle.text,
                                        }}
                                    >
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
