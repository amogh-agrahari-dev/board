/**
 * Utility functions for currency symbols and price formatting.
 */

export interface CurrencyContext {
  market?: string | null;
  ticker?: string | null;
  currency?: string | null;
}

/**
 * Returns the appropriate currency symbol based on asset ticker, market, and user currency.
 * Automatically defaults to Indian Rupee (₹) if:
 * 1. The user selected currency is "INR", OR
 * 2. The market is "IN", OR
 * 3. The ticker ends with ".NS" or ".BO" (NSE/BSE Indian equities).
 * Defaults to USD ($) otherwise.
 */
export function getCurrencySymbol(context?: CurrencyContext): string {
  if (!context) return "$";

  // Check ticker suffix first (NSE / BSE)
  if (context.ticker) {
    const upper = context.ticker.toUpperCase();
    if (upper.endsWith(".NS") || upper.endsWith(".BO")) {
      return "₹";
    }
  }

  // Check market
  if (context.market === "IN") {
    return "₹";
  }

  // Check user profile base currency
  if (context.currency === "INR") {
    return "₹";
  }

  return "$";
}

/**
 * Formats a single price with the appropriate currency symbol.
 */
export function formatPrice(
  amount: number | null | undefined,
  context?: CurrencyContext,
  decimals: number = 2
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "—";
  }
  const symbol = getCurrencySymbol(context);
  return `${symbol}${amount.toFixed(decimals)}`;
}

/**
 * Formats a price range [low, high] with the appropriate currency symbol.
 */
export function formatRange(
  range: [number, number] | null | undefined,
  context?: CurrencyContext,
  decimals: number = 0
): string {
  if (!range || !Array.isArray(range) || range.length < 2) {
    return "—";
  }
  const symbol = getCurrencySymbol(context);
  return `${symbol}${range[0].toFixed(decimals)} – ${symbol}${range[1].toFixed(decimals)}`;
}
