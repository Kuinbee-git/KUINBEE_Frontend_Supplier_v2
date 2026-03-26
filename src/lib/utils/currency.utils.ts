/**
 * Currency Utilities
 * Shared helpers for currency symbol mapping and formatting
 */

import type { Currency } from "@/types/supplier-stats.types";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
};

/**
 * Returns the symbol for a currency code.
 * Falls back to the code itself for unknown currencies.
 * Returns "" when currency is null/undefined (mixed).
 */
export function getCurrencySymbol(currency: Currency | null | undefined): string {
    if (!currency) return "";
    return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Formats a revenue value with the appropriate currency symbol.
 * Uses en-IN locale for INR, en-US for others.
 * When currency is null (mixed), shows the raw number.
 */
export function formatCurrencyValue(
    value: number | string,
    currency: Currency | null | undefined
): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);

    const symbol = getCurrencySymbol(currency);
    const locale = currency === "INR" ? "en-IN" : "en-US";
    const formatted = num.toLocaleString(locale);
    return `${symbol}${formatted}`;
}

/**
 * Compact format for chart axes (e.g. "$1.2K", "₹1.5L").
 * Uses Lakh notation for INR, K/M for others.
 */
export function formatCurrencyShort(
    value: number,
    currency: Currency | null | undefined
): string {
    const symbol = getCurrencySymbol(currency);

    if (currency === "INR") {
        if (value >= 100000) return `${symbol}${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`;
        return `${symbol}${value}`;
    }

    // USD / EUR / GBP / unknown
    if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`;
    return `${symbol}${value}`;
}
