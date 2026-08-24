"use client";

import type { DatasetTimePoint } from "@/types/supplier-stats.types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import { DashboardEmptyState, DashboardSkeleton } from "@/components/dashboard";

interface DatasetViewsSalesChartProps {
  data: DatasetTimePoint[];
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  if (dateStr.length === 7) {
    const [year, month] = dateStr.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[parseInt(month) - 1]} '${year.slice(2)}`;
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function DatasetViewsSalesChart({
  data,
  loading,
}: DatasetViewsSalesChartProps) {
  if (loading) {
    return <DashboardSkeleton className="h-64 sm:h-72" />;
  }

  if (data.length === 0) {
    return (
      <DashboardEmptyState
        surface="plain"
        icon={BarChart3}
        title="No view or sales activity"
        description="Try a longer time range or check again after buyers visit this dataset."
      />
    );
  }

  const viewsColor = "var(--dashboard-action)";
  const salesColor = "var(--semantic-success)";
  const gridColor = "var(--dashboard-glass-border)";

  return (
    <div
      className="h-[260px] w-full sm:h-[280px]"
      role="img"
      aria-label="Dataset views and sales over time"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={viewsColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={viewsColor} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={salesColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={salesColor} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={{
              background: "var(--dashboard-glass-background-strong)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              backdropFilter: "blur(16px)",
              boxShadow: "var(--dashboard-glass-shadow)",
              padding: "12px 16px",
            }}
            labelStyle={{
              color: "var(--muted-foreground)",
              fontSize: 12,
              marginBottom: 4,
            }}
            itemStyle={{
              color: "var(--foreground)",
              fontSize: 12,
              fontWeight: 600,
            }}
            labelFormatter={formatDate}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke={viewsColor}
            strokeWidth={2}
            fill="url(#viewsGradient)"
            dot={false}
            name="Views"
            activeDot={{
              r: 4,
              fill: viewsColor,
              stroke: "var(--dashboard-surface)",
              strokeWidth: 2,
            }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke={salesColor}
            strokeWidth={2}
            fill="url(#salesGradient)"
            dot={false}
            name="Sales"
            activeDot={{
              r: 4,
              fill: salesColor,
              stroke: "var(--dashboard-surface)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
