"use client";

import type { RevenueTrendPoint, Currency } from "@/types/supplier-stats.types";
import {
  formatCurrencyShort,
  getCurrencySymbol,
} from "@/lib/utils/currency.utils";
import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { TrendingUp } from "lucide-react";

import { DashboardEmptyState, DashboardSkeleton } from "@/components/dashboard";

interface RevenueTrendChartProps {
  data: RevenueTrendPoint[];
  loading?: boolean;
}

/** Distinct colors for each currency line */
const CURRENCY_COLORS: Record<string, string> = {
  INR: "var(--chart-1)",
  USD: "var(--chart-2)",
  EUR: "var(--chart-3)",
  GBP: "var(--chart-4)",
};

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

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
  // Discover all unique currencies in the data
  const currencies = useMemo(() => {
    const set = new Set<string>();
    data.forEach((p) => {
      if (p.currency) set.add(p.currency);
    });
    return Array.from(set).sort();
  }, [data]);

  // Transform data: pivot so each date has a column per currency
  // e.g. { date: "2026-03-02", INR: 7, USD: 0 }
  const chartData = useMemo(() => {
    // Group by date
    const dateMap = new Map<string, Record<string, number | string>>();

    // First pass: collect all unique dates in order
    const dateOrder: string[] = [];
    data.forEach((p) => {
      if (!dateMap.has(p.date)) {
        dateOrder.push(p.date);
        const row: Record<string, number | string> = { date: p.date };
        // Initialize all currencies to 0
        currencies.forEach((c) => {
          row[c] = 0;
        });
        dateMap.set(p.date, row);
      }
      const row = dateMap.get(p.date)!;
      if (p.currency) {
        row[p.currency] = Number(p.revenue);
      }
    });

    return dateOrder.map((d) => dateMap.get(d)!);
  }, [data, currencies]);

  if (loading) {
    return <DashboardSkeleton className="h-72 sm:h-80" />;
  }

  if (data.length === 0) {
    return (
      <DashboardEmptyState
        surface="plain"
        icon={TrendingUp}
        title="No revenue in this period"
        description="Try a longer time range or check again after a marketplace purchase."
      />
    );
  }

  const gridColor = "var(--dashboard-glass-border)";

  return (
    <div>
      {/* Legend pills */}
      {currencies.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {currencies.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  background: CURRENCY_COLORS[c] || "var(--muted-foreground)",
                }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {c} ({getCurrencySymbol(c as Currency)})
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        className="h-[280px] w-full sm:h-[320px]"
        role="img"
        aria-label="Dataset revenue over time"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
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
              tickFormatter={(value: number) =>
                currencies.length === 1
                  ? formatCurrencyShort(value, currencies[0] as Currency)
                  : value.toLocaleString("en-US", { notation: "compact" })
              }
              axisLine={false}
              tickLine={false}
              width={50}
              allowDecimals={false}
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
                marginBottom: 6,
              }}
              labelFormatter={formatDate}
              formatter={(value: number, name: string) => {
                const symbol = getCurrencySymbol(name as Currency);
                const locale = name === "INR" ? "en-IN" : "en-US";
                return [`${symbol}${value.toLocaleString(locale)}`, name];
              }}
              itemStyle={{
                color: "var(--foreground)",
                fontSize: 13,
                fontWeight: 600,
              }}
            />
            {currencies.map((currency) => {
              const color =
                CURRENCY_COLORS[currency] || "var(--muted-foreground)";
              return (
                <Line
                  key={currency}
                  type="monotone"
                  dataKey={currency}
                  name={currency}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: color,
                    stroke: "var(--dashboard-surface)",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: color,
                    stroke: "var(--dashboard-surface)",
                    strokeWidth: 2.5,
                  }}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
